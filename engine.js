/* ================================================================
   ENGINE.JS — Mémoire, chrono, utilitaires, tests captcha
================================================================ */

/* ================================================================
   MÉMOIRE (localStorage)
   totalMs : temps total passé à regarder le pigeon (toutes visites)
   tests   : nombre de fois où chaque test a été réussi
   history : dernières visites { t: timestamp, tests: [libellés] }
================================================================ */
const STORE_KEY = 'pigeon_site_v1';

function loadStore() {
  const base = { totalMs: 0, visits: 0, tests: {}, history: [], firstSeen: Date.now() };
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    return {
      totalMs:   s.totalMs   || 0,
      visits:    s.visits    || 0,
      tests:     s.tests     || {},
      history:   s.history   || [],
      firstSeen: s.firstSeen || base.firstSeen,
    };
  } catch (e) {
    return base;
  }
}

const store = loadStore();

let _blockSave = false;

function saveStore() {
  if (_blockSave) return;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) {}
}

function resetStore() {
  _blockSave = true;   /* empêche pagehide / le chrono de réécrire la mémoire */
  try { localStorage.removeItem(STORE_KEY); } catch (e) {}
}

/* ================================================================
   UTILITAIRES
================================================================ */
function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls)  e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function fmtDuration(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const p = n => String(n).padStart(2, '0');
  if (h) return `${h} h ${p(m)} min ${p(r)} s`;
  if (m) return `${m} min ${p(r)} s`;
  return `${r} s`;
}

function fmtDate(ts) {
  return new Date(ts).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

/* ================================================================
   CHRONO — ne compte que si la photo est affichée ET l'onglet visible
================================================================ */
let _viewing  = false;
let _last     = null;
let _lastSave = 0;
let sessionMs = 0;

function startViewing() { _viewing = true; _last = Date.now(); }

function tickTimer(onTick) {
  const now = Date.now();
  if (_viewing && !document.hidden && _last !== null) {
    const d = now - _last;
    if (d < 2000) {            /* ignore les gros sauts (veille, onglet gelé) */
      store.totalMs += d;
      sessionMs     += d;
    }
  }
  _last = (_viewing && !document.hidden) ? now : null;

  if (now - _lastSave > 1000) { saveStore(); _lastSave = now; }
  if (onTick) onTick();
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) saveStore();
  else if (_viewing) _last = Date.now();
});
window.addEventListener('pagehide', saveStore);

/* ================================================================
   TIRAGE DES TESTS
   1 ou 2 tests (jamais plus), sans doublon.
   Les tests les moins souvent faits ont plus de chances de sortir.
================================================================ */
function planTests() {
  const n = Math.random() < 0.5 ? 1 : 2;
  const pool = Object.keys(TESTS);
  const chosen = [];

  while (chosen.length < n && pool.length) {
    const weights = pool.map(id => 1 / (1 + (store.tests[id] || 0)));
    const total   = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let idx = 0;
    while (idx < pool.length - 1 && r > weights[idx]) { r -= weights[idx]; idx++; }
    chosen.push(pool.splice(idx, 1)[0]);
  }
  return chosen;
}

/* ================================================================
   TESTS — chaque test : run(box, done). done(détail?) = réussi.
================================================================ */
function markSuccess(btn, done, detail) {
  btn.textContent = '✓ Vérifié';
  btn.style.background = '#16a34a';
  btn.disabled = true;
  setTimeout(() => done(detail), 700);
}

function makeWarn(box) {
  const w = el('div', 'warning-msg', 'Sélection incorrecte. Veuillez réessayer.');
  box.appendChild(w);
  return w;
}

function flashWarn(w) {
  w.style.display = 'block';
  setTimeout(() => { w.style.display = 'none'; }, 2500);
}

/* ---- Case à cocher ---- */
function testCheckbox(box, done) {
  const row = el('div', 'check-row');
  const cb  = el('div', 'checkbox');
  row.append(cb, el('div', 'check-label', 'Je ne suis pas un robot'));
  box.appendChild(row);
  box.appendChild(el('div', 'note', 'Votre timing de clic sera analysé.'));

  row.onclick = () => {
    cb.classList.add('checked');
    row.style.pointerEvents = 'none';
    setTimeout(() => done(), 900);
  };
}

/* ---- Grille d'images ---- */
function testGrid(box, done) {
  const type = rand(Object.keys(GRID_POOLS));
  const data = rand(GRID_POOLS[type]);
  const info = GRID_LABELS[type];

  box.appendChild(el('div', 'grid-instruction', info.q));

  const order    = shuffle([...data.items.keys()]);
  const items    = order.map(i => data.items[i]);
  const correct  = new Set(order.map((orig, pos) => data.correct.has(orig) ? pos : -1).filter(x => x >= 0));
  const selected = new Set();

  const grid = el('div', 'captcha-grid');
  items.forEach((emoji, i) => {
    const cell = el('div', 'grid-cell', emoji);
    cell.onclick = () => {
      if (selected.has(i)) { selected.delete(i); cell.classList.remove('selected'); }
      else                 { selected.add(i);    cell.classList.add('selected'); }
    };
    grid.appendChild(cell);
  });
  box.appendChild(grid);

  const warn = makeWarn(box);
  const btn  = el('button', 'btn-verify', 'Vérifier');
  btn.onclick = () => {
    const ok = items.every((_, i) => correct.has(i) === selected.has(i));
    if (ok) markSuccess(btn, done, info.name);
    else    flashWarn(warn);
  };
  box.appendChild(btn);
}

/* ---- Texte déformé (canvas) ---- */
function testText(box, done) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];

  box.appendChild(el('div', 'grid-instruction', 'Tapez le texte affiché ci-dessous'));

  const canvas = document.createElement('canvas');
  canvas.width = 220; canvas.height = 60;
  canvas.className = 'text-canvas';
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`;
    ctx.fillRect(Math.random() * 220, Math.random() * 60, 1, 1);
  }
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = `rgba(0,0,0,${Math.random() * 0.15 + 0.05})`;
    ctx.lineWidth = Math.random() * 1.5 + 0.5;
    ctx.beginPath();
    ctx.moveTo(Math.random() * 220, Math.random() * 60);
    ctx.bezierCurveTo(
      Math.random() * 220, Math.random() * 60,
      Math.random() * 220, Math.random() * 60,
      Math.random() * 220, Math.random() * 60
    );
    ctx.stroke();
  }
  code.split('').forEach((ch, i) => {
    ctx.save();
    ctx.translate(20 + i * 33, 38 + (Math.random() * 10 - 5));
    ctx.rotate((Math.random() - 0.5) * 0.4);
    ctx.font = `bold ${24 + Math.random() * 8}px monospace`;
    ctx.fillStyle = `hsl(${Math.random() * 360},60%,25%)`;
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
  box.appendChild(canvas);

  const refresh = el('button', 'icon-btn', '🔄');
  refresh.title = 'Nouveau code';
  refresh.onclick = () => { box.innerHTML = ''; testText(box, done); };
  box.appendChild(refresh);

  const inp = el('input', 'text-input');
  inp.type = 'text';
  inp.placeholder = 'Entrez le texte ci-dessus...';
  inp.maxLength = 6;
  inp.autocomplete = 'off';
  inp.style.textTransform = 'uppercase';
  box.appendChild(inp);

  const warn = makeWarn(box);
  const btn  = el('button', 'btn-verify', 'Vérifier');
  btn.onclick = () => {
    if (inp.value.toUpperCase().replace(/\s/g, '') === code) {
      markSuccess(btn, done);
    } else {
      flashWarn(warn);
      inp.value = '';
    }
  };
  box.appendChild(btn);
}

/* ---- Curseur ---- */
function testSlider(box, done) {
  const target    = Math.floor(Math.random() * 60) + 20;   /* 20–80 % */
  const tolerance = 8;

  box.appendChild(el('div', 'grid-instruction', `Déplacez le curseur vers ${target}%`));

  const track  = el('div', 'slider-track');
  const fill   = el('div', 'slider-fill');
  const handle = el('div', 'slider-handle', '→');
  track.append(fill, handle);
  box.appendChild(track);

  const indicator = el('div', 'note', '0%');
  box.appendChild(indicator);

  let dragging = false;
  let value    = 0;

  function setValue(pct) {
    value = Math.max(0, Math.min(100, pct));
    handle.style.left = value + '%';
    fill.style.width  = value + '%';
    indicator.textContent = Math.round(value) + '%';
  }

  function pctFromEvent(e) {
    const r = track.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * 100;
  }

  handle.addEventListener('pointerdown', e => {
    dragging = true;
    handle.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  handle.addEventListener('pointermove', e => { if (dragging) setValue(pctFromEvent(e)); });

  function release() {
    if (!dragging) return;
    dragging = false;
    if (Math.abs(value - target) <= tolerance) {
      handle.style.background = '#16a34a';
      fill.style.background   = '#16a34a';
      handle.textContent = '✓';
      setTimeout(() => done(), 700);
    } else {
      handle.style.background = '#dc2626';
      setTimeout(() => { handle.style.background = ''; setValue(0); }, 800);
    }
  }
  handle.addEventListener('pointerup', release);
  handle.addEventListener('pointercancel', release);
}

/* ---- Calcul ---- */
function testMath(box, done) {
  const op = rand(['+', '-', '×']);
  let a, b, answer;
  if (op === '+')      { a = Math.floor(Math.random() * 20) + 1;  b = Math.floor(Math.random() * 20) + 1; answer = a + b; }
  else if (op === '-') { a = Math.floor(Math.random() * 20) + 10; b = Math.floor(Math.random() * 10) + 1; answer = a - b; }
  else                 { a = Math.floor(Math.random() * 9) + 2;   b = Math.floor(Math.random() * 9) + 2;  answer = a * b; }

  box.appendChild(el('div', 'grid-instruction', 'Calcul de vérification humaine :'));
  box.appendChild(el('div', 'math-q', `${a} ${op} ${b} = ?`));

  const inp = el('input', 'text-input');
  inp.type = 'number';
  inp.placeholder = 'Votre réponse...';
  inp.style.textAlign = 'center';
  box.appendChild(inp);

  const warn = makeWarn(box);
  const btn  = el('button', 'btn-verify', 'Vérifier');
  btn.onclick = () => {
    if (parseInt(inp.value, 10) === answer) markSuccess(btn, done);
    else { flashWarn(warn); inp.value = ''; }
  };
  box.appendChild(btn);
}

/* ---- Ordre des mots ---- */
function testWords(box, done) {
  const chosen   = rand(WORD_SENTENCES);
  const selected = [];

  box.appendChild(el('div', 'grid-instruction', 'Remettez les mots dans le bon ordre :'));

  const answerZone = el('div', 'word-zone');
  box.appendChild(answerZone);

  const pool = el('div', 'word-pool');

  function wordBtn(word, fromPool) {
    const b = el('button', 'choice-btn word-btn', word);
    b.onclick = () => {
      if (fromPool) {
        selected.push(word);
        answerZone.appendChild(wordBtn(word, false));
      } else {
        selected.splice(selected.indexOf(word), 1);
        pool.appendChild(wordBtn(word, true));
      }
      b.remove();
    };
    return b;
  }

  shuffle(chosen.words).forEach(w => pool.appendChild(wordBtn(w, true)));
  box.appendChild(pool);

  const warn = makeWarn(box);
  const btn  = el('button', 'btn-verify', 'Vérifier');
  btn.onclick = () => {
    if (selected.join(' ') === chosen.answer) markSuccess(btn, done);
    else flashWarn(warn);
  };
  box.appendChild(btn);
}

/* ---- Registre ---- */
const TESTS = {
  checkbox: { title: 'Vérification humaine', sub: 'Cochez la case pour continuer',     run: testCheckbox },
  grid:     { title: 'Vérification d’images', sub: 'Sélectionnez les bonnes cases',     run: testGrid     },
  text:     { title: 'Vérification d’images', sub: 'Recopiez le texte déformé',         run: testText     },
  slider:   { title: 'Vérification humaine', sub: 'Faites glisser vers la position indiquée', run: testSlider },
  math:     { title: 'Vérification humaine', sub: 'Résolvez le problème suivant',       run: testMath     },
  words:    { title: 'Vérification humaine', sub: 'Réorganisez les mots',               run: testWords    },
};

/* ================================================================
   MAIN.JS — Flux : 1 ou 2 tests aléatoires -> photo du pigeon
================================================================ */

const $ = id => document.getElementById(id);

/* Une visite de plus (comptée dès l'arrivée) */
store.visits++;
saveStore();

const plan      = planTests();   /* ex. ['grid', 'math'] */
const doneLabels = [];           /* libellés des tests réussis cette visite */

/* ---------------- Passage des tests ---------------- */
function runTest(i) {
  if (i >= plan.length) return finishGate();

  const id   = plan[i];
  const test = TESTS[id];

  $('progressFill').style.width = (i / plan.length * 100) + '%';
  $('panelTitle').textContent   = test.title;
  $('panelSub').textContent     = `Test ${i + 1} sur ${plan.length} — ${test.sub}`;

  const body = $('panelBody');
  body.style.opacity = '0';
  setTimeout(() => {
    body.innerHTML = '';
    test.run(body, detail => {
      /* Mémorise le test réussi */
      store.tests[id] = (store.tests[id] || 0) + 1;
      doneLabels.push(TEST_LABELS[id] + (detail ? ` (${detail})` : ''));
      saveStore();
      runTest(i + 1);
    });
    body.style.opacity = '1';
  }, 250);
}

/* ---------------- Fin des tests -> site ---------------- */
function finishGate() {
  $('progressFill').style.width = '100%';

  store.history.push({ t: Date.now(), tests: [...doneLabels] });
  store.history = store.history.slice(-20);
  saveStore();

  setTimeout(() => {
    $('gate').hidden = true;
    $('site').hidden = false;
    renderStats();
    startViewing();
  }, 500);
}

/* ---------------- Chrono + messages ---------------- */
let _shownMsg = -1;

function renderTimer() {
  $('timerTotal').textContent   = fmtDuration(store.totalMs);
  $('timerSession').textContent = fmtDuration(sessionMs);

  const secs = Math.floor(sessionMs / 1000);
  for (let i = PIGEON_MESSAGES.length - 1; i >= 0; i--) {
    if (secs >= PIGEON_MESSAGES[i].at) {
      if (i !== _shownMsg) { _shownMsg = i; $('pigeonMsg').textContent = PIGEON_MESSAGES[i].text; }
      break;
    }
  }
}

setInterval(() => {
  tickTimer(() => { if (!$('site').hidden) renderTimer(); });
}, 250);

/* ---------------- Mémoire affichée ---------------- */
function renderStats() {
  $('visitCount').textContent = `Visite n°${store.visits}`;

  /* Tests de cette visite */
  $('statsNow').textContent = doneLabels.length ? doneLabels.join(' + ') : '—';

  /* Total par test */
  const totals = $('statsTotals');
  totals.innerHTML = '';
  Object.keys(TEST_LABELS).forEach(id => {
    const li = document.createElement('li');
    li.textContent = `${TEST_LABELS[id]} : ${store.tests[id] || 0} fois`;
    totals.appendChild(li);
  });

  /* Dernières visites (hors la visite en cours) */
  const hist = $('statsHistory');
  hist.innerHTML = '';
  const previous = store.history.slice(0, -1).slice(-5).reverse();
  if (!previous.length) {
    const li = document.createElement('li');
    li.textContent = 'Aucune visite précédente.';
    hist.appendChild(li);
  } else {
    previous.forEach(h => {
      const li = document.createElement('li');
      li.textContent = `${fmtDate(h.t)} : ${h.tests.join(' + ') || '—'}`;
      hist.appendChild(li);
    });
  }
}

$('resetBtn').onclick = () => {
  if (confirm('Effacer le temps total et la mémoire des tests ?')) {
    resetStore();
    location.reload();
  }
};

/* ---------------- Démarrage ---------------- */
document.addEventListener('DOMContentLoaded', () => runTest(0));

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
    $('site').classList.add('unlocked');     /* défloute la photo */
    $('gate').classList.add('closing');      /* ferme la popup */
    setTimeout(() => { $('gate').hidden = true; }, 700);
    baseMs = Math.floor(store.totalMs / 1000) * 1000;   /* départ du total, aligné sur la seconde */
    startViewing();
  }, 500);
}

/* ---------------- Chrono ---------------- */
/* Total affiché = total d'avant + temps de la visite : les deux changent à la même milliseconde */
let baseMs = 0;

setInterval(() => {
  tickTimer(() => {
    if (!$('site').classList.contains('unlocked')) return;
    $('timerTotal').textContent   = fmtDuration(baseMs + sessionMs);
    $('timerSession').textContent = fmtDuration(sessionMs);
  });
}, 250);

/* ---------------- Blague : clic droit sur le pigeon ---------------- */
const JOKE_TEXT = 'You wouldn’t copy paste a pigeon.';
let _jokeTimer = null;

function showJoke(x, y) {
  let box = document.getElementById('jokeBox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'jokeBox';
    document.body.appendChild(box);
  }
  box.textContent = JOKE_TEXT;

  /* Placé près du curseur, sans sortir de l'écran */
  box.style.left = Math.min(x, window.innerWidth  - 280) + 'px';
  box.style.top  = Math.min(y, window.innerHeight - 60)  + 'px';

  box.classList.remove('show');
  void box.offsetWidth;            /* relance la transition */
  box.classList.add('show');

  clearTimeout(_jokeTimer);
  _jokeTimer = setTimeout(() => box.classList.remove('show'), 2200);
}

document.querySelectorAll('#site .frame').forEach(img => {
  img.addEventListener('contextmenu', e => { e.preventDefault(); showJoke(e.clientX, e.clientY); });
  img.addEventListener('dragstart',   e => e.preventDefault());
});

/* ---------------- Démarrage ---------------- */
document.addEventListener('DOMContentLoaded', () => runTest(0));

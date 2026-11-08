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
    startViewing();
  }, 500);
}

/* ---------------- Chrono ---------------- */
setInterval(() => {
  tickTimer(() => {
    if (!$('site').classList.contains('unlocked')) return;
    $('timerTotal').textContent   = fmtDuration(store.totalMs);
    $('timerSession').textContent = fmtDuration(sessionMs);
  });
}, 250);

/* ---------------- Démarrage ---------------- */
document.addEventListener('DOMContentLoaded', () => runTest(0));

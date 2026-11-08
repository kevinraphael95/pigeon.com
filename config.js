/* ================================================================
   CONFIG.JS — Données statiques (grilles, libellés des tests)
================================================================ */

/* ---- Tests disponibles (1 ou 2 tirés au hasard à chaque visite) ---- */
const TEST_LABELS = {
  checkbox: 'Case à cocher',
  grid:     'Grille d’images',
  text:     'Texte déformé',
  slider:   'Curseur',
  math:     'Calcul',
  words:    'Ordre des mots',
};

/* ---- Grilles : question + nom court (pour la mémoire) ---- */
const GRID_LABELS = {
  feux:       { name: 'feux',       q: 'Sélectionnez toutes les cases avec des feux de circulation' },
  vehicules:  { name: 'véhicules',  q: 'Sélectionnez toutes les cases avec des véhicules' },
  velos:      { name: 'vélos',      q: 'Sélectionnez toutes les cases avec des vélos' },
  animals:    { name: 'animaux',    q: 'Sélectionnez toutes les cases avec des animaux' },
  nourriture: { name: 'nourriture', q: 'Sélectionnez toutes les cases avec de la nourriture' },
  nature:     { name: 'nature',     q: 'Sélectionnez toutes les cases avec des éléments naturels' },
};

const GRID_POOLS = {
  feux: [
    { items: ['🏠','🚦','🌳','🚦','🛣️','🚦','🚗','🏢','🚦'], correct: new Set([1,3,5,8]) },
    { items: ['🌳','🚦','🚗','🏢','🚦','🌿','🚦','🏠','🛑'], correct: new Set([1,4,6]) },
    { items: ['🚦','🌲','🚦','🚶','🏫','🚦','🚗','🏢','🌳'], correct: new Set([0,2,5]) },
  ],
  vehicules: [
    { items: ['🚗','🌲','🚗','🚌','🏠','🚶','🚗','🏍️','🌊'], correct: new Set([0,2,3,6,7]) },
    { items: ['🏠','🚂','🌿','🚁','🌳','🚗','🏢','🚌','🌊'], correct: new Set([1,3,5,7]) },
    { items: ['🚐','🌳','🏠','🚗','🌲','🚕','🌿','🚙','🏢'], correct: new Set([0,3,5,7]) },
  ],
  velos: [
    { items: ['🚲','🌳','🏠','🚲','🚗','🌿','🚲','🏢','🚌'], correct: new Set([0,3,6]) },
    { items: ['🌲','🚲','🚗','🏠','🚲','🌳','🏢','🚲','🚶'], correct: new Set([1,4,7]) },
  ],
  animals: [
    { items: ['🐕','🌳','🏠','🐈','🚗','🐦','🌿','🐇','🚶'], correct: new Set([0,3,5,7]) },
    { items: ['🌲','🐠','🚗','🐘','🌳','🏠','🐊','🚌','🐦'], correct: new Set([1,3,6,8]) },
  ],
  nourriture: [
    { items: ['🍕','🌳','🏠','🍔','🚗','🍎','🌿','🍣','🚶'], correct: new Set([0,3,5,7]) },
    { items: ['🌲','🍜','🚗','🍰','🌳','🏠','🍩','🚌','🍓'], correct: new Set([1,3,6,8]) },
  ],
  nature: [
    { items: ['🌳','🏠','🌊','🚗','🌿','🏢','🌸','🚌','🍃'], correct: new Set([0,2,4,6,8]) },
    { items: ['🏠','🌲','🚗','🌺','🏢','🌿','🚌','🌾','🏫'], correct: new Set([1,3,5,7]) },
  ],
};

/* ---- Phrases pour le test "ordre des mots" ---- */
const WORD_SENTENCES = [
  { words: ['Je', 'ne', 'suis', 'pas', 'un', 'robot'], answer: 'Je ne suis pas un robot' },
  { words: ['Le', 'pigeon', 'regarde', 'au', 'loin'],  answer: 'Le pigeon regarde au loin' },
  { words: ['Vérification', 'en', 'cours'],            answer: 'Vérification en cours' },
  { words: ['Sécurité', 'avant', 'tout'],              answer: 'Sécurité avant tout' },
];

/* ---- Messages du pigeon, selon le temps passé sur la page (secondes de cette visite) ---- */
const PIGEON_MESSAGES = [
  { at: 5,  text: 'Vous regardez toujours.' },
  { at: 15, text: 'La plupart des gens ferment après 3 secondes.' },
  { at: 30, text: 'Ce pigeon ne vous regarde pas.' },
  { at: 60, text: 'Il a l’air de réfléchir à quelque chose.' },
];

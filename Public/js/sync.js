// Interception transparente de localStorage pour réplication serveur
const originalSetItem = localStorage.setItem.bind(localStorage);
const originalRemoveItem = localStorage.removeItem.bind(localStorage);

const pendingQueue = {};
let syncTimer = null;

function dispatchSync(key, value) {
  pendingQueue[key] = value;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    Object.entries(pendingQueue).forEach(([k, v]) => {
      fetch(`/api/store/${k}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: v })
      }).catch(err => console.error(`Erreur synchro ${k}:`, err));
    });
  }, 300);
}

localStorage.setItem = function(key, value) {
  originalSetItem(key, value);
  try {
    dispatchSync(key, JSON.parse(value));
  } catch (e) {
    dispatchSync(key, value);
  }
};

localStorage.removeItem = function(key) {
  originalRemoveItem(key);
  fetch(`/api/store/${key}`, { method: 'DELETE' }).catch(err => console.error(err));
};

// Récupération de l'état serveur avant l'exécution du code applicatif
(async function initHub() {
  try {
    const res = await fetch('/api/sync');
    if (res.ok) {
      const remoteData = await res.json();
      Object.entries(remoteData).forEach(([k, v]) => {
        originalSetItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      });
    }
  } catch (err) {
    console.warn('Serveur distant indisponible, utilisation du cache local.', err);
  }

  // Chargement séquentiel ordonné des modules
  const modules = [
    'js/auth.js',
    'js/budget.js',
    'js/mission.js',
    'js/documents.js',
    'js/meals.js',
    'js/app.js'
  ];

  function loadNext(index) {
    if (index >= modules.length) {
      if (typeof window.onload === 'function') window.onload();
      return;
    }
    const script = document.createElement('script');
    script.src = modules[index];
    script.onload = () => loadNext(index + 1);
    document.body.appendChild(script);
  }

  loadNext(0);
})();
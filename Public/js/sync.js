// --- SYNCHRONISATION CLOUD UPSTASH UNIFIÉE ---
const originalSetItem = localStorage.setItem.bind(localStorage);
const originalRemoveItem = localStorage.removeItem.bind(localStorage);

// Fonction directe de sauvegarde vers Upstash
window.saveToUpstash = async function(key, value) {
  try {
    await fetch(`/api/store/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: value })
    });
  } catch (err) {
    console.error(`Erreur d'envoi vers Upstash (${key}) :`, err);
  }
};

// Interception transparente de localStorage.setItem
localStorage.setItem = function(key, value) {
  originalSetItem(key, value);
  try {
    window.saveToUpstash(key, JSON.parse(value));
  } catch (e) {
    window.saveToUpstash(key, value);
  }
};

localStorage.removeItem = function(key) {
  originalRemoveItem(key);
  fetch(`/api/store/${encodeURIComponent(key)}`, { method: 'DELETE' }).catch(err => console.error(err));
};

// Récupération des données Upstash et mise à jour de l'interface
window.syncFromUpstash = async function() {
  try {
    const res = await fetch('/api/sync', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (!res.ok) return;
    const remoteData = await res.json();

    if (remoteData && typeof remoteData === 'object' && Object.keys(remoteData).length > 0) {
      // 1. Mise à jour du cache local
      Object.entries(remoteData).forEach(([k, v]) => {
        originalSetItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      });

      // 2. Mise à jour de la liste des utilisateurs en mémoire
      if (remoteData.app_users && typeof appUsers !== 'undefined') {
        appUsers = typeof remoteData.app_users === 'string' ? JSON.parse(remoteData.app_users) : remoteData.app_users;
        if (typeof showLoginScreen === 'function' && !currentUser) {
          showLoginScreen();
        }
        if (typeof renderAppUsersList === 'function' && currentUser && currentUser.role === 'parent') {
          renderAppUsersList();
        }
      }

     // 3. Mise à jour des missions et étoiles
      if (remoteData.family_rewards_app || remoteData.family_missions_state) {
        const missionsRaw = remoteData.family_rewards_app || remoteData.family_missions_state;
        const parsedMissions = typeof missionsRaw === 'string' ? JSON.parse(missionsRaw) : missionsRaw;
        if (typeof window.setKidsState === 'function') {
          window.setKidsState(parsedMissions);
        } else {
          window.kidsState = parsedMissions;
          if (typeof renderKids === 'function') renderKids();
        }
      }

      // 4. Mise à jour des repas
      if (remoteData.weekly_meals_plan && typeof renderMeals === 'function') {
        window.weeklyPlan = typeof remoteData.weekly_meals_plan === 'string' ? JSON.parse(remoteData.weekly_meals_plan) : remoteData.weekly_meals_plan;
        renderMeals();
      }

      // 5. Rafraîchissement du tableau de bord
      if (typeof renderDashboard === 'function' && currentUser) {
        renderDashboard();
      }
    }
  } catch (err) {
    console.warn("Impossible de synchroniser avec Upstash :", err);
  }
};

// Synchronisation immédiate au chargement
window.syncFromUpstash();

// Synchronisation quand on change d'application ou d'onglet
window.addEventListener('focus', () => window.syncFromUpstash());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') window.syncFromUpstash();
});

// Synchronisation d'arrière-plan toutes les 15 secondes
setInterval(() => window.syncFromUpstash(), 15000);

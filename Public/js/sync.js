// --- SYNCHRONISATION CLOUD UPSTASH UNIFIÉE ET SÉCURISÉE ---
const originalSetItem = localStorage.setItem.bind(localStorage);
const originalRemoveItem = localStorage.removeItem.bind(localStorage);

// File d'attente pour éviter les collisions d'écritures simultanées sur le serveur
let upstashQueue = Promise.resolve();

window.saveToUpstash = function(key, value) {
  upstashQueue = upstashQueue.then(async () => {
    try {
      await fetch(`/api/store/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: value })
      });
    } catch (err) {
      console.error(`Erreur d'envoi vers Upstash (${key}) :`, err);
    }
  });
  return upstashQueue;
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
  upstashQueue = upstashQueue.then(async () => {
    try {
      await fetch(`/api/store/${encodeURIComponent(key)}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  });
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
      // 1. Mise à jour silencieuse du cache local (sans réémettre d'envois vers le serveur)
      Object.entries(remoteData).forEach(([k, v]) => {
        originalSetItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      });

      // 2. Utilisateurs
      if (remoteData.app_users && typeof appUsers !== 'undefined') {
        appUsers = typeof remoteData.app_users === 'string' ? JSON.parse(remoteData.app_users) : remoteData.app_users;
        if (typeof showLoginScreen === 'function' && !currentUser) showLoginScreen();
        if (typeof renderAppUsersList === 'function' && currentUser && currentUser.role === 'parent') renderAppUsersList();
      }

      // 3. Missions et étoiles (mise à jour directe de la mémoire active)
      if (remoteData.family_rewards_app || remoteData.family_missions_state) {
        const raw = remoteData.family_rewards_app || remoteData.family_missions_state;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (typeof window.setKidsState === 'function') {
          window.setKidsState(parsed);
        } else {
          window.kidsState = parsed;
          if (typeof renderKids === 'function') renderKids();
        }
      }

      // 4. Comptes bancaires et budget
      if (remoteData.bank_accounts && typeof bankAccounts !== 'undefined') {
        bankAccounts = typeof remoteData.bank_accounts === 'string' ? JSON.parse(remoteData.bank_accounts) : remoteData.bank_accounts;
        if (typeof renderAccountsCards === 'function') renderAccountsCards();
        if (typeof currentAccountId !== 'undefined' && currentAccountId && typeof loadCurrentAccountData === 'function') {
          loadCurrentAccountData();
        }
      }

      // 5. Menus
      if (remoteData.weekly_meals_plan && typeof renderMeals === 'function') {
        window.weeklyPlan = typeof remoteData.weekly_meals_plan === 'string' ? JSON.parse(remoteData.weekly_meals_plan) : remoteData.weekly_meals_plan;
        renderMeals();
      }

      // 6. Tableau de bord
      if (typeof renderDashboard === 'function' && currentUser) {
        renderDashboard();
      }
    }
  } catch (err) {
    console.warn("Erreur de synchronisation :", err);
  }
};

// Synchronisation immédiate au lancement
window.syncFromUpstash();

// Synchronisation dès que l'appareil se déverrouille ou revient sur l'onglet
window.addEventListener('focus', () => window.syncFromUpstash());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') window.syncFromUpstash();
});

// Synchronisation automatique en tâche de fond toutes les 10 secondes
setInterval(() => window.syncFromUpstash(), 10000);

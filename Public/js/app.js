// --- GESTION DU THÈME ET DES COULEURS INDIVIDUELLES ---
function getContrastColor(hex) {
  if (!hex) return '#000000';
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const yiq = ((parseInt(hex.substr(0,2),16)*299) + (parseInt(hex.substr(2,2),16)*587) + (parseInt(hex.substr(4,2),16)*114)) / 1000;
  return yiq >= 128 ? '#000000' : '#ffffff';
}

function applySettings() {
  if (!currentUser) return;
  
  const userTheme = currentUser.theme || 'dark';
  const userColor = currentUser.primaryColor || '#38bdf8';

  if (userTheme === 'light') document.body.classList.add('light-mode');
  else document.body.classList.remove('light-mode');
  
  document.documentElement.style.setProperty('--primary', userColor);
  document.documentElement.style.setProperty('--primary-text', getContrastColor(userColor));
  
  const themeSelect = document.getElementById('themeSelect');
  const colorSelect = document.getElementById('primaryColorSelect');
  if (themeSelect) themeSelect.value = userTheme;
  if (colorSelect) colorSelect.value = userColor;
}

window.updateGeneralSettings = function() {
  if (!currentUser) return;
  
  const themeSelect = document.getElementById('themeSelect');
  const colorSelect = document.getElementById('primaryColorSelect');
  
  if (themeSelect && colorSelect) {
    currentUser.theme = themeSelect.value;
    currentUser.primaryColor = colorSelect.value;
    
    // On met à jour l'utilisateur dans le tableau global et on le pousse vers Upstash
    const userIndex = appUsers.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
      appUsers[userIndex] = currentUser;
      localStorage.setItem('app_users', JSON.stringify(appUsers));
    }
    
    applySettings();
  }
};

window.openGeneralSettingsModal = function() {
  const modal = document.getElementById('generalSettingsModal');
  if (modal) modal.style.display = 'flex';
  
  const themeSelect = document.getElementById('themeSelect');
  const colorSelect = document.getElementById('primaryColorSelect');
  
  const theme = (currentUser && currentUser.theme) ? currentUser.theme : 'dark';
  const color = (currentUser && currentUser.primaryColor) ? currentUser.primaryColor : '#38bdf8';
  const role = (currentUser && currentUser.role) ? currentUser.role : 'parent';

  if (themeSelect) themeSelect.value = theme;
  if (colorSelect) colorSelect.value = color;
  
  const profileSection = document.getElementById('appUsersList');
  if (profileSection) profileSection.style.display = (role === 'parent') ? 'flex' : 'none';
  
  // Rend la liste des profils uniquement si le panneau est visible (optimisation mobile)
  if (role === 'parent' && typeof renderAppUsersList === 'function') {
    renderAppUsersList();
  }
};

window.closeGeneralSettingsModal = function() {
  document.getElementById('generalSettingsModal').style.display = 'none';
};


// --- PERSONNALISATION DU TABLEAU DE BORD ---
function getUserDashWidgets() {
  if (!currentUser) return { finances: true, meals: true, missions: true, documents: true };
  
  // Utilisation de try/catch sécurisée au cas où Upstash retourne une chaîne de caractères mal formattée
  try {
    const rawWidgets = localStorage.getItem('dash_widgets_' + currentUser.id);
    if (rawWidgets) return JSON.parse(rawWidgets);
  } catch(e) {
    console.warn("Erreur de lecture des widgets. Réinitialisation par défaut.");
  }
  
  return { finances: true, meals: true, missions: true, documents: true };
}

window.openDashboardCustomModal = function() {
  const widgets = getUserDashWidgets();
  const container = document.getElementById('dashCustomCheckboxes');
  if (!container) return;
  container.innerHTML = '';

  const list = [
    { id: 'finances', label: '💰 Bloc Budget' },
    { id: 'meals', label: '🍽️ Bloc Menu du Jour' },
    { id: 'missions', label: '🎯 Bloc Étoiles & Missions' },
    { id: 'documents', label: '📁 Bloc Coffre-fort Documents' }
  ];

  list.forEach(item => {
    const checked = widgets[item.id] !== false;
    container.innerHTML += `
      <label class="checkbox-label" style="font-size:0.95rem; display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 8px;">
        <input type="checkbox" id="dash_opt_${item.id}" ${checked ? 'checked' : ''} onchange="toggleDashWidget('${item.id}', this.checked)">
        <span>${item.label}</span>
      </label>
    `;
  });

  const modal = document.getElementById('dashboardCustomModal');
  if (modal) modal.style.display = 'flex';
};

window.closeDashboardCustomModal = function() {
  const modal = document.getElementById('dashboardCustomModal');
  if (modal) modal.style.display = 'none';
};

window.saveDashboardCustom = function() {
  closeDashboardCustomModal();
};

window.toggleDashWidget = function(widgetId, isChecked) {
  if (!currentUser) return;
  const widgets = getUserDashWidgets();
  widgets[widgetId] = isChecked;
  // Déclenche l'envoi immédiat au serveur via la fonction interceptée dans sync.js
  localStorage.setItem('dash_widgets_' + currentUser.id, JSON.stringify(widgets));
  renderDashboard();
};


// --- RENDU DYNAMIQUE DU TABLEAU DE BORD ---
async function renderDashboard() {
  if (!currentUser) return;
  
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const dashDateLabel = document.getElementById('dashDateLabel');
  if (dashDateLabel) dashDateLabel.textContent = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);

  const userWidgets = getUserDashWidgets();

  // 1. Widget Budget
  const widgetFin = document.getElementById('widget-finances');
  if (widgetFin) {
    if (userWidgets.finances === false) {
      widgetFin.style.display = 'none';
    } else {
      widgetFin.style.display = 'flex';
      
      if (typeof getAccessibleAccounts === 'function' && typeof currentDateBudget !== 'undefined') {
        const accessibleAccs = getAccessibleAccounts();
        const year = currentDateBudget.getFullYear();
        const month = currentDateBudget.getMonth();
        const currentMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        const todayStr = now.toISOString().split('T')[0];

        let totalCumulReal = 0;
        let totalCumulForecast = 0;
        let totalToClear = 0;

        accessibleAccs.forEach(acc => {
          let txs = [];
          try {
             txs = JSON.parse(localStorage.getItem('transactions_' + acc.id)) || [];
          } catch(e) {}
          
          let accReal = acc.baseBalance || 0;
          let accCarry = acc.baseBalance || 0;
          let mIncome = 0;
          let mExpense = 0;

          txs.forEach(tx => {
            if (tx.cleared) accReal += (tx.type === 'income' ? tx.amount : -tx.amount);
            if (typeof getBudgetMonthKey === 'function' && getBudgetMonthKey(tx.date) < currentMonthKey) {
              accCarry += (tx.type === 'income' ? tx.amount : -tx.amount);
            }
          });

          txs.filter(tx => typeof getBudgetMonthKey === 'function' && getBudgetMonthKey(tx.date) === currentMonthKey).forEach(tx => {
            if (tx.type === 'income') mIncome += tx.amount; else mExpense += tx.amount;
            if (!tx.cleared) totalToClear++;
          });

          totalCumulReal += accReal;
          totalCumulForecast += (accCarry + (mIncome - mExpense));
        });

        const dashRealBal = document.getElementById('dashRealBal');
        const dashForecastBal = document.getElementById('dashForecastBal');
        const dashToClearCount = document.getElementById('dashToClearCount');
        
        if (dashRealBal && typeof formatMoney === 'function') dashRealBal.textContent = formatMoney(totalCumulReal);
        if (dashForecastBal && typeof formatMoney === 'function') dashForecastBal.textContent = formatMoney(totalForecastBalance);
        if (dashToClearCount) dashToClearCount.textContent = totalToClear + (totalToClear > 1 ? ' opérations' : ' opération');
      }
    }
  }

  // 1 bis. Widget Repas du Jour (récupération locale / Upstash)
  const widgetMeals = document.getElementById('widget-meals');
  if (widgetMeals) {
    if (userWidgets.meals === false) {
      widgetMeals.style.display = 'none';
    } else {
      widgetMeals.style.display = 'flex';
      
      try {
        const rawWeeklyPlan = localStorage.getItem('weekly_meals_plan');
        const wp = rawWeeklyPlan ? JSON.parse(rawWeeklyPlan) : (typeof weeklyPlan !== 'undefined' ? weeklyPlan : {});
        const cat = typeof RECIPES_CATALOG !== 'undefined' ? RECIPES_CATALOG : [];
        const rawCustom = localStorage.getItem('custom_recipes');
        const custom = rawCustom ? JSON.parse(rawCustom) : [];
        const allR = [...cat, ...custom];

        const dNames = ['sun','mon','tue','wed','thu','fri','sat'];
        const currentDayId = dNames[now.getDay()];
        const todayEveId = currentDayId + '_eve';
        
        const meal = wp[todayEveId];
        const contentDiv = document.getElementById('dashTodayMealsContent');
        
        if (contentDiv) {
          contentDiv.style.display = 'block';
          if (meal && (meal.customTitle || meal.recipeId)) {
            const recipe = meal.recipeId ? allR.find(r => r.id === meal.recipeId) : null;
            const icon = recipe ? (recipe.icon || '🍽️') : '🍽️';
            const title = meal.customTitle || (recipe ? recipe.title : 'Repas de ce soir');
            contentDiv.innerHTML = `<div style="font-size:1.5rem; margin-bottom:4px;">${icon}</div><div style="font-weight:700; font-size:0.9rem;">${title}</div>`;
          } else {
            contentDiv.innerHTML = `<div style="font-size:0.85rem; color:var(--text-muted);">Aucun repas prévu ce soir.</div>`;
          }
        }
      } catch (e) {
        console.warn('Erreur récupération repas dashboard', e);
      }
    }
  }

  // 2. Widget Missions
  const widgetMis = document.getElementById('widget-missions');
  if (widgetMis) {
    if (userWidgets.missions === false) {
      widgetMis.style.display = 'none';
    } else {
      widgetMis.style.display = 'flex';
    }
  }

  // 3. Widget Documents
  const widgetDoc = document.getElementById('widget-documents');
  if (widgetDoc) {
    if (userWidgets.documents === false) {
      widgetDoc.style.display = 'none';
    } else {
      widgetDoc.style.display = 'flex';
    }
  }
}

// --- NAVIGATION PRINCIPALE ---
window.switchMainTab = function(tabId) {
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  const content = document.getElementById('tab-' + tabId);
  if (content) content.classList.add('active');

  const backBtn = document.getElementById('btn-back-dashboard');
  if (tabId === 'dashboard') {
    if (backBtn) backBtn.classList.add('hidden');
  } else {
    if (backBtn) backBtn.classList.remove('hidden');
  }

  if (tabId === 'dashboard') renderDashboard();
  if (tabId === 'comptes' && typeof initDefaultSelectedAccount === 'function') initDefaultSelectedAccount();
  if (tabId === 'meals' && typeof renderMeals === 'function') renderMeals();
  if (tabId === 'documents' && typeof renderDocuments === 'function') renderDocuments();
  
  if (tabId === 'missions') {
    if (typeof renderKids === 'function') renderKids();
    if (typeof renderChildView === 'function') renderChildView();
  }
};

// --- SYNCHRONISATION FORCÉE DU NOUVEAU PROFIL AU DÉMARRAGE ---
window.onload = function() {
  if (typeof appUsers !== 'undefined' && typeof loginAs === 'function' && typeof showLoginScreen === 'function') {
    
    // Si Upstash a rechargé les données dans sync.js, on rafraîchit la variable applicative appUsers
    const cloudUsers = localStorage.getItem('app_users');
    if (cloudUsers) {
      try {
        appUsers = JSON.parse(cloudUsers);
      } catch(e) {}
    }

    let savedSession = sessionStorage.getItem('activeUserId');
    if (savedSession) {
      let u = appUsers.find(x => x.id === savedSession);
      if (u) {
        return loginAs(u);
      }
    }
    showLoginScreen();
  } else {
    console.error("Erreur de chargement : Les modules dépendants ne sont pas chargés.");
  }
};

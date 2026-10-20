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
    
    const userIndex = appUsers.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
      appUsers[userIndex] = currentUser;
      localStorage.setItem('app_users', JSON.stringify(appUsers));
    }
    
    applySettings();
  }
};

window.openGeneralSettingsModal = function() {
  document.getElementById('generalSettingsModal').style.display = 'flex';
  
  const themeSelect = document.getElementById('themeSelect');
  const colorSelect = document.getElementById('primaryColorSelect');
  if (themeSelect) themeSelect.value = currentUser.theme || 'dark';
  if (colorSelect) colorSelect.value = currentUser.primaryColor || '#38bdf8';
  
  const profileSection = document.getElementById('appUsersList');
  const profileTitle = document.getElementById('adminProfileTitle');
  if (profileSection) profileSection.style.display = (currentUser.role === 'parent') ? 'flex' : 'none';
  if (profileTitle) profileTitle.style.display = (currentUser.role === 'parent') ? 'flex' : 'none';
  
  if (currentUser.role === 'parent' && typeof renderAppUsersList === 'function') {
    renderAppUsersList();
  }
};

window.closeGeneralSettingsModal = function() {
  document.getElementById('generalSettingsModal').style.display = 'none';
};


// --- PERSONNALISATION DU TABLEAU DE BORD ---
function getUserDashWidgets() {
  if (!currentUser) return { finances: true, meals: true, missions: true, documents: true };
  return JSON.parse(localStorage.getItem('dash_widgets_' + currentUser.id)) || {
    finances: true,
    meals: true,
    missions: true,
    documents: true
  };
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
      <label class="checkbox-label" style="font-size:0.95rem;">
        <input type="checkbox" id="dash_opt_${item.id}" ${checked ? 'checked' : ''} onchange="toggleDashWidget('${item.id}', this.checked)">
        ${item.label}
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

window.toggleDashWidget = function(widgetId, isChecked) {
  if (!currentUser) return;
  const widgets = getUserDashWidgets();
  widgets[widgetId] = isChecked;
  localStorage.setItem('dash_widgets_' + currentUser.id, JSON.stringify(widgets));
  renderDashboard();
};


// --- RENDU DU TABLEAU DE BORD ---
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
          const txs = JSON.parse(localStorage.getItem('transactions_' + acc.id)) || [];
          let accReal = acc.baseBalance || 0;
          let accCarry = acc.baseBalance || 0;
          let mIncome = 0;
          let mExpense = 0;

          txs.forEach(tx => {
            if (tx.cleared) accReal += (tx.type === 'income' ? tx.amount : -tx.amount);
            if (typeof getBudgetMonthKey === 'function' && getBudgetMonthKey(tx.date) < currentMonthKey) accCarry += (tx.type === 'income' ? tx.amount : -tx.amount);
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
        if (dashForecastBal && typeof formatMoney === 'function') dashForecastBal.textContent = formatMoney(totalCumulForecast);
        if (dashToClearCount) dashToClearCount.textContent = totalToClear + (totalToClear > 1 ? ' opérations' : ' opération');
      }
    }
  }

  // 1 bis. Widget Repas du Jour
  const widgetMeals = document.getElementById('widget-meals');
  if (widgetMeals) {
    if (userWidgets.meals === false) {
      widgetMeals.style.display = 'none';
    } else {
      widgetMeals.style.display = 'flex';
      // Optionnel : afficher le menu de ce soir si meals.js est actif
      if (typeof weeklyPlan !== 'undefined' && typeof RECIPES_CATALOG !== 'undefined') {
        const dNames = ['sun','mon','tue','wed','thu','fri','sat'];
        const currentDayId = dNames[now.getDay()];
        const todayEveId = currentDayId + '_eve';
        const meal = weeklyPlan[todayEveId];
        const contentDiv = document.getElementById('dashTodayMealsContent');
        if (contentDiv) {
          contentDiv.parentElement.style.display = 'block';
          if (meal && meal.customTitle) {
            const recipe = meal.recipeId ? RECIPES_CATALOG.find(r => r.id === meal.recipeId) : null;
            const icon = recipe ? (recipe.icon || '🍽️') : '🍽️';
            contentDiv.innerHTML = `<div style="font-size:1.5rem; margin-bottom:4px;">${icon}</div><div style="font-weight:700; font-size:0.9rem;">${meal.customTitle}</div>`;
          } else {
            contentDiv.innerHTML = `<div style="font-size:0.85rem; color:var(--text-muted);">Aucun repas prévu ce soir.</div>`;
          }
        }
      }
    }
  }

  // 2. Widget Missions (Sécurisé)
  const widgetMis = document.getElementById('widget-missions');
  if (widgetMis) {
    if (userWidgets.missions === false) {
      widgetMis.style.display = 'none';
    } else {
      widgetMis.style.display = 'flex';
      
      try {
        // Tentative de récupération directe depuis le localStorage si la variable mémoire est inaccessible
        const stateData = JSON.parse(localStorage.getItem('family_missions_state'));
        
        if (stateData) {
          const dashPendingBadge = document.getElementById('dashPendingBadge');
          const dashCommonStars = document.getElementById('dashCommonStars');
          const dashKidsList = document.getElementById('dashKidsList');
          
          const pendingCount = (stateData.pending && Array.isArray(stateData.pending)) ? stateData.pending.length : 0;
          if (dashPendingBadge) {
             dashPendingBadge.textContent = pendingCount > 0 ? `${pendingCount} en attente` : 'Tout est validé';
             dashPendingBadge.style.display = 'inline-block';
             dashPendingBadge.className = pendingCount > 0 ? 'badge badge-recurring' : 'badge badge-cat';
          }
          if (dashCommonStars) {
             dashCommonStars.parentElement.style.display = 'block';
             dashCommonStars.textContent = `${stateData.commonStars || 0} ⭐`;
          }
          if (dashKidsList && Array.isArray(stateData.kids)) {
            dashKidsList.parentElement.style.display = 'block';
            dashKidsList.innerHTML = stateData.kids.map(k => `
              <div style="display:flex; justify-content:space-between; margin-top:4px; font-size:0.9rem;">
                <span>${k.avatar || '🧑'} <b>${k.name}</b></span> 
                <span style="font-weight:700; color:#fbbf24;">${k.stars || 0} ⭐</span>
              </div>
            `).join("");
          }
        }
      } catch (err) {
        console.warn("Impossible de lire les données des missions pour le dashboard :", err);
      }
    }
  }

  // 3. Widget Documents
  const widgetDoc = document.getElementById('widget-documents');
  if (widgetDoc) {
    if (userWidgets.documents === false) {
      widgetDoc.style.display = 'none';
    } else {
      widgetDoc.style.display = 'flex';
      if (typeof getDB === 'function' && typeof canAccessFolder === 'function') {
        try {
          const db = await getDB();
          const txDB = db.transaction('documents', 'readonly');
          txDB.objectStore('documents').getAll().onsuccess = (e) => {
            const docs = e.target.result || [];
            const accessibleDocs = docs.filter(d => {
              if (typeof folders === 'undefined') return true;
              const folder = folders.find(f => f.id === d.folderId);
              if (!folder) return true;
              return canAccessFolder(folder);
            });
            const dashDocCount = document.getElementById('dashDocCount');
            const dashLastDoc = document.getElementById('dashLastDoc');
            if (dashDocCount) {
              dashDocCount.parentElement.style.display = 'block';
              dashDocCount.textContent = accessibleDocs.length + ' documents';
            }
            if (dashLastDoc) dashLastDoc.textContent = accessibleDocs.length > 0 ? accessibleDocs[accessibleDocs.length - 1].name : 'Aucun document';
          };
        } catch (err) {
          console.error(err);
        }
      }
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
  
  // Appel sécurisé pour les missions : tente renderKids() puis initialisation parentale
  if (tabId === 'missions') {
    if (typeof renderKids === 'function') renderKids();
    if (typeof renderChildView === 'function') renderChildView();
  }
};
// --- INITIALISATION ---
window.onload = function() {
  if (typeof appUsers !== 'undefined' && typeof loginAs === 'function' && typeof showLoginScreen === 'function') {
    let savedSession = sessionStorage.getItem('activeUserId');
    if (savedSession) {
      let u = appUsers.find(x => x.id === savedSession);
      if (u) {
        return loginAs(u);
      }
    }
    showLoginScreen();
  } else {
    console.error("Erreur de chargement : auth.js semble manquant.");
  }
};
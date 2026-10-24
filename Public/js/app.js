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
    { id: 'meals', label: '🍽️ Bloc Menus & Recettes' },
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
  localStorage.setItem('dash_widgets_' + currentUser.id, JSON.stringify(widgets));
  renderDashboard();
};


// --- RENDU DYNAMIQUE DU TABLEAU DE BORD ---
async function renderDashboard() {
  if (!currentUser) return;
  
  const userWidgets = getUserDashWidgets();

  // 1. Tuile Budget
  const widgetFin = document.getElementById('widget-finances');
  if (widgetFin) {
    widgetFin.style.display = (userWidgets.finances === false) ? 'none' : 'flex';
  }

  // 2. Tuile Menus (tuile simple, sans texte ni aperçu du repas)
  const widgetMeals = document.getElementById('widget-meals');
  if (widgetMeals) {
    widgetMeals.style.display = (userWidgets.meals === false) ? 'none' : 'flex';
    const contentDiv = document.getElementById('dashTodayMealsContent');
    if (contentDiv) {
      contentDiv.style.display = 'none';
      contentDiv.innerHTML = '';
    }
  }

  // 3. Tuile Missions
  const widgetMis = document.getElementById('widget-missions');
  if (widgetMis) {
    widgetMis.style.display = (userWidgets.missions === false) ? 'none' : 'flex';
  }

  // 4. Tuile Documents
  const widgetDoc = document.getElementById('widget-documents');
  if (widgetDoc) {
    widgetDoc.style.display = (userWidgets.documents === false) ? 'none' : 'flex';
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

// --- INITIALISATION AU CHARGEMENT ---
window.onload = function() {
  if (typeof appUsers !== 'undefined' && typeof loginAs === 'function' && typeof showLoginScreen === 'function') {
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

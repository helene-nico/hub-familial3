// --- DONNÉES UTILISATEURS ---
let appUsers = JSON.parse(localStorage.getItem('app_users')) || [
  { id: 'u1', name: 'Papa', role: 'parent', pin: '0000', avatar: '👨' },
  { id: 'u2', name: 'Maman', role: 'parent', pin: '0000', avatar: '👩' },
  { id: 'u3', name: 'Enfant 1', role: 'child', pin: '', avatar: '👧' }
];

let currentUser = null;
let pendingLoginUserId = null;

// --- GESTION DE LA CONNEXION ---
function showLoginScreen() {
  const screen = document.getElementById('login-screen');
  const container = document.getElementById('app-container');
  if (screen) screen.style.display = 'flex';
  if (container) container.classList.add('hidden');
  
  const grid = document.getElementById('loginUsersGrid');
  if (!grid) return;

  grid.innerHTML = appUsers.map(u => `
    <div class="user-card" onclick="attemptLogin('${u.id}')">
      <div class="avatar">${u.avatar}</div>
      <div class="name">${u.name}</div>
      <div class="role">${u.role === 'parent' ? 'Parent' : 'Enfant'}</div>
    </div>
  `).join('');
}

function attemptLogin(id) {
  const u = appUsers.find(x => x.id === id);
  if (!u) return;

  if (u.pin && u.pin.trim() !== '') {
    pendingLoginUserId = u.id;
    document.getElementById('loginPinTitle').textContent = `Bonjour ${u.name}`;
    document.getElementById('login-pin-input').value = '';
    document.getElementById('pin-login-modal').style.display = 'flex';
    setTimeout(() => document.getElementById('login-pin-input').focus(), 50);
  } else {
    loginAs(u);
  }
}

function closeLoginPinModal() {
  document.getElementById('pin-login-modal').style.display = 'none';
  pendingLoginUserId = null;
}

function submitLoginPin() {
  const input = document.getElementById('login-pin-input').value;
  const u = appUsers.find(x => x.id === pendingLoginUserId);
  if (u && u.pin === input) {
    closeLoginPinModal();
    loginAs(u);
  } else {
    alert("Code PIN erroné.");
    document.getElementById('login-pin-input').value = '';
    document.getElementById('login-pin-input').focus();
  }
}

function loginAs(user) {
  currentUser = user;
  sessionStorage.setItem('activeUserId', user.id);
  
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-container').classList.remove('hidden');
  
  document.getElementById('topAvatar').textContent = user.avatar;
  document.getElementById('topUserName').textContent = user.name;
  
  const btnSettings = document.getElementById('btn-open-settings');
  const btnParent = document.getElementById('btn-parent-mode');
  if (btnSettings) btnSettings.style.display = 'inline-block';
  if (btnParent) btnParent.style.display = user.role === 'parent' ? 'inline-block' : 'none';

  // Appels sécurisés vers les autres modules
  if (typeof applySettings === 'function') applySettings();
  if (typeof initDefaultSelectedAccount === 'function') initDefaultSelectedAccount();
  if (typeof renderKids === 'function') renderKids();
  if (typeof switchMainTab === 'function') switchMainTab('dashboard');
}

function logout() {
  sessionStorage.removeItem('activeUserId');
  currentUser = null;
  if (typeof isParentMode !== 'undefined') isParentMode = false;
  showLoginScreen();
}

// --- GESTION DES PROFILS (ADMINISTRATION PARENTALE) ---
// --- GESTION DES PROFILS (ADMINISTRATION PARENTALE) ---
function openProfileEditModal(userId) {
  if (currentUser && currentUser.role !== 'parent') {
    alert("Seul un profil parent peut administrer les profils.");
    return;
  }

  // Ferme la fenêtre des paramètres généraux
  if (typeof closeGeneralSettingsModal === 'function') {
    closeGeneralSettingsModal();
  }

  const form = document.getElementById('profileEditForm');
  if (form) form.reset();

  if (userId) {
    const u = appUsers.find(x => x.id === userId);
    if (!u) return;
    document.getElementById('profileEditModalTitle').textContent = `Modifier ${u.name}`;
    document.getElementById('editUserId').value = u.id;
    document.getElementById('editUserName').value = u.name;
    document.getElementById('editUserAvatar').value = u.avatar;
    document.getElementById('editUserRole').value = u.role;
    document.getElementById('editUserPin').value = u.pin || '';
  } else {
    document.getElementById('profileEditModalTitle').textContent = "Créer un profil";
    document.getElementById('editUserId').value = '';
    document.getElementById('editUserAvatar').value = '🧑';
    document.getElementById('editUserRole').value = 'child';
  }

  document.getElementById('profileEditModal').style.display = 'flex';
}

window.closeProfileEditModal = () => {
  document.getElementById('profileEditModal').style.display = 'none';
  // Réouvre les paramètres généraux pour revenir à la liste
  if (typeof openGeneralSettingsModal === 'function') {
    openGeneralSettingsModal();
  }
};

function saveProfileEdit(e) {
  e.preventDefault();
  if (currentUser && currentUser.role !== 'parent') return;

  const id = document.getElementById('editUserId').value;
  const name = document.getElementById('editUserName').value.trim();
  const avatar = document.getElementById('editUserAvatar').value.trim();
  const role = document.getElementById('editUserRole').value;
  const pin = document.getElementById('editUserPin').value.trim();

  if (!name) return;

  if (id) {
    const u = appUsers.find(x => x.id === id);
    if (u) {
      const parentCount = appUsers.filter(x => x.role === 'parent').length;
      if (u.role === 'parent' && role !== 'parent' && parentCount <= 1) {
        alert("L'application doit conserver au moins un parent.");
        return;
      }
      u.name = name;
      u.avatar = avatar;
      u.role = role;
      u.pin = pin;
    }
  } else {
    appUsers.push({
      id: 'u_' + Date.now(),
      name,
      role,
      pin,
      avatar,
      theme: 'dark',
      primaryColor: '#38bdf8'
    });
  }

  localStorage.setItem('app_users', JSON.stringify(appUsers));
  
  // Ferme la modale d'édition et rouvre les paramètres avec la liste à jour
  closeProfileEditModal();
  if (typeof initDefaultSelectedAccount === 'function') initDefaultSelectedAccount();
}
function renderAppUsersList() {
  const list = document.getElementById('appUsersList');
  if (!list) return;
  list.innerHTML = appUsers.map(u => `
    <div style="background:var(--bg); border:1px solid var(--border); padding:8px 12px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <span>${u.avatar} <b>${u.name}</b></span>
        <span style="font-size:0.75rem; color:var(--text-muted); margin-left:6px;">(${u.role === 'parent' ? 'Parent' : 'Enfant'} • PIN: ${u.pin ? '••••' : 'Aucun'})</span>
      </div>
      <div style="display:flex; gap:6px;">
        <button class="btn-nav" style="padding:4px 8px; font-size:0.75rem;" onclick="openProfileEditModal('${u.id}')">✏️</button>
        <button class="btn-danger" style="padding:4px 8px;" onclick="deleteAppUser('${u.id}')">✕</button>
      </div>
    </div>
  `).join('');
}

window.deleteAppUser = (id) => {
  if (currentUser && currentUser.role !== 'parent') return;
  const target = appUsers.find(x => x.id === id);
  if (!target) return;
  if (target.role === 'parent' && appUsers.filter(x => x.role === 'parent').length <= 1) {
    alert("Impossible de supprimer le seul profil parent.");
    return;
  }
  if (confirm(`Supprimer définitivement le profil de ${target.name} ?`)) {
    appUsers = appUsers.filter(x => x.id !== id);
    localStorage.setItem('app_users', JSON.stringify(appUsers));
    renderAppUsersList();
    if (typeof initDefaultSelectedAccount === 'function') initDefaultSelectedAccount();
  }
};
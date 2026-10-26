// --- CRYPTO & PIN ---
async function hashPin(pin) {
  if (!pin || pin.trim() === '') return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(pin.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPin(inputPin, storedPin) {
  if (!storedPin) return true;
  if (/^[a-f0-9]{64}$/i.test(storedPin)) {
    const hashedInput = await hashPin(inputPin);
    return hashedInput === storedPin;
  }
  return inputPin === storedPin;
}

// --- UTILISATEURS DU HUB FAMILIAL ---
let appUsers = JSON.parse(localStorage.getItem('app_users')) || [
  { id: 'u1', name: 'Papa', role: 'parent', avatar: '👨', pin: '', theme: 'dark', primaryColor: '#38bdf8' },
  { id: 'u2', name: 'Maman', role: 'parent', avatar: '👩', pin: '', theme: 'dark', primaryColor: '#38bdf8' },
  { id: 'u3', name: 'Enfant', role: 'child', avatar: '🧒', pin: '', theme: 'dark', primaryColor: '#38bdf8' }
];

let currentUser = null;
let pendingLoginUserId = null;

function showLoginScreen() {
  const screen = document.getElementById('login-screen');
  const appCont = document.getElementById('app-container');
  if (screen) screen.style.display = 'flex';
  if (appCont) appCont.classList.add('hidden');

  sessionStorage.removeItem('activeUserId');

  const grid = document.getElementById('loginUsersGrid');
  if (!grid) return;

  grid.innerHTML = appUsers.map(u => `
    <div class="user-card" onclick="attemptLogin('${u.id}')">
      <div class="user-avatar">${u.avatar || '👤'}</div>
      <div class="user-name">${u.name}</div>
      <div class="user-role">${u.role === 'parent' ? 'Parent' : 'Enfant'}</div>
    </div>
  `).join('');
}

function attemptLogin(id) {
  const u = appUsers.find(x => x.id === id);
  if (!u) return;

  if (u.pin) {
    pendingLoginUserId = u.id;
    const pinTitle = document.getElementById('loginPinTitle');
    if (pinTitle) pinTitle.textContent = `Bonjour ${u.name}`;
    const pinInput = document.getElementById('login-pin-input');
    if (pinInput) pinInput.value = '';
    const pinModal = document.getElementById('pin-login-modal');
    if (pinModal) pinModal.style.display = 'flex';
    setTimeout(() => pinInput && pinInput.focus(), 80);
  } else {
    loginAs(u);
  }
}

function closeLoginPinModal() {
  const modal = document.getElementById('pin-login-modal');
  if (modal) modal.style.display = 'none';
  pendingLoginUserId = null;
}

async function submitLoginPin() {
  const pinInput = document.getElementById('login-pin-input');
  if (!pinInput || !pendingLoginUserId) return;
  const pin = pinInput.value.trim();

  const u = appUsers.find(x => x.id === pendingLoginUserId);
  if (!u) {
    closeLoginPinModal();
    return;
  }

  const isValid = await verifyPin(pin, u.pin);
  if (isValid) {
    closeLoginPinModal();
    loginAs(u);
  } else {
    alert('Code PIN incorrect.');
    pinInput.value = '';
    pinInput.focus();
  }
}

function loginAs(user) {
  currentUser = user;
  sessionStorage.setItem('activeUserId', user.id);

  const loginScr = document.getElementById('login-screen');
  const appCont = document.getElementById('app-container');
  if (loginScr) loginScr.style.display = 'none';
  if (appCont) appCont.classList.remove('hidden');

  const topAvatar = document.getElementById('topAvatar');
  const topUserName = document.getElementById('topUserName');
  if (topAvatar) topAvatar.textContent = user.avatar || '👤';
  if (topUserName) topUserName.textContent = user.name;

  const btnSettings = document.getElementById('btn-open-settings');
  const btnParent = document.getElementById('btn-parent-mode');
  if (btnSettings) btnSettings.style.display = 'inline-block';
  if (btnParent) btnParent.style.display = (user.role === 'parent') ? 'inline-block' : 'none';

  if (typeof applySettings === 'function') applySettings();
  if (typeof initDefaultSelectedAccount === 'function') initDefaultSelectedAccount();
  if (typeof renderKids === 'function') renderKids();
  if (typeof switchMainTab === 'function') switchMainTab('dashboard');
  if (typeof window.loadCurrentProfileMealPlan === 'function') window.loadCurrentProfileMealPlan();
}

function logout() {
  sessionStorage.removeItem('activeUserId');
  currentUser = null;
  if (typeof isParentMode !== 'undefined') isParentMode = false;
  showLoginScreen();
}

// --- GESTION DES PROFILS ---
function openProfileEditModal(userId) {
  const generalModal = document.getElementById('generalSettingsModal');
  if (generalModal) generalModal.style.display = 'none';

  const form = document.getElementById('profileEditForm');
  if (form) form.reset();

  const titleEl = document.getElementById('profileEditModalTitle');
  const idEl = document.getElementById('editUserId');
  const nameEl = document.getElementById('editUserName');
  const avatarEl = document.getElementById('editUserAvatar');
  const roleEl = document.getElementById('editUserRole');
  const pinEl = document.getElementById('editUserPin');

  if (userId) {
    const u = appUsers.find(x => x.id === userId);
    if (!u) return;
    if (titleEl) titleEl.textContent = 'Modifier le profil';
    if (idEl) idEl.value = u.id;
    if (nameEl) nameEl.value = u.name;
    if (avatarEl) avatarEl.value = u.avatar || '👤';
    if (roleEl) roleEl.value = u.role;
    if (pinEl) pinEl.value = u.pin ? '••••••••' : '';
  } else {
    if (titleEl) titleEl.textContent = 'Nouveau profil';
    if (idEl) idEl.value = '';
    if (avatarEl) avatarEl.value = '🧑';
    if (roleEl) roleEl.value = 'child';
    if (pinEl) pinEl.value = '';
  }

  const modal = document.getElementById('profileEditModal');
  if (modal) modal.style.display = 'flex';
}

function closeProfileEditModal() {
  const modal = document.getElementById('profileEditModal');
  if (modal) modal.style.display = 'none';

  const generalModal = document.getElementById('generalSettingsModal');
  if (generalModal) generalModal.style.display = 'flex';
}

async function saveProfileEdit(e) {
  if (e) e.preventDefault();
  const id = document.getElementById('editUserId')?.value;
  const name = document.getElementById('editUserName')?.value.trim();
  const avatar = document.getElementById('editUserAvatar')?.value.trim() || '👤';
  const role = document.getElementById('editUserRole')?.value || 'child';
  const pinInput = document.getElementById('editUserPin')?.value.trim();

  if (!name) return;

  let finalPin = '';
  if (id) {
    const existing = appUsers.find(x => x.id === id);
    if (pinInput === '••••••••') {
      finalPin = existing ? existing.pin : '';
    } else if (pinInput !== '') {
      finalPin = await hashPin(pinInput);
    }
  } else {
    if (pinInput !== '') finalPin = await hashPin(pinInput);
  }

  if (id) {
    const u = appUsers.find(x => x.id === id);
    if (u) {
      u.name = name;
      u.avatar = avatar;
      u.role = role;
      u.pin = finalPin;
    }
  } else {
    appUsers.push({
      id: 'u_' + Date.now(),
      name,
      avatar,
      role,
      pin: finalPin,
      theme: 'dark',
      primaryColor: '#38bdf8'
    });
  }

  localStorage.setItem('app_users', JSON.stringify(appUsers));
  if (typeof saveToUpstash === 'function') {
    saveToUpstash('app_users', appUsers);
  }

  renderAppUsersList();
  closeProfileEditModal();

  if (currentUser && currentUser.id === id) {
    const updated = appUsers.find(x => x.id === id);
    if (updated) {
      currentUser = updated;
      const topAvatar = document.getElementById('topAvatar');
      const topUserName = document.getElementById('topUserName');
      if (topAvatar) topAvatar.textContent = updated.avatar;
      if (topUserName) topUserName.textContent = updated.name;
    }
  }
}

function deleteProfile(id) {
  if (appUsers.length <= 1) {
    alert("Impossible de supprimer l'unique profil existant.");
    return;
  }
  if (!confirm('Supprimer ce profil ?')) return;

  appUsers = appUsers.filter(x => x.id !== id);
  localStorage.setItem('app_users', JSON.stringify(appUsers));
  if (typeof saveToUpstash === 'function') {
    saveToUpstash('app_users', appUsers);
  }

  renderAppUsersList();
  if (currentUser && currentUser.id === id) {
    logout();
  }
}

function renderAppUsersList() {
  const container = document.getElementById('appUsersList');
  if (!container) return;

  container.innerHTML = appUsers.map(u => `
    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg); border:1px solid var(--border); padding:8px 12px; border-radius:8px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:1.3rem;">${u.avatar || '👤'}</span>
        <div>
          <div style="font-weight:700;">${u.name} ${u.pin ? '🔒' : ''}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${u.role === 'parent' ? 'Parent' : 'Enfant'}</div>
        </div>
      </div>
      <div style="display:flex; gap:6px;">
        <button type="button" class="btn-nav btn-small" onclick="openProfileEditModal('${u.id}')">✏️</button>
        <button type="button" class="btn-danger btn-small" onclick="deleteProfile('${u.id}')">✕</button>
      </div>
    </div>
  `).join('');
}

// Reconnexion automatique sur session active au chargement
document.addEventListener('DOMContentLoaded', () => {
  const activeId = sessionStorage.getItem('activeUserId');
  if (activeId) {
    const u = appUsers.find(x => x.id === activeId);
    if (u) {
      loginAs(u);
      return;
    }
  }
  showLoginScreen();
});

window.showLoginScreen = showLoginScreen;
window.attemptLogin = attemptLogin;
window.closeLoginPinModal = closeLoginPinModal;
window.submitLoginPin = submitLoginPin;
window.loginAs = loginAs;
window.logout = logout;
window.openProfileEditModal = openProfileEditModal;
window.closeProfileEditModal = closeProfileEditModal;
window.saveProfileEdit = saveProfileEdit;
window.deleteProfile = deleteProfile;
window.renderAppUsersList = renderAppUsersList;

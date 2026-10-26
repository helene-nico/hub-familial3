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
  return inputPin.trim() === storedPin.trim();
}

let failedPinAttempts = 0;
let lockoutUntil = 0;

// Chargement initial des utilisateurs
let appUsers = JSON.parse(localStorage.getItem('app_users')) || [
  { id: 'u1', name: 'Papa', role: 'parent', pin: '9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0', avatar: '👨' },
  { id: 'u2', name: 'Maman', role: 'parent', pin: '9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0', avatar: '👩' },
  { id: 'u3', name: 'Enfant 1', role: 'child', pin: '', avatar: '👧' }
];

let currentUser = null;
let pendingLoginUserId = null;

// --- CONNEXION ---
function showLoginScreen() {
  const screen = document.getElementById('login-screen');
  const container = document.getElementById('app-container');
  if (screen) screen.style.display = 'flex';
  if (container) container.classList.add('hidden');

  appUsers = JSON.parse(localStorage.getItem('app_users')) || appUsers;

  const grid = document.getElementById('loginUsersGrid');
  if (!grid) return;

  grid.innerHTML = appUsers.map(u => `
    <div class="user-card" onclick="attemptLogin('${u.id}')">
      <div class="avatar">${u.avatar || '👤'}</div>
      <div class="name">${u.name}</div>
      <div class="role">${u.role === 'parent' ? 'Parent' : 'Enfant'}</div>
    </div>
  `).join('');
}

function attemptLogin(id) {
  const u = appUsers.find(x => x.id === id);
  if (!u) return;

  if (Date.now() < lockoutUntil) {
    const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
    alert(`Accès temporairement bloqué. Réessaie dans ${remaining} s.`);
    return;
  }

  if (u.pin && u.pin.trim() !== '') {
    pendingLoginUserId = u.id;
    const pinTitle = document.getElementById('loginPinTitle');
    if (pinTitle) pinTitle.textContent = `Bonjour ${u.name}`;
    const pinInput = document.getElementById('login-pin-input');
    if (pinInput) pinInput.value = '';
    const pinModal = document.getElementById('pin-login-modal');
    if (pinModal) pinModal.style.display = 'flex';
    setTimeout(() => pinInput?.focus(), 50);
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
  if (Date.now() < lockoutUntil) {
    const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
    alert(`Accès temporairement bloqué. Réessaie dans ${remaining} s.`);
    return;
  }

  const pinInput = document.getElementById('login-pin-input');
  const enteredPin = pinInput ? pinInput.value : '';
  const u = appUsers.find(x => x.id === pendingLoginUserId);
  if (!u) return;

  const isCorrect = await verifyPin(enteredPin, u.pin);

  if (isCorrect) {
    failedPinAttempts = 0;
    if (u.pin && !/^[a-f0-9]{64}$/i.test(u.pin)) {
      u.pin = await hashPin(enteredPin);
      localStorage.setItem('app_users', JSON.stringify(appUsers));
      if (typeof window.saveToUpstash === 'function') window.saveToUpstash('app_users', appUsers);
    }
    closeLoginPinModal();
    loginAs(u);
  } else {
    failedPinAttempts++;
    if (failedPinAttempts >= 5) {
      lockoutUntil = Date.now() + 30000;
      alert("Trop d'erreurs. Verrouillage pendant 30 secondes.");
      closeLoginPinModal();
    } else {
      alert(`Code PIN erroné (${failedPinAttempts}/5).`);
      if (pinInput) {
        pinInput.value = '';
        pinInput.focus();
      }
    }
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
  const pinField = document.getElementById('editUserPin');

  if (userId) {
    const u = appUsers.find(x => x.id === userId);
    if (!u) return;
    if (titleEl) titleEl.textContent = `Modifier ${u.name}`;
    if (idEl) idEl.value = u.id;
    if (nameEl) nameEl.value = u.name;
    if (avatarEl) avatarEl.value = u.avatar || '🧑';
    if (roleEl) roleEl.value = u.role;
    if (pinField) {
      pinField.value = u.pin ? '••••••••' : '';
      pinField.onfocus = () => {
        if (pinField.value === '••••••••') pinField.value = '';
      };
    }
  } else {
    if (titleEl) titleEl.textContent = "Créer un profil";
    if (idEl) idEl.value = '';
    if (nameEl) nameEl.value = '';
    if (avatarEl) avatarEl.value = '🧑';
    if (roleEl) roleEl.value = 'child';
    if (pinField) {
      pinField.value = '';
      pinField.onfocus = null;
    }
  }

  const modal = document.getElementById('profileEditModal');
  if (modal) modal.style.display = 'flex';
}

window.closeProfileEditModal = () => {
  const modal = document.getElementById('profileEditModal');
  if (modal) modal.style.display = 'none';
  if (typeof openGeneralSettingsModal === 'function') {
    openGeneralSettingsModal();
  }
};

async function saveProfileEdit(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  const idInput = document.getElementById('editUserId');
  const id = idInput ? idInput.value : '';
  const nameInput = document.getElementById('editUserName');
  const name = nameInput ? nameInput.value.trim() : '';
  const avatarInput = document.getElementById('editUserAvatar');
  const avatar = avatarInput ? (avatarInput.value.trim() || '🧑') : '🧑';
  const roleSelect = document.getElementById('editUserRole');
  const role = roleSelect ? roleSelect.value : 'child';
  const pinField = document.getElementById('editUserPin');
  const rawPin = pinField ? pinField.value.trim() : '';

  if (!name) {
    alert("Prénom obligatoire.");
    return;
  }

  appUsers = JSON.parse(localStorage.getItem('app_users')) || appUsers;

  if (id) {
    const u = appUsers.find(x => x.id === id);
    if (u) {
      u.name = name;
      u.avatar = avatar;
      u.role = role;
      if (rawPin !== '' && rawPin !== '••••••••') {
        u.pin = await hashPin(rawPin);
      } else if (rawPin === '') {
        u.pin = '';
      }
    }
  } else {
    const hashedPin = rawPin ? await hashPin(rawPin) : '';
    const newUser = {
      id: 'u_' + Date.now(),
      name: name,
      role: role,
      pin: hashedPin,
      avatar: avatar,
      theme: 'dark',
      primaryColor: '#38bdf8'
    };
    appUsers.push(newUser);

    // Ajout automatique dans les missions si profil enfant
    if (role === 'child') {
      let missionsState = JSON.parse(localStorage.getItem('family_rewards_app')) || (typeof kidsState !== 'undefined' ? kidsState : null);
      if (missionsState && Array.isArray(missionsState.kids)) {
        const alreadyExists = missionsState.kids.some(k => k.name.toLowerCase() === name.toLowerCase());
        if (!alreadyExists) {
          missionsState.kids.push({
            id: Date.now(),
            name: name,
            birthDate: "2018-01-01",
            avatar: avatar,
            stars: 0,
            lifetimeStars: 0,
            present: true
          });
          localStorage.setItem('family_rewards_app', JSON.stringify(missionsState));
          if (typeof window.saveToUpstash === 'function') window.saveToUpstash('family_rewards_app', missionsState);
          if (typeof renderKids === 'function') renderKids();
        }
      }
    }
  }

  // Sauvegarde locale ET envoi immédiat sur Upstash
  localStorage.setItem('app_users', JSON.stringify(appUsers));
  if (typeof window.saveToUpstash === 'function') {
    await window.saveToUpstash('app_users', appUsers);
  }

  if (idInput) idInput.value = '';

  const editModal = document.getElementById('profileEditModal');
  if (editModal) editModal.style.display = 'none';

  renderAppUsersList();
  showLoginScreen();

  if (typeof openGeneralSettingsModal === 'function') {
    openGeneralSettingsModal();
  }
}

function renderAppUsersList() {
  const list = document.getElementById('appUsersList');
  if (!list) return;

  appUsers = JSON.parse(localStorage.getItem('app_users')) || appUsers;

  list.innerHTML = appUsers.map(u => `
    <div style="background:var(--bg); border:1px solid var(--border); padding:8px 12px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <span>${u.avatar || '👤'} <b>${u.name}</b></span>
        <span style="font-size:0.75rem; color:var(--text-muted); margin-left:6px;">(${u.role === 'parent' ? 'Parent' : 'Enfant'} • PIN : ${u.pin ? '••••' : 'Aucun'})</span>
      </div>
      <div style="display:flex; gap:6px;">
        <button class="btn-nav" style="padding:4px 8px; font-size:0.75rem;" onclick="openProfileEditModal('${u.id}')">✏️</button>
        <button class="btn-danger" style="padding:4px 8px;" onclick="deleteAppUser('${u.id}')">✕</button>
      </div>
    </div>
  `).join('');
}

window.deleteAppUser = async (id) => {
  const target = appUsers.find(x => x.id === id);
  if (!target) return;
  if (target.role === 'parent' && appUsers.filter(x => x.role === 'parent').length <= 1) {
    alert("Impossible de supprimer le seul parent restant.");
    return;
  }
  if (confirm(`Supprimer le profil de ${target.name} ?`)) {
    appUsers = appUsers.filter(x => x.id !== id);
    localStorage.setItem('app_users', JSON.stringify(appUsers));
    if (typeof window.saveToUpstash === 'function') {
      await window.saveToUpstash('app_users', appUsers);
    }
    renderAppUsersList();
    showLoginScreen();
  }
};

window.showLoginScreen = showLoginScreen;
window.attemptLogin = attemptLogin;
window.closeLoginPinModal = closeLoginPinModal;
window.submitLoginPin = submitLoginPin;
window.loginAs = loginAs;
window.logout = logout;
window.openProfileEditModal = openProfileEditModal;
window.saveProfileEdit = saveProfileEdit;
window.renderAppUsersList = renderAppUsersList;

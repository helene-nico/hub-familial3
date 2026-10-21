// --- UTILITAIRES CRYPTO & SÉCURITÉ ---

// Hachage SHA-256 via l'API Web Crypto native du navigateur
async function hashPin(pin) {
  if (!pin || pin.trim() === '') return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(pin.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Vérifie un code PIN saisi face au format stocké (gère le hash et l'ancien texte en clair)
async function verifyPin(inputPin, storedPin) {
  if (!storedPin) return true;
  if (/^[a-f0-9]{64}$/i.test(storedPin)) {
    const hashedInput = await hashPin(inputPin);
    return hashedInput === storedPin;
  }
  // Rétrocompatibilité avec les anciens profils non encore migrés
  return inputPin.trim() === storedPin.trim();
}

// Compteurs de protection anti-force brute
let failedPinAttempts = 0;
let lockoutUntil = 0;

// --- DONNÉES UTILISATEURS ---
// Les codes par défaut "0000" sont pré-hachés en SHA-256
let appUsers = JSON.parse(localStorage.getItem('app_users')) || [
  { id: 'u1', name: 'Papa', role: 'parent', pin: '9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0', avatar: '👨' },
  { id: 'u2', name: 'Maman', role: 'parent', pin: '9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0', avatar: '👩' },
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

  if (Date.now() < lockoutUntil) {
    const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
    alert(`Accès temporairement bloqué suite à des erreurs répétées. Réessayez dans ${remaining} s.`);
    return;
  }

  if (u.pin && u.pin.trim() !== '') {
    pendingLoginUserId = u.id;
    document.getElementById('loginPinTitle').textContent = `Bonjour ${u.name}`;
    const pinInput = document.getElementById('login-pin-input');
    pinInput.value = '';
    document.getElementById('pin-login-modal').style.display = 'flex';
    setTimeout(() => pinInput.focus(), 50);
  } else {
    loginAs(u);
  }
}

function closeLoginPinModal() {
  document.getElementById('pin-login-modal').style.display = 'none';
  pendingLoginUserId = null;
}

async function submitLoginPin() {
  if (Date.now() < lockoutUntil) {
    const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
    alert(`Accès temporairement bloqué. Réessayez dans ${remaining} s.`);
    return;
  }

  const pinInput = document.getElementById('login-pin-input');
  const enteredPin = pinInput.value;
  const u = appUsers.find(x => x.id === pendingLoginUserId);
  if (!u) return;

  const isCorrect = await verifyPin(enteredPin, u.pin);

  if (isCorrect) {
    failedPinAttempts = 0;

    // Si le compte stockait encore l'ancien mot de passe en clair, on le migre en SHA-256
    if (u.pin && !/^[a-f0-9]{64}$/i.test(u.pin)) {
      u.pin = await hashPin(enteredPin);
      localStorage.setItem('app_users', JSON.stringify(appUsers));
    }

    closeLoginPinModal();
    loginAs(u);
  } else {
    failedPinAttempts++;
    if (failedPinAttempts >= 5) {
      lockoutUntil = Date.now() + 30000; // Verrouillage 30 secondes
      alert("Trop de tentatives infructueuses. Verrouillage de sécurité pendant 30 secondes.");
      closeLoginPinModal();
    } else {
      alert(`Code PIN erroné. (Tentative ${failedPinAttempts}/5)`);
      pinInput.value = '';
      pinInput.focus();
    }
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
function openProfileEditModal(userId) {
  if (currentUser && currentUser.role !== 'parent') {
    alert("Seul un profil parent peut administrer les profils.");
    return;
  }

  if (typeof closeGeneralSettingsModal === 'function') {
    closeGeneralSettingsModal();
  }

  const form = document.getElementById('profileEditForm');
  if (form) form.reset();

  const pinField = document.getElementById('editUserPin');

  if (userId) {
    const u = appUsers.find(x => x.id === userId);
    if (!u) return;
    document.getElementById('profileEditModalTitle').textContent = `Modifier ${u.name}`;
    document.getElementById('editUserId').value = u.id;
    document.getElementById('editUserName').value = u.name;
    document.getElementById('editUserAvatar').value = u.avatar;
    document.getElementById('editUserRole').value = u.role;
    
    // On n'affiche jamais le hash : on indique par placeholder l'état actuel
    if (pinField) {
      pinField.value = u.pin ? '••••••••' : '';
      pinField.onfocus = () => {
        if (pinField.value === '••••••••') pinField.value = '';
      };
    }
  } else {
    document.getElementById('profileEditModalTitle').textContent = "Créer un profil";
    document.getElementById('editUserId').value = '';
    document.getElementById('editUserAvatar').value = '🧑';
    document.getElementById('editUserRole').value = 'child';
    if (pinField) {
      pinField.value = '';
      pinField.onfocus = null;
    }
  }

  document.getElementById('profileEditModal').style.display = 'flex';
}

window.closeProfileEditModal = () => {
  document.getElementById('profileEditModal').style.display = 'none';
  if (typeof openGeneralSettingsModal === 'function') {
    openGeneralSettingsModal();
  }
};

async function saveProfileEdit(e) {
  e.preventDefault();
  if (currentUser && currentUser.role !== 'parent') return;

  const id = document.getElementById('editUserId').value;
  const name = document.getElementById('editUserName').value.trim();
  const avatar = document.getElementById('editUserAvatar').value.trim();
  const role = document.getElementById('editUserRole').value;
  const pinField = document.getElementById('editUserPin');
  const rawPin = pinField ? pinField.value.trim() : '';

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

      // Traitement du code PIN
      if (rawPin === '••••••••') {
        // Le code reste inchangé
      } else if (rawPin === '') {
        u.pin = ''; // Code désactivé
      } else {
        u.pin = await hashPin(rawPin); // Nouveau code haché
      }
    }
  } else {
    const hashedPin = rawPin ? await hashPin(rawPin) : '';
    appUsers.push({
      id: 'u_' + Date.now(),
      name,
      role,
      pin: hashedPin,
      avatar,
      theme: 'dark',
      primaryColor: '#38bdf8'
    });
  }

  localStorage.setItem('app_users', JSON.stringify(appUsers));
  
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

// Exposition explicite sur la portée globale
window.showLoginScreen = showLoginScreen;
window.attemptLogin = attemptLogin;
window.closeLoginPinModal = closeLoginPinModal;
window.submitLoginPin = submitLoginPin;
window.loginAs = loginAs;
window.logout = logout;
window.openProfileEditModal = openProfileEditModal;
window.saveProfileEdit = saveProfileEdit;
window.renderAppUsersList = renderAppUsersList;

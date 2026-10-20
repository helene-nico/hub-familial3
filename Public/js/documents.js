let folders = JSON.parse(localStorage.getItem('doc_folders')) || [
  { id: 'f_common_1', name: 'Papiers Famille', scope: 'shared', ownerId: 'u1' },
  { id: 'f_common_2', name: 'Maison & Factures', scope: 'shared', ownerId: 'u1' }
];

let docsList = JSON.parse(localStorage.getItem('doc_list')) || [];
let currentFolderId = 'all';

function saveDocsMetadata() {
  localStorage.setItem('doc_folders', JSON.stringify(folders));
  localStorage.setItem('doc_list', JSON.stringify(docsList));
}

function canAccessFolder(folder) {
  if (!folder) return false;
  if (folder.scope === 'shared') return true;
  return typeof currentUser !== 'undefined' && currentUser && folder.ownerId === currentUser.id;
}
window.canAccessFolder = canAccessFolder;

// Adaptateur pour l'affichage dans le widget du tableau de bord
window.getDB = function() {
  return {
    transaction: () => ({
      objectStore: () => ({
        getAll: () => ({
          set onsuccess(cb) {
            cb({ target: { result: docsList } });
          }
        })
      })
    })
  };
};

function renderFoldersBar() {
  const bar = document.getElementById('foldersBar');
  if (!bar) return;
  bar.innerHTML = `<div class="folder-chip ${currentFolderId === 'all' ? 'active' : ''}" onclick="selectFolder('all')">Tous les dossiers</div>`;

  folders.forEach(f => {
    if (canAccessFolder(f)) {
      bar.innerHTML += `
        <div class="folder-chip ${currentFolderId === f.id ? 'active' : ''}" onclick="selectFolder('${f.id}')">
          ${f.scope === 'private' ? '🔒' : '📁'} ${f.name}
        </div>
      `;
    }
  });

  const select = document.getElementById('docFolderSelect');
  if (select) {
    select.innerHTML = '';
    folders.forEach(f => {
      if (canAccessFolder(f)) {
        select.innerHTML += `<option value="${f.id}">${f.scope === 'private' ? '🔒' : '📁'} ${f.name}</option>`;
      }
    });
  }
}

window.selectFolder = function(id) {
  currentFolderId = id;
  renderFoldersBar();
  renderDocuments();
};

window.openFolderModal = function() {
  document.getElementById('folderModal').style.display = 'flex';
  renderFoldersList();
};

window.closeFolderModal = function() {
  document.getElementById('folderModal').style.display = 'none';
};

function renderFoldersList() {
  const list = document.getElementById('foldersList');
  if (!list) return;
  list.innerHTML = '';
  folders.forEach(f => {
    if (canAccessFolder(f)) {
      list.innerHTML += `
        <div style="background:var(--bg); border:1px solid var(--border); padding:8px 12px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
          <span>${f.scope === 'private' ? '🔒' : '📁'} <b>${f.name}</b> <small style="color:var(--text-muted);">(${f.scope === 'private' ? 'Privé' : 'Commun'})</small></span>
          <button class="btn-danger" onclick="deleteFolder('${f.id}')">✕</button>
        </div>
      `;
    }
  });
}

const folderForm = document.getElementById('folderForm');
if (folderForm) {
  folderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('newFolderName');
    const scopeInput = document.getElementById('newFolderScope');
    const name = nameInput.value.trim();
    const scope = scopeInput.value;
    if (!name) return;

    folders.push({
      id: 'f_' + Date.now(),
      name,
      scope,
      ownerId: currentUser ? currentUser.id : 'u1'
    });
    saveDocsMetadata();
    nameInput.value = '';
    renderFoldersList();
    renderFoldersBar();
  });
}

window.deleteFolder = function(id) {
  if (confirm("Supprimer ce dossier ? Les fichiers associés ne seront plus classés.")) {
    folders = folders.filter(f => f.id !== id);
    saveDocsMetadata();
    if (currentFolderId === id) currentFolderId = 'all';
    renderFoldersList();
    renderFoldersBar();
    renderDocuments();
  }
};

window.renderDocuments = function() {
  renderFoldersBar();
  const tbody = document.getElementById('docsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  docsList = JSON.parse(localStorage.getItem('doc_list')) || [];

  const accessibleDocs = docsList.filter(d => {
    const folder = folders.find(f => f.id === d.folderId);
    if (!folder) return true;
    return canAccessFolder(folder);
  });

  const filtered = accessibleDocs.filter(d => {
    if (currentFolderId === 'all') return true;
    return d.folderId === currentFolderId;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:20px;">Aucun document dans cette sélection.</td></tr>';
    return;
  }

  filtered.forEach(doc => {
    const sizeKb = (doc.size / 1024).toFixed(1) + ' Ko';
    const folder = folders.find(f => f.id === doc.folderId);
    const folderLabel = folder ? `${folder.scope === 'private' ? '🔒' : '📁'} ${folder.name}` : 'Général';

    tbody.innerHTML += `
      <tr>
        <td><b>${doc.name}</b></td>
        <td><span class="badge badge-cat">${folderLabel}</span></td>
        <td>${doc.date}</td>
        <td style="color:var(--text-muted);">${sizeKb}</td>
        <td style="text-align:right;">
          <a href="/api/documents/file/${encodeURIComponent(doc.fileId)}" download="${encodeURIComponent(doc.name)}" class="btn-nav" style="padding:4px 8px; font-size:0.8rem; text-decoration:none; display:inline-block;">⬇ Télécharger</a>
        </td>
        <td style="text-align:center;"><button class="btn-danger" onclick="deleteDoc('${doc.id}')">✕</button></td>
      </tr>
    `;
  });
};

const docForm = document.getElementById('docForm');
if (docForm) {
  docForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('docFileInput');
    const nameInput = document.getElementById('docName');
    const folderSelect = document.getElementById('docFolderSelect');
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData });
      const uploaded = await res.json();

      const docRecord = {
        id: 'doc_' + Date.now(),
        name: nameInput.value.trim(),
        fileId: uploaded.fileId,
        folderId: folderSelect.value,
        date: new Date().toLocaleDateString('fr-FR'),
        size: uploaded.size,
        mimeType: uploaded.mimeType,
        ownerId: currentUser ? currentUser.id : 'u1'
      };

      docsList.push(docRecord);
      saveDocsMetadata();

      closeDocModal();
      docForm.reset();
      renderDocuments();
      if (typeof renderDashboard === 'function') renderDashboard();
    } catch (err) {
      alert("Erreur lors de l'envoi du document sur le serveur.");
    }
  });
}

window.deleteDoc = async function(id) {
  if (!confirm("Supprimer définitivement ce document ?")) return;
  const doc = docsList.find(d => d.id === id);
  if (doc && doc.fileId) {
    try {
      await fetch(`/api/documents/file/${encodeURIComponent(doc.fileId)}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  }
  docsList = docsList.filter(d => d.id !== id);
  saveDocsMetadata();
  renderDocuments();
  if (typeof renderDashboard === 'function') renderDashboard();
};

window.openDocModal = function() { document.getElementById('docModal').style.display = 'flex'; };
window.closeDocModal = function() { document.getElementById('docModal').style.display = 'none'; };
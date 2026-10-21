// --- SYNCHRONISATION AVEC UPSTASH (RENDER) ---
async function saveToCloud(key, value) {
  try {
    await fetch(`/api/store/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value })
    });
  } catch (err) {
    console.error(`Erreur sauvegarde cloud (${key}) :`, err);
  }
}

async function deleteFromCloud(key) {
  try {
    await fetch(`/api/store/${key}`, { method: 'DELETE' });
  } catch (err) {
    console.error(`Erreur suppression cloud (${key}) :`, err);
  }
}

async function syncFromCloud() {
  try {
    const res = await fetch('/api/sync');
    if (!res.ok) return;
    const cloudData = await res.json();

    if (cloudData && typeof cloudData === 'object' && Object.keys(cloudData).length > 0) {
      // 1. Mettre à jour le localStorage avec les données du serveur
      Object.keys(cloudData).forEach(key => {
        const val = cloudData[key];
        localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
      });

      // 2. Mettre à jour la variable en mémoire pour les comptes
      if (cloudData.bank_accounts) {
        bankAccounts = typeof cloudData.bank_accounts === 'string'
          ? JSON.parse(cloudData.bank_accounts)
          : cloudData.bank_accounts;
      }

      // 3. Rafraîchir l'interface
      renderAccountsCards();
      if (currentAccountId) {
        loadCurrentAccountData();
      }
    } else {
      // Si la base Upstash est encore vide, on initialise avec les comptes par défaut
      if (bankAccounts && bankAccounts.length > 0) {
        saveToCloud('bank_accounts', bankAccounts);
      }
    }
  } catch (err) {
    console.error("Erreur de synchronisation cloud :", err);
  }
}

// Synchronise au chargement, au retour sur l'onglet et toutes les 30 secondes
syncFromCloud();
window.addEventListener('focus', syncFromCloud);
setInterval(syncFromCloud, 30000);

// --- DONNÉES FINANCIÈRES ---
let bankAccounts = JSON.parse(localStorage.getItem('bank_accounts')) || [
  { id: 'acc_comm', name: 'Compte Commun', icon: '🏦', ownerId: 'shared', sharing: 'all', baseBalance: 0 },
  { id: 'acc_u1', name: 'Compte Perso Papa', icon: '💳', ownerId: 'u1', sharing: 'parents', baseBalance: 0 },
  { id: 'acc_u2', name: 'Compte Perso Maman', icon: '💳', ownerId: 'u2', sharing: 'parents', baseBalance: 0 }
];

let currentAccountId = null;
let baseBalance = 0;
let transactions = [];
let recurringRules = [];
let categories = [];
let defaultCategories = [
  { id: 'c1', name: 'Alimentation' },
  { id: 'c2', name: 'Logement' },
  { id: 'c3', name: 'Loisirs' }
];
let showCleared = false;
let currentDateBudget = new Date();

const txDateInput = document.getElementById('txDate');
if (txDateInput) txDateInput.value = new Date().toISOString().split('T')[0];

function formatMoney(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}

function getBudgetMonthKey(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return `${parts[0]}-${String(parts[1]).padStart(2, '0')}`;
}

function canAccessAccount(acc, user) {
  if (!acc || !user) return false;
  if (acc.sharing === 'all') return true;
  if (acc.sharing === 'parents') return user.role === 'parent';
  if (acc.sharing === 'private') return acc.ownerId === user.id;
  return false;
}

function getAccessibleAccounts() {
  if (typeof currentUser === 'undefined' || !currentUser) return [];
  return bankAccounts.filter(acc => canAccessAccount(acc, currentUser));
}

// --- NAVIGATION ENTRE L'ACCUEIL DES COMPTES ET LE DÉTAIL ---
window.showBudgetAccountsView = function() {
  const accView = document.getElementById('budget-accounts-view');
  const detailView = document.getElementById('budget-detail-view');
  if (accView) accView.classList.remove('hidden');
  if (detailView) detailView.classList.add('hidden');
  renderAccountsCards();
};

window.showBudgetDetailView = function() {
  const accView = document.getElementById('budget-accounts-view');
  const detailView = document.getElementById('budget-detail-view');
  if (accView) accView.classList.add('hidden');
  if (detailView) detailView.classList.remove('hidden');
};

window.initDefaultSelectedAccount = function() {
  showBudgetAccountsView();
};

window.selectBankAccount = function(id) {
  currentAccountId = id;
  loadCurrentAccountData();
  showBudgetDetailView();
};

function computeAccountRealBalance(accId) {
  const acc = bankAccounts.find(a => a.id === accId);
  if (!acc) return 0;
  const txs = JSON.parse(localStorage.getItem('transactions_' + accId)) || [];
  let total = acc.baseBalance || 0;
  txs.forEach(tx => {
    if (tx.cleared) {
      total += (tx.type === 'income' ? tx.amount : -tx.amount);
    }
  });
  return total;
}

function loadCurrentAccountData() {
  renderAccountsCards();
  if (!currentAccountId) {
    transactions = [];
    recurringRules = [];
    baseBalance = 0;
    categories = defaultCategories;
    renderBudget();
    return;
  }

  const acc = bankAccounts.find(a => a.id === currentAccountId);
  baseBalance = acc ? (acc.baseBalance || 0) : 0;
  transactions = JSON.parse(localStorage.getItem('transactions_' + currentAccountId)) || [];
  recurringRules = JSON.parse(localStorage.getItem('recurring_rules_' + currentAccountId)) || [];
  categories = JSON.parse(localStorage.getItem('categories_' + currentAccountId)) || defaultCategories;

  renderBudget();
}

function saveBudgetData() {
  if (!currentAccountId) return;

  // 1. Sauvegarde locale
  localStorage.setItem('transactions_' + currentAccountId, JSON.stringify(transactions));
  localStorage.setItem('recurring_rules_' + currentAccountId, JSON.stringify(recurringRules));
  localStorage.setItem('categories_' + currentAccountId, JSON.stringify(categories));

  const acc = bankAccounts.find(a => a.id === currentAccountId);
  if (acc) {
    acc.baseBalance = baseBalance;
    localStorage.setItem('bank_accounts', JSON.stringify(bankAccounts));
    saveToCloud('bank_accounts', bankAccounts);
  }

  // 2. Synchronisation Upstash
  saveToCloud('transactions_' + currentAccountId, transactions);
  saveToCloud('recurring_rules_' + currentAccountId, recurringRules);
  saveToCloud('categories_' + currentAccountId, categories);
}

function renderAccountsCards() {
  const container = document.getElementById('accountsCardsGrid');
  if (!container) return;
  container.innerHTML = '';
  const accessible = getAccessibleAccounts();

  if (accessible.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted); padding:10px;">Aucun compte accessible pour ce profil.</p>';
    return;
  }

  accessible.forEach(acc => {
    const realBal = computeAccountRealBalance(acc.id);
    let badgeLabel = '🌍 Famille';
    if (acc.sharing === 'private') badgeLabel = '🔒 Privé';
    if (acc.sharing === 'parents') badgeLabel = '👥 Parents';

    const isActive = acc.id === currentAccountId;

    container.innerHTML += `
      <div class="account-badge-card ${isActive ? 'active' : ''}" onclick="selectBankAccount('${acc.id}')">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div class="acc-title"><span>${acc.icon || '💳'}</span> <span>${acc.name}</span></div>
          <span class="badge badge-cat">${badgeLabel}</span>
        </div>
        <div class="acc-balance val-real">${formatMoney(realBal)}</div>
      </div>
    `;
  });

  const activeAcc = bankAccounts.find(a => a.id === currentAccountId);
  const label = document.getElementById('activeAccountNameLabel');
  if (label) {
    label.textContent = activeAcc ? `${activeAcc.icon || '💳'} ${activeAcc.name}` : 'Sélectionnez un compte';
  }
}

// --- AUTO-GÉNÉRATION DES RÉCURRENCES ---
function generateRecurringTransactions(monthKey) {
  if (!recurringRules || recurringRules.length === 0) return;
  let modified = false;

  recurringRules.forEach(rule => {
    const ruleMonthKey = getBudgetMonthKey(rule.startDate);
    if (ruleMonthKey <= monthKey) {
      const exists = transactions.some(t => t.recurringId === rule.id && getBudgetMonthKey(t.date) === monthKey);

      if (!exists) {
        let y = parseInt(monthKey.split('-')[0]);
        let m = parseInt(monthKey.split('-')[1]);
        let d = rule.day;

        let maxDays = new Date(y, m, 0).getDate();
        if (d > maxDays) d = maxDays;

        let dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

        transactions.push({
          id: 'tx_' + Date.now() + Math.floor(Math.random() * 1000),
          type: rule.type,
          categoryId: rule.categoryId,
          title: rule.title,
          amount: rule.amount,
          date: dateStr,
          cleared: false,
          recurringId: rule.id
        });
        modified = true;
      }
    }
  });

  if (modified) saveBudgetData();
}

function renderBudget() {
  const catSelect = document.getElementById('txCategory');
  if (catSelect) {
    catSelect.innerHTML = '<option value="">-- Aucune --</option>';
    categories.forEach(c => catSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`);
  }

  const year = currentDateBudget.getFullYear();
  const month = currentDateBudget.getMonth();
  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  const monthLabel = document.getElementById('currentMonthLabel');
  if (monthLabel) monthLabel.textContent = `${monthNames[month]} ${year}`;

  const currentMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  generateRecurringTransactions(currentMonthKey);

  let realTotal = baseBalance;
  let carryoverTotal = baseBalance;

  transactions.forEach(tx => {
    if (tx.cleared) realTotal += (tx.type === 'income' ? tx.amount : -tx.amount);
    if (getBudgetMonthKey(tx.date) < currentMonthKey) carryoverTotal += (tx.type === 'income' ? tx.amount : -tx.amount);
  });

  const realBalEl = document.getElementById('realBalance');
  if (realBalEl) realBalEl.textContent = formatMoney(realTotal);

  const monthTxs = transactions.filter(tx => getBudgetMonthKey(tx.date) === currentMonthKey).sort((a,b) => a.date.localeCompare(b.date));
  let mIncome = 0, mExpense = 0;
  const catTotals = {};

  monthTxs.forEach(tx => {
    if (tx.type === 'income') mIncome += tx.amount;
    else {
      mExpense += tx.amount;
      const cId = tx.categoryId || 'none';
      catTotals[cId] = (catTotals[cId] || 0) + tx.amount;
    }
  });

  const forecastBalEl = document.getElementById('forecastBalance');
  if (forecastBalEl) forecastBalEl.textContent = formatMoney(carryoverTotal + (mIncome - mExpense));

  const summaryGrid = document.getElementById('summaryGrid');
  const noSummary = document.getElementById('noSummaryMessage');
  if (summaryGrid && noSummary) {
    summaryGrid.innerHTML = '';
    const catKeys = Object.keys(catTotals);
    if (catKeys.length > 0) {
      noSummary.style.display = 'none';
      catKeys.forEach(cid => {
        const cName = cid === 'none' ? 'Non catégorisé' : (categories.find(c => c.id === cid)?.name || 'Inconnu');
        summaryGrid.innerHTML += `
          <div style="background:var(--bg); border:1px solid var(--border); padding:10px; border-radius:8px;">
            <div style="font-size:0.8rem; color:var(--text-muted);">${cName}</div>
            <div style="font-weight:700;">${formatMoney(catTotals[cid])}</div>
          </div>`;
      });
    } else {
      noSummary.style.display = 'block';
    }
  }

  const tbody = document.getElementById('txTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const displayed = monthTxs.filter(tx => showCleared || !tx.cleared);

  if (displayed.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:20px;">Toutes les opérations sont à jour.</td></tr>';
    return;
  }

  displayed.forEach(tx => {
    const cName = categories.find(c => c.id === tx.categoryId)?.name;
    tbody.innerHTML += `
      <tr class="${tx.cleared ? 'cleared' : ''}">
        <td style="text-align:center;"><input type="checkbox" ${tx.cleared ? 'checked' : ''} onchange="toggleClear('${tx.id}')"></td>
        <td>${tx.date.split('-').reverse().join('/')}</td>
        <td>
          <div>${tx.title} ${tx.recurringId ? '<span class="badge badge-recurring">🔄 Récurrent</span>' : ''}</div>
          ${cName ? `<span class="badge badge-cat">${cName}</span>` : ''}
        </td>
        <td style="text-align:right; font-weight:600;" class="${tx.type === 'income' ? 'positive' : 'negative'}">
          ${tx.type === 'income' ? '+' : '-'}${formatMoney(tx.amount)}
        </td>
        <td style="text-align:right; padding-right:12px;">
          <div style="display:inline-flex; gap:6px; justify-content:flex-end;">
            <button class="btn-nav" style="padding:4px 8px; font-size:0.75rem;" onclick="openTxModal('${tx.id}')" title="Modifier">✏️</button>
            <button class="btn-danger" style="padding:4px 8px;" onclick="deleteTx('${tx.id}')" title="Supprimer">✕</button>
          </div>
        </td>
      </tr>
    `;
  });
}

window.toggleClear = (id) => {
  const tx = transactions.find(t => t.id === id);
  if (tx) {
    tx.cleared = !tx.cleared;
    saveBudgetData();
    loadCurrentAccountData();
  }
};

window.deleteTx = (id) => {
  if (confirm("Supprimer cette opération ?")) {
    transactions = transactions.filter(t => t.id !== id);
    saveBudgetData();
    loadCurrentAccountData();
  }
};

window.toggleShowCleared = () => {
  showCleared = document.getElementById('toggleCleared').checked;
  renderBudget();
};

/* --- FENÊTRES MODALES OPÉRATIONS --- */
window.openTxModal = (txId = null) => {
  const form = document.getElementById('txForm');
  if (form) form.reset();

  const titleEl = document.getElementById('txModalTitle');
  const editIdInput = document.getElementById('editTxId');
  const btnDelete = document.getElementById('btnDeleteTxModal');
  const recurringGroup = document.getElementById('txRecurringGroup');

  if (txId) {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;
    if (titleEl) titleEl.textContent = "Modifier l'opération";
    if (editIdInput) editIdInput.value = tx.id;
    const typeSelect = document.getElementById('txType');
    const catSelect = document.getElementById('txCategory');
    const titleInput = document.getElementById('txTitle');
    const amountInput = document.getElementById('txAmount');
    const dateInput = document.getElementById('txDate');

    if (typeSelect) typeSelect.value = tx.type;
    if (catSelect) catSelect.value = tx.categoryId || '';
    if (titleInput) titleInput.value = tx.title;
    if (amountInput) amountInput.value = tx.amount;
    if (dateInput) dateInput.value = tx.date;
    if (recurringGroup) recurringGroup.style.display = 'none';
    if (btnDelete) btnDelete.style.display = 'inline-block';
  } else {
    if (titleEl) titleEl.textContent = "Nouvelle Opération";
    if (editIdInput) editIdInput.value = '';
    const dateInput = document.getElementById('txDate');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    if (recurringGroup) recurringGroup.style.display = 'block';
    if (btnDelete) btnDelete.style.display = 'none';
  }

  const modal = document.getElementById('txModal');
  if (modal) modal.style.display = 'flex';
};

window.closeTxModal = () => {
  const modal = document.getElementById('txModal');
  if (modal) modal.style.display = 'none';
};

window.deleteCurrentModalTx = () => {
  const editId = document.getElementById('editTxId')?.value;
  if (editId) {
    closeTxModal();
    deleteTx(editId);
  }
};

window.openBreakdownModal = () => { document.getElementById('breakdownModal').style.display = 'flex'; };
window.closeBreakdownModal = () => { document.getElementById('breakdownModal').style.display = 'none'; };

/* --- GESTION DES CATÉGORIES --- */
window.openCatModal = () => { 
  document.getElementById('catModal').style.display = 'flex'; 
  renderCatModalList();
};
window.closeCatModal = () => { document.getElementById('catModal').style.display = 'none'; };

function renderCatModalList() {
  const list = document.getElementById('modalCatList');
  if (!list) return;

  if (categories.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:10px;">Aucune catégorie.</p>';
    return;
  }

  list.innerHTML = categories.map(c => `
    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg); border:1px solid var(--border); padding:8px 12px; border-radius:8px;">
      <span style="font-weight:600;">${c.name}</span>
      <div style="display:flex; gap:4px;">
        <button type="button" class="btn-nav" style="padding:4px 8px;" onclick="editCategory('${c.id}')" title="Modifier">✏️</button>
        <button type="button" class="btn-danger" style="padding:4px 8px;" onclick="deleteCategory('${c.id}')" title="Supprimer">✕</button>
      </div>
    </div>
  `).join('');
}

window.editCategory = (id) => {
  const cat = categories.find(c => c.id === id);
  if (!cat) return;
  const newName = prompt("Modifier le nom de la catégorie :", cat.name);
  if (newName && newName.trim() !== "") {
    cat.name = newName.trim();
    saveBudgetData();
    renderCatModalList();
    renderBudget();
  }
};

window.deleteCategory = (id) => {
  if (confirm("Supprimer cette catégorie ? (Les opérations existantes perdront cette étiquette mais ne seront pas supprimées)")) {
    categories = categories.filter(c => c.id !== id);
    transactions.forEach(tx => {
      if (tx.categoryId === id) tx.categoryId = '';
    });
    saveBudgetData();
    renderCatModalList();
    renderBudget();
  }
};

const catForm = document.getElementById('catForm');
if (catForm) {
  catForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('newCatName');
    const name = nameInput.value.trim();
    if (name) {
      categories.push({ id: 'c_' + Date.now(), name });
      saveBudgetData();
      nameInput.value = '';
      renderCatModalList();
      renderBudget();
    }
  });
}

/* --- GESTION DE LA CRÉATION ET MODIFICATION DE COMPTE --- */
window.openAccountModal = function(accId) {
  const form = document.getElementById('accountForm');
  if (form) form.reset();

  const titleEl = document.getElementById('accountModalTitle');
  const btnDelete = document.getElementById('btnDeleteAccount');
  const editIdInput = document.getElementById('editAccountId');

  if (accId) {
    const acc = bankAccounts.find(a => a.id === accId);
    if (!acc) return;
    if (titleEl) titleEl.textContent = "Modifier le compte";
    if (editIdInput) editIdInput.value = acc.id;
    document.getElementById('accFormName').value = acc.name || '';
    document.getElementById('accFormIcon').value = acc.icon || '💳';
    document.getElementById('accFormBalance').value = acc.baseBalance !== undefined ? acc.baseBalance : 0;
    document.getElementById('accFormSharing').value = acc.sharing || 'parents';
    if (btnDelete) btnDelete.style.display = 'inline-block';
  } else {
    if (titleEl) titleEl.textContent = "Nouveau Compte";
    if (editIdInput) editIdInput.value = '';
    document.getElementById('accFormIcon').value = '💳';
    document.getElementById('accFormBalance').value = '0.00';
    document.getElementById('accFormSharing').value = 'parents';
    if (btnDelete) btnDelete.style.display = 'none';
  }

  document.getElementById('accountModal').style.display = 'flex';
};

window.openEditActiveAccountModal = function() {
  if (!currentAccountId) {
    alert("Veuillez d'abord sélectionner un compte.");
    return;
  }
  openAccountModal(currentAccountId);
};

window.closeAccountModal = function() {
  document.getElementById('accountModal').style.display = 'none';
};

window.deleteCurrentActiveAccount = async function() {
  const editId = document.getElementById('editAccountId').value;
  if (!editId) return;

  const acc = bankAccounts.find(a => a.id === editId);
  if (!acc) return;

  if (confirm(`Supprimer définitivement le compte « ${acc.name} » et tout son historique ?`)) {
    bankAccounts = bankAccounts.filter(a => a.id !== editId);
    localStorage.removeItem('transactions_' + editId);
    localStorage.removeItem('recurring_rules_' + editId);
    localStorage.removeItem('categories_' + editId);
    localStorage.setItem('bank_accounts', JSON.stringify(bankAccounts));

    // Suppression sur Upstash
    await deleteFromCloud('transactions_' + editId);
    await deleteFromCloud('recurring_rules_' + editId);
    await deleteFromCloud('categories_' + editId);
    await saveToCloud('bank_accounts', bankAccounts);

    closeAccountModal();
    currentAccountId = null;
    showBudgetAccountsView();
  }
};

const accountForm = document.getElementById('accountForm');
if (accountForm) {
  accountForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('editAccountId').value;
    const name = document.getElementById('accFormName').value.trim();
    const icon = document.getElementById('accFormIcon').value.trim() || '💳';
    const balance = parseFloat(document.getElementById('accFormBalance').value) || 0;
    const sharing = document.getElementById('accFormSharing').value;

    if (!name) return;

    if (editId) {
      const acc = bankAccounts.find(a => a.id === editId);
      if (acc) {
        acc.name = name;
        acc.icon = icon;
        acc.baseBalance = balance;
        acc.sharing = sharing;
      }
    } else {
      const newAcc = {
        id: 'acc_' + Date.now(),
        name,
        icon,
        baseBalance: balance,
        sharing,
        ownerId: (typeof currentUser !== 'undefined' && currentUser) ? currentUser.id : 'u1'
      };
      bankAccounts.push(newAcc);
      currentAccountId = newAcc.id;
    }

    localStorage.setItem('bank_accounts', JSON.stringify(bankAccounts));
    saveToCloud('bank_accounts', bankAccounts);

    closeAccountModal();
    if (currentAccountId) {
      loadCurrentAccountData();
    } else {
      showBudgetAccountsView();
    }
  });
}

/* --- GESTION DES RÉCURRENCES (MODALE) --- */
window.openRecurringModal = () => { 
  document.getElementById('recurringModal').style.display = 'flex'; 
  renderRecurringList();
};
window.closeRecurringModal = () => { document.getElementById('recurringModal').style.display = 'none'; };

function renderRecurringList() {
  const list = document.getElementById('recurringList');
  if (!list) return;

  if (!recurringRules || recurringRules.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:20px;">Aucune opération récurrente configurée.</p>';
    return;
  }

  list.innerHTML = recurringRules.map(r => {
    const cName = categories.find(c => c.id === r.categoryId)?.name || '';
    return `
      <div style="background:var(--bg); border:1px solid var(--border); padding:12px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <div>
          <div style="font-weight:700;">${r.title}</div>
          <div style="font-size:0.85rem; color:var(--text-muted);">
            Le ${r.day} du mois • <span class="${r.type === 'income' ? 'positive' : 'negative'}">${r.type === 'income' ? '+' : '-'}${formatMoney(r.amount)}</span> ${cName ? '('+cName+')' : ''}
          </div>
        </div>
        <button class="btn-danger" onclick="deleteRecurringRule('${r.id}')">✕</button>
      </div>
    `;
  }).join('');
}

window.deleteRecurringRule = (id) => {
  if (confirm("Supprimer cette récurrence ? Les opérations futures ne seront plus créées (les anciennes sont conservées).")) {
    recurringRules = recurringRules.filter(r => r.id !== id);
    saveBudgetData();
    renderRecurringList();
  }
};

/* --- SOUMISSION DE L'OPÉRATION (AJOUT OU MODIFICATION) --- */
const txForm = document.getElementById('txForm');
if (txForm) {
  txForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('editTxId')?.value;
    const type = document.getElementById('txType').value;
    const cat = document.getElementById('txCategory').value;
    const title = document.getElementById('txTitle').value.trim();
    const amount = parseFloat(document.getElementById('txAmount').value);
    const date = document.getElementById('txDate').value;

    if (!title || isNaN(amount) || !date) return;

    if (editId) {
      const tx = transactions.find(t => t.id === editId);
      if (tx) {
        tx.type = type;
        tx.categoryId = cat;
        tx.title = title;
        tx.amount = amount;
        tx.date = date;
      }
    } else {
      const recurring = document.getElementById('txRecurring')?.checked || false;
      const recId = recurring ? 'rec_' + Date.now() : null;

      transactions.push({
        id: 'tx_' + Date.now(),
        type,
        categoryId: cat,
        title,
        amount,
        date,
        cleared: false, 
        recurringId: recId
      });

      if (recurring) {
        recurringRules.push({
          id: recId,
          type,
          categoryId: cat,
          title,
          amount,
          startDate: date,
          day: parseInt(date.split('-')[2], 10)
        });
      }
    }

    saveBudgetData();
    closeTxModal();
    loadCurrentAccountData();
  });
}

/* --- CHANGEMENT DE MOIS --- */
window.changeMonth = function(delta) {
  currentDateBudget.setDate(1); 
  currentDateBudget.setMonth(currentDateBudget.getMonth() + delta);
  renderBudget();
};

/* --- GESTION DU MENU DÉROULANT OPTIONS BUDGET --- */
window.toggleBudgetOptions = function(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const menu = document.getElementById('budget-options-menu');
  if (menu) {
    menu.classList.toggle('show');
  }
};

document.addEventListener('click', function(event) {
  const menu = document.getElementById('budget-options-menu');
  if (menu && menu.classList.contains('show') && !event.target.closest('.dropdown-container')) {
    menu.classList.remove('show');
  }
});

// ==========================================
// MODULE BUDGET FAMILIAL (Multi-comptes, Rapprochement, Prévisionnel)
// ==========================================

let bankAccounts = [];
let categories = [];
let transactions = [];
let recurringRules = [];
let budgetSettings = { defaultAccountId: null };

let currentAccountId = null;
let currentMonthKey = ''; // Format 'YYYY-MM'
let isInitialBudgetLoad = true;

// --- INITIALISATION ---
window.initBudgetModule = async () => {
  setupBudgetDateSelector();
  await loadBudgetData();
  setupBudgetEventListeners();
};

function setupBudgetDateSelector() {
  const select = document.getElementById('budgetMonthSelect');
  if (!select) return;

  select.innerHTML = '';
  const now = new Date();
  
  // Générer une plage de 12 mois passés à 12 mois futurs
  for (let i = -12; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = label.charAt(0).toUpperCase() + label.slice(1);
    if (i === 0) opt.selected = true;
    select.appendChild(opt);
  }

  currentMonthKey = select.value;
  select.onchange = (e) => {
    currentMonthKey = e.target.value;
    renderCurrentMonth();
  };
}

// --- CHARGEMENT DES DONNÉES ---
async function loadBudgetData() {
  // 1. Paramètres & Catégories (globaux)
  budgetSettings = JSON.parse(localStorage.getItem('budget_settings')) || { defaultAccountId: null };
  categories = JSON.parse(localStorage.getItem('budget_categories')) || [];
  
  // Si aucune catégorie n'existe, on injecte les catégories par défaut
  if (categories.length === 0) {
    categories = [
      { id: 'cat_salaire', name: 'Salaires & Revenus', icon: '💰', type: 'income' },
      { id: 'cat_courses', name: 'Alimentation & Courses', icon: '🛒', type: 'expense' },
      { id: 'cat_logement', name: 'Loyer & Charges', icon: '🏠', type: 'expense' },
      { id: 'cat_energie', name: 'Électricité & Eau', icon: '⚡', type: 'expense' },
      { id: 'cat_loisirs', name: 'Loisirs & Sorties', icon: '🎉', type: 'expense' },
      { id: 'cat_transports', name: 'Transports & Carburant', icon: '🚗', type: 'expense' },
      { id: 'cat_sante', name: 'Santé & Assurances', icon: '💊', type: 'expense' },
      { id: 'cat_virement', name: 'Virements internes', icon: '🔄', type: 'both' }
    ];
    localStorage.setItem('budget_categories', JSON.stringify(categories));
    saveToCloud('budget_categories', categories);
  }

  // 2. Comptes bancaires
  bankAccounts = JSON.parse(localStorage.getItem('bank_accounts')) || [];
  if (bankAccounts.length === 0) {
    bankAccounts = [
      { id: 'acc_principal', name: 'Compte Courant Principal', initialBalance: 0, color: '#3b82f6' }
    ];
    budgetSettings.defaultAccountId = 'acc_principal';
    localStorage.setItem('bank_accounts', JSON.stringify(bankAccounts));
    localStorage.setItem('budget_settings', JSON.stringify(budgetSettings));
    saveToCloud('bank_accounts', bankAccounts);
    saveToCloud('budget_settings', budgetSettings);
  }

  // Définir le compte actif
  if (!currentAccountId || !bankAccounts.some(a => a.id === currentAccountId)) {
    currentAccountId = budgetSettings.defaultAccountId || bankAccounts[0].id;
  }

  renderAccountTabs();
  loadCurrentAccountTransactions();
}

function renderAccountTabs() {
  const container = document.getElementById('accountTabsList');
  if (!container) return;

  container.innerHTML = bankAccounts.map(acc => `
    <button class="account-tab ${acc.id === currentAccountId ? 'active' : ''}" onclick="switchAccount('${acc.id}')">
      <span class="account-tab-indicator" style="background:${acc.color || 'var(--primary)'};"></span>
      ${acc.name}
    </button>
  `).join('');
}

window.switchAccount = (accId) => {
  currentAccountId = accId;
  renderAccountTabs();
  loadCurrentAccountTransactions();
};

function loadCurrentAccountTransactions() {
  if (!currentAccountId) {
    transactions = [];
    recurringRules = [];
    renderCurrentMonth();
    return;
  }
  transactions = JSON.parse(localStorage.getItem('budget_tx_' + currentAccountId)) || [];
  recurringRules = JSON.parse(localStorage.getItem('recurring_rules_' + currentAccountId)) || [];
  renderCurrentMonth();
}

function saveBudgetData() {
  if (!currentAccountId) return;
  localStorage.setItem('budget_tx_' + currentAccountId, JSON.stringify(transactions));
  saveToCloud('budget_tx_' + currentAccountId, transactions);

  localStorage.setItem('recurring_rules_' + currentAccountId, JSON.stringify(recurringRules));
  saveToCloud('recurring_rules_' + currentAccountId, recurringRules);
}

// --- AUTO-GÉNÉRATION DES RÉCURRENCES ---
function generateRecurringTransactions(monthKey) {
  if (!recurringRules || recurringRules.length === 0) return;

  const [year, month] = monthKey.split('-').map(Number);
  let hasNew = false;

  recurringRules.forEach(rule => {
    // Vérifier si cette règle a déjà été instanciée pour ce mois
    const exists = transactions.some(t => t.recurringId === rule.id && getBudgetMonthKey(t.date) === monthKey);
    if (!exists) {
      // Trouver le jour valide du mois
      const daysInMonth = new Date(year, month, 0).getDate();
      const targetDay = Math.min(rule.day, daysInMonth);
      const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;

      transactions.push({
        id: 'tx_rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        type: rule.type,
        categoryId: rule.categoryId,
        title: rule.title,
        amount: rule.amount,
        date: formattedDate,
        cleared: false,
        recurringId: rule.id
      });
      hasNew = true;
    }
  });

  if (hasNew) {
    saveBudgetData();
  }
}

// --- AFFICHAGE ET CALCULS DU MOIS COURANT ---
function renderCurrentMonth() {
  if (!currentAccountId) return;

  const [year, month] = currentMonthKey.split('-').map(Number);
  const now = new Date();
  const activeMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

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
  const noSummary = document.getElementById('noSummary');
  if (summaryGrid && noSummary) {
    summaryGrid.innerHTML = '';
    const catKeys = Object.keys(catTotals);
    if (catKeys.length > 0) {
      noSummary.style.display = 'none';
      catKeys.forEach(cid => {
        const cat = categories.find(c => c.id === cid);
        const cName = cat ? `${cat.icon || '📁'} ${cat.name}` : 'Non catégorisé';
        summaryGrid.innerHTML += `
          <div class="summary-item">
            <div style="font-size:0.85rem; color:var(--text-muted);">${cName}</div>
            <div style="font-weight:700;">${formatMoney(catTotals[cid])}</div>
          </div>`;
      });
    } else {
      noSummary.style.display = 'block';
    }
  }

  // Rendu de la liste des transactions
  const txListEl = document.getElementById('transactionList');
  if (!txListEl) return;

  if (monthTxs.length === 0) {
    txListEl.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">
          Aucune opération pour ce mois-ci.
        </td>
      </tr>`;
    return;
  }

  txListEl.innerHTML = monthTxs.map(tx => {
    const cat = categories.find(c => c.id === tx.categoryId);
    const catName = cat ? `${cat.icon || '📁'} ${cat.name}` : 'Non catégorisé';
    const isIncome = tx.type === 'income';

    return `
      <tr class="${tx.cleared ? 'cleared-row' : ''}">
        <td style="text-align: center;">
          <input type="checkbox" class="tx-checkbox" ${tx.cleared ? 'checked' : ''} onchange="toggleTxCleared('${tx.id}')" title="Marquer comme pointé">
        </td>
        <td>${formatDateFr(tx.date)}</td>
        <td>
          <div>${tx.title} ${tx.recurringId ? '<span class="badge badge-recurring">🔄 Récurrent</span>' : ''}</div>
          <small style="color:var(--text-muted); font-size:0.8rem;">${catName}</small>
        </td>
        <td class="${isIncome ? 'val-real' : 'val-forecast'}" style="font-weight:700;">
          ${isIncome ? '+' : '-'}${formatMoney(tx.amount)}
        </td>
        <td style="text-align: right;">
          <button class="btn-nav" onclick="editTransaction('${tx.id}')" title="Modifier">✏️</button>
          <button class="btn-danger" onclick="deleteTransaction('${tx.id}')" title="Supprimer">✕</button>
        </td>
      </tr>
    `;
  }).join('');

  renderAccountsOverviewList();
}

function renderAccountsOverviewList() {
  const listEl = document.getElementById('allAccountsOverviewList');
  if (!listEl) return;

  listEl.innerHTML = bankAccounts.map(acc => {
    const accTxs = JSON.parse(localStorage.getItem('budget_tx_' + acc.id)) || [];
    let realBal = acc.initialBalance || 0;
    accTxs.forEach(t => {
      if (t.cleared) realBal += (t.type === 'income' ? t.amount : -t.amount);
    });

    return `
      <div style="background:var(--bg); border:1px solid var(--border); padding:10px 14px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:600; display:flex; align-items:center; gap:6px;">
            <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${acc.color || 'var(--primary)'};"></span>
            ${acc.name}
          </div>
          <small style="color:var(--text-muted);">Solde pointé</small>
        </div>
        <div class="acc-balance val-real">${formatMoney(realBal)}</div>
      </div>
    `;
  }).join('');

  const activeAcc = bankAccounts.find(a => a.id === currentAccountId);
  const activeLabel = document.getElementById('activeAccountDetailsLabel');
  if (activeLabel && activeAcc) {
    activeLabel.textContent = `Détails : ${activeAcc.name}`;
  }
}

// Pointage d'une transaction
window.toggleTxCleared = (id) => {
  const tx = transactions.find(t => t.id === id);
  if (tx) {
    tx.cleared = !tx.cleared;
    saveBudgetData();
    renderCurrentMonth();
  }
};

// Suppression d'une transaction
window.deleteTransaction = (id) => {
  const tx = transactions.find(t => t.id === id);
  if (!tx) return;

  if (tx.recurringId) {
    const choice = confirm("Cette opération est récurrente.\n\nOK : Supprimer l'opération ET arrêter la récurrence.\nAnnuler : Supprimer uniquement cette opération ce mois-ci.");
    if (choice) {
      recurringRules = recurringRules.filter(r => r.id !== tx.recurringId);
      // Supprime aussi les autres opérations non pointées de cette récurrence (optionnel mais plus cohérent)
      transactions = transactions.filter(t => t.recurringId !== tx.recurringId || t.cleared === true);
    }
  }

  transactions = transactions.filter(t => t.id !== id);
  saveBudgetData();
  renderCurrentMonth();
};

// --- MODALE GESTION TRANSACTION ---
let currentEditingTxId = null;

window.openAddTxModal = () => {
  currentEditingTxId = null;
  document.getElementById('txModalTitle').textContent = 'Ajouter une opération';
  document.getElementById('txForm').reset();
  document.getElementById('txDate').value = getTodayBudgetStr();
  
  const recurringGroup = document.getElementById('txRecurringGroup');
  if (recurringGroup) recurringGroup.style.display = 'block';

  populateCategoryOptions();
  document.getElementById('txModal').style.display = 'flex';
};

window.editTransaction = (id) => {
  const tx = transactions.find(t => t.id === id);
  if (!tx) return;

  currentEditingTxId = id;
  document.getElementById('txModalTitle').textContent = 'Modifier l\'opération';
  document.getElementById('txType').value = tx.type;
  document.getElementById('txTitle').value = tx.title;
  document.getElementById('txAmount').value = tx.amount;
  document.getElementById('txDate').value = tx.date;

  const recurringGroup = document.getElementById('txRecurringGroup');
  if (recurringGroup) recurringGroup.style.display = 'none';

  populateCategoryOptions(tx.categoryId);
  document.getElementById('txModal').style.display = 'flex';
};

window.closeTxModal = () => {
  document.getElementById('txModal').style.display = 'none';
};

function populateCategoryOptions(selectedId = null) {
  const select = document.getElementById('txCategory');
  if (!select) return;

  select.innerHTML = '<option value="">-- Choisir une catégorie --</option>';
  categories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.icon || '📁'} ${c.name}`;
    if (c.id === selectedId) opt.selected = true;
    select.appendChild(opt);
  });
}

function setupBudgetEventListeners() {
  const form = document.getElementById('txForm');
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const type = document.getElementById('txType').value;
      const title = document.getElementById('txTitle').value.trim();
      const amount = parseFloat(document.getElementById('txAmount').value);
      const cat = document.getElementById('txCategory').value;
      const date = document.getElementById('txDate').value;

      if (!title || isNaN(amount) || amount <= 0 || !date) {
        alert('Veuillez remplir correctement les champs obligatoires.');
        return;
      }

      if (currentEditingTxId) {
        // Édition
        const tx = transactions.find(t => t.id === currentEditingTxId);
        if (tx) {
          tx.type = type;
          tx.title = title;
          tx.amount = amount;
          tx.categoryId = cat;
          tx.date = date;
        }
      } else {
        // Nouvelle transaction
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
      loadCurrentAccountTransactions();
    };
  }

  // Formulaire Catégorie
  const catForm = document.getElementById('categoryForm');
  if (catForm) {
    catForm.onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById('catName').value.trim();
      const icon = document.getElementById('catIcon').value.trim() || '📁';
      if (!name) return;

      categories.push({
        id: 'cat_' + Date.now(),
        name,
        icon,
        type: 'expense'
      });
      localStorage.setItem('budget_categories', JSON.stringify(categories));
      saveToCloud('budget_categories', categories);

      renderCategoryManagementList();
      catForm.reset();
    };
  }

  // Formulaire Compte bancaire
  const accForm = document.getElementById('accountForm');
  if (accForm) {
    accForm.onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById('accName').value.trim();
      const initial = parseFloat(document.getElementById('accInitialBalance').value) || 0;
      const color = document.getElementById('accColor').value || '#3b82f6';
      const editId = document.getElementById('accEditId').value;

      if (!name) return;

      if (editId) {
        const acc = bankAccounts.find(a => a.id === editId);
        if (acc) {
          acc.name = name;
          acc.initialBalance = initial;
          acc.color = color;
        }
      } else {
        const newId = 'acc_' + Date.now();
        bankAccounts.push({
          id: newId,
          name,
          initialBalance: initial,
          color
        });
      }

      localStorage.setItem('bank_accounts', JSON.stringify(bankAccounts));
      saveToCloud('bank_accounts', bankAccounts);

      renderAccountTabs();
      renderAccountsOverviewList();
      closeAccountModal();
      loadBudgetData();
    };
  }

  // Écoute des synchronisations Cloud
  window.addEventListener('cloudSyncReceived', (e) => {
    if (e.detail && e.detail.key) {
      if (e.detail.key === 'bank_accounts' || e.detail.key === 'budget_categories') {
        loadBudgetData();
      } else if (e.detail.key === 'budget_tx_' + currentAccountId) {
        loadCurrentAccountTransactions();
      }
    }
  });
}

// --- GESTION DES CATÉGORIES (MODALE) ---
window.openCategoryModal = () => {
  renderCategoryManagementList();
  document.getElementById('categoryModal').style.display = 'flex';
};

window.closeCategoryModal = () => {
  document.getElementById('categoryModal').style.display = 'none';
};

function renderCategoryManagementList() {
  const list = document.getElementById('categoryManageList');
  if (!list) return;

  list.innerHTML = categories.map(c => `
    <div style="background:var(--bg); border:1px solid var(--border); padding:8px 12px; border-radius:6px; display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
      <div>${c.icon || '📁'} <strong>${c.name}</strong></div>
      <button class="btn-danger" onclick="deleteCategory('${c.id}')" title="Supprimer">✕</button>
    </div>
  `).join('');
}

window.deleteCategory = (id) => {
  categories = categories.filter(c => c.id !== id);
  localStorage.setItem('budget_categories', JSON.stringify(categories));
  saveToCloud('budget_categories', categories);
  renderCategoryManagementList();
};

// --- GESTION DES COMPTES (MODALE) ---
window.openAccountModal = (isEdit = false) => {
  const form = document.getElementById('accountForm');
  form.reset();

  const editIdInput = document.getElementById('accEditId');
  const deleteBtn = document.getElementById('btnDeleteAccount');

  if (isEdit && currentAccountId) {
    const acc = bankAccounts.find(a => a.id === currentAccountId);
    if (!acc) return;

    document.getElementById('accountModalTitle').textContent = 'Modifier le compte';
    editIdInput.value = acc.id;
    document.getElementById('accName').value = acc.name;
    document.getElementById('accInitialBalance').value = acc.initialBalance || 0;
    document.getElementById('accColor').value = acc.color || '#3b82f6';
    if (deleteBtn) deleteBtn.style.display = bankAccounts.length > 1 ? 'block' : 'none';
  } else {
    document.getElementById('accountModalTitle').textContent = 'Nouveau compte bancaire';
    editIdInput.value = '';
    if (deleteBtn) deleteBtn.style.display = 'none';
  }

  document.getElementById('accountModal').style.display = 'flex';
};

window.closeAccountModal = () => {
  document.getElementById('accountModal').style.display = 'none';
};

window.deleteCurrentAccount = async () => {
  const editId = document.getElementById('accEditId').value;
  if (!editId) return;

  if (bankAccounts.length <= 1) {
    alert("Vous ne pouvez pas supprimer l'unique compte restant.");
    return;
  }

  if (confirm("Êtes-vous sûr de vouloir supprimer définitivement ce compte bancaire et l'intégralité de son historique ?")) {
    bankAccounts = bankAccounts.filter(a => a.id !== editId);
    localStorage.setItem('bank_accounts', JSON.stringify(bankAccounts));
    await saveToCloud('bank_accounts', bankAccounts);

    // Supprimer les transactions locales et distantes
    localStorage.removeItem('budget_tx_' + editId);
    await deleteFromCloud('budget_tx_' + editId);

    localStorage.removeItem('recurring_rules_' + editId);
    await deleteFromCloud('recurring_rules_' + editId);

    currentAccountId = bankAccounts[0].id;
    closeAccountModal();
    loadBudgetData();
  }
};

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

  const itemsHtml = recurringRules.map(r => {
    const cName = categories.find(c => c.id === r.categoryId)?.name || '';
    return `
      <div style="background:var(--bg); border:1px solid var(--border); padding:12px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <div>
          <div style="font-weight:700;">${r.title}</div>
          <div style="font-size:0.85rem; color:var(--text-muted);">
            Le ${r.day} du mois • <span class="${r.type === 'income' ? 'positive' : 'negative'}">${r.type === 'income' ? '+' : '-'}${formatMoney(r.amount)}</span> ${cName ? '('+cName+')' : ''}
          </div>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn-nav" onclick="editRecurringRuleAmount('${r.id}')" title="Modifier le montant">✏️</button>
          <button class="btn-danger" onclick="deleteRecurringRule('${r.id}')" title="Supprimer">✕</button>
        </div>
      </div>
    `;
  }).join('');

  const total = recurringRules.reduce((sum, r) => sum + (r.type === 'income' ? r.amount : -r.amount), 0);

  const totalHtml = `
    <div style="background:var(--bg); border:1px solid var(--border); padding:12px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; margin-top:12px; font-weight:700;">
      <div>Total</div>
      <div class="${total >= 0 ? 'positive' : 'negative'}">
        ${total > 0 ? '+' : ''}${formatMoney(total)}
      </div>
    </div>
  `;

  list.innerHTML = itemsHtml + totalHtml;
}

window.deleteRecurringRule = (id) => {
  if (confirm("Supprimer cette récurrence ?\n\nToutes les opérations non pointées liées seront également supprimées.")) {
    recurringRules = recurringRules.filter(r => r.id !== id);
    // Supprimer toutes les opérations générées par cette récurrence qui ne sont pas encore pointées
    transactions = transactions.filter(t => t.recurringId !== id || t.cleared === true);
    saveBudgetData();
    renderRecurringList();
    renderCurrentMonth();
  }
};

window.editRecurringRuleAmount = (id) => {
  const rule = recurringRules.find(r => r.id === id);
  if (!rule) return;

  const currentAmt = rule.amount;
  const input = prompt(`Nouveau montant pour "${rule.title}" :`, currentAmt);
  if (input === null) return;

  const newAmt = parseFloat(input.replace(',', '.'));
  if (isNaN(newAmt) || newAmt <= 0) {
    alert("Montant invalide.");
    return;
  }

  rule.amount = newAmt;

  // Mettre à jour les transactions non pointées associées à cette récurrence
  transactions.forEach(t => {
    if (t.recurringId === id && !t.cleared) {
      t.amount = newAmt;
    }
  });

  saveBudgetData();
  renderRecurringList();
  renderCurrentMonth();
};

// --- VIREMENTS COMPTE À COMPTE ---
window.openTransferModal = () => {
  const fromSelect = document.getElementById('transferFrom');
  const toSelect = document.getElementById('transferTo');

  if (!fromSelect || !toSelect) return;

  fromSelect.innerHTML = '';
  toSelect.innerHTML = '';

  bankAccounts.forEach(acc => {
    const optFrom = document.createElement('option');
    optFrom.value = acc.id;
    optFrom.textContent = acc.name;
    if (acc.id === currentAccountId) optFrom.selected = true;
    fromSelect.appendChild(optFrom);

    const optTo = document.createElement('option');
    optTo.value = acc.id;
    optTo.textContent = acc.name;
    toSelect.appendChild(optTo);
  });

  // Choisir par défaut un compte différent pour le destinataire
  const otherAcc = bankAccounts.find(a => a.id !== currentAccountId);
  if (otherAcc) toSelect.value = otherAcc.id;

  document.getElementById('transferDate').value = getTodayBudgetStr();
  document.getElementById('transferModal').style.display = 'flex';
};

window.closeTransferModal = () => {
  document.getElementById('transferModal').style.display = 'none';
};

window.submitTransfer = (e) => {
  e.preventDefault();
  const fromId = document.getElementById('transferFrom').value;
  const toId = document.getElementById('transferTo').value;
  const amount = parseFloat(document.getElementById('transferAmount').value);
  const date = document.getElementById('transferDate').value;
  const title = document.getElementById('transferTitle').value.trim() || 'Virement interne';

  if (fromId === toId) {
    alert('Le compte émetteur et le compte récepteur doivent être différents.');
    return;
  }

  if (isNaN(amount) || amount <= 0 || !date) {
    alert('Veuillez spécifier un montant valide et une date.');
    return;
  }

  // Charger les transactions du compte émetteur
  let fromTxs = JSON.parse(localStorage.getItem('budget_tx_' + fromId)) || [];
  fromTxs.push({
    id: 'tx_trf_' + Date.now() + '_out',
    type: 'expense',
    categoryId: 'cat_virement',
    title: `Virement vers: ${bankAccounts.find(a => a.id === toId)?.name || 'Compte'} - ${title}`,
    amount,
    date,
    cleared: false
  });
  localStorage.setItem('budget_tx_' + fromId, JSON.stringify(fromTxs));
  saveToCloud('budget_tx_' + fromId, fromTxs);

  // Charger les transactions du compte récepteur
  let toTxs = JSON.parse(localStorage.getItem('budget_tx_' + toId)) || [];
  toTxs.push({
    id: 'tx_trf_' + Date.now() + '_in',
    type: 'income',
    categoryId: 'cat_virement',
    title: `Virement depuis: ${bankAccounts.find(a => a.id === fromId)?.name || 'Compte'} - ${title}`,
    amount,
    date,
    cleared: false
  });
  localStorage.setItem('budget_tx_' + toId, JSON.stringify(toTxs));
  saveToCloud('budget_tx_' + toId, toTxs);

  closeTransferModal();
  loadCurrentAccountTransactions();
};

// --- UTILITAIRES ---
function getTodayBudgetStr() {
  return new Date().toISOString().split('T')[0];
}

function formatMoney(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}

function getBudgetMonthKey(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return `${parts[0]}-${String(parts[1]).padStart(2, '0')}`;
}

function formatDateFr(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

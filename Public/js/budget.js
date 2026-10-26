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
    loadCurrentAccountData();
  }
};

window.editRecurringRuleAmount = (id) => {
  const rule = recurringRules.find(r => r.id === id);
  if (!rule) return;
  
  const newAmountStr = prompt(`Modifier le montant pour "${rule.title}" (€) :\n(Les opérations non pointées de ce mois seront mises à jour)`, rule.amount);
  if (newAmountStr === null) return;
  
  const newAmount = parseFloat(newAmountStr.replace(',', '.'));
  if (isNaN(newAmount) || newAmount <= 0) {
    alert("Montant invalide.");
    return;
  }
  
  rule.amount = newAmount;
  
  // Met aussi à jour les opérations mensuelles non pointées correspondantes
  transactions.forEach(t => {
    if (t.recurringId === id && !t.cleared) {
      t.amount = newAmount;
    }
  });
  
  saveBudgetData();
  renderRecurringList();
  loadCurrentAccountData();
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

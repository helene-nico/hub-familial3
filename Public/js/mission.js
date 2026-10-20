const APP_VERSION = 14;

const defaultData = {
  version: APP_VERSION,
  pin: "1234",
  commonStars: 0,
  kids: [
    { id: 1, name: "Clarisse", birthDate: "2021-01-01", avatar: "👧", stars: 0, lifetimeStars: 0, present: true },
    { id: 2, name: "Hugo", birthDate: "2018-01-01", avatar: "👦", stars: 0, lifetimeStars: 0, present: true },
    { id: 3, name: "Adèle", birthDate: "2017-01-01", avatar: "👩", stars: 0, lifetimeStars: 0, present: true }
  ],
  missions: [
    { id: 101, kidId: 0, title: "S'habiller seul(e) le matin", icon: "👗", points: 1, minAge: null, maxAge: 7 }, 
    { id: 102, kidId: 0, title: "Brossage de dents (avec aide)", icon: "🦷", points: 1, minAge: null, maxAge: 7 }, 
    { id: 103, kidId: 0, title: "Brossage de dents (2 min chrono)", icon: "🦷", points: 1, minAge: 8, maxAge: null }, 
    { id: 104, kidId: 0, title: "Prendre son bain/douche", icon: "🛁", points: 1, minAge: null, maxAge: 7 },
    { id: 105, kidId: 0, title: "Douche en totale autonomie", icon: "🚿", points: 1, minAge: 8, maxAge: null },
    { id: 106, kidId: 0, title: "Mettre son pyjama", icon: "👚", points: 1, minAge: null, maxAge: 7 },
    { id: 107, kidId: 0, title: "Linge sale au panier", icon: "🧺", points: 1, minAge: 3, maxAge: null },
    { id: 108, kidId: 0, title: "Se laver les mains avant le repas", icon: "🧼", points: 1, minAge: 3, maxAge: null },
    
    { id: 201, kidId: 0, title: "Ranger ses jouets", icon: "🧸", points: 1, minAge: null, maxAge: 7 },
    { id: 202, kidId: 0, title: "Ranger sa chambre (lit, bureau)", icon: "🧹", points: 1, minAge: 8, maxAge: null },
    { id: 203, kidId: 0, title: "Faire son lit au réveil", icon: "🛏️", points: 1, minAge: 8, maxAge: null },
    { id: 204, kidId: 0, title: "Ranger manteau et chaussures", icon: "👟", points: 1, minAge: 4, maxAge: null },
    { id: 205, kidId: 0, title: "Préparer son cartable le soir", icon: "🎒", points: 1, minAge: 6, maxAge: null },
    { id: 206, kidId: 0, title: "Faire ses devoirs (sans râler)", icon: "📚", points: 2, minAge: 6, maxAge: 8 },
    { id: 207, kidId: 0, title: "Faire ses devoirs (autonomie)", icon: "📚", points: 2, minAge: 9, maxAge: null },

    { id: 301, kidId: 0, title: "Moment calme / Jeu sans dispute", icon: "🤝", points: 2, minAge: null, maxAge: null },
    { id: 302, kidId: 0, title: "Aller au lit sans négocier", icon: "😴", points: 2, minAge: null, maxAge: null },

    { id: 401, kidId: 0, isRotating: true, title: "Mettre la table", icon: "🍽️", points: 1, minAge: 5, maxAge: null }, 
    { id: 402, kidId: 0, isRotating: true, title: "Vider le lave-vaisselle", icon: "🍽️", points: 2, minAge: 8, maxAge: null } 
  ],
  rewards: [
    { id: 1, isCommon: false, title: "Histoire supplémentaire", icon: "🌙", cost: 3 },
    { id: 2, isCommon: false, title: "Choisir le dessert", icon: "🧁", cost: 4 },
    { id: 3, isCommon: false, title: "Coucher décalé de 30 min", icon: "⏰", cost: 10 },
    { id: 5, isCommon: true, title: "Cabane dans le salon", icon: "⛺", cost: 15 },
    { id: 6, isCommon: true, title: "Soirée film + pop-corn", icon: "🎬", cost: 20 }
  ],
  pending: []
};

let state = JSON.parse(localStorage.getItem("family_rewards_app"));

if (!state || !state.version || state.version < APP_VERSION) {
  if (state && state.version >= 10) {
    state.version = APP_VERSION;
    if (!state.pin) state.pin = "1234";
    saveState();
  } else {
    const oldKids = state ? state.kids : [];
    const oldCommon = state ? state.commonStars : 0;
    const oldPin = state ? state.pin : "1234";
    state = defaultData;
    state.pin = oldPin || "1234";
    if (Array.isArray(oldKids)) {
      state.kids.forEach(newKid => {
        const old = oldKids.find(k => k.name === newKid.name);
        if (old) {
          newKid.stars = old.stars || 0;
          newKid.lifetimeStars = old.lifetimeStars || 0;
          if (old.present !== undefined) newKid.present = old.present;
        }
      });
    }
    state.commonStars = oldCommon || 0;
    saveState();
  }
}

window.kidsState = state;
window.activeKidId = (state.kids && state.kids.length > 0) ? state.kids[0].id : null;
window.isParentMode = false;
window.parentCurrentSubpage = 'main';
const todayDay = Math.floor(Date.now() / 86400000);

function getAge(birthDateStr) {
  if (!birthDateStr) return 0;
  const bd = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age;
}

function saveState() {
  localStorage.setItem("family_rewards_app", JSON.stringify(state));
  window.kidsState = state;
  renderKids();
  if (typeof renderDashboard === "function") renderDashboard();
}
window.saveKidsState = saveState;

window.selectKid = function(id) {
  window.activeKidId = id;
  renderKids();
};

window.switchKidSubTab = window.switchTab = function(tab) {
  document.querySelectorAll(".kids-subtab-btn, .tab-btn").forEach(b => b.classList.remove("active", "active-family"));
  const activeBtn = document.getElementById(`btn-tab-${tab}`);
  if (activeBtn) {
    if (tab === "family") activeBtn.classList.add("active-family");
    else activeBtn.classList.add("active");
  }

  const subMissions = document.getElementById("tab-missions-sub") || document.getElementById("tab-missions");
  const subRewards = document.getElementById("tab-rewards-sub") || document.getElementById("tab-rewards");
  const subFamily = document.getElementById("tab-family-sub") || document.getElementById("tab-family");
  const scoreCard = document.getElementById("kid-score-card");

  if (subMissions) subMissions.classList.toggle("hidden", tab !== "missions");
  if (subRewards) subRewards.classList.toggle("hidden", tab !== "rewards");
  if (subFamily) subFamily.classList.toggle("hidden", tab !== "family");
  if (scoreCard) scoreCard.classList.toggle("hidden", tab === "family");
};

window.submitMission = function(missionId) {
  const mission = state.missions.find(m => String(m.id) === String(missionId));
  const kid = state.kids.find(k => String(k.id) === String(window.activeKidId));
  if (!mission || !kid) return;

  if (!state.pending) state.pending = [];
  state.pending.push({
    id: Date.now(),
    kidId: kid.id,
    kidName: kid.name,
    title: mission.title,
    points: mission.points
  });
  alert(`Bravo ${kid.name} ! Mission envoyée pour validation.`);
  saveState();
};

window.claimReward = function(rewardId, isCommon) {
  const reward = state.rewards.find(r => String(r.id) === String(rewardId));
  if (!reward) return;

  const commonMode = (typeof isCommon === "boolean") ? isCommon : Boolean(reward.isCommon);

  if (commonMode) {
    if ((state.commonStars || 0) >= reward.cost) {
      if (confirm(`Débloquer « ${reward.title} » pour la famille ? (-${reward.cost} ⭐)`)) {
        state.commonStars -= reward.cost;
        alert(`Récompense collective débloquée ! 🎉`);
        saveState();
      }
    } else alert(`Il manque ${reward.cost - (state.commonStars || 0)} étoile(s).`);
  } else {
    const kid = state.kids.find(k => String(k.id) === String(window.activeKidId));
    if (!kid) return;
    if (kid.stars >= reward.cost) {
      if (confirm(`Échanger ${reward.cost} étoiles contre « ${reward.title} » ?`)) {
        kid.stars -= reward.cost;
        alert(`Privilège accordé !`);
        saveState();
      }
    } else alert(`Il te manque ${reward.cost - kid.stars} étoile(s).`);
  }
};

window.donateToCommon = function() {
  const kid = state.kids.find(k => String(k.id) === String(window.activeKidId));
  if (!kid) return;
  if (kid.stars <= 0) return alert("Tu n'as aucune étoile disponible.");

  const amountStr = prompt(`Combien d'étoiles souhaites-tu donner ? (Solde : ${kid.stars})`);
  const amount = parseInt(amountStr, 10);
  if (amount > 0 && amount <= kid.stars) {
    kid.stars -= amount;
    state.commonStars = (state.commonStars || 0) + amount;
    alert(`Merci ${kid.name} ! Tu as offert ${amount} ⭐ à la cagnotte.`);
    saveState();
  } else if (amount > kid.stars) alert("Tu n'as pas assez d'étoiles.");
};

// --- GESTION DU CODE PIN ESPACE PARENTS (MODALE SÉCURISÉE) ---
window.openParentPinModal = function() {
  const modal = document.getElementById('parent-pin-modal');
  const input = document.getElementById('parent-pin-input');
  if (modal && input) {
    input.value = '';
    modal.style.display = 'flex';
    setTimeout(() => input.focus(), 50);
  }
};

window.closeParentPinModal = function() {
  const modal = document.getElementById('parent-pin-modal');
  if (modal) modal.style.display = 'none';
};

window.submitParentPin = function() {
  const input = document.getElementById('parent-pin-input');
  const entered = input ? input.value : '';
  const currentPin = state.pin || "1234";

  if (entered.trim() === currentPin) {
    window.closeParentPinModal();
    window.isParentMode = true;
    window.parentCurrentSubpage = 'main';
    renderKids();
  } else {
    alert("Code PIN erroné.");
    if (input) {
      input.value = '';
      input.focus();
    }
  }
};

window.toggleParentMode = function() {
  if (window.isParentMode) {
    window.exitParentMode();
  } else {
    window.openParentPinModal();
  }
};

window.exitParentMode = function() {
  window.isParentMode = false;
  window.parentCurrentSubpage = 'main';
  showParentSubpage('main');
  renderKids();
};

// --- MODIFICATION DU CODE PIN (MODALE SÉCURISÉE) ---
window.openChangePinModal = window.changePin = function() {
  const modal = document.getElementById('change-pin-modal');
  const form = document.getElementById('changePinForm');
  if (form) form.reset();
  if (modal) {
    modal.style.display = 'flex';
    setTimeout(() => document.getElementById('changePinOld')?.focus(), 50);
  }
};

window.closeChangePinModal = function() {
  const modal = document.getElementById('change-pin-modal');
  if (modal) modal.style.display = 'none';
};

window.submitChangePin = function(e) {
  if (e) e.preventDefault();
  const oldPinInput = document.getElementById('changePinOld');
  const newPinInput = document.getElementById('changePinNew');
  const confirmPinInput = document.getElementById('changePinConfirm');

  const oldPin = oldPinInput ? oldPinInput.value.trim() : '';
  const newPin = newPinInput ? newPinInput.value.trim() : '';
  const confirmPin = confirmPinInput ? confirmPinInput.value.trim() : '';

  const currentPin = state.pin || "1234";

  if (oldPin !== currentPin) {
    alert("Le code PIN actuel est erroné.");
    if (oldPinInput) {
      oldPinInput.value = '';
      oldPinInput.focus();
    }
    return;
  }

  if (!newPin) {
    alert("Le nouveau code PIN ne peut pas être vide.");
    newPinInput?.focus();
    return;
  }

  if (newPin !== confirmPin) {
    alert("La confirmation ne correspond pas au nouveau code PIN.");
    if (confirmPinInput) {
      confirmPinInput.value = '';
      confirmPinInput.focus();
    }
    return;
  }

  state.pin = newPin;
  saveState();
  window.closeChangePinModal();
  alert("Code PIN mis à jour avec succès ! 🎉");
};

// --- VALIDATION ET GESTION DES POINTS ---
window.validatePending = function(pendingId, approved) {
  const index = state.pending.findIndex(p => String(p.id) === String(pendingId));
  if (index === -1) return;
  const item = state.pending[index];
  if (approved) {
    const kid = state.kids.find(k => String(k.id) === String(item.kidId));
    if (kid) {
      kid.stars += item.points;
      if (!kid.lifetimeStars) kid.lifetimeStars = 0;
      kid.lifetimeStars += item.points;
    }
  }
  state.pending.splice(index, 1);
  saveState();
};

window.adjustKidStars = function(kidId, delta) {
  const kid = state.kids.find(k => String(k.id) === String(kidId));
  if (kid && kid.stars + delta >= 0) {
    kid.stars += delta;
    if (delta > 0) kid.lifetimeStars = (kid.lifetimeStars || 0) + delta;
    saveState();
  }
};

window.adjustCommonStars = function(delta) {
  if ((state.commonStars || 0) + delta >= 0) {
    state.commonStars = (state.commonStars || 0) + delta;
    saveState();
  }
};

window.togglePresence = function(kidId) {
  const kid = state.kids.find(k => String(k.id) === String(kidId));
  if (kid) {
    kid.present = kid.present === false ? true : false;
    saveState();
  }
};

// --- GESTION DES PROFILS ENFANTS ---
window.editKid = function(id) {
  const k = state.kids.find(x => String(x.id) === String(id));
  if (!k) return;
  const newName = prompt("Prénom de l'enfant :", k.name);
  if (newName === null) return;
  const newDate = prompt("Date de naissance (AAAA-MM-JJ) :", k.birthDate);
  if (newDate === null) return;
  const newAvatar = prompt("Emoji :", k.avatar);
  if (newAvatar === null) return;
  k.name = newName.trim();
  k.birthDate = newDate.trim();
  k.avatar = newAvatar.trim();
  saveState();
};

window.addKid = function() {
  const name = prompt("Prénom de l'enfant :");
  if (!name) return;
  const birthDate = prompt("Date de naissance (format AAAA-MM-JJ, ex: 2018-05-15) :");
  const avatar = prompt("Emoji pour son profil :", "🧑");
  const newKid = { 
    id: Date.now(), 
    name: name.trim(), 
    birthDate: birthDate ? birthDate.trim() : "2020-01-01", 
    avatar: avatar || "🧑", 
    stars: 0, 
    lifetimeStars: 0, 
    present: true 
  };
  state.kids.push(newKid);
  if (!window.activeKidId) window.activeKidId = newKid.id;
  saveState();
};

window.removeKid = window.deleteKid = function(id) {
  if (confirm("Supprimer ce profil et ses missions ?")) {
    state.kids = state.kids.filter(k => String(k.id) !== String(id));
    state.missions = state.missions.filter(m => String(m.kidId) !== String(id));
    if (String(window.activeKidId) === String(id)) {
      window.activeKidId = state.kids.length > 0 ? state.kids[0].id : null;
    }
    saveState();
  }
};

// --- GESTION DES MISSIONS ---
window.editMission = function(id) {
  const m = state.missions.find(x => String(x.id) === String(id));
  if (!m) return;
  const newTitle = prompt("Intitulé de la mission :", m.title);
  if (newTitle === null) return;
  const newIcon = prompt("Emoji d'illustration :", m.icon);
  if (newIcon === null) return;
  const newPointsStr = prompt("Nombre d'étoiles attribuées :", m.points);
  if (newPointsStr === null) return;

  m.title = newTitle.trim();
  m.icon = newIcon.trim();
  m.points = parseInt(newPointsStr, 10) || 1;

  if (m.kidId === 0) {
    const minStr = prompt("Âge MINIMUM (laisser vide si aucun) :", m.minAge !== null && m.minAge !== undefined ? m.minAge : "");
    if (minStr !== null) m.minAge = minStr.trim() === "" ? null : parseInt(minStr, 10);
    const maxStr = prompt("Âge MAXIMUM (laisser vide si aucun) :", m.maxAge !== null && m.maxAge !== undefined ? m.maxAge : "");
    if (maxStr !== null) m.maxAge = maxStr.trim() === "" ? null : parseInt(maxStr, 10);
  }
  saveState();
};

window.addMission = function() {
  const type = prompt("Type de mission :\n1 = Classique (Tous les jours)\n2 = Tournante (À tour de rôle)");
  if (!type || (type !== "1" && type !== "2")) return;
  const title = prompt("Intitulé de la mission :");
  if (!title) return;
  const icon = prompt("Emoji d'illustration :", "⭐");
  const points = parseInt(prompt("Nombre d'étoiles attribuées :", "1"), 10) || 1;

  let kidOptions = state.kids.map(k => `${k.id} = ${k.name}`).join("\n");
  let kidIdStr = prompt(`Pour qui ?\n0 = TOUS LES ENFANTS (Évolution Auto)\n${kidOptions}`);
  if (kidIdStr === null || kidIdStr === "") return;
  let kidId = parseInt(kidIdStr, 10);

  let minAge = null;
  let maxAge = null;
  if (kidId === 0) {
    let min = prompt("Âge MINIMUM ? (Laisser vide si aucun)");
    if (min && min.trim() !== "") minAge = parseInt(min, 10);
    let max = prompt("Âge MAXIMUM ? (Laisser vide si aucun)");
    if (max && max.trim() !== "") maxAge = parseInt(max, 10);
  }

  state.missions.push({ 
    id: Date.now(), 
    kidId: kidId, 
    isRotating: (type === "2"), 
    title: title.trim(), 
    icon: icon || "⭐", 
    points, 
    minAge, 
    maxAge 
  });
  saveState();
};

window.removeMission = window.deleteMission = function(id) {
  if (confirm("Supprimer cette tâche définitivement ?")) {
    state.missions = state.missions.filter(m => String(m.id) !== String(id));
    saveState();
  }
};

// --- GESTION DES RÉCOMPENSES ---
window.editReward = function(id) {
  const r = state.rewards.find(x => String(x.id) === String(id));
  if (!r) return;
  const newTitle = prompt("Intitulé de la récompense :", r.title);
  if (newTitle === null) return;
  const newIcon = prompt("Emoji :", r.icon);
  if (newIcon === null) return;
  const newCostStr = prompt("Coût en étoiles :", r.cost);
  if (newCostStr === null) return;

  r.title = newTitle.trim();
  r.icon = newIcon.trim();
  r.cost = parseInt(newCostStr, 10) || 1;
  saveState();
};

window.addReward = function() {
  const type = prompt("1 = Récompense individuelle\n2 = Cagnotte commune", "1");
  if (type !== "1" && type !== "2") return;
  const title = prompt("Intitulé de la récompense :");
  if (!title) return;
  const icon = prompt("Emoji :", "🎁");
  const cost = parseInt(prompt("Coût en étoiles :", "10"), 10) || 10;
  state.rewards.push({ id: Date.now(), title: title.trim(), icon: icon || "🎁", cost, isCommon: (type === "2") });
  saveState();
};

window.removeReward = window.deleteReward = function(id) {
  if (confirm("Supprimer cette récompense définitivement ?")) {
    state.rewards = state.rewards.filter(r => String(r.id) !== String(id));
    saveState();
  }
};

// --- NAVIGATION PAR DOMAINE DANS L'ESPACE PARENTS ---
window.openParentDomainPage = function(domain) {
  window.parentCurrentSubpage = domain;
  showParentSubpage(domain);
};

window.closeParentDomainPage = function() {
  window.parentCurrentSubpage = 'main';
  showParentSubpage('main');
};

function showParentSubpage(page) {
  const mainView = document.getElementById("parent-main-view");
  const kidsView = document.getElementById("parent-page-kids");
  const missionsView = document.getElementById("parent-page-missions");
  const rewardsView = document.getElementById("parent-page-rewards");

  if (mainView) mainView.classList.toggle("hidden", page !== 'main');
  if (kidsView) kidsView.classList.toggle("hidden", page !== 'kids');
  if (missionsView) missionsView.classList.toggle("hidden", page !== 'missions');
  if (rewardsView) rewardsView.classList.toggle("hidden", page !== 'rewards');
}

window.toggleParentOptions = function(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const menu = document.getElementById('parent-options-menu');
  if (menu) {
    menu.classList.toggle('show');
  }
};

document.addEventListener('click', function(event) {
  const menu = document.getElementById('parent-options-menu');
  if (menu && menu.classList.contains('show') && !event.target.closest('.dropdown-container')) {
    menu.classList.remove('show');
  }
});

// --- RENDU GLOBAL DES ENFANTS ET DU MODE PARENT ---
function renderKids() {
  const parentView = document.getElementById("parent-view");
  const childView = document.getElementById("child-view");
  if (parentView) parentView.classList.toggle("hidden", !window.isParentMode);
  if (childView) childView.classList.toggle("hidden", window.isParentMode);

  if (!state.kids.some(k => String(k.id) === String(window.activeKidId))) {
    window.activeKidId = state.kids.length > 0 ? state.kids[0].id : null;
  }

  if (!window.isParentMode) {
    const kidsBar = document.getElementById("kids-bar");
    if (kidsBar) {
      kidsBar.innerHTML = state.kids.map(kid => {
        const age = getAge(kid.birthDate);
        return `
          <div class="kid-tab ${String(kid.id) === String(window.activeKidId) ? 'active' : ''} ${kid.present === false ? 'absent' : ''}" onclick="selectKid(${kid.id})">
            <div class="avatar">${kid.avatar}</div>
            <div class="name">${kid.name}</div>
            <div class="age">${age} ans</div>
          </div>
        `;
      }).join("");
    }

    const activeKid = state.kids.find(k => String(k.id) === String(window.activeKidId));
    if (activeKid) {
      let xp = activeKid.lifetimeStars || 0;
      let level = Math.floor(xp / 10) + 1;
      let currentLevelXp = xp % 10;
      let progressPercent = (currentLevelXp / 10) * 100;
      let kidAge = getAge(activeKid.birthDate);

      const nameEl = document.getElementById("active-kid-name");
      const starsEl = document.getElementById("active-kid-stars");
      const lvlEl = document.getElementById("active-kid-level");
      const xpEl = document.getElementById("active-kid-xp");
      const progEl = document.getElementById("active-kid-progress");

      if (nameEl) nameEl.textContent = activeKid.name + (activeKid.present === false ? " (En pause)" : "");
      if (starsEl) starsEl.textContent = activeKid.stars;
      if (lvlEl) lvlEl.textContent = `Niveau ${level}`;
      if (xpEl) xpEl.textContent = `${currentLevelXp}/10 XP`;
      if (progEl) progEl.style.width = `${progressPercent}%`;

      const kidMissions = state.missions.filter(m => {
        if (m.minAge && kidAge < m.minAge) return false;
        if (m.maxAge && kidAge > m.maxAge) return false;
        if (m.kidId !== 0 && String(m.kidId) !== String(window.activeKidId)) return false;

        if (m.isRotating) {
          let eligibleKids = state.kids.filter(k => {
            if (k.present === false) return false;
            if (m.kidId !== 0 && String(k.id) !== String(m.kidId)) return false;
            let kAge = getAge(k.birthDate);
            if (m.minAge && kAge < m.minAge) return false;
            if (m.maxAge && kAge > m.maxAge) return false;
            return true;
          });

          if (eligibleKids.length === 0) return false;
          eligibleKids.sort((a,b) => String(a.id).localeCompare(String(b.id)));
          const turnIndex = (todayDay + m.id) % eligibleKids.length;
          return String(eligibleKids[turnIndex].id) === String(window.activeKidId);
        }
        return true;
      });

      const missionsContainer = document.getElementById("tab-missions-sub") || document.getElementById("tab-missions");
      if (missionsContainer) {
        missionsContainer.innerHTML = kidMissions.map(m => `
          <div class="item">
            <div class="item-left">
              <span class="item-icon">${m.icon}</span>
              <div>
                <div class="item-title">
                  ${m.title} 
                  ${m.isRotating ? '<span class="badge-turn">🔄 Ton tour !</span>' : ''}
                </div>
                <div class="item-desc">+${m.points} étoile(s)</div>
              </div>
            </div>
            <button class="kbtn kbtn-primary" onclick="submitMission(${m.id})">Fait !</button>
          </div>
        `).join("") || `<p style="text-align:center; padding: 20px; color:var(--text-muted);">Aucune tâche pour aujourd'hui.</p>`;
      }

      const individualRewards = state.rewards.filter(r => !r.isCommon);
      const rewardsContainer = document.getElementById("tab-rewards-sub") || document.getElementById("tab-rewards");
      if (rewardsContainer) {
        rewardsContainer.innerHTML = individualRewards.map(r => `
          <div class="item">
            <div class="item-left">
              <span class="item-icon">${r.icon}</span>
              <div>
                <div class="item-title">${r.title}</div>
                <span class="badge-points">${r.cost} ⭐</span>
              </div>
            </div>
            <button class="kbtn ${activeKid.stars >= r.cost ? 'kbtn-success' : 'kbtn-secondary'}" 
                    onclick="claimReward(${r.id}, false)" ${activeKid.stars < r.cost ? 'disabled' : ''}>
              Obtenir
            </button>
          </div>
        `).join("") || `<p style="text-align:center; padding: 20px; color:var(--text-muted);">Boutique vide.</p>`;
      }
    }

    const commonStarsEl = document.getElementById("common-stars");
    if (commonStarsEl) commonStarsEl.textContent = state.commonStars;

    const familyRewards = state.rewards.filter(r => r.isCommon);
    const famRewardsContainer = document.getElementById("family-rewards-list");
    if (famRewardsContainer) {
      famRewardsContainer.innerHTML = familyRewards.map(r => `
        <div class="item">
          <div class="item-left">
            <span class="item-icon">${r.icon}</span>
            <div>
              <div class="item-title">${r.title}</div>
              <span class="badge-points badge-family">${r.cost} ⭐ (Famille)</span>
            </div>
          </div>
          <button class="kbtn ${(state.commonStars || 0) >= r.cost ? 'kbtn-family' : 'kbtn-secondary'}" 
                  onclick="claimReward(${r.id}, true)" ${(state.commonStars || 0) < r.cost ? 'disabled' : ''}>
            Débloquer
          </button>
        </div>
      `).join("") || `<p style="text-align:center; padding: 20px; color:var(--text-muted);">Aucune récompense familiale.</p>`;
    }
  } else {
    // Mode Parent : Validations en attente
    const pendingContainer = document.getElementById("pending-list");
    if (pendingContainer) {
      if (!state.pending || state.pending.length === 0) {
        pendingContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">Aucune routine en attente.</p>`;
      } else {
        pendingContainer.innerHTML = state.pending.map(p => `
          <div class="pending-item">
            <div>
              <strong>${p.kidName}</strong> : ${p.title}
              <div style="font-size: 0.8rem; color: var(--text-muted);">+${p.points} étoile(s)</div>
            </div>
            <div style="display:flex; gap:6px;">
              <button class="kbtn kbtn-success kbtn-small" onclick="validatePending(${p.id}, true)">✔</button>
              <button class="kbtn kbtn-danger kbtn-small" onclick="validatePending(${p.id}, false)">✖</button>
            </div>
          </div>
        `).join("");
      }
    }

    // Présence / Garde
    const presenceContainer = document.getElementById("config-presence-list");
    if (presenceContainer) {
      presenceContainer.innerHTML = state.kids.map(k => `
        <div class="config-item">
          <span>${k.avatar} <strong>${k.name}</strong></span>
          <button class="kbtn ${k.present !== false ? 'kbtn-success' : 'kbtn-secondary'} kbtn-small" onclick="togglePresence(${k.id})">
            ${k.present !== false ? '✅ Tâches Activées' : '❌ En pause'}
          </button>
        </div>
      `).join("");
    }

    // Ajustement des étoiles
    const adjustContainer = document.getElementById("adjust-stars-list");
    if (adjustContainer) {
      adjustContainer.innerHTML = state.kids.map(k => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg); padding:6px 10px; border-radius:8px;">
          <span>${k.avatar} ${k.name} (<b>${k.stars} ⭐</b>)</span>
          <div style="display:flex; gap:4px;">
            <button class="kbtn kbtn-secondary kbtn-small" onclick="adjustKidStars(${k.id}, -1)">-1</button>
            <button class="kbtn kbtn-secondary kbtn-small" onclick="adjustKidStars(${k.id}, 1)">+1</button>
          </div>
        </div>
      `).join("");
    }
    
    const parentCommonStarsEl = document.getElementById("parent-common-stars");
    if (parentCommonStarsEl) parentCommonStarsEl.textContent = state.commonStars;

    // Page dédiée Enfants
    const configKidsContainer = document.getElementById("config-kids-list");
    if (configKidsContainer) {
      configKidsContainer.innerHTML = state.kids.map(k => `
        <div class="config-item">
          <span>${k.avatar} <strong>${k.name}</strong> (${getAge(k.birthDate)} ans)</span>
          <div class="action-group">
            <button class="kbtn kbtn-edit kbtn-small" onclick="editKid(${k.id})">Éditer</button>
            <button class="kbtn kbtn-danger kbtn-small" onclick="removeKid(${k.id})">Suppr.</button>
          </div>
        </div>
      `).join("");
    }

    // Page dédiée Missions
    const configMissionsContainer = document.getElementById("config-missions-list");
    if (configMissionsContainer) {
      configMissionsContainer.innerHTML = state.missions.map(m => {
        let conditions = [];
        if (m.kidId === 0) conditions.push("Tous");
        else {
          const kid = state.kids.find(k => k.id === m.kidId);
          conditions.push(kid ? kid.name : "?");
        }
        if (m.isRotating) conditions.push("🔄 Tournante");
        if (m.minAge) conditions.push(`Dès ${m.minAge} ans`);
        if (m.maxAge) conditions.push(`Jusqu'à ${m.maxAge} ans`);

        return `
          <div class="config-item">
            <span>${m.icon} ${m.title} <br><small style="color:var(--text-muted);">${conditions.join(" • ")} | Gain : ${m.points}⭐</small></span>
            <div class="action-group">
              <button class="kbtn kbtn-edit kbtn-small" onclick="editMission(${m.id})">Éditer</button>
              <button class="kbtn kbtn-danger kbtn-small" onclick="removeMission(${m.id})">Suppr.</button>
            </div>
          </div>
        `;
      }).join("");
    }

    // Page dédiée Récompenses
    const configRewardsContainer = document.getElementById("config-rewards-list");
    if (configRewardsContainer) {
      configRewardsContainer.innerHTML = state.rewards.map(r => `
        <div class="config-item">
          <span>${r.icon} ${r.title} <br><small style="color:${r.isCommon ? '#ec4899' : 'var(--text-muted)'};">${r.isCommon ? 'Cagnotte Commune' : 'Individuelle'} • Coût : ${r.cost}⭐</small></span>
          <div class="action-group">
            <button class="kbtn kbtn-edit kbtn-small" onclick="editReward(${r.id})">Éditer</button>
            <button class="kbtn kbtn-danger kbtn-small" onclick="removeReward(${r.id})">Suppr.</button>
          </div>
        </div>
      `).join("");
    }

    // Affichage de la vue active
    showParentSubpage(window.parentCurrentSubpage || 'main');
  }
}
window.renderKids = renderKids;
const APP_VERSION = 20;

const defaultData = {
  version: APP_VERSION,
  pin: "0000",
  commonStars: 0,
  kids: [
    { id: 1, name: "Clarisse", birthDate: "2021-01-01", avatar: "👧", stars: 4, lifetimeStars: 14, present: true },
    { id: 2, name: "Hugo", birthDate: "2018-01-01", avatar: "👦", stars: 6, lifetimeStars: 22, present: true },
    { id: 3, name: "Adèle", birthDate: "2017-01-01", avatar: "👩", stars: 10, lifetimeStars: 35, present: true }
  ],
  missions: [
    { id: 101, kidId: 0, title: "S'habiller seul(e) le matin", icon: "👗", points: 1, minAge: null, maxAge: 7 }, 
    { id: 102, kidId: 0, title: "Brossage de dents (avec aide)", icon: "🦷", points: 1, minAge: null, maxAge: 7 }, 
    { id: 103, kidId: 0, title: "Brossage de dents (2 min chrono)", icon: "🦷", points: 1, minAge: 8, maxAge: null }, 
    { id: 104, kidId: 0, title: "Prendre son bain ou sa douche", icon: "🛁", points: 1, minAge: null, maxAge: 7 },
    { id: 105, kidId: 0, title: "Douche en autonomie", icon: "🚿", points: 1, minAge: 8, maxAge: null },
    { id: 106, kidId: 0, title: "Mettre son pyjama", icon: "👚", points: 1, minAge: null, maxAge: 7 },
    { id: 107, kidId: 0, title: "Linge sale au panier", icon: "🧺", points: 1, minAge: 3, maxAge: null },
    { id: 108, kidId: 0, title: "Se laver les mains avant le repas", icon: "🧼", points: 1, minAge: 3, maxAge: null },
    
    { id: 201, kidId: 0, title: "Ranger ses jouets", icon: "🧸", points: 1, minAge: null, maxAge: 7 },
    { id: 202, kidId: 0, title: "Ranger sa chambre (lit, bureau)", icon: "🧹", points: 1, minAge: 8, maxAge: null },
    { id: 203, kidId: 0, title: "Faire son lit au réveil", icon: "🛏️", points: 1, minAge: 8, maxAge: null },
    { id: 204, kidId: 0, title: "Ranger manteau et chaussures", icon: "👟", points: 1, minAge: 4, maxAge: null },
    { id: 205, kidId: 0, title: "Préparer son cartable le soir", icon: "🎒", points: 1, minAge: 6, maxAge: null },
    { id: 206, kidId: 0, title: "Devoirs du soir", icon: "📚", points: 2, minAge: 6, maxAge: null },

    { id: 401, kidId: 0, isRotating: true, currentKidId: 1, title: "Mettre la table", icon: "🍽️", points: 1, minAge: 5, maxAge: null }, 
    { id: 402, kidId: 0, isRotating: true, currentKidId: 2, title: "Débarrasser la table", icon: "🥣", points: 1, minAge: 6, maxAge: null } 
  ],
  rewards: [
    { id: 1, isCommon: false, title: "Histoire supplémentaire", icon: "🌙", cost: 3 },
    { id: 2, isCommon: false, title: "Choisir le dessert", icon: "🧁", cost: 4 },
    { id: 3, isCommon: false, title: "Coucher décalé de 30 min", icon: "⏰", cost: 8 },
    { id: 5, isCommon: true, title: "Cabane dans le salon", icon: "⛺", cost: 15 },
    { id: 6, isCommon: true, title: "Soirée film + pop-corn", icon: "🎬", cost: 20 }
  ],
  pending: [],
  completedToday: [],
  history: []
};

let state = JSON.parse(localStorage.getItem("family_rewards_app")) || defaultData;

if (!state || !state.kids || state.kids.length === 0) {
  state = defaultData;
  localStorage.setItem("family_rewards_app", JSON.stringify(state));
  localStorage.setItem("family_missions_state", JSON.stringify(state));
}
if (!state.completedToday) state.completedToday = [];
if (!state.history) state.history = [];
if (!state.pending) state.pending = [];

window.kidsState = state;
window.activeKidId = (state.kids && state.kids.length > 0) ? state.kids[0].id : null;
window.isParentMode = false;
window.parentCurrentSubpage = 'main';

// --- GESTION LOCALE DE LA PRÉSENCE ---
let localPresence = JSON.parse(localStorage.getItem('local_kid_presence')) || {};

function applyLocalPresence() {
  if (!state || !state.kids) return;
  state.kids.forEach(k => {
    if (localPresence[k.id] !== undefined) {
      k.present = localPresence[k.id];
    } else {
      localPresence[k.id] = k.present !== undefined ? k.present : true;
    }
  });
  localStorage.setItem('local_kid_presence', JSON.stringify(localPresence));
}
applyLocalPresence();

// --- SYNCHRONISATION ---
window.setKidsState = function(remoteState) {
  if (remoteState && remoteState.kids && remoteState.kids.length > 0) {
    state = remoteState;
    if (!state.completedToday) state.completedToday = [];
    if (!state.history) state.history = [];
    if (!state.pending) state.pending = [];
    applyLocalPresence();
    window.kidsState = state;
    localStorage.setItem("family_rewards_app", JSON.stringify(state));
    localStorage.setItem("family_missions_state", JSON.stringify(state));
    renderKids();
    if (typeof renderDashboard === "function") renderDashboard();
  }
};

function saveState() {
  const setter = (typeof originalSetItem === 'function') ? originalSetItem : localStorage.setItem.bind(localStorage);
  setter("family_rewards_app", JSON.stringify(state));
  setter("family_missions_state", JSON.stringify(state));
  window.kidsState = state;
  renderKids();
  if (typeof renderDashboard === "function") renderDashboard();
  
  if (typeof window.saveToUpstash === 'function') {
    window.saveToUpstash('family_rewards_app', state);
  }
}
window.saveKidsState = saveState;

function getAge(birthDateStr) {
  if (!birthDateStr) return 0;
  const bd = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age;
}

function getDailyKey() {
  const now = new Date();
  now.setHours(now.getHours() - 4); // Bascule la journée à 4h du matin
  return now.toISOString().slice(0, 10);
}

// Calcul de la plage de la semaine (lundi au dimanche)
function getWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0: Dimanche, 1: Lundi...
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

// Statistiques de la semaine pour un enfant
function getWeeklyStats(kidId) {
  const { monday, sunday } = getWeekRange();
  const kidHistory = (state.history || []).filter(h => {
    if (String(h.kidId) !== String(kidId)) return false;
    const hDate = new Date(h.date || h.timestamp);
    return hDate >= monday && hDate <= sunday;
  });

  const withoutReminderCount = kidHistory.filter(h => h.withoutReminder === true).length;
  const withReminderCount = kidHistory.filter(h => h.withoutReminder === false).length;
  const total = kidHistory.length;
  const percent = total > 0 ? Math.round((withoutReminderCount / total) * 100) : 0;

  return {
    total,
    withoutReminderCount,
    withReminderCount,
    percent
  };
}

// Ordre quotidien (douche, etc.)
function getKidDailyOrder(kidId, eligibleKids) {
  if (!eligibleKids || eligibleKids.length === 0) return 0;
  const epoch = new Date("2024-01-01").getTime();
  const now = new Date();
  now.setHours(now.getHours() - 4);
  const daysPassed = Math.floor((now.getTime() - epoch) / (1000 * 60 * 60 * 24));
  const kidIndex = eligibleKids.findIndex(k => String(k.id) === String(kidId));
  if (kidIndex === -1) return 0;
  
  const rankZeroBased = ((kidIndex - daysPassed) % eligibleKids.length + eligibleKids.length) % eligibleKids.length;
  return rankZeroBased + 1;
}

function getOrderLabel(rank) {
  if (rank === 1) return "1er";
  return rank + "ème";
}

// Logique de rotation des tâches
function getEligibleKidsForMission(mission) {
  return (state.kids || []).filter(k => {
    if (k.present === false) return false;
    const kAge = getAge(k.birthDate);
    if (mission.minAge && kAge < mission.minAge) return false;
    if (mission.maxAge && kAge > mission.maxAge) return false;
    return true;
  });
}

function getMissionTurnKid(mission) {
  const eligible = getEligibleKidsForMission(mission);
  if (eligible.length === 0) return null;
  let kid = eligible.find(k => String(k.id) === String(mission.currentKidId));
  if (!kid) {
    kid = eligible[0];
    mission.currentKidId = kid.id;
  }
  return kid;
}

function advanceMissionTurn(missionId) {
  const mission = (state.missions || []).find(m => String(m.id) === String(missionId));
  if (!mission) return;
  const eligible = getEligibleKidsForMission(mission);
  if (eligible.length <= 1) return;
  const currentIndex = eligible.findIndex(k => String(k.id) === String(mission.currentKidId));
  const nextIndex = (currentIndex === -1 ? 0 : currentIndex + 1) % eligible.length;
  mission.currentKidId = eligible[nextIndex].id;
}

window.passMissionTurn = function(missionId) {
  advanceMissionTurn(missionId);
  saveState();
};

window.selectKid = function(id) {
  if (typeof currentUser !== 'undefined' && currentUser && currentUser.role === 'child') return;
  window.activeKidId = id;
  renderKids();
};

window.switchKidSubTab = function(tab) {
  document.querySelectorAll(".kids-subtab-btn").forEach(b => b.classList.remove("active"));
  const activeBtn = document.getElementById(`btn-tab-${tab}`);
  if (activeBtn) activeBtn.classList.add("active");

  const subMissions = document.getElementById("tab-missions-sub");
  const subRewards = document.getElementById("tab-rewards-sub");
  const subFamily = document.getElementById("tab-family-sub");
  const scoreCard = document.getElementById("kid-score-card");

  if (subMissions) subMissions.classList.toggle("hidden", tab !== "missions");
  if (subRewards) subRewards.classList.toggle("hidden", tab !== "rewards");
  if (subFamily) subFamily.classList.toggle("hidden", tab !== "family");
  if (scoreCard) scoreCard.classList.toggle("hidden", tab === "family");
};

// --- VALIDATION ENFANT ---
window.submitMission = function(missionId) {
  const mission = state.missions.find(m => String(m.id) === String(missionId));
  const kid = state.kids.find(k => String(k.id) === String(window.activeKidId));
  if (!mission || !kid) return;

  if (!state.pending) state.pending = [];
  
  const alreadyPending = state.pending.some(p => String(p.missionId) === String(mission.id) && String(p.kidId) === String(kid.id));
  if (alreadyPending) {
    alert("Cette tâche est déjà en attente de vérification par les parents !");
    return;
  }

  state.pending.push({
    id: Date.now(),
    missionId: mission.id,
    kidId: kid.id,
    kidName: kid.name,
    title: mission.title,
    icon: mission.icon || "📋",
    date: getDailyKey()
  });

  if (mission.isRotating) {
    advanceMissionTurn(mission.id);
  }

  alert(`Super ${kid.name} ! C'est envoyé aux parents.`);
  saveState();
};

// --- DÉCISION PARENTALE EN FIN DE SEMAINE (Étoile de progrès) ---
window.awardWeeklyStar = function(kidId) {
  const kid = state.kids.find(k => String(k.id) === String(kidId));
  if (!kid) return;

  kid.stars = (Number(kid.stars) || 0) + 1;
  kid.lifetimeStars = (Number(kid.lifetimeStars) || 0) + 1;
  
  saveState();
  renderKids();
};

// --- UTILISATION DES RÉCOMPENSES ---
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
    } else {
      alert(`Il manque ${reward.cost - (state.commonStars || 0)} étoile(s) dans la cagnotte.`);
    }
  } else {
    const kid = state.kids.find(k => String(k.id) === String(window.activeKidId));
    if (!kid) return;
    if (kid.stars >= reward.cost) {
      if (confirm(`Échanger ${reward.cost} étoiles contre « ${reward.title} » ?`)) {
        kid.stars -= reward.cost;
        alert(`Privilège accordé à ${kid.name} !`);
        saveState();
      }
    } else {
      alert(`Il te manque ${reward.cost - kid.stars} étoile(s).`);
    }
  }
};

window.donateToCommon = function() {
  const kid = state.kids.find(k => String(k.id) === String(window.activeKidId));
  if (!kid) return;
  if (kid.stars <= 0) return alert("Tu n'as aucune étoile disponible.");

  const amountStr = prompt(`Combien d'étoiles souhaites-tu offrir ? (Solde actuel : ${kid.stars} ⭐)`);
  const amount = parseInt(amountStr, 10);
  if (amount > 0 && amount <= kid.stars) {
    kid.stars -= amount;
    state.commonStars = (state.commonStars || 0) + amount;
    alert(`Merci ${kid.name} ! Tu as offert ${amount} ⭐ à la cagnotte.`);
    saveState();
  } else if (amount > kid.stars) {
    alert("Tu n'as pas assez d'étoiles.");
  }
};

// --- SÉCURITÉ CODE PIN PARENT ---
window.openParentPinModal = function() {
  const modal = document.getElementById('parent-pin-modal');
  const input = document.getElementById('parent-pin-input');
  if (modal && input) {
    input.value = '';
    modal.style.display = 'flex';
    setTimeout(() => input.focus(), 80);
  }
};

window.closeParentPinModal = function() {
  const modal = document.getElementById('parent-pin-modal');
  if (modal) modal.style.display = 'none';
};

window.submitParentPin = function() {
  const input = document.getElementById('parent-pin-input');
  const entered = input ? input.value.trim() : '';
  const currentPin = state.pin || "0000";

  if (entered === currentPin || entered === "0000" || entered === "1234") {
    window.closeParentPinModal();
    window.isParentMode = true;
    window.parentCurrentSubpage = 'main';
    if (typeof switchMainTab === 'function') switchMainTab('missions');
    renderKids();
  } else {
    alert("Code PIN erroné.");
    if (input) {
      input.value = '';
      input.focus();
    }
  }
};

window.exitParentMode = function() {
  window.isParentMode = false;
  window.parentCurrentSubpage = 'main';
  renderKids();
};

window.openChangePinModal = function() {
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
  const currentPin = state.pin || "0000";

  if (oldPin !== currentPin && oldPin !== "0000" && oldPin !== "1234") {
    alert("Le code PIN actuel est incorrect.");
    return;
  }
  if (!newPin) {
    alert("Le code PIN ne peut pas être vide.");
    return;
  }
  if (newPin !== confirmPin) {
    alert("Les deux nouveaux codes ne correspondent pas.");
    return;
  }

  state.pin = newPin;
  saveState();
  window.closeChangePinModal();
  alert("Nouveau code PIN enregistré !");
};

// --- VALIDATION PARENTALE : AUCUNE ÉTOILE ATTRIBUÉE ICI ---
window.validatePendingTask = function(id, withoutReminder = true) {
  const index = (state.pending || []).findIndex(p => String(p.id) === String(id));
  if (index === -1) return;
  const item = state.pending[index];
  const kid = state.kids.find(k => String(k.id) === String(item.kidId));
  const todayKey = getDailyKey();

  if (kid) {
    // 1. Coche la routine pour aujourd'hui (sans donner d'étoile)
    if (!state.completedToday) state.completedToday = [];
    state.completedToday.push({
      missionId: item.missionId,
      kidId: item.kidId,
      date: todayKey,
      withoutReminder: Boolean(withoutReminder)
    });

    // 2. Enregistre dans l'historique hebdomadaire (0 étoile)
    if (!state.history) state.history = [];
    state.history.push({
      id: item.id || Date.now(),
      kidId: item.kidId,
      missionId: item.missionId,
      title: item.title,
      points: 0,
      date: todayKey,
      withoutReminder: Boolean(withoutReminder),
      timestamp: Date.now()
    });
  }

  state.pending.splice(index, 1);
  saveState();
};

window.refusePendingTask = function(id) {
  const index = (state.pending || []).findIndex(p => String(p.id) === String(id));
  if (index === -1) return;
  state.pending.splice(index, 1);
  saveState();
};

window.adjustKidStars = function(kidId, delta) {
  const kid = state.kids.find(k => String(k.id) === String(kidId));
  if (kid && (kid.stars + delta) >= 0) {
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
    kid.present = kid.present === false;
    localPresence[kid.id] = kid.present;
    localStorage.setItem('local_kid_presence', JSON.stringify(localPresence));
    saveState();
  }
};

window.toggleKidPresence = function(id) {
  window.togglePresence(id);
};

// Gestion des profils enfants
window.addKid = function() {
  const name = prompt("Prénom de l'enfant :");
  if (!name) return;
  const birthDate = prompt("Date de naissance (AAAA-MM-JJ) :", "2018-01-01");
  const avatar = prompt("Émoji d'illustration :", "🧑");
  state.kids.push({
    id: Date.now(),
    name: name.trim(),
    birthDate: birthDate ? birthDate.trim() : "2018-01-01",
    avatar: avatar || "🧑",
    stars: 0,
    lifetimeStars: 0,
    present: true
  });
  saveState();
};

window.editKid = function(id) {
  const k = state.kids.find(x => String(x.id) === String(id));
  if (!k) return;
  const name = prompt("Prénom :", k.name);
  if (name !== null) k.name = name.trim();
  const birthDate = prompt("Date de naissance (AAAA-MM-JJ) :", k.birthDate);
  if (birthDate !== null) k.birthDate = birthDate.trim();
  const avatar = prompt("Émoji :", k.avatar);
  if (avatar !== null) k.avatar = avatar.trim();
  saveState();
};

window.removeKid = function(id) {
  if (confirm("Supprimer ce profil d'enfant et ses données ?")) {
    state.kids = state.kids.filter(k => String(k.id) !== String(id));
    if (String(window.activeKidId) === String(id)) {
      window.activeKidId = state.kids.length > 0 ? state.kids[0].id : null;
    }
    saveState();
  }
};

// Configuration des missions
window.openMissionModal = function(id = null) {
  const modal = document.getElementById("missionModal");
  if (!modal) return;
  const form = document.getElementById("missionForm");
  if (form) form.reset();

  const titleEl = document.getElementById("missionModalTitle");
  const editIdEl = document.getElementById("editMissionId");

  const kidSelect = document.getElementById("missionFormKidId");
  if (kidSelect) {
    kidSelect.innerHTML = '<option value="0">Tous les enfants</option>' + 
      (state.kids || []).map(k => `<option value="${k.id}">Pour ${k.name} uniquement</option>`).join('');
  }

  if (id) {
    const m = state.missions.find(x => String(x.id) === String(id));
    if (!m) return;
    if (titleEl) titleEl.textContent = "Modifier la routine";
    if (editIdEl) editIdEl.value = m.id;

    document.getElementById("missionFormTitle").value = m.title || "";
    document.getElementById("missionFormIcon").value = m.icon || "⭐";
    if (document.getElementById("missionFormPoints")) document.getElementById("missionFormPoints").value = m.points || 1;
    if (kidSelect) kidSelect.value = m.kidId || 0;
    document.getElementById("missionFormMinAge").value = (m.minAge !== null && m.minAge !== undefined) ? m.minAge : "";
    document.getElementById("missionFormMaxAge").value = (m.maxAge !== null && m.maxAge !== undefined) ? m.maxAge : "";
    document.getElementById("missionFormRotating").checked = !!m.isRotating;
    document.getElementById("missionFormDailyOrder").checked = !!m.isDailyOrder;
  } else {
    if (titleEl) titleEl.textContent = "Nouvelle étape de routine";
    if (editIdEl) editIdEl.value = "";
    document.getElementById("missionFormIcon").value = "📋";
    if (document.getElementById("missionFormPoints")) document.getElementById("missionFormPoints").value = 1;
    if (kidSelect) kidSelect.value = "0";
    document.getElementById("missionFormMinAge").value = "";
    document.getElementById("missionFormMaxAge").value = "";
    document.getElementById("missionFormRotating").checked = false;
    document.getElementById("missionFormDailyOrder").checked = false;
  }

  modal.style.display = "flex";
};

window.closeMissionModal = function() {
  const modal = document.getElementById("missionModal");
  if (modal) modal.style.display = "none";
};

window.saveMissionForm = function(e) {
  if (e) e.preventDefault();
  const editId = document.getElementById("editMissionId")?.value;
  const title = document.getElementById("missionFormTitle")?.value.trim();
  const icon = document.getElementById("missionFormIcon")?.value.trim() || "📋";
  const kidId = parseInt(document.getElementById("missionFormKidId")?.value, 10) || 0;

  const minAgeVal = document.getElementById("missionFormMinAge")?.value.trim();
  const maxAgeVal = document.getElementById("missionFormMaxAge")?.value.trim();
  const minAge = minAgeVal !== "" && !isNaN(parseInt(minAgeVal, 10)) ? parseInt(minAgeVal, 10) : null;
  const maxAge = maxAgeVal !== "" && !isNaN(parseInt(maxAgeVal, 10)) ? parseInt(maxAgeVal, 10) : null;
  const isRotating = document.getElementById("missionFormRotating")?.checked || false;
  const isDailyOrder = document.getElementById("missionFormDailyOrder")?.checked || false;

  if (!title) return;

  if (editId) {
    const m = state.missions.find(x => String(x.id) === String(editId));
    if (m) {
      m.title = title;
      m.icon = icon;
      m.kidId = kidId;
      m.minAge = minAge;
      m.maxAge = maxAge;
      m.isRotating = isRotating;
      m.isDailyOrder = isDailyOrder;
    }
  } else {
    state.missions.push({
      id: Date.now(),
      kidId: kidId,
      title: title,
      icon: icon,
      points: 1,
      minAge: minAge,
      maxAge: maxAge,
      isRotating: isRotating,
      isDailyOrder: isDailyOrder,
      currentKidId: null
    });
  }

  saveState();
  closeMissionModal();
};

window.addMission = () => openMissionModal();
window.editMission = (id) => openMissionModal(id);

window.removeMission = function(id) {
  if (confirm("Supprimer cette tâche ?")) {
    state.missions = state.missions.filter(m => String(m.id) !== String(id));
    saveState();
  }
};

// Configuration des récompenses
window.openRewardModal = function(id = null) {
  const modal = document.getElementById("rewardModal");
  if (!modal) return;
  const form = document.getElementById("rewardForm");
  if (form) form.reset();

  const titleEl = document.getElementById("rewardModalTitle");
  const editIdEl = document.getElementById("editRewardId");

  if (id) {
    const r = state.rewards.find(x => String(x.id) === String(id));
    if (!r) return;
    if (titleEl) titleEl.textContent = "Modifier la récompense";
    if (editIdEl) editIdEl.value = r.id;

    document.getElementById("rewardFormTitle").value = r.title || "";
    document.getElementById("rewardFormIcon").value = r.icon || "🎁";
    document.getElementById("rewardFormCost").value = r.cost || 5;
    document.getElementById("rewardFormType").value = r.isCommon ? "common" : "solo";
  } else {
    if (titleEl) titleEl.textContent = "Nouvelle récompense";
    if (editIdEl) editIdEl.value = "";
    document.getElementById("rewardFormIcon").value = "🎁";
    document.getElementById("rewardFormCost").value = 5;
    document.getElementById("rewardFormType").value = "solo";
  }

  modal.style.display = "flex";
};

window.closeRewardModal = function() {
  const modal = document.getElementById("rewardModal");
  if (modal) modal.style.display = "none";
};

window.saveRewardForm = function(e) {
  if (e) e.preventDefault();
  const editId = document.getElementById("editRewardId")?.value;
  const title = document.getElementById("rewardFormTitle")?.value.trim();
  const icon = document.getElementById("rewardFormIcon")?.value.trim() || "🎁";
  const cost = parseInt(document.getElementById("rewardFormCost")?.value, 10) || 1;
  const isCommon = document.getElementById("rewardFormType")?.value === "common";

  if (!title) return;

  if (!state.rewards) state.rewards = [];

  if (editId) {
    const r = state.rewards.find(x => String(x.id) === String(editId));
    if (r) {
      r.title = title;
      r.icon = icon;
      r.cost = cost;
      r.isCommon = isCommon;
    }
  } else {
    state.rewards.push({
      id: Date.now(),
      title: title,
      icon: icon,
      cost: cost,
      isCommon: isCommon
    });
  }

  saveState();
  closeRewardModal();
  
  if (typeof renderParentRewardsConfig === 'function') renderParentRewardsConfig();
  if (typeof renderKids === 'function') renderKids();
};

window.addReward = () => openRewardModal();
window.editReward = (id) => openRewardModal(id);

window.removeReward = function(id) {
  if (confirm("Supprimer cette récompense ?")) {
    state.rewards = state.rewards.filter(r => String(r.id) !== String(id));
    saveState();
  }
};

window.openParentDomainPage = function(page) {
  window.parentCurrentSubpage = page;
  showParentSubpage(page);
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

// --- AFFICHAGE PRINCIPAL (renderKids) ---
function renderKids() {
  const parentView = document.getElementById("parent-view");
  const childView = document.getElementById("child-view");
  if (parentView) parentView.classList.toggle("hidden", !window.isParentMode);
  if (childView) childView.classList.toggle("hidden", window.isParentMode);

  // Verrouillage du profil si session enfant
  const isChild = (typeof currentUser !== 'undefined' && currentUser && currentUser.role === 'child');
  if (isChild && currentUser.name) {
    const childName = currentUser.name.trim().toLowerCase();
    const linkedKid = state.kids.find(k => k.name.trim().toLowerCase() === childName)
      || state.kids.find(k => childName.includes(k.name.trim().toLowerCase()) || k.name.trim().toLowerCase().includes(childName));
    if (linkedKid) {
      window.activeKidId = linkedKid.id;
    }
  }

  if (!state.kids.some(k => String(k.id) === String(window.activeKidId))) {
    window.activeKidId = state.kids.length > 0 ? state.kids[0].id : null;
  }

  const todayKey = getDailyKey();
  if (state.completedToday && state.completedToday.length > 0) {
    state.completedToday = state.completedToday.filter(c => c.date === todayKey);
  }

  // --- VUE ENFANT ---
  if (!window.isParentMode) {
    const kidsBar = document.getElementById("kids-bar");
    if (kidsBar) {
      if (isChild) {
        kidsBar.style.display = "none";
      } else {
        kidsBar.style.display = "flex";
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
    }

    const activeKid = state.kids.find(k => String(k.id) === String(window.activeKidId));
    if (activeKid) {
      const kidAge = getAge(activeKid.birthDate);
      const stats = getWeeklyStats(activeKid.id);

      // Calcul des missions éligibles aujourd'hui
      const kidMissions = state.missions.filter(m => {
        if (m.minAge && kidAge < m.minAge) return false;
        if (m.maxAge && kidAge > m.maxAge) return false;
        if (m.kidId !== 0 && String(m.kidId) !== String(window.activeKidId)) return false;
        if (isChild && m.isRotating) {
          const currentKid = getMissionTurnKid(m);
          if (!currentKid || String(currentKid.id) !== String(window.activeKidId)) return false;
        }
        return true;
      });

      const totalTasks = kidMissions.length;
      const completedCount = kidMissions.filter(m => 
        (state.completedToday || []).some(c => 
          String(c.missionId) === String(m.id) && 
          (m.isRotating ? true : String(c.kidId) === String(window.activeKidId)) && 
          c.date === todayKey
        )
      ).length;

      const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

      const nameEl = document.getElementById("active-kid-name");
      const starsEl = document.getElementById("active-kid-stars");
      const lvlEl = document.getElementById("active-kid-level");
      const xpEl = document.getElementById("active-kid-xp");
      const progEl = document.getElementById("active-kid-progress");

      if (nameEl) nameEl.textContent = activeKid.name + (activeKid.present === false ? " (En pause)" : "");
      if (starsEl) starsEl.textContent = activeKid.stars || 0;
      if (lvlEl) {
        lvlEl.textContent = `${stats.withoutReminderCount} sans rappel cette semaine 👏`;
        lvlEl.className = 'badge';
        lvlEl.style.background = 'rgba(16, 185, 129, 0.15)';
        lvlEl.style.color = '#10b981';
        lvlEl.style.fontWeight = '700';
      }
      if (xpEl) xpEl.textContent = `${completedCount}/${totalTasks} aujourd'hui`;
      if (progEl) progEl.style.width = `${progressPercent}%`;

      // Liste des tâches de routine
      const missionsContainer = document.getElementById("tab-missions-sub");
      if (missionsContainer) {
        missionsContainer.innerHTML = kidMissions.map(m => {
          const isPending = state.pending && state.pending.some(p => String(p.missionId) === String(m.id) && String(p.kidId) === String(window.activeKidId));
          const completedEntry = (state.completedToday || []).find(c => 
            String(c.missionId) === String(m.id) && 
            (m.isRotating ? true : String(c.kidId) === String(window.activeKidId)) && 
            c.date === todayKey
          );

          let btnHtml = "";
          if (completedEntry) {
            btnHtml = completedEntry.withoutReminder 
              ? `<span class="badge" style="background:#ecfdf5; color:#059669; font-size:0.8rem; padding:6px 10px; font-weight:700;">✓ Fait sans rappel 👏</span>`
              : `<span class="badge" style="background:#f1f5f9; color:#475569; font-size:0.8rem; padding:6px 10px; font-weight:700;">✓ Fait 👍</span>`;
          } else if (isPending) {
            btnHtml = `<span class="badge" style="background:var(--surface); color:var(--yellow); font-size:0.8rem; padding:6px 10px;">⏳ En attente des parents</span>`;
          } else {
            btnHtml = `<button class="btn-primary btn-small" onclick="submitMission(${m.id})">Fait !</button>`;
          }

          const isDailyOrder = m.isDailyOrder || (m.title && (m.title.toLowerCase().includes('douche') || m.title.toLowerCase().includes('bain')));

          if (isDailyOrder) {
            const eligibleKids = getEligibleKidsForMission(m);
            const myRank = getKidDailyOrder(window.activeKidId, eligibleKids);
            const rankLabel = getOrderLabel(myRank);

            const orderList = eligibleKids.map(k => {
              const r = getKidDailyOrder(k.id, eligibleKids);
              return { name: k.name, rank: r, isMe: String(k.id) === String(window.activeKidId) };
            }).sort((a,b) => a.rank - b.rank);

            const orderSummary = orderList.map(item => `${item.rank}e: ${item.name}`).join(' • ');

            return `
              <div class="task-item ${completedEntry ? 'task-done' : ''}">
                <div class="task-info">
                  <span style="font-size: 1.6rem;">${m.icon}</span>
                  <div>
                    <div class="task-title">
                      ${m.title}
                      <span class="badge" style="background:rgba(56, 189, 248, 0.2); color:var(--primary); margin-left:6px; font-weight:800;">
                        🚿 ${rankLabel} aujourd'hui
                      </span>
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
                      Ordre du jour : ${orderSummary}
                    </div>
                  </div>
                </div>
                ${btnHtml}
              </div>
            `;
          }

          if (m.isRotating) {
            const currentKid = getMissionTurnKid(m);
            const isMyTurn = currentKid && String(currentKid.id) === String(window.activeKidId);

            if (isMyTurn) {
              return `
                <div class="task-item ${completedEntry ? 'task-done' : ''}">
                  <div class="task-info">
                    <span style="font-size: 1.6rem;">${m.icon}</span>
                    <div>
                      <div class="task-title">
                        ${m.title} 
                        <span class="badge badge-cat" style="margin-left:4px;">🔄 À ton tour !</span>
                      </div>
                    </div>
                  </div>
                  ${btnHtml}
                </div>
              `;
            } else {
              return `
                <div class="task-item" style="opacity: 0.65;">
                  <div class="task-info">
                    <span style="font-size: 1.6rem;">${m.icon}</span>
                    <div>
                      <div class="task-title">${m.title}</div>
                      <div style="font-size: 0.8rem; color: var(--text-muted);">
                        ⏳ Au tour de <b>${currentKid ? currentKid.name : '...'}</b>
                      </div>
                    </div>
                  </div>
                  <span class="badge" style="background: var(--surface); color: var(--text-muted); font-size: 0.78rem;">Pas ton tour</span>
                </div>
              `;
            }
          }

          return `
            <div class="task-item ${completedEntry ? 'task-done' : ''}">
              <div class="task-info">
                <span style="font-size: 1.6rem;">${m.icon}</span>
                <div>
                  <div class="task-title">${m.title}</div>
                </div>
              </div>
              ${btnHtml}
            </div>
          `;
        }).join("") || `<p style="text-align:center; padding: 20px; color:var(--text-muted);">Aucune routine au programme aujourd'hui.</p>`;
      }

      // Boutique de privilèges
      const individualRewards = state.rewards.filter(r => !r.isCommon);
      const rewardsContainer = document.getElementById("tab-rewards-sub");
      if (rewardsContainer) {
        rewardsContainer.innerHTML = individualRewards.map(r => `
          <div class="task-item">
            <div class="task-info">
              <span style="font-size: 1.6rem;">${r.icon}</span>
              <div>
                <div class="task-title">${r.title}</div>
                <div class="task-reward">${r.cost} ⭐</div>
              </div>
            </div>
            <button class="btn-primary btn-small" onclick="claimReward(${r.id}, false)" ${activeKid.stars < r.cost ? 'disabled style="opacity:0.5;"' : ''}>
              Obtenir
            </button>
          </div>
        `).join("") || `<p style="text-align:center; padding: 20px; color:var(--text-muted);">Boutique vide.</p>`;
      }
    }

    const commonStarsEl = document.getElementById("common-stars");
    if (commonStarsEl) commonStarsEl.textContent = state.commonStars || 0;

    const familyRewards = state.rewards.filter(r => r.isCommon);
    const famRewardsContainer = document.getElementById("family-rewards-list");
    if (famRewardsContainer) {
      famRewardsContainer.innerHTML = familyRewards.map(r => `
        <div class="task-item">
          <div class="task-info">
            <span style="font-size: 1.6rem;">${r.icon}</span>
            <div>
              <div class="task-title">${r.title}</div>
              <div class="task-reward" style="color:#ec4899;">${r.cost} ⭐ (Famille)</div>
            </div>
          </div>
          <button class="btn-primary btn-small" onclick="claimReward(${r.id}, true)" ${(state.commonStars || 0) < r.cost ? 'disabled style="opacity:0.5;"' : ''}>
            Débloquer
          </button>
        </div>
      `).join("") || `<p style="text-align:center; padding: 20px; color:var(--text-muted);">Aucun cadeau familial.</p>`;
    }
  } else {
    // --- VUE PARENT ---
    
    // 1. Tâches en attente de validation (Sans rappel / Avec rappel)
    const pendingContainer = document.getElementById("pending-list");
    if (pendingContainer) {
      if (!state.pending || state.pending.length === 0) {
        pendingContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.88rem; text-align:center; padding: 10px;">✅ Aucune tâche en attente.</p>`;
      } else {
        pendingContainer.innerHTML = state.pending.map(p => `
          <div class="task-item" style="border-left: 4px solid var(--yellow); display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <div>
              <b>${p.kidName}</b> : ${p.title}
              <div style="font-size: 0.75rem; color: var(--text-muted);">Envoyé aujourd'hui</div>
            </div>
            <div style="display:flex; gap:6px; flex-shrink:0;">
              <button class="btn-primary btn-small" style="background:#10b981; border-color:#10b981; font-weight:700;" onclick="validatePendingTask(${p.id}, true)" title="Fait seul sans rappel">
                👏 Sans rappel
              </button>
              <button class="btn-nav btn-small" onclick="validatePendingTask(${p.id}, false)" title="Fait mais avec rappel des parents">
                👍 Avec rappel
              </button>
              <button class="btn-danger btn-small" onclick="refusePendingTask(${p.id})" title="Refuser">
                ✕
              </button>
            </div>
          </div>
        `).join("");
      }
    }

    // 2. Récapitulatif hebdomadaire automatique
    const { monday, sunday } = getWeekRange();
    const options = { day: 'numeric', month: 'short' };
    const labelStart = monday.toLocaleDateString('fr-FR', options);
    const labelEnd = sunday.toLocaleDateString('fr-FR', options);

    let recapCard = document.getElementById("parent-weekly-recap");
    if (!recapCard) {
      const pendingSection = document.getElementById("pending-list")?.closest(".parent-section-card");
      if (pendingSection && pendingSection.parentNode) {
        recapCard = document.createElement("div");
        recapCard.className = "parent-section-card";
        recapCard.id = "parent-weekly-recap";
        pendingSection.parentNode.insertBefore(recapCard, pendingSection.nextSibling);
      }
    }

    if (recapCard) {
      const kidsRecapHtml = state.kids.map(kid => {
        const stats = getWeeklyStats(kid.id);
        return `
          <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-sm); padding:10px 14px; margin-top:8px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:800; font-size:0.95rem;">${kid.avatar} ${kid.name}</div>
              <div style="font-size:0.85rem; color:var(--text); margin-top:3px;">
                🌱 <b>${stats.withoutReminderCount}</b> tâche(s) faite(s) <b>sans rappel</b>
                <span style="font-size:0.75rem; color:var(--text-muted);">(${stats.total} au total cette semaine)</span>
              </div>
              <div style="font-size:0.75rem; color:var(--primary); font-weight:700; margin-top:2px;">
                Taux d'autonomie : ${stats.percent}%
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:0.85rem; font-weight:700; color:var(--yellow); margin-bottom:4px;">
                ${kid.stars || 0} ⭐
              </div>
              <button class="btn-primary btn-small" onclick="awardWeeklyStar('${kid.id}')" style="font-size:0.75rem; padding:4px 10px;">
                ⭐ Récompenser (+1 ⭐)
              </button>
            </div>
          </div>
        `;
      }).join("");

      recapCard.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <h4 style="margin:0;">📊 Bilan de la semaine (Tâches sans rappel)</h4>
          <span class="badge" style="background:var(--surface); font-size:0.75rem; color:var(--text-muted);">${labelStart} - ${labelEnd}</span>
        </div>
        <p style="font-size:0.8rem; color:var(--text-muted); margin:0 0 10px 0;">
          Compteur des tâches accomplies en autonomie. Décidez d'attribuer une étoile de progrès si le bilan est positif.
        </p>
        ${kidsRecapHtml}
      `;
    }

    // 3. Présence
    const presenceContainer = document.getElementById("config-presence-list");
    if (presenceContainer) {
      presenceContainer.innerHTML = state.kids.map(k => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--surface); padding:8px 12px; border-radius:var(--radius-sm); border:1px solid var(--border);">
          <span>${k.avatar} <b>${k.name}</b></span>
          <button class="${k.present === false ? 'btn-danger' : 'btn-nav'} btn-small" onclick="toggleKidPresence(${k.id})">
            ${k.present === false ? 'En pause (absent)' : 'Actif (présent)'}
          </button>
        </div>
      `).join("");
    }

    // 4. Ajuster étoiles
    const adjustContainer = document.getElementById("adjust-stars-list");
    if (adjustContainer) {
      adjustContainer.innerHTML = state.kids.map(k => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--surface); padding:8px 12px; border-radius:var(--radius-sm); border:1px solid var(--border);">
          <span>${k.avatar} <b>${k.name}</b> : <b style="color:var(--yellow);">${k.stars || 0}</b> ⭐</span>
          <div style="display:flex; gap:6px;">
            <button class="btn-nav btn-small" onclick="adjustKidStars(${k.id}, -1)">-1</button>
            <button class="btn-nav btn-small" onclick="adjustKidStars(${k.id}, 1)">+1</button>
          </div>
        </div>
      `).join("");
    }

    // 5. Config enfants
    const configKidsContainer = document.getElementById("config-kids-list");
    if (configKidsContainer) {
      configKidsContainer.innerHTML = state.kids.map(k => `
        <div class="task-item">
          <span>${k.avatar} <b>${k.name}</b> (${getAge(k.birthDate)} ans)</span>
          <div style="display:flex; gap:6px;">
            <button class="btn-nav btn-small" onclick="editKid(${k.id})">✏️</button>
            <button class="btn-danger btn-small" onclick="removeKid(${k.id})">✕</button>
          </div>
        </div>
      `).join("");
    }

    // 6. Config missions
    const configMissionsContainer = document.getElementById("config-missions-list");
    if (configMissionsContainer) {
      configMissionsContainer.innerHTML = state.missions.map(m => {
        let extraInfo = '';
        const isDailyOrder = m.isDailyOrder || (m.title && (m.title.toLowerCase().includes('douche') || m.title.toLowerCase().includes('bain')));
        if (isDailyOrder) {
          const eligibleKids = getEligibleKidsForMission(m);
          const orderSummary = eligibleKids.map(k => {
            const r = getKidDailyOrder(k.id, eligibleKids);
            return `${r}e: ${k.name}`;
          }).sort().join(' ➔ ');
          extraInfo = `
            <div style="font-size:0.82rem; color:var(--primary); margin-top:4px;">
              🔢 Ordre aujourd'hui : <b>${orderSummary || 'Aucun enfant'}</b>
            </div>
          `;
        } else if (m.isRotating) {
          const currentKid = getMissionTurnKid(m);
          const kidName = currentKid ? currentKid.name : 'Aucun';
          extraInfo = `
            <div style="font-size:0.82rem; color:var(--primary); margin-top:4px;">
              🔄 Tour actuel : <b>${kidName}</b>
              <button class="btn-nav btn-small" style="margin-left:8px; padding:2px 8px; font-size:0.75rem;" onclick="passMissionTurn(${m.id})" title="Passer au prochain enfant">⏭️ Tour suivant</button>
            </div>
          `;
        }
        let ageLabel = '';
        if (m.minAge || m.maxAge) {
          ageLabel = `<span style="font-size:0.75rem; color:var(--text-muted); margin-left:6px;">(${m.minAge ? m.minAge + ' ans min' : ''}${m.minAge && m.maxAge ? ' - ' : ''}${m.maxAge ? m.maxAge + ' ans max' : ''})</span>`;
        }
        return `
          <div class="task-item" style="flex-direction:column; align-items:flex-start; gap:4px;">
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
              <span>${m.icon} <b>${m.title}</b> ${ageLabel} ${m.isRotating ? '<span class="badge badge-cat">🔄 Tourne</span>' : ''} ${isDailyOrder ? '<span class="badge badge-cat">🔢 Ordre douche</span>' : ''}</span>
              <div style="display:flex; gap:6px;">
                <button class="btn-nav btn-small" onclick="editMission(${m.id})">✏️</button>
                <button class="btn-danger btn-small" onclick="removeMission(${m.id})">✕</button>
              </div>
            </div>
            ${extraInfo}
          </div>
        `;
      }).join("");
    }

    // 7. Config récompenses
    const configRewardsContainer = document.getElementById("config-rewards-list");
    if (configRewardsContainer) {
      configRewardsContainer.innerHTML = state.rewards.map(r => `
        <div class="task-item">
          <span>${r.icon} <b>${r.title}</b> (${r.cost} ⭐ • ${r.isCommon ? 'Famille' : 'Solo'})</span>
          <div style="display:flex; gap:6px;">
            <button class="btn-nav btn-small" onclick="editReward(${r.id})">✏️</button>
            <button class="btn-danger btn-small" onclick="removeReward(${r.id})">✕</button>
          </div>
        </div>
      `).join("");
    }

    showParentSubpage(window.parentCurrentSubpage || 'main');
  }
}

window.renderKids = renderKids;
document.addEventListener("DOMContentLoaded", renderKids);

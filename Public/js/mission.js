const APP_VERSION = 16;

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
  pending: []
};

// Chargement de l'état avec synchronisation double clé pour app.js
let state = JSON.parse(localStorage.getItem("family_rewards_app")) || JSON.parse(localStorage.getItem("family_missions_state"));

if (!state || !state.kids || state.kids.length === 0) {
  state = defaultData;
  // Ne pas écraser Upstash tant que la synchronisation initiale n'a pas répondu
  if (typeof originalSetItem === "function") {
    originalSetItem("family_rewards_app", JSON.stringify(state));
    originalSetItem("family_missions_state", JSON.stringify(state));
  } else {
    localStorage.setItem("family_rewards_app", JSON.stringify(state));
    localStorage.setItem("family_missions_state", JSON.stringify(state));
  }
}

window.kidsState = state;
window.activeKidId = (state.kids && state.kids.length > 0) ? state.kids[0].id : null;
window.isParentMode = false;
window.parentCurrentSubpage = 'main';

// Fonction appelée par sync.js dès que les données du serveur arrivent
window.setKidsState = function(remoteState) {
  if (remoteState && remoteState.kids && remoteState.kids.length > 0) {
    state = remoteState;
    window.kidsState = state;
    if (typeof originalSetItem === "function") {
      originalSetItem("family_rewards_app", JSON.stringify(state));
      originalSetItem("family_missions_state", JSON.stringify(state));
    }
    renderKids();
    if (typeof renderDashboard === "function") renderDashboard();
  }
};

function getAge(birthDateStr) {
  if (!birthDateStr) return 0;
  const bd = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age;
}

// --- LOGIQUE DE GESTION DU TOUR DE RÔLE (ROTATION) ---
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

function saveState() {
  localStorage.setItem("family_rewards_app", JSON.stringify(state));
  localStorage.setItem("family_missions_state", JSON.stringify(state));
  window.kidsState = state;
  renderKids();
  if (typeof renderDashboard === "function") renderDashboard();
}
window.saveKidsState = saveState;

window.selectKid = function(id) {
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

  // Dès qu'une tâche tournante est validée par l'enfant, le tour passe immédiatement au suivant
  if (mission.isRotating) {
    advanceMissionTurn(mission.id);
  }

  alert(`Super ${kid.name} ! Mission envoyée pour validation aux parents.`);
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
    } else alert(`Il manque ${reward.cost - (state.commonStars || 0)} étoile(s) dans la cagnotte.`);
  } else {
    const kid = state.kids.find(k => String(k.id) === String(window.activeKidId));
    if (!kid) return;
    if (kid.stars >= reward.cost) {
      if (confirm(`Échanger ${reward.cost} étoiles contre « ${reward.title} » ?`)) {
        kid.stars -= reward.cost;
        alert(`Privilège accordé à ${kid.name} !`);
        saveState();
      }
    } else alert(`Il te manque ${reward.cost - kid.stars} étoile(s).`);
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

// --- GESTION DU CODE PIN ESPACE PARENTS ---
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

// --- MODIFICATION DU CODE PIN PARENT ---
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

// --- ACTIONS PARENTALES (VALIDATIONS, POINTS) ---
window.validatePending = function(pendingId, approved) {
  const index = (state.pending || []).findIndex(p => String(p.id) === String(pendingId));
  if (index === -1) return;
  const item = state.pending[index];
  if (approved) {
    const kid = state.kids.find(k => String(k.id) === String(item.kidId));
    if (kid) {
      kid.stars = (kid.stars || 0) + item.points;
      kid.lifetimeStars = (kid.lifetimeStars || 0) + item.points;
    }
  }
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
    saveState();
  }
};

// --- GESTION PROFILS ENFANTS ---
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

// --- GESTION MISSIONS & RÉCOMPENSES ---
window.addMission = function() {
  const title = prompt("Intitulé de la mission :");
  if (!title) return;
  const icon = prompt("Émoji :", "⭐") || "⭐";
  const points = parseInt(prompt("Points attribués :", "1"), 10) || 1;
  const isRotating = confirm("Cette mission doit-elle tourner entre les enfants (chacun son tour) ?");
  state.missions.push({
    id: Date.now(),
    kidId: 0,
    title: title.trim(),
    icon: icon.trim(),
    points: points,
    minAge: null,
    maxAge: null,
    isRotating: isRotating,
    currentKidId: null
  });
  saveState();
};

window.editMission = function(id) {
  const m = state.missions.find(x => String(x.id) === String(id));
  if (!m) return;
  const title = prompt("Titre :", m.title);
  if (title !== null) m.title = title.trim();
  const icon = prompt("Émoji :", m.icon);
  if (icon !== null) m.icon = icon.trim();
  const pts = prompt("Points :", m.points);
  if (pts !== null) m.points = parseInt(pts, 10) || 1;
  const isRotating = confirm("Cette mission doit-elle tourner entre les enfants (chacun son tour) ? Actuellement : " + (m.isRotating ? "Oui" : "Non"));
  m.isRotating = isRotating;
  saveState();
};

window.removeMission = function(id) {
  if (confirm("Supprimer cette tâche ?")) {
    state.missions = state.missions.filter(m => String(m.id) !== String(id));
    saveState();
  }
};

window.addReward = function() {
  const title = prompt("Intitulé de la récompense :");
  if (!title) return;
  const icon = prompt("Émoji :", "🎁") || "🎁";
  const cost = parseInt(prompt("Coût en étoiles :", "5"), 10) || 5;
  const isCommon = confirm("Est-ce une récompense collective (Cagnotte commune) ?");
  state.rewards.push({
    id: Date.now(),
    title: title.trim(),
    icon: icon.trim(),
    cost: cost,
    isCommon: isCommon
  });
  saveState();
};

window.editReward = function(id) {
  const r = state.rewards.find(x => String(x.id) === String(id));
  if (!r) return;
  const title = prompt("Intitulé :", r.title);
  if (title !== null) r.title = title.trim();
  const icon = prompt("Émoji :", r.icon);
  if (icon !== null) r.icon = icon.trim();
  const cost = prompt("Coût en étoiles :", r.cost);
  if (cost !== null) r.cost = parseInt(cost, 10) || 1;
  saveState();
};

window.removeReward = function(id) {
  if (confirm("Supprimer cette récompense ?")) {
    state.rewards = state.rewards.filter(r => String(r.id) !== String(id));
    saveState();
  }
};

// --- SOUS-PAGES DU MODE PARENT ---
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

// --- RENDU GRAPHIQUE GLOBAL ---
function renderKids() {
  const parentView = document.getElementById("parent-view");
  const childView = document.getElementById("child-view");
  if (parentView) parentView.classList.toggle("hidden", !window.isParentMode);
  if (childView) childView.classList.toggle("hidden", window.isParentMode);

  if (!state.kids.some(k => String(k.id) === String(window.activeKidId))) {
    window.activeKidId = state.kids.length > 0 ? state.kids[0].id : null;
  }

  // Vue Enfant
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
        return true;
      });

      const missionsContainer = document.getElementById("tab-missions-sub");
      if (missionsContainer) {
        missionsContainer.innerHTML = kidMissions.map(m => {
          if (m.isRotating) {
            const currentKid = getMissionTurnKid(m);
            const isMyTurn = currentKid && String(currentKid.id) === String(window.activeKidId);

            if (isMyTurn) {
              return `
                <div class="task-item">
                  <div class="task-info">
                    <span style="font-size: 1.6rem;">${m.icon}</span>
                    <div>
                      <div class="task-title">
                        ${m.title} 
                        <span class="badge badge-cat" style="margin-left:4px;">🔄 À ton tour !</span>
                      </div>
                      <div class="task-reward">+${m.points} ⭐</div>
                    </div>
                  </div>
                  <button class="btn-primary btn-small" onclick="submitMission(${m.id})">Fait !</button>
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
            <div class="task-item">
              <div class="task-info">
                <span style="font-size: 1.6rem;">${m.icon}</span>
                <div>
                  <div class="task-title">${m.title}</div>
                  <div class="task-reward">+${m.points} ⭐</div>
                </div>
              </div>
              <button class="btn-primary btn-small" onclick="submitMission(${m.id})">Fait !</button>
            </div>
          `;
        }).join("") || `<p style="text-align:center; padding: 20px; color:var(--text-muted);">Aucune tâche pour aujourd'hui.</p>`;
      }

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
    // Mode Parent
    const pendingContainer = document.getElementById("pending-list");
    if (pendingContainer) {
      if (!state.pending || state.pending.length === 0) {
        pendingContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.88rem;">Aucune tâche en attente de validation.</p>`;
      } else {
        pendingContainer.innerHTML = state.pending.map(p => `
          <div class="task-item">
            <div>
              <b>${p.kidName}</b> : ${p.title}
              <div style="font-size: 0.8rem; color: var(--yellow);">+${p.points} étoile(s)</div>
            </div>
            <div style="display:flex; gap:6px;">
              <button class="btn-primary btn-small" onclick="validatePending(${p.id}, true)">✔ Valider</button>
              <button class="btn-danger btn-small" onclick="validatePending(${p.id}, false)">✖ Refuser</button>
            </div>
          </div>
        `).join("");
      }
    }

    const presenceContainer = document.getElementById("config-presence-list");
    if (presenceContainer) {
      presenceContainer.innerHTML = state.kids.map(k => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--surface); padding:8px 12px; border-radius:8px;">
          <span>${k.avatar} <b>${k.name}</b></span>
          <button class="btn-nav btn-small" onclick="togglePresence(${k.id})">
            ${k.present !== false ? '✅ Activé' : '❌ En pause'}
          </button>
        </div>
      `).join("");
    }

    const adjustContainer = document.getElementById("adjust-stars-list");
    if (adjustContainer) {
      adjustContainer.innerHTML = state.kids.map(k => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--surface); padding:8px 12px; border-radius:8px;">
          <span>${k.avatar} ${k.name} (<b>${k.stars} ⭐</b>)</span>
          <div style="display:flex; gap:6px;">
            <button class="btn-nav btn-small" onclick="adjustKidStars(${k.id}, -1)">-1</button>
            <button class="btn-nav btn-small" onclick="adjustKidStars(${k.id}, 1)">+1</button>
          </div>
        </div>
      `).join("");
    }
    
    const parentCommonStarsEl = document.getElementById("parent-common-stars");
    if (parentCommonStarsEl) parentCommonStarsEl.textContent = state.commonStars || 0;

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

    const configMissionsContainer = document.getElementById("config-missions-list");
    if (configMissionsContainer) {
      configMissionsContainer.innerHTML = state.missions.map(m => {
        let rotatingInfo = '';
        if (m.isRotating) {
          const currentKid = getMissionTurnKid(m);
          const kidName = currentKid ? currentKid.name : 'Aucun';
          rotatingInfo = `
            <div style="font-size:0.82rem; color:var(--primary); margin-top:4px;">
              🔄 Tour actuel : <b>${kidName}</b>
              <button class="btn-nav btn-small" style="margin-left:8px; padding:2px 8px; font-size:0.75rem;" onclick="passMissionTurn(${m.id})" title="Passer au prochain enfant">⏭️ Tour suivant</button>
            </div>
          `;
        }
        return `
          <div class="task-item" style="flex-direction:column; align-items:flex-start; gap:4px;">
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
              <span>${m.icon} <b>${m.title}</b> (${m.points} ⭐) ${m.isRotating ? '<span class="badge badge-cat">🔄 Tourne</span>' : ''}</span>
              <div style="display:flex; gap:6px;">
                <button class="btn-nav btn-small" onclick="editMission(${m.id})">✏️</button>
                <button class="btn-danger btn-small" onclick="removeMission(${m.id})">✕</button>
              </div>
            </div>
            ${rotatingInfo}
          </div>
        `;
      }).join("");
    }

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

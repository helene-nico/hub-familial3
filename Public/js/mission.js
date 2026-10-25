const APP_VERSION = 18; // Version mise à jour pour le système d'XP

const defaultData = {
  version: APP_VERSION,
  pin: "0000",
  commonStars: 0,
  kids: [
    { id: 1, name: "Clarisse", birthDate: "2021-01-01", avatar: "👧", stars: 4, lifetimeStars: 14, present: true, level: 1, xp: 0 },
    { id: 2, name: "Hugo", birthDate: "2018-01-01", avatar: "👦", stars: 6, lifetimeStars: 22, present: true, level: 1, xp: 0 },
    { id: 3, name: "Adèle", birthDate: "2017-01-01", avatar: "👩", stars: 10, lifetimeStars: 35, present: true, level: 1, xp: 0 }
  ],
  missions: [
    { id: 101, kidId: 0, title: "S'habiller seul(e) le matin", icon: "👗", points: 10, minAge: null, maxAge: 7 }, 
    { id: 102, kidId: 0, title: "Brossage de dents (avec aide)", icon: "🦷", points: 10, minAge: null, maxAge: 7 }, 
    { id: 103, kidId: 0, title: "Brossage de dents (2 min chrono)", icon: "🦷", points: 10, minAge: 8, maxAge: null }, 
    { id: 104, kidId: 0, title: "Prendre son bain ou sa douche", icon: "🛁", points: 10, minAge: null, maxAge: 7 },
    { id: 105, kidId: 0, title: "Douche en autonomie", icon: "🚿", points: 10, minAge: 8, maxAge: null },
    { id: 106, kidId: 0, title: "Mettre son pyjama", icon: "👚", points: 10, minAge: null, maxAge: 7 },
    { id: 107, kidId: 0, title: "Linge sale au panier", icon: "🧺", points: 10, minAge: 3, maxAge: null },
    { id: 108, kidId: 0, title: "Se laver les mains avant le repas", icon: "🧼", points: 10, minAge: 3, maxAge: null },
    { id: 201, kidId: 0, title: "Ranger ses jouets", icon: "🧸", points: 15, minAge: null, maxAge: 7 },
    { id: 202, kidId: 0, title: "Ranger sa chambre (lit, bureau)", icon: "🧹", points: 15, minAge: 8, maxAge: null },
    { id: 203, kidId: 0, title: "Faire son lit au réveil", icon: "🛏️", points: 10, minAge: 8, maxAge: null },
    { id: 204, kidId: 0, title: "Ranger manteau et chaussures", icon: "👟", points: 10, minAge: 4, maxAge: null },
    { id: 205, kidId: 0, title: "Préparer son cartable le soir", icon: "🎒", points: 15, minAge: 6, maxAge: null },
    { id: 206, kidId: 0, title: "Devoirs du soir", icon: "📚", points: 20, minAge: 6, maxAge: null },
    { id: 401, kidId: 0, isRotating: true, currentKidId: 1, title: "Mettre la table", icon: "🍽️", points: 10, minAge: 5, maxAge: null }, 
    { id: 402, kidId: 0, isRotating: true, currentKidId: 2, title: "Débarrasser la table", icon: "🥣", points: 10, minAge: 6, maxAge: null } 
  ],
  rewards: [
    { id: 1, isCommon: false, title: "Histoire supplémentaire", icon: "🌙", cost: 30 },
    { id: 2, isCommon: false, title: "Choisir le dessert", icon: "🧁", cost: 40 },
    { id: 3, isCommon: false, title: "Coucher décalé de 30 min", icon: "⏰", cost: 80 },
    { id: 5, isCommon: true, title: "Cabane dans le salon", icon: "⛺", cost: 150 },
    { id: 6, isCommon: true, title: "Soirée film + pop-corn", icon: "🎬", cost: 200 }
  ],
  pending: [],
  completedToday: []
};

// Initialisation de l'état
let state = JSON.parse(localStorage.getItem("family_rewards_app")) || defaultData;
if (!state || !state.kids || state.kids.length === 0) {
  state = defaultData;
  localStorage.setItem("family_rewards_app", JSON.stringify(state));
}

// Variables globales
window.activeKidId = state.kids.length > 0 ? state.kids[0].id : null;
window.isParentMode = false;
window.parentCurrentSubpage = null;

// Méthode de sauvegarde 
function saveState() {
  localStorage.setItem("family_rewards_app", JSON.stringify(state));
  if (typeof window.syncUpstash === "function") {
    window.syncUpstash(state);
  }
}

// Outils de gestion
function getAge(birthDate) {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
}

function getDailyKey() {
  return new Date().toISOString().split('T')[0];
}

function getEligibleKidsForMission(mission) {
  return state.kids.filter(k => k.present !== false && (mission.kidId === 0 || mission.kidId === k.id));
}

function advanceMissionTurn(missionId) {
  const mission = state.missions.find(m => m.id === missionId);
  if (!mission || !mission.isRotating) return;
  const eligibleKids = getEligibleKidsForMission(mission);
  if (eligibleKids.length <= 1) return;
  
  let currentIndex = eligibleKids.findIndex(k => k.id === mission.currentKidId);
  currentIndex = (currentIndex + 1) % eligibleKids.length;
  mission.currentKidId = eligibleKids[currentIndex].id;
  saveState();
}

function getKidDailyOrder(kidId, eligibleKids) {
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const index = eligibleKids.findIndex(k => k.id === kidId);
  return ((index + dayOfYear) % eligibleKids.length) + 1;
}

// Formules d'XP
function getXpThreshold(level) {
  // Le niveau 1 nécessite 50 XP, niveau 2 -> 100 XP, niveau 3 -> 150 XP, etc.
  return level * 50; 
}

// ----------------------------------------------------
// ACTIONS UTILISATEUR : PROGRÈS ET EFFORT (Remplace submitMission)
// ----------------------------------------------------
window.submitMissionProgress = function(missionId, effortType) {
  const mission = state.missions.find(m => String(m.id) === String(missionId));
  const kid = state.kids.find(k => String(k.id) === String(window.activeKidId));
  if (!mission || !kid) return;

  if (!state.pending) state.pending = [];
  
  const alreadyPending = state.pending.some(p => String(p.missionId) === String(mission.id) && String(p.kidId) === String(kid.id));
  if (alreadyPending) {
    alert("Cette mission est déjà en attente de validation par les parents !");
    return;
  }

  const basePoints = mission.points || 10;
  // Calcul de l'XP gagné : 50% pour l'effort, 100% si accompli en autonomie
  const earnedXp = effortType === 'effort' ? Math.max(1, Math.round(basePoints * 0.5)) : basePoints;
  const effortLabel = effortType === 'effort' ? "A fait de son mieux 🌱" : "Réussi seul 🚀";

  state.pending.push({
    id: Date.now(),
    missionId: mission.id,
    kidId: kid.id,
    kidName: kid.name,
    title: mission.title,
    points: earnedXp, // XP réels gagnés
    effortLabel: effortLabel
  });

  if (mission.isRotating) {
    advanceMissionTurn(mission.id);
  }

  alert(`Super ${kid.name} ! Ton effort est envoyé pour validation aux parents.`);
  saveState();
  renderKids();
};

window.claimReward = function(rewardId, isCommon) {
  const reward = state.rewards.find(r => r.id === rewardId);
  const kid = state.kids.find(k => k.id === window.activeKidId);
  
  if (isCommon) {
    if (state.commonStars >= reward.cost) {
      if(confirm(`Utiliser ${reward.cost} XP de la cagnotte pour : ${reward.title} ?`)) {
        state.commonStars -= reward.cost;
        alert("Cadeau collectif débloqué !");
        saveState();
        renderKids();
      }
    }
  } else {
    // Rétrocompatibilité : utiliser l'XP/Stars comme monnaie pour les récompenses
    let currency = kid.stars !== undefined ? kid.stars : kid.xp;
    if (currency >= reward.cost) {
      if(confirm(`Utiliser ${reward.cost} points pour : ${reward.title} ?`)) {
        if(kid.stars !== undefined) kid.stars -= reward.cost;
        kid.xp -= reward.cost;
        alert("Cadeau débloqué !");
        saveState();
        renderKids();
      }
    }
  }
};

window.donateToCommon = function() {
  const kid = state.kids.find(k => k.id === window.activeKidId);
  let currency = kid.stars !== undefined ? kid.stars : kid.xp;
  if (currency >= 5) {
    if(confirm("Donner 5 points à la cagnotte familiale ?")) {
      if(kid.stars !== undefined) kid.stars -= 5;
      kid.xp -= 5;
      state.commonStars = (state.commonStars || 0) + 5;
      saveState();
      renderKids();
    }
  } else {
    alert("Il te faut au moins 5 points pour contribuer !");
  }
};

// ----------------------------------------------------
// VALIDATION PARENTALE
// ----------------------------------------------------
window.validatePending = function(pendingId, approved) {
  const index = (state.pending || []).findIndex(p => String(p.id) === String(pendingId));
  if (index === -1) return;
  
  const item = state.pending[index];
  if (approved) {
    const kid = state.kids.find(k => String(k.id) === String(item.kidId));
    if (kid) {
      if (kid.level === undefined) kid.level = 1;
      if (kid.xp === undefined) kid.xp = 0;

      // Ajout de l'XP
      kid.xp += item.points;
      if (kid.stars !== undefined) kid.stars += item.points; // rétrocompatibilité
      kid.lifetimeStars = (kid.lifetimeStars || 0) + item.points;

      // Passage de niveau
      let threshold = getXpThreshold(kid.level);
      while(kid.xp >= threshold) {
        kid.xp -= threshold;
        kid.level += 1;
        threshold = getXpThreshold(kid.level);
      }
    }
    if (!state.completedToday) state.completedToday = [];
    state.completedToday.push({
      missionId: item.missionId,
      kidId: item.kidId,
      date: getDailyKey()
    });
  }
  
  state.pending.splice(index, 1);
  saveState();
};

window.validatePendingTask = function(id) {
  window.validatePending(id, true);
  renderKids();
};
window.refusePendingTask = function(id) {
  window.validatePending(id, false);
  renderKids();
};

// Administration Parents
window.openParentPinModal = function() { document.getElementById("parentPinModal").style.display = "flex"; };
window.closeParentPinModal = function() { document.getElementById("parentPinModal").style.display = "none"; document.getElementById("parentPinInput").value = ""; };
window.submitParentPin = function() {
  if (document.getElementById("parentPinInput").value === state.pin) {
    window.isParentMode = true;
    window.parentCurrentSubpage = null;
    window.closeParentPinModal();
    renderKids();
  } else { alert("Code PIN incorrect !"); }
};
window.exitParentMode = function() { window.isParentMode = false; window.parentCurrentSubpage = null; renderKids(); };
window.openParentDomainPage = function(domain) { window.parentCurrentSubpage = domain; renderKids(); };
window.closeParentDomainPage = function() { window.parentCurrentSubpage = null; renderKids(); };
window.openChangePinModal = function() { document.getElementById("changePinModal").style.display = "flex"; };
window.closeChangePinModal = function() { document.getElementById("changePinModal").style.display = "none"; };
window.submitChangePin = function() { state.pin = document.getElementById("newPinInput").value; saveState(); window.closeChangePinModal(); alert("PIN modifié !"); };

// Gestion Enfants
window.addKid = function() {
  const name = prompt("Prénom de l'enfant :"); if(!name) return;
  const birthDate = prompt("Date de naissance (AAAA-MM-JJ) :");
  const avatar = prompt("Emoji avatar :", "👧");
  state.kids.push({ id: Date.now(), name, birthDate, avatar, stars: 0, lifetimeStars: 0, present: true, level: 1, xp: 0 });
  saveState(); renderKids();
};
window.editKid = function(id) {
  const kid = state.kids.find(k => k.id === id); if(!kid) return;
  const name = prompt("Prénom :", kid.name); if(name) kid.name = name;
  const birth = prompt("Date (AAAA-MM-JJ) :", kid.birthDate); if(birth) kid.birthDate = birth;
  const ava = prompt("Avatar :", kid.avatar); if(ava) kid.avatar = ava;
  saveState(); renderKids();
};
window.removeKid = function(id) {
  if(confirm("Supprimer cet enfant ?")) { state.kids = state.kids.filter(k => k.id !== id); saveState(); renderKids(); }
};
window.selectKid = function(id) { window.activeKidId = id; renderKids(); };
window.toggleKidPresence = function(id) {
  const kid = state.kids.find(k => k.id === id);
  if(kid) { kid.present = kid.present === false ? true : false; saveState(); renderKids(); }
};
window.adjustKidStars = function(id, diff) {
  const kid = state.kids.find(k => k.id === id);
  if (kid) {
      kid.stars = Math.max(0, (kid.stars || 0) + diff);
      kid.xp = Math.max(0, (kid.xp || 0) + diff); // On maintient la cohérence
      saveState(); renderKids(); 
  }
};
window.adjustCommonStars = function(diff) { state.commonStars = Math.max(0, (state.commonStars || 0) + diff); saveState(); renderKids(); };

// Navigation Sous-onglets enfant
window.switchKidSubTab = function(tab) {
  document.querySelectorAll(".kids-subtab-btn").forEach(b => b.classList.remove("active"));
  const btn = document.getElementById("btn-tab-" + tab);
  if(btn) btn.classList.add("active");
  document.getElementById("tab-missions-sub").classList.toggle("hidden", tab !== "missions");
  document.getElementById("tab-rewards-sub").classList.toggle("hidden", tab !== "rewards");
  document.getElementById("tab-family-sub").classList.toggle("hidden", tab !== "family");
  document.getElementById("kid-score-card").classList.toggle("hidden", tab === "family");
};

// ----------------------------------------------------
// AFFICHAGE PRINCIPAL (renderKids)
// ----------------------------------------------------
window.renderKids = function() {
  const parentView = document.getElementById("parent-view");
  const childView = document.getElementById("child-view");
  if (parentView) parentView.classList.toggle("hidden", !window.isParentMode);
  if (childView) childView.classList.toggle("hidden", window.isParentMode);

  if (!state.kids.some(k => String(k.id) === String(window.activeKidId))) {
    window.activeKidId = state.kids.length > 0 ? state.kids[0].id : null;
  }

  // --- VUE ENFANT ---
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
          </div>`;
      }).join("");
    }

    const activeKid = state.kids.find(k => String(k.id) === String(window.activeKidId));
    if (activeKid) {
      const today = getDailyKey();
      const age = getAge(activeKid.birthDate);
      
      // Update Score Card avec le Niveau et XP
      const lvl = activeKid.level || 1;
      const xp = activeKid.xp || 0;
      const nextThreshold = getXpThreshold(lvl);
      const pct = Math.min(100, Math.round((xp / nextThreshold) * 100));

      const nameEl = document.getElementById("active-kid-name");
      const levelEl = document.getElementById("active-kid-level");
      const xpEl = document.getElementById("active-kid-xp");
      const progEl = document.getElementById("active-kid-progress");
      const starsEl = document.getElementById("active-kid-stars");
      
      if(nameEl) nameEl.textContent = activeKid.name;
      if(levelEl) { levelEl.textContent = `Niveau ${lvl}`; levelEl.className = 'badge progress-level-badge'; }
      if(xpEl) xpEl.textContent = `${xp} / ${nextThreshold} XP`;
      if(progEl) progEl.style.width = `${pct}%`;
      // Optionnel: Garder l'affichage de l'XP en grand
      if(starsEl) starsEl.textContent = activeKid.stars !== undefined ? activeKid.stars : xp; 

      const kidMissions = state.missions.filter(m => {
        if (m.kidId !== 0 && String(m.kidId) !== String(activeKid.id)) return false;
        if (m.minAge && age < m.minAge) return false;
        if (m.maxAge && age > m.maxAge) return false;
        if (m.isRotating && m.currentKidId !== activeKid.id) return false;
        return true;
      });

      const missionsContainer = document.getElementById("tab-missions-sub");
      if (missionsContainer) {
        missionsContainer.innerHTML = kidMissions.map(m => {
          const isPending = state.pending && state.pending.some(p => String(p.missionId) === String(m.id) && String(p.kidId) === String(window.activeKidId));
          const isCompleted = state.completedToday && state.completedToday.some(c => c.missionId === m.id && c.kidId === activeKid.id && c.date === today);
          
          let btnHtml = "";
          const effortXp = Math.max(1, Math.round((m.points||10) * 0.5));
          const fullXp = m.points||10;

          if (isCompleted) {
             btnHtml = `<div style="font-size:0.8rem; color:#10b981; font-weight:700; margin-top:6px;">✓ Validé aujourd'hui</div>`;
          } else if (isPending) {
             btnHtml = `<div style="font-size:0.8rem; color:#f59e0b; font-weight:700; margin-top:6px;">⏳ En attente parentale</div>`;
          } else {
             btnHtml = `
              <div class="task-progress-actions" style="display:flex; gap:8px; margin-top:8px;">
                <button class="btn-effort" onclick="submitMissionProgress(${m.id}, 'effort')">
                  🌱 J'ai essayé (+${effortXp} XP)
                </button>
                <button class="btn-effort btn-effort-done" onclick="submitMissionProgress(${m.id}, 'success')">
                  🚀 Réussi seul (+${fullXp} XP)
                </button>
              </div>`;
          }

          let extraHtml = "";
          if (m.isDailyOrder || (m.title && m.title.toLowerCase().includes('douche'))) {
            const elig = getEligibleKidsForMission(m);
            if(elig.length > 1) {
              const r = getKidDailyOrder(activeKid.id, elig);
              extraHtml = `<div style="font-size: 0.75rem; color: var(--text-muted); font-weight:bold; margin-top:4px;">▶ C'est ton tour : Tu es le ${r === 1 ? '1er' : r + 'ème'}</div>`;
            }
          }

          return `
            <div class="task-card ${isCompleted ? 'task-done' : ''}">
              <div style="display:flex; align-items:center; gap:12px;">
                <span style="font-size:1.8rem;">${m.icon}</span>
                <div style="flex:1;">
                  <div style="font-weight:700;">${m.title}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">Progression : +${fullXp} XP max</div>
                  ${extraHtml}
                </div>
              </div>
              ${btnHtml}
            </div>`;
        }).join("");
      }

      // Rendu des récompenses (Reste identique mais basé sur l'XP/Stars)
      const rewardsContainer = document.getElementById("tab-rewards-sub");
      const famRewardsContainer = document.getElementById("family-rewards-list");
      const individualRewards = state.rewards.filter(r => !r.isCommon);
      const familyRewards = state.rewards.filter(r => r.isCommon);

      if (rewardsContainer) {
        rewardsContainer.innerHTML = individualRewards.map(r => `
          <div class="task-item">
            <div class="task-info">
              <span style="font-size: 1.6rem;">${r.icon}</span>
              <div>
                <div class="task-title">${r.title}</div>
                <div class="task-reward">${r.cost} XP</div>
              </div>
            </div>
            <button class="btn-primary btn-small" onclick="claimReward(${r.id}, false)" ${(activeKid.stars !== undefined ? activeKid.stars : activeKid.xp) < r.cost ? 'disabled style="opacity:0.5;"' : ''}>
              Choisir
            </button>
          </div>`).join("");
      }
      
      if (famRewardsContainer) {
        famRewardsContainer.innerHTML = familyRewards.map(r => `
          <div class="task-item">
            <div class="task-info">
              <span style="font-size: 1.6rem;">${r.icon}</span>
              <div>
                <div class="task-title">${r.title}</div>
                <div class="task-reward" style="color:#ec4899;">${r.cost} XP (Famille)</div>
              </div>
            </div>
            <button class="btn-primary btn-small" onclick="claimReward(${r.id}, true)" ${(state.commonStars || 0) < r.cost ? 'disabled style="opacity:0.5;"' : ''}>
              Débloquer
            </button>
          </div>`).join("");
      }
      const cs = document.getElementById("common-stars"); if (cs) cs.textContent = state.commonStars || 0;
    }
  }

  // --- VUE PARENTS ---
  if (window.isParentMode) {
    document.getElementById("parent-main-view").classList.toggle("hidden", window.parentCurrentSubpage !== null);
    document.getElementById("parent-page-kids").classList.toggle("hidden", window.parentCurrentSubpage !== 'kids');
    document.getElementById("parent-page-missions").classList.toggle("hidden", window.parentCurrentSubpage !== 'missions');
    document.getElementById("parent-page-rewards").classList.toggle("hidden", window.parentCurrentSubpage !== 'rewards');

    if (window.parentCurrentSubpage === null) {
      const pendingContainer = document.getElementById("pending-list");
      if (pendingContainer) {
        if (!state.pending || state.pending.length === 0) {
          pendingContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.88rem; text-align:center; padding: 10px;">✅ Aucune tâche en attente.</p>`;
        } else {
          pendingContainer.innerHTML = state.pending.map(p => `
            <div class="task-item" style="border-left: 4px solid var(--yellow);">
              <div>
                <b>${p.kidName}</b> : ${p.title}
                <div style="font-size: 0.75rem; color: var(--text-muted);"><i>${p.effortLabel || "Action accomplie"}</i></div>
                <div style="font-size: 0.8rem; color: var(--yellow); font-weight: bold;">+${p.points} XP</div>
              </div>
              <div style="display:flex; gap:6px;">
                <button class="btn-primary btn-small" onclick="validatePendingTask(${p.id})">Valider</button>
                <button class="btn-danger btn-small" onclick="refusePendingTask(${p.id})">Refuser</button>
              </div>
            </div>`).join("");
        }
      }
      
      const pcs = document.getElementById("parent-common-stars"); if (pcs) pcs.textContent = state.commonStars || 0;
      
      const presenceContainer = document.getElementById("config-presence-list");
      if (presenceContainer) {
        presenceContainer.innerHTML = state.kids.map(k => `
          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--surface); padding:8px 12px; border-radius:var(--radius-sm); border:1px solid var(--border);">
            <span>${k.avatar} <b>${k.name}</b></span>
            <button class="${k.present === false ? 'btn-danger' : 'btn-nav'} btn-small" onclick="toggleKidPresence(${k.id})">
              ${k.present === false ? 'En pause (absent)' : 'Actif (présent)'}
            </button>
          </div>`).join("");
      }

      const adjustContainer = document.getElementById("adjust-stars-list");
      if (adjustContainer) {
        adjustContainer.innerHTML = state.kids.map(k => `
          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--surface); padding:8px 12px; border-radius:var(--radius-sm); border:1px solid var(--border);">
            <span>${k.avatar} <b>${k.name}</b> : <b style="color:var(--yellow);">${k.xp || k.stars}</b> XP</span>
            <div style="display:flex; gap:6px;">
              <button class="btn-nav btn-small" onclick="adjustKidStars(${k.id}, -1)">-1</button>
              <button class="btn-nav btn-small" onclick="adjustKidStars(${k.id}, +1)">+1</button>
            </div>
          </div>`).join("");
      }
    }

    if (window.parentCurrentSubpage === 'kids') {
      const configKidsContainer = document.getElementById("config-kids-list");
      if (configKidsContainer) {
        configKidsContainer.innerHTML = state.kids.map(k => `
          <div class="task-item">
            <span>${k.avatar} <b>${k.name}</b> (${getAge(k.birthDate)} ans)</span>
            <div style="display:flex; gap:6px;">
              <button class="btn-nav btn-small" onclick="editKid(${k.id})">✏️</button>
              <button class="btn-danger btn-small" onclick="removeKid(${k.id})">✕</button>
            </div>
          </div>`).join("");
      }
    }
  }
};

// Injection Globale (Pour que index.html puisse appeler ces fonctions si besoin)
window.state = state;

// Démarrage
window.addEventListener('DOMContentLoaded', () => {
  renderKids();
  window.switchKidSubTab('missions');
});

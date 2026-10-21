// --- CATALOGUE DE BASE (30 RECETTES) ---
const DEFAULT_RECIPES = [
  // --- CLASSIQUES & RÉCONFORT ---
  { id: 'r_hachis', icon: '🐮🥔', title: 'Hachis Parmentier maison', category: 'Réconfort', ingredients: [{ name: 'Pommes de terre', qty: 1000, unit: 'g' }, { name: 'Bœuf haché', qty: 500, unit: 'g' }, { name: 'Oignons', qty: 2, unit: 'p' }, { name: 'Lait', qty: 15, unit: 'cl' }, { name: 'Beurre', qty: 40, unit: 'g' }, { name: 'Gruyère râpé', qty: 70, unit: 'g' }], steps: 'Cuire les pommes de terre à l’eau, écraser avec beurre et lait. Faire revenir les oignons et la viande. Superposer viande, purée et fromage dans un plat. Gratiner 20 min à 200°C.' },
  { id: 'r_tartiflette', icon: '🥓🧀', title: 'Tartiflette traditionnelle', category: 'Réconfort', ingredients: [{ name: 'Pommes de terre', qty: 1000, unit: 'g' }, { name: 'Reblochon', qty: 1, unit: 'p' }, { name: 'Lardons fumés', qty: 200, unit: 'g' }, { name: 'Oignons', qty: 2, unit: 'p' }, { name: 'Crème fraîche', qty: 10, unit: 'cl' }], steps: 'Cuire les pommes de terre. Faire revenir oignons et lardons. Disposer les pommes de terre en rondelles dans un plat, ajouter le mélange lardons, la crème, et le reblochon coupé en deux par-dessus. Cuire 25 min à 200°C.' },
  { id: 'r_tomates_farcies', icon: '🍅🐷', title: 'Tomates farcies au riz', category: 'Réconfort', ingredients: [{ name: 'Grosses tomates', qty: 4, unit: 'p' }, { name: 'Chair à saucisse', qty: 400, unit: 'g' }, { name: 'Riz', qty: 150, unit: 'g' }, { name: 'Ail et persil', qty: 1, unit: 'portion' }], steps: 'Évider les tomates. Mélanger la chair avec la pulpe des tomates, ail et persil. Farcir les tomates. Mettre le riz au fond du plat, poser les tomates dessus, ajouter un peu d’eau et cuire 45 min à 180°C.' },
  { id: 'r_gratin_dauphinois', icon: '🥔🥛', title: 'Gratin dauphinois et salade', category: 'Réconfort', ingredients: [{ name: 'Pommes de terre', qty: 1000, unit: 'g' }, { name: 'Lait', qty: 50, unit: 'cl' }, { name: 'Crème liquide', qty: 50, unit: 'cl' }, { name: 'Ail', qty: 2, unit: 'gousses' }, { name: 'Salade verte', qty: 1, unit: 'p' }], steps: 'Couper les pommes de terre en fines rondelles (ne pas les laver après). Frotter le plat à l’ail. Disposer les rondelles, couvrir du mélange lait, crème, sel, poivre et muscade. Enfourner 1h à 160°C.' },
  
  // --- MONDE & ÉPICES ---
  { id: 'r_poulet_curry', icon: '🍗🥥', title: 'Poulet au curry et lait de coco', category: 'Monde', ingredients: [{ name: 'Blancs de poulet', qty: 600, unit: 'g' }, { name: 'Lait de coco', qty: 40, unit: 'cl' }, { name: 'Riz basmati', qty: 300, unit: 'g' }, { name: 'Oignon', qty: 1, unit: 'p' }, { name: 'Poudre de curry', qty: 2, unit: 'c. à soupe' }], steps: 'Émincer poulet et oignon. Dorer le tout. Ajouter le curry et le lait de coco. Mijoter 15 min. Servir avec le riz.' },
  { id: 'r_chili', icon: '🤠🍅', title: 'Chili con carne express', category: 'Monde', ingredients: [{ name: 'Bœuf haché', qty: 500, unit: 'g' }, { name: 'Haricots rouges', qty: 400, unit: 'g' }, { name: 'Tomates concassées', qty: 400, unit: 'g' }, { name: 'Maïs', qty: 150, unit: 'g' }, { name: 'Épices chili', qty: 1, unit: 'sachet' }], steps: 'Faire revenir la viande. Ajouter épices, tomates, haricots et maïs. Mijoter 20 min.' },
  { id: 'r_fajitas', icon: '🌯🫑', title: 'Fajitas au bœuf et poivrons', category: 'Monde', ingredients: [{ name: 'Tortillas', qty: 8, unit: 'p' }, { name: 'Bœuf (rumsteck)', qty: 400, unit: 'g' }, { name: 'Poivrons', qty: 2, unit: 'p' }, { name: 'Oignon rouge', qty: 1, unit: 'p' }, { name: 'Épices mexicaines', qty: 1, unit: 'sachet' }], steps: 'Émincer bœuf, poivrons et oignon. Saisir la viande, retirer. Saisir les légumes, remettre la viande avec les épices. Garnir les tortillas tièdes.' },
  { id: 'r_couscous', icon: '🥘🥕', title: 'Couscous rapide poulet merguez', category: 'Monde', ingredients: [{ name: 'Semoule', qty: 300, unit: 'g' }, { name: 'Pilons de poulet', qty: 4, unit: 'p' }, { name: 'Merguez', qty: 4, unit: 'p' }, { name: 'Légumes couscous (surgelés ou frais)', qty: 600, unit: 'g' }, { name: 'Épices ras el hanout', qty: 2, unit: 'c. à soupe' }], steps: 'Faire dorer les viandes. Ajouter les légumes, les épices et de l’eau. Mijoter 30 min. Préparer la semoule à part.' },

  // --- PÂTES & RIZ ---
  { id: 'r_lasagnes', icon: '🍝🧀', title: 'Lasagnes à la bolognaise', category: 'Pâtes & Riz', ingredients: [{ name: 'Pâtes à lasagne', qty: 250, unit: 'g' }, { name: 'Bœuf haché', qty: 500, unit: 'g' }, { name: 'Sauce tomate', qty: 700, unit: 'g' }, { name: 'Béchamel', qty: 50, unit: 'cl' }, { name: 'Gruyère râpé', qty: 150, unit: 'g' }], steps: 'Préparer la bolognaise. Alterner couches de pâtes, bolognaise et béchamel. Finir par le fromage. Cuire 30 min à 180°C.' },
  { id: 'r_carbonara', icon: '🍝🥓', title: 'Pâtes à la carbonara', category: 'Pâtes & Riz', ingredients: [{ name: 'Spaghetti', qty: 400, unit: 'g' }, { name: 'Lardons', qty: 250, unit: 'g' }, { name: 'Jaunes d’œufs', qty: 4, unit: 'p' }, { name: 'Parmesan', qty: 80, unit: 'g' }], steps: 'Cuire les pâtes. Dorer les lardons. Battre jaunes et parmesan avec de l’eau de cuisson. Mélanger les pâtes aux lardons, retirer du feu et ajouter les œufs.' },
  { id: 'r_risotto', icon: '🍚🍄', title: 'Risotto aux champignons', category: 'Pâtes & Riz', ingredients: [{ name: 'Riz arborio', qty: 300, unit: 'g' }, { name: 'Champignons de Paris', qty: 300, unit: 'g' }, { name: 'Bouillon de volaille', qty: 1, unit: 'L' }, { name: 'Parmesan', qty: 60, unit: 'g' }, { name: 'Oignon', qty: 1, unit: 'p' }], steps: 'Faire suer l’oignon. Ajouter le riz jusqu’à ce qu’il soit translucide. Ajouter le bouillon louche par louche pendant 18 min. Incorporer les champignons poêlés et le parmesan à la fin.' },
  { id: 'r_wok_nouilles', icon: '🍜🍗', title: 'Wok de nouilles sautées au poulet', category: 'Pâtes & Riz', ingredients: [{ name: 'Nouilles chinoises', qty: 300, unit: 'g' }, { name: 'Poulet', qty: 400, unit: 'g' }, { name: 'Carottes', qty: 2, unit: 'p' }, { name: 'Sauce soja', qty: 4, unit: 'c. à soupe' }], steps: 'Cuire les nouilles. Faire sauter le poulet émincé et les carottes râpées à feu vif. Ajouter les nouilles et la sauce soja, bien mélanger.' },

  // --- QUOTIDIEN EXPRESS ---
  { id: 'r_quiche', icon: '🥧🥓', title: 'Quiche lorraine et salade verte', category: 'Quotidien', ingredients: [{ name: 'Pâte brisée', qty: 1, unit: 'p' }, { name: 'Lardons', qty: 200, unit: 'g' }, { name: 'Œufs', qty: 3, unit: 'p' }, { name: 'Crème fraîche', qty: 20, unit: 'cl' }, { name: 'Salade', qty: 1, unit: 'p' }], steps: 'Étaler la pâte. Mélanger œufs et crème. Ajouter les lardons dorés. Verser sur la pâte. Cuire 35 min à 180°C. Servir avec la salade.' },
  { id: 'r_croque', icon: '🥪🧀', title: 'Croque-monsieur et salade', category: 'Quotidien', ingredients: [{ name: 'Pain de mie', qty: 8, unit: 'tranches' }, { name: 'Jambon blanc', qty: 4, unit: 'tranches' }, { name: 'Gruyère râpé', qty: 150, unit: 'g' }, { name: 'Beurre', qty: 30, unit: 'g' }, { name: 'Salade', qty: 1, unit: 'p' }], steps: 'Beurrer les tranches. Monter les croques avec jambon et fromage. Gratiner au four 10 min.' },
  { id: 'r_omelette', icon: '🍳🥔', title: 'Omelette pommes de terre', category: 'Quotidien', ingredients: [{ name: 'Œufs', qty: 8, unit: 'p' }, { name: 'Pommes de terre', qty: 400, unit: 'g' }, { name: 'Fromage râpé', qty: 100, unit: 'g' }], steps: 'Couper les pommes de terre en dés et les rissoler. Battre les œufs en omelette, ajouter le fromage. Verser sur les pommes de terre et cuire des deux côtés.' },
  { id: 'r_poulet_basquaise', icon: '🍗🍅', title: 'Poulet basquaise et riz', category: 'Quotidien', ingredients: [{ name: 'Cuisses de poulet', qty: 4, unit: 'p' }, { name: 'Tomates concassées', qty: 400, unit: 'g' }, { name: 'Poivrons (rouge/vert)', qty: 3, unit: 'p' }, { name: 'Riz', qty: 250, unit: 'g' }], steps: 'Dorer le poulet. Ajouter les poivrons émincés et les tomates. Laisser mijoter 45 min. Servir avec du riz blanc.' },
  { id: 'r_wraps', icon: '🌯🥗', title: 'Wraps poulet crudités', category: 'Quotidien', ingredients: [{ name: 'Galettes à wrap', qty: 4, unit: 'p' }, { name: 'Aiguillettes de poulet', qty: 400, unit: 'g' }, { name: 'Tomates', qty: 2, unit: 'p' }, { name: 'Salade', qty: 1, unit: 'p' }, { name: 'Mayonnaise', qty: 4, unit: 'c. à soupe' }], steps: 'Cuire le poulet. Garnir les galettes de sauce, salade, tomates en dés et poulet. Rouler serré.' },
  { id: 'r_filet_mignon', icon: '🥩🥔', title: 'Filet mignon moutarde', category: 'Quotidien', ingredients: [{ name: 'Filet mignon de porc', qty: 500, unit: 'g' }, { name: 'Moutarde', qty: 3, unit: 'c. à soupe' }, { name: 'Crème fraîche', qty: 15, unit: 'cl' }, { name: 'Pommes de terre (pour purée)', qty: 800, unit: 'g' }], steps: 'Badigeonner le filet de moutarde et le rôtir 30 min au four à 190°C. Faire une purée maison. Déglacer le plat avec la crème.' },

  // --- LÉGER & SALADES ---
  { id: 'r_saumon_four', icon: '🐟🥕', title: 'Saumon et légumes rôtis', category: 'Léger & Salade', ingredients: [{ name: 'Pavés de saumon', qty: 4, unit: 'p' }, { name: 'Courgettes', qty: 2, unit: 'p' }, { name: 'Carottes', qty: 4, unit: 'p' }, { name: 'Huile d’olive', qty: 3, unit: 'c. à soupe' }], steps: 'Couper les légumes en bâtonnets, cuire au four 20 min à 190°C. Ajouter le saumon dessus et cuire encore 12 min.' },
  { id: 'r_salade_cesar', icon: '🥗🍗', title: 'Salade César complète', category: 'Léger & Salade', ingredients: [{ name: 'Salade romaine', qty: 1, unit: 'p' }, { name: 'Poulet grillé', qty: 400, unit: 'g' }, { name: 'Croûtons', qty: 80, unit: 'g' }, { name: 'Parmesan', qty: 50, unit: 'g' }, { name: 'Sauce César', qty: 5, unit: 'c. à soupe' }], steps: 'Dresser la salade, parsemer de poulet, croûtons, copeaux de parmesan et sauce.' },
  { id: 'r_poke_bowl', icon: '🥑🍚', title: 'Poke Bowl Saumon Avocat', category: 'Léger & Salade', ingredients: [{ name: 'Riz à sushi', qty: 250, unit: 'g' }, { name: 'Saumon frais', qty: 400, unit: 'g' }, { name: 'Avocat', qty: 2, unit: 'p' }, { name: 'Concombre', qty: 1, unit: 'p' }, { name: 'Graines de sésame', qty: 1, unit: 'c. à soupe' }], steps: 'Cuire le riz. Couper le saumon, l’avocat et le concombre en dés. Disposer dans un bol sur le riz froid. Ajouter sauce soja et sésame.' },
  { id: 'r_salade_pates', icon: '🥗🍝', title: 'Salade de pâtes estivale', category: 'Léger & Salade', ingredients: [{ name: 'Pâtes courtes', qty: 300, unit: 'g' }, { name: 'Tomates cerises', qty: 250, unit: 'g' }, { name: 'Mozzarella (billes)', qty: 150, unit: 'g' }, { name: 'Jambon de parme', qty: 4, unit: 'tranches' }, { name: 'Pesto', qty: 3, unit: 'c. à soupe' }], steps: 'Cuire les pâtes et refroidir. Mélanger avec tomates, mozzarella, jambon déchiré et sauce pesto.' },

  // --- VÉGÉTARIEN ---
  { id: 'r_dhal', icon: '🍛🥥', title: 'Dhal de lentilles au lait de coco', category: 'Végétarien', ingredients: [{ name: 'Lentilles corail', qty: 300, unit: 'g' }, { name: 'Tomates concassées', qty: 400, unit: 'g' }, { name: 'Lait de coco', qty: 25, unit: 'cl' }, { name: 'Épices (curcuma, cumin)', qty: 2, unit: 'c. à soupe' }], steps: 'Cuire les lentilles avec les épices et les tomates pendant 20 min. Ajouter le lait de coco. Servir avec du riz.' },
  { id: 'r_wok_tofu', icon: '🥢🥦', title: 'Wok végétarien au tofu croquant', category: 'Végétarien', ingredients: [{ name: 'Tofu ferme', qty: 400, unit: 'g' }, { name: 'Brocoli', qty: 1, unit: 'p' }, { name: 'Nouilles de riz', qty: 250, unit: 'g' }, { name: 'Sauce soja sucrée', qty: 4, unit: 'c. à soupe' }], steps: 'Couper le tofu en cubes et le faire griller à la poêle. Ajouter les fleurettes de brocoli blanchies et les nouilles cuites. Mélanger avec la sauce.' },
  { id: 'r_curry_pois', icon: '🥘🍚', title: 'Curry de pois chiches', category: 'Végétarien', ingredients: [{ name: 'Pois chiches (boîte)', qty: 400, unit: 'g' }, { name: 'Épinards frais', qty: 200, unit: 'g' }, { name: 'Lait de coco', qty: 20, unit: 'cl' }, { name: 'Pâte de curry', qty: 1, unit: 'c. à soupe' }, { name: 'Riz basmati', qty: 250, unit: 'g' }], steps: 'Faire revenir la pâte de curry. Ajouter les pois chiches, le lait de coco et les épinards. Laisser fondre 10 min. Servir sur le riz.' },
  { id: 'r_soupe_grill', icon: '🥣🥖', title: 'Velouté potimarron et tartines', category: 'Végétarien', ingredients: [{ name: 'Potimarron', qty: 1, unit: 'p' }, { name: 'Pain de campagne', qty: 4, unit: 'tranches' }, { name: 'Fromage de chèvre', qty: 100, unit: 'g' }, { name: 'Crème', qty: 10, unit: 'cl' }], steps: 'Cuire le potimarron 25 min dans l’eau, mixer avec la crème. Garnir le pain de chèvre, gratiner 5 min. Servir ensemble.' },

  // --- WEEK-END & FAMILLE ---
  { id: 'r_burgers', icon: '🍔🍟', title: 'Burgers maison et potatoes', category: 'Week-end', ingredients: [{ name: 'Pains à burger', qty: 4, unit: 'p' }, { name: 'Steaks hachés', qty: 4, unit: 'p' }, { name: 'Cheddar', qty: 4, unit: 'tranches' }, { name: 'Pommes de terre', qty: 800, unit: 'g' }], steps: 'Couper les pommes de terre, rôtir au four avec huile et épices. Cuire les steaks, toaster les pains, monter les burgers avec salade, tomate et sauce.' },
  { id: 'r_pizza', icon: '🍕🍅', title: 'Pizza maison Jambon Fromage', category: 'Week-end', ingredients: [{ name: 'Pâte à pizza', qty: 1, unit: 'p' }, { name: 'Coulis de tomate', qty: 15, unit: 'cl' }, { name: 'Jambon', qty: 4, unit: 'tranches' }, { name: 'Mozzarella râpée', qty: 200, unit: 'g' }], steps: 'Étaler la pâte. Napper de tomate. Disposer le jambon et couvrir de fromage. Enfourner 15 min à 220°C.' },
  { id: 'r_tacos', icon: '🌮🧀', title: 'Soirée Tacos Mexicains', category: 'Week-end', ingredients: [{ name: 'Coquilles à Tacos', qty: 12, unit: 'p' }, { name: 'Bœuf haché', qty: 500, unit: 'g' }, { name: 'Épices tacos', qty: 1, unit: 'sachet' }, { name: 'Salade & Tomate', qty: 1, unit: 'p' }, { name: 'Cheddar râpé', qty: 100, unit: 'g' }], steps: 'Cuire la viande avec les épices. Disposer sur la table la viande, les coquilles chaudes, la salade, les tomates en dés et le fromage pour que chacun crée son taco.' },
  { id: 'r_blanquette', icon: '🍲🍚', title: 'Blanquette de veau', category: 'Week-end', ingredients: [{ name: 'Veau (épaule)', qty: 800, unit: 'g' }, { name: 'Carottes', qty: 4, unit: 'p' }, { name: 'Champignons', qty: 250, unit: 'g' }, { name: 'Crème épaisse', qty: 20, unit: 'cl' }, { name: 'Riz', qty: 300, unit: 'g' }], steps: 'Faire bouillir la viande 1h30 dans un bouillon avec les carottes. Préparer une sauce avec le bouillon, de la farine et la crème. Ajouter les champignons cuits et servir avec du riz.' }
];

window.RECIPES_CATALOG = DEFAULT_RECIPES;

let customRecipes = JSON.parse(localStorage.getItem('custom_recipes')) || [];

function getAllRecipes() {
  const customIds = new Set(customRecipes.map(r => r.id));
  const filteredDefaults = DEFAULT_RECIPES.filter(r => !customIds.has(r.id));
  return [...customRecipes, ...filteredDefaults];
}

// Semaine débutant le Vendredi Soir et se terminant le Vendredi Midi suivant
const MEAL_DAYS = [
  { id: 'fri_start', name: 'Vendredi', slots: [{ id: 'fri_eve', label: 'Soir' }] },
  { id: 'sat', name: 'Samedi', slots: [{ id: 'sat_mid', label: 'Midi' }, { id: 'sat_eve', label: 'Soir' }] },
  { id: 'sun', name: 'Dimanche', slots: [{ id: 'sun_mid', label: 'Midi' }, { id: 'sun_eve', label: 'Soir' }] },
  { id: 'mon', name: 'Lundi', slots: [{ id: 'mon_mid', label: 'Midi' }, { id: 'mon_eve', label: 'Soir' }] },
  { id: 'tue', name: 'Mardi', slots: [{ id: 'tue_mid', label: 'Midi' }, { id: 'tue_eve', label: 'Soir' }] },
  { id: 'wed', name: 'Mercredi', slots: [{ id: 'wed_mid', label: 'Midi' }, { id: 'wed_eve', label: 'Soir' }] },
  { id: 'thu', name: 'Jeudi', slots: [{ id: 'thu_mid', label: 'Midi' }, { id: 'thu_eve', label: 'Soir' }] },
  { id: 'fri_end', name: 'Vendredi suivant', slots: [{ id: 'fri_mid', label: 'Midi' }] }
];

let weeklyPlan = JSON.parse(localStorage.getItem('weekly_meals_plan')) || {};
let defaultPortions = parseInt(localStorage.getItem('default_meal_portions'), 10) || 4;
let activePickingSlotId = null;

function saveMealsPlan() {
  localStorage.setItem('weekly_meals_plan', JSON.stringify(weeklyPlan));
}

window.updateDefaultPortions = function(val) {
  defaultPortions = Math.max(1, parseInt(val, 10) || 4);
  localStorage.setItem('default_meal_portions', defaultPortions);
};

// --- AFFICHAGE DU PLANNING ---
window.renderMeals = function() {
  const container = document.getElementById('mealsGrid');
  if (!container) return;
  container.innerHTML = '';

  const defaultInput = document.getElementById('defaultPortionsInput');
  if (defaultInput) defaultInput.value = defaultPortions;

  const allRecipes = getAllRecipes();

  MEAL_DAYS.forEach(day => {
    const dayCard = document.createElement('div');
    dayCard.className = 'meal-day-card';
    
    let slotsHtml = day.slots.map(slot => {
      const meal = weeklyPlan[slot.id];
      const portions = meal ? (meal.portions || defaultPortions) : defaultPortions;
      const recipe = meal && meal.recipeId ? allRecipes.find(r => r.id === meal.recipeId) : null;
      const customTitle = meal ? (meal.customTitle || (recipe ? recipe.title : '')) : '';
      const displayIcon = recipe ? (recipe.icon || '🍽️') : '🍽️';

      return `
        <div class="meal-slot-box">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span class="meal-slot-label">${slot.label}</span>
            <div style="display:flex; align-items:center; gap:4px;">
              <button type="button" class="btn-primary" style="padding:2px 8px; font-size:0.75rem; border-radius:4px; height:auto; min-height:0; line-height:1.2;" 
                onclick="swapMealSlot('${slot.id}', event)" title="Demander une idée à l'IA en ligne">🔄 IA</button>
              <span style="font-size:0.75rem; color:var(--text-muted); margin-left:4px;">👥</span>
              <input type="number" min="1" max="20" value="${portions}" class="meal-portions-input" 
                onchange="updateMealPortions('${slot.id}', this.value)" title="Nombre de personnes">
            </div>
          </div>
          <div class="meal-slot-content ${customTitle ? 'filled' : 'empty'}" onclick="openMealPicker('${slot.id}', '${day.name} ${slot.label}')">
            ${customTitle ? `
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:1.6rem; line-height:1;">${displayIcon}</span>
                <div style="font-weight:700; font-size:0.9rem; line-height:1.2;">${customTitle}</div>
              </div>
              ${recipe ? `<span class="badge badge-cat" style="margin-top:8px; display:inline-block;">${recipe.category}</span>` : ''}
            ` : `
              <span style="color:var(--text-muted); font-size:0.85rem; text-align:center;">+ Choisir un repas</span>
            `}
          </div>
        </div>
      `;
    }).join('');

    dayCard.innerHTML = `
      <div class="meal-day-header">${day.name}</div>
      <div style="display:flex; flex-direction:column; gap:10px;">${slotsHtml}</div>
    `;
    container.appendChild(dayCard);
  });
};

window.updateMealPortions = function(slotId, val) {
  const portions = Math.max(1, parseInt(val, 10) || defaultPortions);
  if (!weeklyPlan[slotId]) {
    weeklyPlan[slotId] = { recipeId: null, customTitle: '', portions };
  } else {
    weeklyPlan[slotId].portions = portions;
  }
  saveMealsPlan();
};

// --- SUGGESTION D'UN REPAS VIA IA ---
window.swapMealSlot = async function(slotId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const btn = event ? event.currentTarget : null;
  const originalText = btn ? btn.textContent : '';
  if (btn) {
    btn.textContent = '⏳...';
    btn.disabled = true;
  }

  try {
    let slotLabel = slotId;
    MEAL_DAYS.forEach(d => {
      const s = d.slots.find(x => x.id === slotId);
      if (s) slotLabel = `${d.name} ${s.label}`;
    });

    const existingMeals = Object.values(weeklyPlan).map(m => m.customTitle).filter(Boolean);

    const res = await fetch('/api/ai/suggest-meal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotLabel, existingMeals })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Erreur serveur (${res.status})`);
    }

    const recipe = await res.json();

    // Enregistrement local de la recette reçue
    customRecipes.push(recipe);
    localStorage.setItem('custom_recipes', JSON.stringify(customRecipes));

    // Assignation au créneau
    const currentMeal = weeklyPlan[slotId];
    weeklyPlan[slotId] = {
      recipeId: recipe.id,
      customTitle: recipe.title,
      portions: currentMeal ? currentMeal.portions : defaultPortions
    };

    saveMealsPlan();
    renderMeals();
  } catch (err) {
    alert("Impossible de générer le repas par l'IA : " + err.message);
  } finally {
    if (btn) {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }
};

// --- GESTION DU CHOIX DE RECETTE ---
window.openMealPicker = function(slotId, slotTitle) {
  activePickingSlotId = slotId;
  const titleEl = document.getElementById('mealPickerTitle');
  if (titleEl) titleEl.textContent = `Repas du ${slotTitle}`;
  
  const searchInput = document.getElementById('recipeSearchInput');
  if (searchInput) searchInput.value = '';
  
  renderRecipesList();
  document.getElementById('mealPickerModal').style.display = 'flex';
};

window.closeMealPickerModal = function() {
  document.getElementById('mealPickerModal').style.display = 'none';
  activePickingSlotId = null;
};

window.renderRecipesList = function() {
  const container = document.getElementById('recipePickerList');
  if (!container) return;
  const search = (document.getElementById('recipeSearchInput')?.value || '').toLowerCase().trim();
  const cat = document.getElementById('recipeCategoryFilter')?.value || 'all';

  const allRecipes = getAllRecipes();
  const filtered = allRecipes.filter(r => {
    const matchCat = (cat === 'all' || r.category === cat);
    const matchSearch = r.title.toLowerCase().includes(search) || 
                        r.ingredients.some(i => i.name.toLowerCase().includes(search));
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted); padding:10px; text-align:center;">Aucune recette trouvée.</p>';
    return;
  }

  container.innerHTML = filtered.map(r => `
    <div class="recipe-pick-item" style="display:flex; justify-content:space-between; align-items:center;">
      <div onclick="selectRecipeForSlot('${r.id}')" style="display:flex; align-items:center; gap:12px; flex:1; cursor:pointer;">
        <span style="font-size:1.6rem;">${r.icon || '🍽️'}</span>
        <div>
          <div style="font-weight:700; font-size:0.95rem;">${r.title} ${r.isCustom ? '<span style="font-size:0.7rem; color:var(--primary); font-weight:normal;">(Personnalisée)</span>' : ''}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${r.category} • ${r.ingredients.length} ingrédient(s)</div>
        </div>
      </div>
      <div style="display:flex; gap:6px; align-items:center;">
        <button type="button" class="btn-nav" style="padding:4px 8px;" onclick="openRecipeEditModal('${r.id}')" title="Modifier la recette">✏️</button>
        <button type="button" class="btn-primary btn-small" onclick="selectRecipeForSlot('${r.id}')">Choisir</button>
      </div>
    </div>
  `).join('');
};

window.selectRecipeForSlot = function(recipeId) {
  if (!activePickingSlotId) return;
  const currentPortions = weeklyPlan[activePickingSlotId]?.portions || defaultPortions;
  weeklyPlan[activePickingSlotId] = {
    recipeId,
    customTitle: '',
    portions: currentPortions
  };
  saveMealsPlan();
  closeMealPickerModal();
  renderMeals();
};

window.clearCurrentMealSlot = function() {
  if (activePickingSlotId && weeklyPlan[activePickingSlotId]) {
    delete weeklyPlan[activePickingSlotId];
    saveMealsPlan();
  }
  closeMealPickerModal();
  renderMeals();
};

// --- CRÉATION & MODIFICATION DE RECETTE (FORMULAIRE) ---
window.addIngredientRow = function(name = '', qty = '', unit = 'g') {
  const container = document.getElementById('recipeIngredientsContainer');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'ing-row';
  row.style.cssText = 'display:flex; gap:6px; align-items:center;';
  row.innerHTML = `
    <input type="text" class="ing-name" placeholder="Ingrédient (ex: Carottes)" value="${name}" required style="flex:2; font-size:0.85rem; padding:4px 8px;">
    <input type="number" step="0.1" class="ing-qty" placeholder="Qté" value="${qty}" required style="width:65px; font-size:0.85rem; padding:4px 8px;">
    <input type="text" class="ing-unit" placeholder="Unité (g, cl, p...)" value="${unit}" style="width:75px; font-size:0.85rem; padding:4px 8px;">
    <button type="button" class="btn-danger btn-small" onclick="this.parentElement.remove()" style="padding:4px 8px;">✕</button>
  `;
  container.appendChild(row);
};

window.openRecipeEditModal = function(recipeId = null) {
  const form = document.getElementById('recipeEditForm');
  if (form) form.reset();

  const titleEl = document.getElementById('recipeEditModalTitle');
  const idInput = document.getElementById('editRecipeId');
  const btnDelete = document.getElementById('btnDeleteRecipe');
  const container = document.getElementById('recipeIngredientsContainer');
  if (container) container.innerHTML = '';

  if (recipeId) {
    const recipe = getAllRecipes().find(r => r.id === recipeId);
    if (!recipe) return;

    if (titleEl) titleEl.textContent = "Modifier la recette";
    if (idInput) idInput.value = recipe.id;
    document.getElementById('recipeFormIcon').value = recipe.icon || '🍽️';
    document.getElementById('recipeFormTitle').value = recipe.title || '';
    document.getElementById('recipeFormCategory').value = recipe.category || 'Quotidien';
    document.getElementById('recipeFormSteps').value = recipe.steps || '';

    if (recipe.ingredients && recipe.ingredients.length > 0) {
      recipe.ingredients.forEach(i => addIngredientRow(i.name, i.qty, i.unit));
    } else {
      addIngredientRow();
    }

    if (btnDelete) btnDelete.style.display = 'inline-block';
  } else {
    if (titleEl) titleEl.textContent = "Nouvelle recette";
    if (idInput) idInput.value = '';
    document.getElementById('recipeFormIcon').value = '🍽️';
    document.getElementById('recipeFormSteps').value = '';
    addIngredientRow('', '', 'g');
    addIngredientRow('', '', 'p');
    if (btnDelete) btnDelete.style.display = 'none';
  }

  document.getElementById('recipeEditModal').style.display = 'flex';
};

window.closeRecipeEditModal = function() {
  document.getElementById('recipeEditModal').style.display = 'none';
};

window.saveRecipe = function(event) {
  event.preventDefault();
  const editId = document.getElementById('editRecipeId').value;
  const icon = document.getElementById('recipeFormIcon').value.trim() || '🍽️';
  const title = document.getElementById('recipeFormTitle').value.trim();
  const category = document.getElementById('recipeFormCategory').value;
  const steps = document.getElementById('recipeFormSteps').value.trim();

  const ingRows = document.querySelectorAll('#recipeIngredientsContainer .ing-row');
  const ingredients = [];
  ingRows.forEach(row => {
    const name = row.querySelector('.ing-name').value.trim();
    const qty = parseFloat(row.querySelector('.ing-qty').value) || 0;
    const unit = row.querySelector('.ing-unit').value.trim() || 'p';
    if (name) ingredients.push({ name, qty, unit });
  });

  if (!title) return;

  if (editId) {
    const existingIndex = customRecipes.findIndex(r => r.id === editId);
    const updatedRecipe = {
      id: editId,
      icon,
      title,
      category,
      ingredients,
      steps,
      isCustom: true
    };

    if (existingIndex !== -1) {
      customRecipes[existingIndex] = updatedRecipe;
    } else {
      customRecipes.push(updatedRecipe);
    }
  } else {
    const newRecipe = {
      id: 'cr_' + Date.now(),
      icon,
      title,
      category,
      ingredients,
      steps,
      isCustom: true
    };
    customRecipes.push(newRecipe);
  }

  localStorage.setItem('custom_recipes', JSON.stringify(customRecipes));
  closeRecipeEditModal();
  renderMeals();
  if (document.getElementById('mealPickerModal').style.display === 'flex') {
    renderRecipesList();
  }
};

window.deleteCurrentRecipe = function() {
  const editId = document.getElementById('editRecipeId').value;
  if (!editId) return;

  if (confirm("Supprimer cette recette personnalisée ?")) {
    customRecipes = customRecipes.filter(r => r.id !== editId);
    localStorage.setItem('custom_recipes', JSON.stringify(customRecipes));

    Object.keys(weeklyPlan).forEach(slot => {
      if (weeklyPlan[slot] && weeklyPlan[slot].recipeId === editId) {
        delete weeklyPlan[slot];
      }
    });
    saveMealsPlan();

    closeRecipeEditModal();
    renderMeals();
    if (document.getElementById('mealPickerModal').style.display === 'flex') {
      renderRecipesList();
    }
  }
};

// --- GESTION DE LA SEMAINE PAR IA ---
window.autoSuggestWeek = async function() {
  if (!confirm("Générer un planning complet pour la semaine grâce à l'IA sur Internet ?")) return;

  const btn = document.querySelector('button[onclick="autoSuggestWeek()"]');
  const originalText = btn ? btn.textContent : '';
  if (btn) {
    btn.textContent = '⏳ Génération en cours...';
    btn.disabled = true;
  }

  try {
    const slots = [];
    MEAL_DAYS.forEach(day => {
      day.slots.forEach(slot => {
        slots.push({ id: slot.id, label: `${day.name} ${slot.label}` });
      });
    });

    const res = await fetch('/api/ai/suggest-week', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slots })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Erreur serveur (${res.status})`);
    }

    const generatedMeals = await res.json();

    generatedMeals.forEach(meal => {
      customRecipes.push(meal);

      const prevPortions = weeklyPlan[meal.slotId]?.portions || defaultPortions;
      weeklyPlan[meal.slotId] = {
        recipeId: meal.id,
        customTitle: meal.title,
        portions: prevPortions
      };
    });

    localStorage.setItem('custom_recipes', JSON.stringify(customRecipes));
    saveMealsPlan();
    renderMeals();
    alert("Votre menu de la semaine a été généré avec succès par l'IA ! 🎉");
  } catch (err) {
    alert("Erreur lors de la génération IA : " + err.message);
  } finally {
    if (btn) {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }
};

window.clearWholeWeek = function() {
  if (!confirm("Voulez-vous vraiment vider tout le planning de la semaine ?")) return;
  weeklyPlan = {};
  saveMealsPlan();
  renderMeals();
};

// --- LISTE DE COURSES PAR RAYON ---
function getIngredientCategory(name) {
  const n = name.toLowerCase();
  if (n.includes('pomme') || n.includes('oignon') || n.includes('tomate') || n.includes('salade') || n.includes('ail') || n.includes('carotte') || n.includes('poivron') || n.includes('champignon') || n.includes('courgette') || n.includes('avocat') || n.includes('concombre') || n.includes('brocoli') || n.includes('épinard') || n.includes('potimarron') || n.includes('citron')) {
    return '🥬 Fruits & Légumes';
  }
  if (n.includes('bœuf') || n.includes('poulet') || n.includes('lardon') || n.includes('saucisse') || n.includes('merguez') || n.includes('veau') || n.includes('porc') || n.includes('jambon') || n.includes('steak')) {
    return '🥩 Viandes & Charcuterie';
  }
  if (n.includes('saumon') || n.includes('poisson') || n.includes('crevette')) {
    return '🐟 Poissons';
  }
  if (n.includes('lait') || n.includes('beurre') || n.includes('gruyère') || n.includes('reblochon') || n.includes('crème') || n.includes('parmesan') || n.includes('œuf') || n.includes('mozzarella') || n.includes('cheddar') || n.includes('chèvre') || n.includes('fromage')) {
    return '🧀 Produits Laitiers & Frais';
  }
  if (n.includes('riz') || n.includes('pâte') || n.includes('spaghetti') || n.includes('nouille') || n.includes('semoule') || n.includes('lentille') || n.includes('pois chiche')) {
    return '🍝 Pâtes, Riz & Céréales';
  }
  if (n.includes('pain') || n.includes('burger') || n.includes('wrap') || n.includes('tortilla') || n.includes('croûton') || n.includes('tacos')) {
    return '🍞 Boulangerie';
  }
  if (n.includes('surgelé')) { return '❄️ Surgelés'; }
  return '🥫 Épicerie & Autres';
}

function computeWeeklyGrocery() {
  const aggregated = {};
  const allRecipes = getAllRecipes();

  Object.keys(weeklyPlan).forEach(slotId => {
    const meal = weeklyPlan[slotId];
    if (!meal || !meal.recipeId) return;
    const recipe = allRecipes.find(r => r.id === meal.recipeId);
    if (!recipe) return;
    const factor = (meal.portions || defaultPortions) / 4; 
    recipe.ingredients.forEach(ing => {
      const key = `${ing.name.toLowerCase().trim()}_${ing.unit}`;
      if (!aggregated[key]) {
        aggregated[key] = { name: ing.name, qty: 0, unit: ing.unit, category: getIngredientCategory(ing.name) };
      }
      aggregated[key].qty += (ing.qty * factor);
    });
  });
  return Object.values(aggregated);
}

window.openGroceryModal = function() {
  const items = computeWeeklyGrocery();
  const container = document.getElementById('groceryListContainer');
  const countEl = document.getElementById('groceryItemsCount');
  if (countEl) countEl.textContent = `${items.length} ingrédient(s) nécessaire(s)`;

  if (items.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:20px;">Aucun repas planifié avec recette enregistrée.</p>';
    document.getElementById('groceryModal').style.display = 'flex';
    return;
  }

  const groupedItems = {};
  items.forEach(item => {
    if (!groupedItems[item.category]) groupedItems[item.category] = [];
    groupedItems[item.category].push(item);
  });

  Object.keys(groupedItems).forEach(cat => groupedItems[cat].sort((a, b) => a.name.localeCompare(b.name)));

  const categoryOrder = ['🥬 Fruits & Légumes', '🥩 Viandes & Charcuterie', '🐟 Poissons', '🧀 Produits Laitiers & Frais', '🍞 Boulangerie', '🍝 Pâtes, Riz & Céréales', '🥫 Épicerie & Autres', '❄️ Surgelés'];
  
  let htmlContent = '';
  let globalIndex = 0;

  categoryOrder.forEach(catName => {
    if (groupedItems[catName] && groupedItems[catName].length > 0) {
      htmlContent += `<div style="font-weight: 800; font-size: 1.05rem; color: var(--primary); margin-top: 14px; margin-bottom: 6px; border-bottom: 2px solid var(--border); padding-bottom: 4px;">${catName}</div>`;
      groupedItems[catName].forEach(item => {
        const roundedQty = Math.round(item.qty * 10) / 10;
        let qtyDisplay = roundedQty > 0 ? `${roundedQty} ${item.unit}` : 'Quantité libre';
        if (item.unit === 'p' || item.unit === 'pièce(s)') qtyDisplay = `${roundedQty}`;
        if (item.unit === 'portion' || item.unit === 'sachet') qtyDisplay = `${roundedQty} ${item.unit}`;

        htmlContent += `
          <label class="checkbox-label" style="background:var(--bg); border:1px solid var(--border); padding:8px 12px; border-radius:6px; font-size:0.9rem; margin-bottom:4px;">
            <input type="checkbox" id="g_check_${globalIndex++}">
            <span style="flex:1;"><b>${item.name}</b></span>
            <span style="font-weight:700; color:var(--text);">${qtyDisplay}</span>
          </label>
        `;
      });
    }
  });

  container.innerHTML = htmlContent;
  document.getElementById('groceryModal').style.display = 'flex';
};

window.closeGroceryModal = function() {
  document.getElementById('groceryModal').style.display = 'none';
};

window.copyGroceryToClipboard = function() {
  const items = computeWeeklyGrocery();
  if (items.length === 0) return;
  const groupedItems = {};
  items.forEach(item => {
    if (!groupedItems[item.category]) groupedItems[item.category] = [];
    groupedItems[item.category].push(item);
  });
  const categoryOrder = ['🥬 Fruits & Légumes', '🥩 Viandes & Charcuterie', '🐟 Poissons', '🧀 Produits Laitiers & Frais', '🍞 Boulangerie', '🍝 Pâtes, Riz & Céréales', '🥫 Épicerie & Autres', '❄️ Surgelés'];
  let textToCopy = "🛒 LISTE DE COURSES DE LA SEMAINE :\n\n";

  categoryOrder.forEach(catName => {
    if (groupedItems[catName] && groupedItems[catName].length > 0) {
      textToCopy += `=== ${catName.toUpperCase()} ===\n`;
      groupedItems[catName].forEach(item => {
        const roundedQty = Math.round(item.qty * 10) / 10;
        let unitText = item.unit === 'p' ? 'pièce(s)' : item.unit;
        textToCopy += `- ${item.name} : ${roundedQty} ${unitText}\n`;
      });
      textToCopy += `\n`;
    }
  });
  navigator.clipboard.writeText(textToCopy.trim()).then(() => alert("Liste de courses copiée dans le presse-papier !"));
};

// --- IMPRESSIONS PDF ---
window.printFridgeMenu = function() {
  let hasMeals = false;
  let rowsHtml = '';
  const allRecipes = getAllRecipes();

  MEAL_DAYS.forEach(day => {
    day.slots.forEach(slot => {
      const meal = weeklyPlan[slot.id];
      if (!meal) return;
      const recipe = meal.recipeId ? allRecipes.find(r => r.id === meal.recipeId) : null;
      const title = meal.customTitle || (recipe ? recipe.title : '');
      const icon = recipe ? (recipe.icon || '🍽️') : '🍽️';

      if (title.trim() !== '') {
        hasMeals = true;
        const portions = meal.portions || defaultPortions;
        rowsHtml += `
          <tr>
            <td style="font-weight:700; width:140px; padding:15px; border-bottom:1px solid #ddd; vertical-align:middle; text-align:center;">
              <div style="font-size:1.1rem; color:#111;">${day.name}</div>
              <div style="font-size:0.85rem; color:#666; font-weight:normal; margin-top:4px;">${slot.label}</div>
            </td>
            <td style="padding:15px; border-bottom:1px solid #ddd; vertical-align:middle;">
              <div style="display:flex; align-items:center; gap:20px;">
                <div style="font-size:3.5rem; line-height:1;">${icon}</div>
                <div style="font-size:1.3rem; font-weight:600; color:#222; line-height:1.3;">${title}</div>
              </div>
            </td>
            <td style="width:100px; text-align:center; padding:15px; border-bottom:1px solid #ddd; vertical-align:middle; font-size:1.1rem;">
              👥 <b>${portions}</b>
            </td>
          </tr>
        `;
      }
    });
  });

  if (!hasMeals) {
    alert("Aucun repas planifié pour le moment.");
    return;
  }

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Menu de la Semaine - Frigo</title>
      <style>
        body { font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 25px; color: #111; margin: 0; }
        h1 { text-align: center; font-size: 2rem; margin-bottom: 25px; color: #2563eb; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; background: white; }
        th { background: #eff6ff; text-align: center; padding: 12px; border-bottom: 3px solid #bfdbfe; font-size: 1rem; color: #1e3a8a; text-transform: uppercase; }
        @media print {
          @page { margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <h1>📋 Menu de la Semaine</h1>
      <table>
        <thead>
          <tr>
            <th>Jour</th>
            <th style="text-align:left;">Plat prévu</th>
            <th style="text-align:center;">Miam !</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
};

window.printRecipeBook = function() {
  const chosenRecipes = [];
  const allRecipes = getAllRecipes();

  MEAL_DAYS.forEach(day => {
    day.slots.forEach(slot => {
      const meal = weeklyPlan[slot.id];
      if (!meal || !meal.recipeId) return;
      const recipe = allRecipes.find(r => r.id === meal.recipeId);
      if (recipe) {
        chosenRecipes.push({ dayLabel: `${day.name} (${slot.label})`, recipe, portions: meal.portions || defaultPortions });
      }
    });
  });

  if (chosenRecipes.length === 0) {
    alert("Aucune recette complète enregistrée dans le planning.");
    return;
  }

  let recipesHtml = chosenRecipes.map((item, i) => {
    const factor = item.portions / 4;
    const ingList = item.recipe.ingredients.map(ing => {
      const qty = Math.round(ing.qty * factor * 10) / 10;
      return `<li><b>${ing.name}</b> : ${qty} ${ing.unit === 'p' ? '' : ing.unit}</li>`;
    }).join('');

    return `
      <div style="page-break-inside: avoid; margin-bottom: 30px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; background: #fafafa;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #e5e7eb; padding-bottom:12px; margin-bottom:15px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-size:2.5rem;">${item.recipe.icon || '🍽️'}</span>
            <h2 style="font-size:1.4rem; margin:0; color:#111;">Recette ${i + 1} : ${item.recipe.title}</h2>
          </div>
          <span style="background:#e0f2fe; color:#0369a1; padding:6px 12px; border-radius:8px; font-size:0.9rem; font-weight:bold;">
            ${item.dayLabel} • Pour ${item.portions} personnes
          </span>
        </div>
        <div style="display:flex; gap:20px;">
          <div style="flex:1; background:white; padding:15px; border-radius:8px; border:1px solid #e5e7eb;">
            <h3 style="font-size:1.05rem; margin:0 0 10px 0; color:#4b5563;">🛒 Ingrédients :</h3>
            <ul style="margin:0; padding-left:20px; font-size:0.95rem; line-height:1.6;">${ingList}</ul>
          </div>
          <div style="flex:2; background:white; padding:15px; border-radius:8px; border:1px solid #e5e7eb;">
            <h3 style="font-size:1.05rem; margin:0 0 10px 0; color:#4b5563;">👩‍🍳 Préparation :</h3>
            <p style="margin:0; font-size:0.95rem; line-height:1.6; color:#1f2937;">${item.recipe.steps || 'Aucune étape renseignée.'}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Cahier de Recettes de la Semaine</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 25px; color: #111; }
        h1 { text-align: center; font-size: 2rem; margin-bottom: 5px; color: #2563eb; }
        p.subtitle { text-align: center; color: #666; font-size: 1.1rem; margin-top: 0; margin-bottom: 30px; }
        @media print {
          @page { margin: 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <h1>📖 Cahier de Recettes de la Semaine</h1>
      <p class="subtitle">Quantités ajustées au nombre exact de convives pour chaque repas</p>
      ${recipesHtml}
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
};

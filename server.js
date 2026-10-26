const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.json({ limit: '10mb' }));

// Middleware anti-cache : force les données fraîches à chaque rechargement
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Détection automatique du dossier statique
let publicDir = path.join(__dirname, 'public');
if (fs.existsSync(path.join(__dirname, 'Public'))) {
  publicDir = path.join(__dirname, 'Public');
} else if (!fs.existsSync(publicDir) && fs.existsSync(path.join(__dirname, 'index.html'))) {
  publicDir = __dirname;
}

app.use(express.static(publicDir));

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const AI_KEY = process.env.AI_API_KEY;

// Diagnostic au lancement
console.log("--- CONFIGURATION DU SERVEUR ---");
console.log("Dossier statique :", publicDir);
console.log("UPSTASH_REDIS :", (REDIS_URL && REDIS_TOKEN) ? "CONNECTÉ" : "MANQUANT");
console.log("AI_API_KEY :", AI_KEY ? "DÉTECTÉE" : "MANQUANTE");
console.log("---------------------------------");

async function upstash(commandArray) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error("Variables Upstash manquantes sur Render.");
  }
  
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commandArray)
  });

  const data = await res.json();
  if (data.error) throw new Error(`Erreur Upstash : ${data.error}`);
  return data;
}

// Appel vers Groq ou OpenAI
async function callAI(messages) {
  if (!AI_KEY) {
    throw new Error("Clé AI_API_KEY non renseignée sur Render.");
  }

  let apiUrl = 'https://api.openai.com/v1/chat/completions';
  let model = 'gpt-4o-mini';

  if (AI_KEY.startsWith('gsk_')) {
    apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    model = 'openai/gpt-oss-20b';
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AI_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur de l'API IA (${response.status}) : ${errorText}`);
  }

  const json = await response.json();
  return JSON.parse(json.choices[0].message.content);
}

// Route d'accueil
app.get('/', (req, res) => {
  const file = path.join(publicDir, 'index.html');
  if (fs.existsSync(file)) res.sendFile(file);
  else res.status(404).send("Fichier index.html introuvable.");
});

// Routes de synchronisation Upstash
app.get('/api/sync', async (req, res) => {
  try {
    const data = await upstash(["GET", "hub_data"]);
    res.json(data.result ? JSON.parse(data.result) : {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/store/:key', async (req, res) => {
  try {
    const data = await upstash(["GET", "hub_data"]);
    const state = data.result ? JSON.parse(data.result) : {};
    state[req.params.key] = req.body.value;
    await upstash(["SET", "hub_data", JSON.stringify(state)]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/store/:key', async (req, res) => {
  try {
    const data = await upstash(["GET", "hub_data"]);
    const state = data.result ? JSON.parse(data.result) : {};
    delete state[req.params.key];
    await upstash(["SET", "hub_data", JSON.stringify(state)]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route IA : Suggérer ou créer un plat spécifique
app.post('/api/ai/suggest-meal', async (req, res) => {
  try {
    const { slotLabel, existingMeals, dishName } = req.body;
    let prompt;

    if (dishName && dishName.trim()) {
      prompt = `Tu es un chef cuisinier familial français. Génère la recette complète, équilibrée et détaillée pour le plat spécifique suivant : "${dishName.trim()}".
Le plat doit convenir pour 4 personnes.

Réponds OBLIGATOIREMENT avec ce JSON valide :
{
  "title": "Nom précis et appétissant du plat",
  "icon": "Emoji représentatif (ex: 🥘, 🥩, 🍝, 🐟)",
  "category": "Catégorie parmi: Quotidien, Réconfort, Monde, Pâtes & Riz, Léger & Salade, Végétarien, Week-end",
  "ingredients": [
    { "name": "Nom ingrédient", "qty": 400, "unit": "g" }
  ],
  "steps": "Instructions de préparation claires et concises pour 4 personnes."
}
Unités autorisées pour les ingrédients : "g", "kg", "cl", "L", "p" (pour pièces), "c. à soupe", "portion".`;
    } else {
      prompt = `Propose une idée de repas familial français pour : ${slotLabel}.
${existingMeals && existingMeals.length > 0 ? `Évite les plats similaires à : ${existingMeals.join(', ')}.` : ''}

Réponds OBLIGATOIREMENT avec ce JSON valide :
{
  "title": "Nom du plat",
  "icon": "Emoji représentatif",
  "category": "Quotidien",
  "ingredients": [
    { "name": "Nom ingrédient", "qty": 400, "unit": "g" }
  ],
  "steps": "Instructions de préparation claires."
}`;
    }

    const recipe = await callAI([
      { role: "system", content: "Tu es un chef cuisinier familial qui répond uniquement en JSON strict." },
      { role: "user", content: prompt }
    ]);

    recipe.id = 'r_ai_' + Date.now();
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route IA : Suggérer la semaine complète (14 créneaux obligatoires)
app.post('/api/ai/suggest-week', async (req, res) => {
  try {
    const { slots } = req.body;
    const prompt = `Tu es un chef cuisinier familial français. Tu DOIS obligatoirement générer un repas pour CHACUN des ${slots.length} créneaux suivants sans exception (du premier au tout dernier créneau) :
${slots.map(s => `- ID: "${s.id}", Créneau: "${s.label}"`).join('\n')}

Pour chaque créneau, indique 3 à 5 ingrédients essentiels et une préparation en 2 phrases pour garantir un format compact et complet.

Réponds UNIQUEMENT avec ce JSON valide :
{
  "meals": [
    {
      "slotId": "ID exact du créneau",
      "title": "Nom du plat",
      "icon": "Emoji",
      "category": "Quotidien",
      "ingredients": [
        { "name": "Nom ingrédient", "qty": 400, "unit": "g" }
      ],
      "steps": "Instructions de préparation concises."
    }
  ]
}`;

    const result = await callAI([
      { role: "system", content: "Tu es un assistant culinaire qui répond uniquement en JSON strict contenant obligatoirement tous les créneaux demandés." },
      { role: "user", content: prompt }
    ]);

    const mealsWithIds = (result.meals || []).map((m, index) => ({
      ...m,
      id: 'r_ai_' + Date.now() + '_' + index
    }));

    res.json(mealsWithIds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));

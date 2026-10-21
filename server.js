const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.json({ limit: '10mb' }));

// Middleware anti-cache
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

async function upstash(commandArray) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error("Variables d'environnement Upstash manquantes sur Render.");
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

// Fonction utilitaire d'appel IA (compatible Groq, OpenAI, Mistral)
async function callAI(messages) {
  if (!AI_KEY) {
    throw new Error("Clé d'API manquante. Configure la variable AI_API_KEY sur Render.");
  }

  let apiUrl = 'https://api.openai.com/v1/chat/completions';
  let model = 'gpt-4o-mini';

  if (AI_KEY.startsWith('gsk_')) {
    apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    model = 'llama-3.3-70b-versatile';
  } else if (AI_KEY.startsWith('mistral_') || process.env.AI_PROVIDER === 'mistral') {
    apiUrl = 'https://api.mistral.ai/v1/chat/completions';
    model = 'mistral-small-latest';
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
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur API IA (${response.status}) : ${errorText}`);
  }

  const json = await response.json();
  const rawContent = json.choices[0].message.content;
  return JSON.parse(rawContent);
}

app.get('/', (req, res) => {
  const file = path.join(publicDir, 'index.html');
  if (fs.existsSync(file)) {
    res.sendFile(file);
  } else {
    res.status(404).send("Erreur : le fichier index.html est introuvable sur le serveur.");
  }
});

app.get('/api/sync', async (req, res) => {
  try {
    const data = await upstash(["GET", "hub_data"]);
    res.json(data.result ? JSON.parse(data.result) : {});
  } catch (err) {
    console.error("Erreur /api/sync :", err.message);
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
    console.error(`Erreur /api/store/${req.params.key} :`, err.message);
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
    console.error(`Erreur delete :`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- ROUTES IA POUR LES MENUS ---

// 1. Suggérer un plat unique
app.post('/api/ai/suggest-meal', async (req, res) => {
  try {
    const { slotLabel, existingMeals } = req.body;
    const prompt = `Tu es un chef de cuisine familiale française. Propose une idée de repas savoureuse, équilibrée et de saison pour : ${slotLabel}.
${existingMeals && existingMeals.length > 0 ? `Évite de proposer un plat similaire à ceux déjà prévus cette semaine : ${existingMeals.join(', ')}.` : ''}

Réponds obligatoirement avec un JSON respectant exactement cette structure :
{
  "title": "Nom du plat",
  "icon": "Emoji représentatif (ex: 🥘, 🍝, 🥗)",
  "category": "Catégorie parmi: Réconfort, Monde, Pâtes & Riz, Quotidien, Léger & Salade, Végétarien, Week-end",
  "ingredients": [
    { "name": "Nom ingrédient", "qty": 400, "unit": "g" }
  ],
  "steps": "Instructions de préparation claires et concises pour 4 personnes."
}
Unités autorisées pour les ingrédients : "g", "kg", "cl", "L", "p" (pour pièces), "c. à soupe", "portion".`;

    const recipe = await callAI([
      { role: "system", content: "Tu es un chef cuisinier familial qui répond uniquement en JSON strict." },
      { role: "user", content: prompt }
    ]);

    recipe.id = 'r_ai_' + Date.now();
    res.json(recipe);
  } catch (err) {
    console.error("Erreur IA repas :", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. Suggérer le planning complet de la semaine
app.post('/api/ai/suggest-week', async (req, res) => {
  try {
    const { slots } = req.body; // Liste des créneaux [{ id, label }]
    const prompt = `Tu es un chef cuisinier familial français. Génère un planning complet et varié de repas familiaux pour les créneaux suivants :
${slots.map(s => `- ID: "${s.id}", Créneau: "${s.label}"`).join('\n')}

Veille à équilibrer les repas : alterne poissons, volailles, viandes, légumes et féculents, avec des repas plus légers en semaine et conviviaux le week-end.

Réponds obligatoirement avec un objet JSON contenant une clé "meals" qui est une liste d'objets :
{
  "meals": [
    {
      "slotId": "ID du créneau correspondant",
      "title": "Nom du plat",
      "icon": "Emoji",
      "category": "Catégorie",
      "ingredients": [
        { "name": "Nom ingrédient", "qty": 500, "unit": "g" }
      ],
      "steps": "Instructions de préparation."
    }
  ]
}`;

    const result = await callAI([
      { role: "system", content: "Tu es un assistant culinaire qui répond uniquement en JSON strict." },
      { role: "user", content: prompt }
    ]);

    const mealsWithIds = (result.meals || []).map((m, index) => ({
      ...m,
      id: 'r_ai_' + Date.now() + '_' + index
    }));

    res.json(mealsWithIds);
  } catch (err) {
    console.error("Erreur IA semaine :", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));

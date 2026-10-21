const express = require('express');
const path = require('path');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Diagnostic au lancement
console.log("--- VÉRIFICATION VARIABLES D'ENVIRONNEMENT ---");
console.log("UPSTASH_REDIS_REST_URL détecté :", REDIS_URL ? "OUI" : "NON (MANQUANT)");
console.log("UPSTASH_REDIS_REST_TOKEN détecté :", REDIS_TOKEN ? "OUI" : "NON (MANQUANT)");
console.log("-----------------------------------------------");

async function upstash(commandArray) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error("Impossible de contacter Upstash : variables d'environnement manquantes sur Render.");
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

app.get('/api/sync', async (req, res) => {
  try {
    console.log("--> Demande de synchronisation (/api/sync)");
    const data = await upstash(["GET", "hub_data"]);
    res.json(data.result ? JSON.parse(data.result) : {});
  } catch (err) {
    console.error("Erreur /api/sync :", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/store/:key', async (req, res) => {
  try {
    console.log(`--> Sauvegarde reçue pour la clé : ${req.params.key}`);
    const data = await upstash(["GET", "hub_data"]);
    const state = data.result ? JSON.parse(data.result) : {};
    state[req.params.key] = req.body.value;
    await upstash(["SET", "hub_data", JSON.stringify(state)]);
    console.log(`Donnée enregistrée avec succès pour ${req.params.key}`);
    res.json({ success: true });
  } catch (err) {
    console.error(`Erreur /api/store/${req.params.key} :`, err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/store/:key', async (req, res) => {
  try {
    console.log(`--> Suppression pour la clé : ${req.params.key}`);
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));

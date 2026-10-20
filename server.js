const express = require('express');
const path = require('path');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Fonction pour parler à la base de données gratuite
async function upstash(commandArray) {
  if (!REDIS_URL || !REDIS_TOKEN) return { result: null };
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commandArray)
  });
  return res.json();
}

app.get('/api/sync', async (req, res) => {
  try {
    const data = await upstash(["GET", "hub_data"]);
    res.json(data.result ? JSON.parse(data.result) : {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/store/:key', async (req, res) => {
  try {
    const data = await upstash(["GET", "hub_data"]);
    const state = data.result ? JSON.parse(data.result) : {};
    state[req.params.key] = req.body.value;
    await upstash(["SET", "hub_data", JSON.stringify(state)]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/store/:key', async (req, res) => {
  try {
    const data = await upstash(["GET", "hub_data"]);
    const state = data.result ? JSON.parse(data.result) : {};
    delete state[req.params.key];
    await upstash(["SET", "hub_data", JSON.stringify(state)]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));
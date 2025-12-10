const express = require('express');
const router = express.Router();

// Lightweight agents endpoint (stub)
// TODO: replace with real DB-backed agents when model/schema exists
router.get('/', async (req, res) => {
  try {
    // return an empty list for now so clients don't 404
    res.json({ agents: [] });
  } catch (err) {
    console.error('agents list error', err);
    res.status(500).json({ error: 'server_error' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  // stub: no agent records yet
  res.status(404).json({ error: 'not_found', id });
});

module.exports = router;

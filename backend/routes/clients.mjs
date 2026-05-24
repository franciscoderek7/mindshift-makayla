import { Router } from 'express';
import { authenticate } from '../middleware/auth.mjs';
import { pool } from '../config/database.mjs';

const router = Router();

// GET /api/clients — List all clients (admin only)
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, status, created_at FROM clients ORDER BY created_at DESC'
    );
    res.json({ clients: result.rows, total: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET /api/clients/:id — Get client profile
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Client not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// POST /api/clients — Create new client
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, email, phone, goals } = req.body;
    const result = await pool.query(
      'INSERT INTO clients (name, email, phone, goals, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, phone, goals, 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// PATCH /api/clients/:id — Update client
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { name, phone, goals, status } = req.body;
    const result = await pool.query(
      'UPDATE clients SET name = COALESCE($1, name), phone = COALESCE($2, phone), goals = COALESCE($3, goals), status = COALESCE($4, status), updated_at = NOW() WHERE id = $5 RETURNING *',
      [name, phone, goals, status, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Client not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update client' });
  }
});

export default router;

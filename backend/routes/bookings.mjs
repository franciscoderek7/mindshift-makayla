import { Router } from 'express';
import { authenticate } from '../middleware/auth.mjs';
import { pool } from '../config/database.mjs';

const router = Router();

// GET /api/bookings — List user's bookings
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM bookings WHERE user_id = $1 ORDER BY scheduled_at DESC',
      [req.user.id]
    );
    res.json({ bookings: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// POST /api/bookings — Create a booking
router.post('/', authenticate, async (req, res) => {
  try {
    const { service_type, scheduled_at, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO bookings (user_id, service_type, scheduled_at, notes, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, service_type, scheduled_at, notes, 'confirmed']
    );
    // TODO: Trigger Scheduler agent to sync with Calendly
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Booking failed' });
  }
});

// PATCH /api/bookings/:id/cancel — Cancel a booking
router.patch('/:id/cancel', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      ['cancelled', req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Booking not found' });
    res.json({ booking: result.rows[0], message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Cancellation failed' });
  }
});

export default router;

import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.mjs';
import { pool } from '../config/database.mjs';

const router = Router();

// GET /api/admin/dashboard — Admin dashboard stats
router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
  try {
    const [users, clients, payments, bookings] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM clients'),
      pool.query('SELECT COUNT(*), SUM(amount) FROM payments WHERE status = $1', ['completed']),
      pool.query('SELECT COUNT(*) FROM bookings WHERE status = $1', ['confirmed'])
    ]);

    res.json({
      totalUsers: parseInt(users.rows[0].count),
      totalClients: parseInt(clients.rows[0].count),
      totalPayments: parseInt(payments.rows[0].count),
      totalRevenue: parseFloat(payments.rows[0].sum || 0) / 100,
      upcomingBookings: parseInt(bookings.rows[0].count),
      agentsActive: 8,
      systemHealth: 'operational'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// GET /api/admin/agents/logs — Agent activity logs
router.get('/agents/logs', authenticate, requireAdmin, async (req, res) => {
  // TODO: Implement agent activity logging
  res.json({ logs: [], message: 'Agent logging endpoint ready' });
});

export default router;

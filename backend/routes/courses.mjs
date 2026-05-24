import { Router } from 'express';
import { authenticate } from '../middleware/auth.mjs';
import { pool } from '../config/database.mjs';

const router = Router();

// GET /api/courses — List all courses
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM courses ORDER BY sort_order ASC');
    res.json({ courses: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// GET /api/courses/:id — Get course details
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM courses WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Course not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// POST /api/courses/:id/enroll — Enroll in a course (requires auth)
router.post('/:id/enroll', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2) RETURNING *',
      [req.user.id, req.params.id]
    );
    res.status(201).json({ enrollment: result.rows[0], message: 'Enrolled successfully' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Already enrolled in this course' });
    }
    res.status(500).json({ error: 'Enrollment failed' });
  }
});

export default router;

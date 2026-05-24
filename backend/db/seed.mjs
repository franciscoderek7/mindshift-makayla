import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function seed() {
  console.log('Seeding MindShift database...');

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('changeme123', 12);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
      ['Makayla Francisco', 'makayla@mindshift.ca', adminPassword, 'admin']
    );

    // Seed courses
    const courses = [
      { title: 'Foundations of Behavior Change', description: 'Core CBT techniques and habit formation science', price: 2900, weeks: 4, order: 1 },
      { title: 'Consciousness & Awareness', description: 'Meditation, mindfulness, and awareness expansion practices', price: 2900, weeks: 6, order: 2 },
      { title: 'Sustainable Living Blueprint', description: 'Practical sustainability for everyday life', price: 2900, weeks: 4, order: 3 },
      { title: 'Emotional Intelligence Mastery', description: 'Understanding and managing emotions for better relationships', price: 2900, weeks: 5, order: 4 },
      { title: 'The Transformation Protocol', description: 'Advanced integration of all MindShift methodologies', price: 2900, weeks: 8, order: 5 }
    ];

    for (const course of courses) {
      await pool.query(
        `INSERT INTO courses (title, description, price_cents, duration_weeks, sort_order) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
        [course.title, course.description, course.price, course.weeks, course.order]
      );
    }

    console.log('Seed complete — admin user and courses created.');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();

import { Router } from 'express';
import Stripe from 'stripe';
import { logger } from '../config/logger.mjs';
import { pool } from '../config/database.mjs';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ===========================================
// Stripe Webhook Handler
// ===========================================
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error(`Stripe webhook signature verification failed: ${err.message}`);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  // Handle event types
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      logger.info(`Payment completed: ${session.id} — ${session.customer_email}`);

      // Record payment in database
      try {
        await pool.query(
          'INSERT INTO payments (stripe_session_id, email, amount, product_id, status) VALUES ($1, $2, $3, $4, $5)',
          [session.id, session.customer_email, session.amount_total, session.metadata?.productId, 'completed']
        );
      } catch (dbErr) {
        logger.error(`Failed to record payment: ${dbErr.message}`);
      }

      // TODO: Trigger BillingBot agent for invoice generation
      // TODO: Trigger ContentForge agent for course access provisioning
      break;
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object;
      logger.warn(`Payment failed: ${intent.id}`);
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      logger.info(`Subscription ${event.type}: ${subscription.id}`);
      // TODO: Update user subscription status
      break;
    }

    default:
      logger.info(`Unhandled Stripe event: ${event.type}`);
  }

  res.json({ received: true });
});

// ===========================================
// Calendly Webhook Handler
// ===========================================
router.post('/calendly', async (req, res) => {
  const { event, payload } = req.body;

  // Verify webhook signature
  const signature = req.headers['calendly-webhook-signature'];
  // TODO: Implement Calendly signature verification

  logger.info(`Calendly webhook: ${event}`);

  switch (event) {
    case 'invitee.created': {
      // New booking created
      const { name, email, scheduled_event } = payload;
      logger.info(`New booking: ${name} (${email}) at ${scheduled_event?.start_time}`);

      try {
        await pool.query(
          'INSERT INTO bookings (user_email, service_type, scheduled_at, calendly_event_id, status) VALUES ($1, $2, $3, $4, $5)',
          [email, 'coaching', scheduled_event?.start_time, scheduled_event?.uri, 'confirmed']
        );
      } catch (dbErr) {
        logger.error(`Failed to record booking: ${dbErr.message}`);
      }

      // TODO: Trigger Scheduler agent for confirmation email
      break;
    }

    case 'invitee.canceled': {
      const { email, scheduled_event } = payload;
      logger.info(`Booking cancelled: ${email}`);

      try {
        await pool.query(
          'UPDATE bookings SET status = $1, updated_at = NOW() WHERE calendly_event_id = $2',
          ['cancelled', scheduled_event?.uri]
        );
      } catch (dbErr) {
        logger.error(`Failed to update cancelled booking: ${dbErr.message}`);
      }
      break;
    }

    default:
      logger.info(`Unhandled Calendly event: ${event}`);
  }

  res.json({ received: true });
});

export default router;

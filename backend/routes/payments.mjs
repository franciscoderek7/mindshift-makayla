import { Router } from 'express';
import Stripe from 'stripe';
import { authenticate } from '../middleware/auth.mjs';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Product price map (Stripe Price IDs — replace with live IDs)
const PRODUCTS = {
  journal: { name: 'Transformation Journal', amount: 2900, priceId: 'price_JOURNAL_PLACEHOLDER' },
  guide: { name: 'Behavior Modification Guide', amount: 4900, priceId: 'price_GUIDE_PLACEHOLDER' },
  supplements: { name: 'Mind-Expanding Supplements', amount: 7900, priceId: 'price_SUPPLEMENTS_PLACEHOLDER' },
  course: { name: 'Full Course Access', amount: 14900, priceId: 'price_COURSE_PLACEHOLDER' },
  kit: { name: 'Complete Transformation Kit', amount: 19900, priceId: 'price_KIT_PLACEHOLDER' }
};

// POST /api/payments/create-checkout — Create Stripe Checkout session
router.post('/create-checkout', async (req, res) => {
  try {
    const { productId, email } = req.body;
    const product = PRODUCTS[productId];

    if (!product) {
      return res.status(400).json({ error: 'Invalid product' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: { name: product.name },
          unit_amount: product.amount
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${process.env.CORS_ORIGIN}/mindshift-makayla/?payment=success`,
      cancel_url: `${process.env.CORS_ORIGIN}/mindshift-makayla/?payment=cancelled`,
      metadata: { productId, source: 'mindshift' }
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// GET /api/payments/products — List available products
router.get('/products', (req, res) => {
  const products = Object.entries(PRODUCTS).map(([id, p]) => ({
    id,
    name: p.name,
    amount: p.amount / 100,
    currency: 'CAD'
  }));
  res.json({ products });
});

// GET /api/payments/history — Get user's payment history
router.get('/history', authenticate, async (req, res) => {
  // TODO: Query payments table
  res.json({ payments: [], message: 'Payment history endpoint ready' });
});

export default router;

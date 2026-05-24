# MindShift Backend API

**Owner:** Makayla Francisco | **Tech:** Derek Francisco  
**Status:** Prepared for deployment — activate after June 9, 2026

---

## Architecture

- **Runtime:** Node.js 20+ (ES Modules)
- **Framework:** Express.js
- **Database:** PostgreSQL (Heroku Postgres Essential-0)
- **Cache/Sessions:** Redis (Heroku Redis Mini)
- **Payments:** Stripe Checkout
- **Scheduling:** Calendly API + Webhooks
- **Email:** SendGrid
- **AI:** OpenAI GPT-4o (agent reasoning)
- **Queue:** Bull (Redis-backed job queue)

## 8 AI Agents

| Agent | Role |
|-------|------|
| TherapyBot | CBT-based conversational support and mood tracking |
| EcoAdvisor | Sustainability scoring and green habit recommendations |
| DataMind | Behavioral analytics and progress visualization |
| CoachPrime | Personalized coaching plans and goal tracking |
| OmniaGuard | Data privacy and security monitoring |
| Scheduler | Intelligent booking via Calendly |
| ContentForge | Course content generation and learning paths |
| BillingBot | Payment processing, invoicing, subscriptions |

## Deployment (Heroku)

```bash
# 1. Create Heroku app
heroku create mindshift-api

# 2. Add addons
heroku addons:create heroku-postgresql:essential-0
heroku addons:create heroku-redis:mini

# 3. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -hex 32)
heroku config:set SESSION_SECRET=$(openssl rand -hex 32)
heroku config:set STRIPE_SECRET_KEY=sk_live_xxxxx
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
heroku config:set STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
heroku config:set CALENDLY_API_KEY=xxxxx
heroku config:set CALENDLY_WEBHOOK_SECRET=xxxxx
heroku config:set SENDGRID_API_KEY=SG.xxxxx
heroku config:set OPENAI_API_KEY=sk-xxxxx
heroku config:set CORS_ORIGIN=https://franciscoderek7.github.io
heroku config:set ADMIN_EMAIL=makayla@mindshift.ca

# 4. Deploy
git push heroku main

# 5. Run migration
heroku run node db/migrate.mjs

# 6. Seed initial data
heroku run node db/seed.mjs

# 7. Scale worker
heroku ps:scale worker=1
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | Health check |
| POST | /api/auth/register | No | Register user |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Yes | Current user |
| GET | /api/agents | No | List all agents |
| GET | /api/agents/:id | No | Agent details |
| POST | /api/agents/:id/invoke | Yes | Invoke agent action |
| GET | /api/clients | Yes | List clients |
| POST | /api/clients | Yes | Create client |
| GET | /api/courses | No | List courses |
| POST | /api/courses/:id/enroll | Yes | Enroll in course |
| GET | /api/bookings | Yes | User's bookings |
| POST | /api/bookings | Yes | Create booking |
| POST | /api/payments/create-checkout | No | Stripe checkout |
| GET | /api/payments/products | No | List products |
| POST | /api/webhooks/stripe | No | Stripe webhook |
| POST | /api/webhooks/calendly | No | Calendly webhook |
| GET | /api/admin/dashboard | Admin | Dashboard stats |

## Local Development

```bash
cp .env.example .env
# Fill in your local values
npm install
npm run migrate
npm run seed
npm run dev
```

## Security

- All passwords hashed with bcrypt (12 rounds)
- JWT tokens expire in 7 days
- Rate limiting: 100 req/15min (API), 5 req/15min (auth)
- CORS restricted to frontend origin
- Helmet security headers
- PostgreSQL parameterized queries (no SQL injection)
- Stripe webhook signature verification
- PIPEDA compliant data handling

---

*Backend ready for deployment. Activate with: `git push heroku main`*

const express = require('express');
const Stripe = require('stripe');
const config = require('../config');

const router = express.Router();
const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: '2024-09-30.acacia'
});

// POST /api/payments/create-checkout-session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { clientSessionId } = req.body;

    if (!clientSessionId) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'clientSessionId is required.'
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: config.stripePriceId,
          quantity: 1
        }
      ],
      success_url: `${config.appBaseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.appBaseUrl}/cancel.html`,
      metadata: {
        clientSessionId
      }
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error('Error creating Stripe Checkout Session:', err.message || err);
    return res.status(500).json({
      error: 'PAYMENT_ERROR',
      message: 'Unable to create payment session. Please try again.'
    });
  }
});

module.exports = router;
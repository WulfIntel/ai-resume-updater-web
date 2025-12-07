const dotenv = require('dotenv');
dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripePriceId: process.env.STRIPE_PRICE_ID,
  openAiApiKey: process.env.OPENAI_API_KEY,
  appBaseUrl: process.env.APP_BASE_URL
};

// Basic startup validation
const missing = [];
if (!config.stripeSecretKey) missing.push('STRIPE_SECRET_KEY');
if (!config.stripePriceId) missing.push('STRIPE_PRICE_ID');
if (!config.openAiApiKey) missing.push('OPENAI_API_KEY');
if (!config.appBaseUrl) missing.push('APP_BASE_URL');

if (missing.length > 0) {
  console.error(
    'Missing required environment variables:\n' +
      missing.map((k) => `- ${k}`).join('\n') +
      '\n\nPlease set them in your .env file (copy from .env.example).'
  );
  process.exit(1);
}

module.exports = config;
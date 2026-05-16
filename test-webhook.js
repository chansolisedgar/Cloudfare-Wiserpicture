const crypto = require('crypto');
const { handler } = require('./netlify/functions/lemon-webhook.js');

const secret = 'test_secret';
process.env.LEMON_SQUEEZY_WEBHOOK_SECRET = secret;
// We would need SUPABASE_URL and SUPABASE_SERVICE_KEY here if we wanted to fully test,
// but we can just check if it gets to that point.

const payload = {
  meta: { event_name: 'order_created' },
  data: {
    attributes: {
      user_email: 'test@example.com',
      user_name: 'Test User'
    }
  }
};

const bodyStr = JSON.stringify(payload);
const hmac = crypto.createHmac('sha256', secret);
const digest = hmac.update(bodyStr).digest('hex');

const event = {
  httpMethod: 'POST',
  headers: {
    'x-signature': digest
  },
  body: bodyStr
};

handler(event).then(res => console.log('Response:', res)).catch(err => console.error('Error:', err));

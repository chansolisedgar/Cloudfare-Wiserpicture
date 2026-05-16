/**
 * Lemon Squeezy Webhook Handler (Netlify Function)
 * 
 * Receives order_created events from Lemon Squeezy,
 * creates a user in Supabase Auth, and sends a magic link email.
 * 
 * Environment variables required (set in Netlify Dashboard):
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_KEY (service_role key, not anon)
 * - LEMON_SQUEEZY_WEBHOOK_SECRET
 */

const crypto = require('crypto');

exports.handler = async (event) => {
  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Verify HMAC signature from Lemon Squeezy
  const signature = event.headers['x-signature'];
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

  if (!signature || !secret) {
    console.error('Missing signature or secret');
    return { statusCode: 400, body: 'Missing signature' };
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(event.body).digest('hex');

  if (signature !== digest) {
    console.error('Invalid webhook signature');
    return { statusCode: 400, body: 'Invalid signature' };
  }

  // Parse payload
  const payload = JSON.parse(event.body);
  const eventName = payload.meta?.event_name;

  console.log(`Received Lemon Squeezy event: ${eventName}`);

  if (eventName === 'order_created') {
    const email = payload.data?.attributes?.user_email;
    const name = payload.data?.attributes?.user_name || '';

    if (!email) {
      console.error('No email in payload');
      return { statusCode: 400, body: 'No email found' };
    }

    console.log(`Processing order for: ${email} (${name})`);

    try {
      // Dynamic import of Supabase (ESM in Node 18+)
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );

      // Create user in Supabase Auth (or update if exists)
      const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          has_access: true,
          purchased_at: new Date().toISOString()
        }
      });

      if (createError) {
        if (createError.message.includes('already registered') || createError.message.includes('already been registered')) {
          console.log(`User ${email} already exists — updating metadata`);
          // User exists — update their metadata to grant access
          const { data: { users } } = await supabase.auth.admin.listUsers();
          const existingUser = users.find(u => u.email === email);
          if (existingUser) {
            await supabase.auth.admin.updateUserById(existingUser.id, {
              user_metadata: {
                ...existingUser.user_metadata,
                has_access: true,
                purchased_at: new Date().toISOString()
              }
            });
          }
        } else {
          throw createError;
        }
      } else {
        console.log(`User created: ${userData.user.id}`);
      }

      // Generate magic link for first-time access
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: (process.env.SITE_URL || 'https://wiserpicture.com') + '/portal.html'
        }
      });

      if (linkError) {
        console.warn('Could not generate magic link:', linkError);
        // Not fatal — user can still request a new link from the login page
      } else {
        console.log('Magic link generated successfully');
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: `User ${email} provisioned` })
      };

    } catch (err) {
      console.error('Error processing webhook:', err);
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  // For other events, just acknowledge
  return { statusCode: 200, body: 'OK' };
};

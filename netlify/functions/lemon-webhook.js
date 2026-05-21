/**
 * Lemon Squeezy Webhook Handler (Netlify Function)
 * 
 * Receives order_created events from Lemon Squeezy,
 * creates a user in Supabase Auth with module access,
 * and sends an invite/magic link email.
 * 
 * Environment variables required (set in Netlify Dashboard):
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_KEY (service_role key, not anon)
 * - LEMON_SQUEEZY_WEBHOOK_SECRET
 * - SITE_URL (optional, defaults to https://wiserpiture.netlify.app)
 */

const crypto = require('crypto');

// Función para sincronizar con Mailchimp
async function syncWithMailchimp(email, name, tags) {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    console.warn('Skipping Mailchimp sync: missing API Key or Audience ID');
    return;
  }

  const https = require('https');
  const datacenter = apiKey.split('-')[1] || 'us14';
  const subscriberHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
  const url = `https://${datacenter}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`;

  const [FNAME, ...lastNameParts] = (name || '').split(' ');
  const LNAME = lastNameParts.join(' ');

  const data = JSON.stringify({
    email_address: email,
    status_if_new: 'subscribed',
    merge_fields: { FNAME, LNAME },
    tags: tags
  });

  const options = {
    method: 'PUT',
    headers: {
      'Authorization': `apikey ${apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve) => {
    const req = https.request(url, options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`Mailchimp sync success for ${email}`);
        } else {
          console.error(`Mailchimp sync error for ${email}:`, responseBody);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error('Request Error syncing to Mailchimp:', e);
      resolve();
    });

    req.write(data);
    req.end();
  });
}

// Map checkout custom_data.modules to actual module arrays
// This is the source of truth for which bundle grants which modules
function parseModulesFromCustomData(customData) {
  if (!customData || !customData.modules) {
    // Fallback: if no custom data, grant module 1 (free tier)
    return [1];
  }
  
  const modulesStr = String(customData.modules);
  const modules = modulesStr.split(',').map(m => parseInt(m.trim(), 10)).filter(m => !isNaN(m) && m >= 1 && m <= 5);
  
  // Always include module 1
  if (!modules.includes(1)) modules.unshift(1);
  
  return modules;
}

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
    const customData = payload.meta?.custom_data || {};
    const productName = payload.data?.attributes?.first_order_item?.product_name || '';

    if (!email) {
      console.error('No email in payload');
      return { statusCode: 400, body: 'No email found' };
    }

    // Determine which modules the user gets access to
    const newModules = parseModulesFromCustomData(customData);
    
    console.log(`Processing order for: ${email} (${name})`);
    console.log(`Product: ${productName}`);
    console.log(`Modules granted: ${newModules.join(', ')}`);

    // Determinar etiquetas para Mailchimp
    const tags = [];
    if (newModules.length === 1 && newModules[0] === 1) {
      tags.push('Comprador Módulo 1 Gratis');
    } else if (newModules.length === 5) {
      tags.push('Comprador Curso Completo');
    } else {
      tags.push(`Comprador Módulos: ${newModules.join(', ')}`);
    }

    // Sincronizar con Mailchimp de fondo
    await syncWithMailchimp(email, name, tags);

    const siteUrl = process.env.SITE_URL || 'https://wiserpiture.netlify.app';

    try {
      // Import Supabase
      const { createClient } = require('@supabase/supabase-js');
      
      // Admin client for updating metadata and creating users
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );

      // Anon client specifically for triggering auth emails like a normal user
      const supabaseAnon = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3Y2FnZGxzbGt4cnpxbmd5c3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTkyNDMsImV4cCI6MjA5NDM3NTI0M30.rI6-hkEDvs9m_TJDVAc3eaPygo_1GRNUVyg9QbTvNJc'
      );

      // Helper function to safely find a user by email
      async function findUserByEmail(targetEmail) {
        let page = 1;
        while (page <= 10) { // Limit to 10 pages to avoid infinite loops
          const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
            page: page,
            perPage: 1000
          });
          if (error || !users || users.length === 0) return null;
          const found = users.find(u => u.email === targetEmail);
          if (found) return found;
          if (users.length < 1000) return null; // No more pages
          page++;
        }
        return null;
      }
      
      const existingUser = await findUserByEmail(email);

      if (existingUser) {
        // ── EXISTING USER: merge modules and update ──
        console.log(`User ${email} already exists — merging module access`);
        
        const existingModules = existingUser.user_metadata?.modules_access || [];
        const mergedModules = [...new Set([...existingModules, ...newModules])].sort((a, b) => a - b);
        
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          user_metadata: {
            ...existingUser.user_metadata,
            has_access: true,
            modules_access: mergedModules,
            last_purchase_at: new Date().toISOString(),
            last_product: productName
          }
        });
        
        console.log(`Updated modules for ${email}: [${mergedModules.join(', ')}]`);

        // Send a magic link email so they can log in easily
        // Use supabaseAnon so it acts like a normal client login attempt (which properly triggers the email)
        const { error: otpError } = await supabaseAnon.auth.signInWithOtp({
          email: email,
          options: {
            emailRedirectTo: siteUrl + '/portal.html'
          }
        });

        if (otpError) {
          console.warn('Could not send magic link for existing user:', otpError);
        } else {
          console.log(`Magic link email sent to existing user: ${email}`);
        }

      } else {
        // ── NEW USER: create + invite ──
        console.log(`Creating new user: ${email}`);
        
        // Use inviteUserByEmail — this creates the user AND sends an invite email
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: {
            full_name: name,
            has_access: true,
            modules_access: newModules,
            purchased_at: new Date().toISOString(),
            last_product: productName
          },
          redirectTo: siteUrl + '/portal.html'
        });

        if (inviteError) {
          // If invite fails (e.g., user exists in a different state), fall back to createUser
          console.warn('inviteUserByEmail failed, falling back to createUser:', inviteError.message);
          
          const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            email_confirm: true,
            user_metadata: {
              full_name: name,
              has_access: true,
              modules_access: newModules,
              purchased_at: new Date().toISOString(),
              last_product: productName
            }
          });

          if (createError) {
            throw createError;
          }

          console.log(`User created via fallback: ${userData.user.id}`);

          // Send magic link email for this user using Anon client
          const { error: fallbackOtpError } = await supabaseAnon.auth.signInWithOtp({
            email: email,
            options: {
              emailRedirectTo: siteUrl + '/portal.html'
            }
          });

          if (fallbackOtpError) {
            console.warn('Could not send magic link for fallback user:', fallbackOtpError);
          } else {
            console.log(`Magic link email sent to fallback user: ${email}`);
          }
        } else {
          console.log(`User invited: ${inviteData.user.id}`);
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          message: `User ${email} provisioned with modules [${newModules.join(', ')}]` 
        })
      };

    } catch (err) {
      console.error('Error processing webhook:', err);
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  // For other events, just acknowledge
  return { statusCode: 200, body: 'OK' };
};

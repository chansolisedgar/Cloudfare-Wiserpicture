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

    const siteUrl = process.env.SITE_URL || 'https://wiserpiture.netlify.app';

    try {
      // Import Supabase
      const { createClient } = require('@supabase/supabase-js');
      
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );

      // Check if user already exists
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existingUser = users.find(u => u.email === email);

      if (existingUser) {
        // ── EXISTING USER: merge modules and update ──
        console.log(`User ${email} already exists — merging module access`);
        
        const existingModules = existingUser.user_metadata?.modules_access || [];
        const mergedModules = [...new Set([...existingModules, ...newModules])].sort((a, b) => a - b);
        
        await supabase.auth.admin.updateUserById(existingUser.id, {
          user_metadata: {
            ...existingUser.user_metadata,
            has_access: true,
            modules_access: mergedModules,
            last_purchase_at: new Date().toISOString(),
            last_product: productName
          }
        });
        
        console.log(`Updated modules for ${email}: [${mergedModules.join(', ')}]`);

        // Send a magic link so they can log in easily
        const { error: otpError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: email,
          options: {
            redirectTo: siteUrl + '/portal.html'
          }
        });

        if (otpError) {
          console.warn('Could not generate magic link for existing user:', otpError);
        }

      } else {
        // ── NEW USER: create + invite ──
        console.log(`Creating new user: ${email}`);
        
        // Use inviteUserByEmail — this creates the user AND sends an invite email
        const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
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
          
          const { data: userData, error: createError } = await supabase.auth.admin.createUser({
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

          // Generate magic link for this user
          await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: {
              redirectTo: siteUrl + '/portal.html'
            }
          });
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

/**
 * LemonSqueezy webhook — order_created
 * Provisions Supabase access, sends confirmation + follow-up emails (Resend)
 * and tags the buyer in Mailchimp.
 */
import {
  parseModules,
  provisionUserAccess,
  sendPurchaseEmails,
  syncWithMailchimp,
  purchaseTagsFor
} from '../_lib/provision.js';

export async function onRequestPost({ request, env }) {
  try {
    const signature = request.headers.get('x-signature');
    const secret = env.LEMON_SQUEEZY_WEBHOOK_SECRET;

    if (!signature || !secret) {
      return new Response('Missing signature', { status: 400 });
    }

    const rawBody = await request.text();

    // Verify HMAC
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    const digest = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    if (signature !== digest) {
      return new Response('Invalid signature', { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;

    if (eventName === 'order_created') {
      const email = payload.data?.attributes?.user_email;
      const name = payload.data?.attributes?.user_name || '';
      const customData = payload.meta?.custom_data || {};
      const productName = payload.data?.attributes?.first_order_item?.product_name || '';

      if (!email) {
        return new Response('No email found', { status: 400 });
      }

      const newModules = parseModules(customData.modules);

      const { isNewUser, modules } = await provisionUserAccess({
        email, name, modules: newModules, productName, env
      });

      await sendPurchaseEmails({ email, name, modules: newModules, env, isNewUser });
      await syncWithMailchimp(email, name, purchaseTagsFor(newModules), env);

      return new Response(JSON.stringify({ success: true, message: 'User provisioned', modules }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('OK', { status: 200 });

  } catch (err) {
    console.error('Error processing webhook:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' }});
  }
}

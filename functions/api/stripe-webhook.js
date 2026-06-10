/**
 * Stripe webhook — pagos con OXXO (efectivo) vía Stripe Payment Links.
 *
 * LemonSqueezy no soporta OXXO, así que los pagos en efectivo entran por
 * Stripe. Cada Payment Link debe llevar en su metadata la clave `modules`
 * (ej. "1,2,3") para saber qué desbloquear.
 *
 * Eventos manejados:
 *  - checkout.session.completed          → tarjeta (pago inmediato)
 *  - checkout.session.async_payment_succeeded → OXXO (el cliente pagó el voucher)
 *
 * Env vars requeridas: STRIPE_WEBHOOK_SECRET (whsec_...)
 */
import {
  parseModules,
  provisionUserAccess,
  sendPurchaseEmails,
  syncWithMailchimp,
  purchaseTagsFor
} from '../_lib/provision.js';

async function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(',').map(p => {
      const [k, ...v] = p.split('=');
      return [k.trim(), v.join('=')];
    })
  );
  const timestamp = parts.t;
  const expected = parts.v1;
  if (!timestamp || !expected) return false;

  // Reject events older than 5 minutes (replay protection)
  const age = Math.abs(Date.now() / 1000 - parseInt(timestamp, 10));
  if (isNaN(age) || age > 300) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signedPayload = `${timestamp}.${rawBody}`;
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const digest = Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  return digest === expected;
}

export async function onRequestPost({ request, env }) {
  try {
    const rawBody = await request.text();
    const valid = await verifyStripeSignature(
      rawBody,
      request.headers.get('stripe-signature'),
      env.STRIPE_WEBHOOK_SECRET
    );

    if (!valid) {
      return new Response('Invalid signature', { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const type = event.type;

    const isPaidCheckout =
      (type === 'checkout.session.completed' && event.data?.object?.payment_status === 'paid') ||
      type === 'checkout.session.async_payment_succeeded';

    if (isPaidCheckout) {
      const session = event.data.object;
      const email = session.customer_details?.email || session.customer_email;
      const name = session.customer_details?.name || '';
      const productName = session.metadata?.product_name || 'Workbook WiserPicture (OXXO)';

      if (!email) {
        return new Response('No email found', { status: 400 });
      }

      const newModules = parseModules(session.metadata?.modules);

      const { isNewUser } = await provisionUserAccess({
        email, name, modules: newModules, productName, env
      });

      await sendPurchaseEmails({ email, name, modules: newModules, env, isNewUser });
      await syncWithMailchimp(email, name, purchaseTagsFor(newModules), env);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Acknowledge everything else (incl. checkout.session.completed unpaid = voucher OXXO generado)
    return new Response('OK', { status: 200 });

  } catch (err) {
    console.error('Error processing Stripe webhook:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' }});
  }
}

/**
 * Envío manual de un correo de la secuencia del lead magnet.
 * Solo para el administrador — sirve para alcanzar a leads que descargaron
 * el Módulo 1 antes de que existiera la automatización.
 *
 * POST /api/send-lead-email
 *   Headers: Authorization: Bearer <supabase access token>
 *   Body:    { "email": "...", "which": 1|2|3, "withIntro": true }
 */
import {
  DEFAULT_ANON_KEY,
  DEFAULT_SUPABASE_URL as FRONTEND_SUPABASE_URL,
  sendSingleLeadEmail
} from '../_lib/provision.js';

const FALLBACK_ADMINS = ['chansolis.edgar@gmail.com', 'edgar@wiserpicture.com'];

export async function onRequestPost({ request, env }) {
  try {
    // ---- Autenticación de admin (igual que /api/admin-stats) ----
    const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'No autorizado' }, 401);

    const userRes = await fetch(`${FRONTEND_SUPABASE_URL}/auth/v1/user`, {
      headers: { 'apikey': DEFAULT_ANON_KEY, 'Authorization': `Bearer ${token}` }
    });
    if (!userRes.ok) return json({ error: 'Sesión inválida' }, 401);

    const caller = await userRes.json();
    const adminEmails = [...new Set([
      ...FALLBACK_ADMINS,
      ...(env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
    ])];
    if (!adminEmails.includes((caller.email || '').toLowerCase())) {
      return json({ error: 'Acceso restringido al administrador' }, 403);
    }

    // ---- Validación de entrada ----
    const { email, which, withIntro = false } = await request.json();

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ error: 'Email inválido' }, 400);
    }
    const n = parseInt(which, 10);
    if (![1, 2, 3].includes(n)) {
      return json({ error: 'El campo "which" debe ser 1, 2 o 3' }, 400);
    }
    if (!env.RESEND_API_KEY) {
      return json({
        error: 'Falta configuración en el servidor',
        detail: 'La variable RESEND_API_KEY no está configurada en Cloudflare Pages.'
      }, 500);
    }

    // ---- Envío ----
    const { subject } = await sendSingleLeadEmail({ email, which: n, env, withIntro: !!withIntro });

    return json({
      success: true,
      message: `Correo ${n} enviado a ${email}`,
      subject
    });

  } catch (err) {
    console.error('Error enviando correo de lead:', err);
    return json({ error: err.message }, 500);
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

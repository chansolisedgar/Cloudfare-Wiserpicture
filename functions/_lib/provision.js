/**
 * Shared provisioning logic for purchase webhooks (LemonSqueezy + Stripe/OXXO).
 *
 * Flow on every purchase:
 *   1. Create or update the Supabase user with module access
 *   2. Send the Supabase invite / magic link (login access)
 *   3. Send branded emails via Resend (confirmation + follow-up in 3 days)
 *   4. Tag the contact in Mailchimp
 */
import { createClient } from '@supabase/supabase-js';

// Public (anon) key — same one shipped in js/supabase-auth.js
export const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3Y2FnZGxzbGt4cnpxbmd5c3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTkyNDMsImV4cCI6MjA5NDM3NTI0M30.rI6-hkEDvs9m_TJDVAc3eaPygo_1GRNUVyg9QbTvNJc';

// API URL del proyecto (la misma que usa el frontend)
export const DEFAULT_SUPABASE_URL = 'https://qwcagdlslkxrzqngystj.supabase.co';

/**
 * Devuelve la URL del API de Supabase. Si la env var está vacía o tiene un
 * valor inválido (ej. el link del dashboard en vez del API URL), usa la
 * URL correcta del proyecto.
 */
export function getSupabaseUrl(env) {
  const raw = (env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  return /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(raw) ? raw : DEFAULT_SUPABASE_URL;
}

export const MODULE_NAMES = {
  1: 'Fundamentos',
  2: 'Presupuesto',
  3: 'Deudas',
  4: 'Ahorro',
  5: 'Inversión'
};

export function packageNameFor(modules) {
  if (modules.length >= 5) return 'Curso Completo (Módulos 1–5)';
  const set = new Set(modules);
  if (set.has(2) && set.has(3) && !set.has(4)) return 'Paquete Orden (Módulos 1–3)';
  if (set.has(4) || set.has(5)) return 'Paquete Crecimiento (Módulos 4–5)';
  if (modules.length === 1 && modules[0] === 1) return 'Módulo 1 Gratis';
  return `Módulos ${modules.join(', ')}`;
}

export function parseModules(modulesValue) {
  if (!modulesValue) return [1];
  const modules = String(modulesValue)
    .split(',')
    .map(m => parseInt(m.trim(), 10))
    .filter(m => !isNaN(m) && m >= 1 && m <= 5);
  if (!modules.includes(1)) modules.unshift(1);
  return [...new Set(modules)].sort((a, b) => a - b);
}

/**
 * Creates the user (sending a Supabase invite email) or merges new module
 * access into an existing user (sending a magic link).
 * Returns { isNewUser, modules } — modules is the merged access list.
 */
export async function provisionUserAccess({ email, name, modules, productName, env }) {
  const siteUrl = env.SITE_URL || 'https://wiserpicture.com';

  const supabaseUrl = getSupabaseUrl(env);
  const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_KEY);
  const supabaseAnon = createClient(supabaseUrl, env.SUPABASE_ANON_KEY || DEFAULT_ANON_KEY);

  async function findUserByEmail(targetEmail) {
    const target = targetEmail.toLowerCase();
    let page = 1;
    while (page <= 10) {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error || !users || users.length === 0) return null;
      const found = users.find(u => (u.email || '').toLowerCase() === target);
      if (found) return found;
      if (users.length < 1000) return null;
      page++;
    }
    return null;
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    const existingModules = existingUser.user_metadata?.modules_access || [];
    const mergedModules = [...new Set([...existingModules, ...modules])].sort((a, b) => a - b);

    await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
      user_metadata: {
        ...existingUser.user_metadata,
        has_access: true,
        modules_access: mergedModules,
        last_purchase_at: new Date().toISOString(),
        last_product: productName
      }
    });

    await supabaseAnon.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: siteUrl + '/portal.html' }
    });

    return { isNewUser: false, modules: mergedModules };
  }

  const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: name,
      has_access: true,
      modules_access: modules,
      purchased_at: new Date().toISOString(),
      last_product: productName
    },
    redirectTo: siteUrl + '/portal.html'
  });

  if (inviteError) {
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        has_access: true,
        modules_access: modules,
        purchased_at: new Date().toISOString(),
        last_product: productName
      }
    });

    if (createError) throw createError;

    await supabaseAnon.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: siteUrl + '/portal.html' }
    });
  }

  return { isNewUser: true, modules };
}

// ============================================================
// EMAILS (Resend — free tier: 3,000/mes, 100/día)
// ============================================================

async function sendResendEmail(env, payload) {
  if (!env.RESEND_API_KEY) {
    console.warn('Skipping email: RESEND_API_KEY not configured');
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.RESEND_FROM || 'Edgar de WiserPicture <hola@wiserpicture.com>',
      reply_to: env.REPLY_TO_EMAIL || 'Chansolis.edgar@gmail.com',
      ...payload
    })
  });
  if (!res.ok) {
    console.error('Resend error:', res.status, await res.text());
  }
}

function emailShell(innerHtml, siteUrl) {
  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background-color:#F9F9F6;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9F9F6;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;border:1px solid #E8E8E5;overflow:hidden;">
        <tr><td style="background:#334F2B;padding:24px;text-align:center;">
          <span style="color:#FFFFFF;font-size:20px;font-weight:700;letter-spacing:1px;">WiserPicture</span><br>
          <span style="color:#C9A84C;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Finanzas con Propósito</span>
        </td></tr>
        <tr><td style="padding:32px;color:#1A1C1B;font-size:15px;line-height:1.6;">
          ${innerHtml}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #E8E8E5;text-align:center;">
          <p style="margin:0;font-size:11px;color:#6B705C;">© WiserPicture · <a href="${siteUrl}/aviso-de-privacidad.html" style="color:#6B705C;">Aviso de Privacidad</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;"><tr><td style="background:#334F2B;border-radius:8px;">
    <a href="${href}" style="display:inline-block;padding:14px 32px;color:#FFFFFF;font-weight:600;text-decoration:none;font-size:14px;">${label}</a>
  </td></tr></table>`;
}

/**
 * Sends the purchase confirmation email now and schedules a follow-up
 * email 3 days later (Resend scheduled_at).
 */
export async function sendPurchaseEmails({ email, name, modules, env, isNewUser }) {
  const siteUrl = env.SITE_URL || 'https://wiserpicture.com';
  const firstName = (name || '').split(' ')[0] || 'Hola';
  const pkg = packageNameFor(modules);

  // Seguimiento personalizado por WhatsApp (Edgar: 938 107 2211)
  const WA_PHONE = '529381072211';
  const waLink = (msg) => `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`;
  const waButton = (href, label) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px auto 4px;"><tr><td style="background:#25D366;border-radius:8px;">
    <a href="${href}" style="display:inline-block;padding:12px 28px;color:#FFFFFF;font-weight:600;text-decoration:none;font-size:14px;">💬 ${label}</a>
  </td></tr></table>`;

  const waBlockCompra = `
      <div style="background:#F4F4F1;border-radius:12px;padding:18px 20px;margin:20px 0;text-align:center;">
        <p style="margin:0;font-weight:700;color:#334F2B;">Tu compra incluye seguimiento personalizado 🤝</p>
        <p style="margin:8px 0 0;font-size:13px;color:#6B705C;">Escríbeme directamente por WhatsApp y te acompaño en tu proceso:</p>
        ${waButton(waLink(`¡Hola Edgar! Soy ${firstName !== 'Hola' ? firstName : ''} y acabo de adquirir el ${pkg}. Me gustaría comenzar mi seguimiento personalizado. 🙌`), 'Escribir a Edgar por WhatsApp')}
        <p style="margin:6px 0 0;font-size:12px;color:#6B705C;">938 107 2211 · Edgar U. Chan</p>
      </div>`;

  const waBlockFollowup = `
      <div style="background:#F4F4F1;border-radius:12px;padding:18px 20px;margin:20px 0;text-align:center;">
        <p style="margin:0;font-weight:700;color:#334F2B;">¿Dudas o quieres revisar tu avance juntos?</p>
        <p style="margin:8px 0 0;font-size:13px;color:#6B705C;">Tu seguimiento personalizado está incluido — mándame un WhatsApp:</p>
        ${waButton(waLink(`¡Hola Edgar! Soy ${firstName !== 'Hola' ? firstName : ''} y estoy trabajando mi ${pkg}. Tengo una pregunta sobre mi proceso. 🙏`), 'Escribir a Edgar por WhatsApp')}
        <p style="margin:6px 0 0;font-size:12px;color:#6B705C;">938 107 2211 · Edgar U. Chan</p>
      </div>`;

  const modulesList = modules
    .map(m => `<li style="margin-bottom:6px;"><strong>Módulo ${m}:</strong> ${MODULE_NAMES[m] || ''}</li>`)
    .join('');

  const accessNote = isNewUser
    ? 'Te enviamos por separado un <strong>email de invitación</strong> para activar tu cuenta. Si no lo encuentras, entra al portal con tu email y te llegará un link de acceso (sin contraseña).'
    : 'Tus nuevos módulos ya están desbloqueados en tu cuenta. Entra al portal con tu email y te llegará un link de acceso (sin contraseña).';

  await sendResendEmail(env, {
    to: [email],
    subject: `✅ Tu compra está confirmada — ${pkg}`,
    html: emailShell(`
      <h1 style="font-size:22px;color:#334F2B;margin:0 0 16px;">¡Gracias por tu compra, ${firstName}! 🎉</h1>
      <p>Tu pago fue confirmado y tu acceso ya está activo:</p>
      <div style="background:#F4F4F1;border-radius:12px;padding:16px 20px;margin:16px 0;">
        <p style="margin:0 0 8px;font-weight:700;color:#334F2B;">${pkg}</p>
        <ul style="margin:0;padding-left:20px;color:#1A1C1B;">${modulesList}</ul>
      </div>
      <p>${accessNote}</p>
      ${ctaButton(siteUrl + '/login.html', 'Acceder a mi portal')}
      ${waBlockCompra}
      <p style="font-size:13px;color:#6B705C;">En el portal encontrarás los cuadernos interactivos (tu progreso se guarda en la nube), los PDFs imprimibles y las plantillas descargables.</p>
      <p style="font-size:13px;color:#6B705C;">¿Dudas o problemas con tu acceso? Responde a este correo o escríbeme por WhatsApp y te ayudo personalmente.</p>
      <p style="margin-top:24px;">Con propósito,<br><strong>Edgar U. Chan</strong></p>
    `, siteUrl)
  });

  // Follow-up 3 días después
  await sendResendEmail(env, {
    to: [email],
    subject: `${firstName}, ¿ya empezaste tu Módulo ${modules[0]}?`,
    scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    html: emailShell(`
      <h1 style="font-size:22px;color:#334F2B;margin:0 0 16px;">¿Cómo vas, ${firstName}?</h1>
      <p>Hace unos días obtuviste tu <strong>${pkg}</strong>. Quería escribirte personalmente para animarte a dar el primer paso (o el siguiente).</p>
      <p>Un consejo práctico: <strong>agenda 20 minutos esta semana</strong> para trabajar tu cuaderno. La constancia pequeña vence a la motivación grande.</p>
      <p style="background:#F4F4F1;border-left:3px solid #C9A84C;border-radius:0 8px 8px 0;padding:12px 16px;font-style:italic;color:#6B705C;">"Los planes del diligente ciertamente tienden a la abundancia." — Proverbios 21:5</p>
      ${ctaButton(siteUrl + '/login.html', 'Continuar mi workbook')}
      ${waBlockFollowup}
      <p style="font-size:13px;color:#6B705C;">Recuerda: tu progreso se guarda automáticamente en la nube, puedes avanzar a tu ritmo desde cualquier dispositivo.</p>
      <p style="font-size:13px;color:#6B705C;">Si algo no funciona o tienes preguntas sobre el contenido, responde a este correo o mándame WhatsApp.</p>
      <p style="margin-top:24px;">Con propósito,<br><strong>Edgar U. Chan</strong></p>
    `, siteUrl)
  });
}

// ============================================================
// MAILCHIMP
// ============================================================

export function purchaseTagsFor(modules) {
  if (modules.length === 1 && modules[0] === 1) return ['Comprador Módulo 1 Gratis'];
  if (modules.length === 5) return ['Comprador Curso Completo'];
  return [`Comprador Módulos: ${modules.join(', ')}`];
}

export async function syncWithMailchimp(email, name, tags, env) {
  const apiKey = env.MAILCHIMP_API_KEY;
  const audienceId = env.MAILCHIMP_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    console.warn('Skipping Mailchimp sync: missing API Key or Audience ID');
    return;
  }

  const datacenter = apiKey.split('-')[1] || 'us14';
  const subscriberHash = await md5Hex(email.toLowerCase());
  const url = `https://${datacenter}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`;

  const [FNAME, ...lastNameParts] = (name || '').split(' ');
  const LNAME = lastNameParts.join(' ');

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `apikey ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email_address: email,
      status_if_new: 'subscribed',
      merge_fields: { FNAME, LNAME },
      tags
    })
  });

  if (res.ok) {
    console.log(`Mailchimp sync success for ${email}`);
  } else {
    console.error(`Mailchimp sync error for ${email}:`, await res.text());
  }
}

// Pure-JS MD5 (Workers crypto.subtle has no MD5; Mailchimp requires it for subscriber hashes)
function md5Hex(string) {
  function rotateLeft(lValue, iShiftBits) { return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits)); }
  function addUnsigned(lX,lY) {
    var lX4,lY4,lX8,lY8,lResult;
    lX8 = (lX & 0x80000000); lY8 = (lY & 0x80000000); lX4 = (lX & 0x40000000); lY4 = (lY & 0x40000000);
    lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
    if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
      else return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
    } else return (lResult ^ lX8 ^ lY8);
  }
  function F(x,y,z) { return (x & y) | ((~x) & z); }
  function G(x,y,z) { return (x & z) | (y & (~z)); }
  function H(x,y,z) { return (x ^ y ^ z); }
  function I(x,y,z) { return (y ^ (x | (~z))); }
  function FF(a,b,c,d,x,s,ac) { a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac)); return addUnsigned(rotateLeft(a, s), b); }
  function GG(a,b,c,d,x,s,ac) { a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac)); return addUnsigned(rotateLeft(a, s), b); }
  function HH(a,b,c,d,x,s,ac) { a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac)); return addUnsigned(rotateLeft(a, s), b); }
  function II(a,b,c,d,x,s,ac) { a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac)); return addUnsigned(rotateLeft(a, s), b); }
  function convertToWordArray(string) {
    var lWordCount, lMessageLength = string.length, lNumberOfWords_temp1=lMessageLength + 8;
    var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64, lNumberOfWords = (lNumberOfWords_temp2+1)*16;
    var lWordArray=Array(lNumberOfWords-1), lBytePosition = 0, lByteCount = 0;
    while ( lByteCount < lMessageLength ) {
      lWordCount = (lByteCount-(lByteCount % 4))/4; lBytePosition = (lByteCount % 4)*8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition)); lByteCount++;
    }
    lWordCount = (lByteCount-(lByteCount % 4))/4; lBytePosition = (lByteCount % 4)*8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
    lWordArray[lNumberOfWords-2] = lMessageLength<<3; lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
    return lWordArray;
  }
  function wordToHex(lValue) {
    var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
    for (lCount = 0;lCount<=3;lCount++) {
      lByte = (lValue>>>(lCount*8)) & 255; WordToHexValue_temp = "0" + lByte.toString(16);
      WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
    }
    return WordToHexValue;
  }
  function utf8Encode(string) {
    string = string.replace(/\r\n/g,"\n"); var utftext = "";
    for (var n = 0; n < string.length; n++) {
      var c = string.charCodeAt(n);
      if (c < 128) utftext += String.fromCharCode(c);
      else if((c > 127) && (c < 2048)) { utftext += String.fromCharCode((c >> 6) | 192); utftext += String.fromCharCode((c & 63) | 128); }
      else { utftext += String.fromCharCode((c >> 12) | 224); utftext += String.fromCharCode(((c >> 6) & 63) | 128); utftext += String.fromCharCode((c & 63) | 128); }
    }
    return utftext;
  }
  var x=Array(), k,AA,BB,CC,DD,a,b,c,d;
  var S11=7, S12=12, S13=17, S14=22, S21=5, S22=9 , S23=14, S24=20, S31=4, S32=11, S33=16, S34=23, S41=6, S42=10, S43=15, S44=21;
  string = utf8Encode(string); x = convertToWordArray(string);
  a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
  for (k=0;k<x.length;k+=16) {
    AA=a; BB=b; CC=c; DD=d;
    a=FF(a,b,c,d,x[k+0], S11,0xD76AA478); d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756); c=FF(c,d,a,b,x[k+2], S13,0x242070DB); b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
    a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF); d=FF(d,a,b,c,x[k+5], S12,0x4787C62A); c=FF(c,d,a,b,x[k+6], S13,0xA8304613); b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
    a=FF(a,b,c,d,x[k+8], S11,0x698098D8); d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF); c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1); b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
    a=FF(a,b,c,d,x[k+12],S11,0x6B901122); d=FF(d,a,b,c,x[k+13],S12,0xFD987193); c=FF(c,d,a,b,x[k+14],S13,0xA679438E); b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
    a=GG(a,b,c,d,x[k+1], S21,0xF61E2562); d=GG(d,a,b,c,x[k+6], S22,0xC040B340); c=GG(c,d,a,b,x[k+11],S23,0x265E5A51); b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
    a=GG(a,b,c,d,x[k+5], S21,0xD62F105D); d=GG(d,a,b,c,x[k+10],S22,0x2441453); c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681); b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
    a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6); d=GG(d,a,b,c,x[k+14],S22,0xC33707D6); c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87); b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
    a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905); d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8); c=GG(c,d,a,b,x[k+7], S23,0x676F02D9); b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
    a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942); d=HH(d,a,b,c,x[k+8], S32,0x8771F681); c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122); b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
    a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44); d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9); c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60); b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
    a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6); d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA); c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085); b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
    a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039); d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5); c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8); b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
    a=II(a,b,c,d,x[k+0], S41,0xF4292244); d=II(d,a,b,c,x[k+7], S42,0x432AFF97); c=II(c,d,a,b,x[k+14],S43,0xAB9423A7); b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
    a=II(a,b,c,d,x[k+12],S41,0x655B59C3); d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92); c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D); b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
    a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F); d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0); c=II(c,d,a,b,x[k+6], S43,0xA3014314); b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
    a=II(a,b,c,d,x[k+4], S41,0xF7537E82); d=II(d,a,b,c,x[k+11],S42,0xBD3AF235); c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB); b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
    a=addUnsigned(a,AA); b=addUnsigned(b,BB); c=addUnsigned(c,CC); d=addUnsigned(d,DD);
  }
  return (wordToHex(a)+wordToHex(b)+wordToHex(c)+wordToHex(d)).toLowerCase();
}

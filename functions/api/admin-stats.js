/**
 * Admin dashboard API — solo accesible para los emails en ADMIN_EMAILS.
 *
 * GET /api/admin-stats  (Authorization: Bearer <supabase access token>)
 * Devuelve métricas de usuarios, accesos por módulo y progreso de workbooks.
 *
 * La primera vez que el admin entra, se le otorga automáticamente acceso
 * completo a los 5 módulos y el rol "admin" en su cuenta.
 */
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_ANON_KEY, DEFAULT_SUPABASE_URL as FRONTEND_SUPABASE_URL, getSupabaseUrl } from '../_lib/provision.js';
// Siempre admins, aunque ADMIN_EMAILS no esté configurada en Cloudflare
const FALLBACK_ADMINS = ['chansolis.edgar@gmail.com', 'edgar@wiserpicture.com'];

export async function onRequestGet({ request, env }) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return json({ error: 'No autorizado' }, 401);
    }

    // Valida la sesión directamente contra el proyecto del frontend,
    // sin depender de SUPABASE_URL/keys del entorno de Cloudflare
    const userRes = await fetch(`${FRONTEND_SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': DEFAULT_ANON_KEY,
        'Authorization': `Bearer ${token}`
      }
    });

    if (!userRes.ok) {
      const detail = (await userRes.text()).slice(0, 200);
      return json({ error: 'Sesión inválida', detail: `auth ${userRes.status}: ${detail}` }, 401);
    }

    const caller = await userRes.json();

    const adminEmails = [...new Set([
      ...FALLBACK_ADMINS,
      ...(env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
    ])];

    if (!adminEmails.includes((caller.email || '').toLowerCase())) {
      return json({ error: 'Acceso restringido al administrador' }, 403);
    }

    if (!env.SUPABASE_SERVICE_KEY) {
      return json({
        error: 'Falta configuración en el servidor',
        detail: 'La variable SUPABASE_SERVICE_KEY no existe en Cloudflare Pages. Agrégala en: dash.cloudflare.com → Workers & Pages → tu proyecto → Settings → Variables and Secrets. El valor es el "service_role" key de Supabase (Project Settings → API keys).'
      }, 500);
    }

    const supabaseAdmin = createClient(getSupabaseUrl(env), env.SUPABASE_SERVICE_KEY);

    // Auto-grant: asegura que el admin tenga rol y acceso completo a los módulos
    const meta = caller.user_metadata || {};
    if (meta.role !== 'admin' || (meta.modules_access || []).length < 5) {
      await supabaseAdmin.auth.admin.updateUserById(caller.id, {
        user_metadata: {
          ...meta,
          role: 'admin',
          has_access: true,
          modules_access: [1, 2, 3, 4, 5]
        }
      });
    }

    // ---- Usuarios ----
    const allUsers = [];
    let page = 1;
    while (page <= 10) {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) {
        return json({
          error: 'No se pudo leer la lista de usuarios de Supabase',
          detail: `${error.message || error}. Verifica que SUPABASE_SERVICE_KEY en Cloudflare sea el "service_role" key correcto del proyecto.`
        }, 500);
      }
      if (!users || users.length === 0) break;
      allUsers.push(...users);
      if (users.length < 1000) break;
      page++;
    }

    // ---- Progreso de workbooks ----
    // Supabase regresa máx. 1000 filas por consulta; paginamos con range()
    const progressRows = [];
    for (let from = 0; from < 50000; from += 1000) {
      const { data: batch, error: progressError } = await supabaseAdmin
        .from('workbook_progress')
        .select('user_id, updated_at')
        .range(from, from + 999);
      if (progressError || !batch || batch.length === 0) break;
      progressRows.push(...batch);
      if (batch.length < 1000) break;
    }

    const progressByUser = {};
    let lastActivity = null;
    (progressRows || []).forEach(r => {
      progressByUser[r.user_id] = (progressByUser[r.user_id] || 0) + 1;
      if (!lastActivity || r.updated_at > lastActivity) lastActivity = r.updated_at;
    });

    // ---- Métricas ----
    const moduleCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let buyers = 0;

    const userList = allUsers.map(u => {
      const m = u.user_metadata || {};
      const modules = Array.isArray(m.modules_access) ? m.modules_access : [];
      const isBuyer = modules.some(n => n >= 2);
      if (isBuyer) buyers++;
      modules.forEach(n => { if (moduleCounts[n] !== undefined) moduleCounts[n]++; });

      return {
        email: u.email,
        name: m.full_name || '',
        modules,
        role: m.role || '',
        lastProduct: m.last_product || '',
        purchasedAt: m.last_purchase_at || m.purchased_at || null,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at,
        progressFields: progressByUser[u.id] || 0
      };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return json({
      generatedAt: new Date().toISOString(),
      totals: {
        users: allUsers.length,
        buyers,
        freeUsers: allUsers.length - buyers,
        progressFieldsSaved: (progressRows || []).length,
        activeWorkbookUsers: Object.keys(progressByUser).length,
        lastActivity
      },
      moduleCounts,
      users: userList
    });

  } catch (err) {
    console.error('Admin stats error:', err);
    return json({ error: err.message }, 500);
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

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

const FALLBACK_ADMIN = 'chansolis.edgar@gmail.com';

export async function onRequestGet({ request, env }) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return json({ error: 'No autorizado' }, 401);
    }

    // Valida el token con el service key (evita fallos si el anon key del
    // entorno no coincide con el del frontend)
    const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      return json({ error: 'Sesión inválida', detail: authError?.message || 'sin usuario' }, 401);
    }

    const adminEmails = (env.ADMIN_EMAILS || FALLBACK_ADMIN)
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    if (!adminEmails.includes((caller.email || '').toLowerCase())) {
      return json({ error: 'Acceso restringido al administrador' }, 403);
    }

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
      if (error) throw error;
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

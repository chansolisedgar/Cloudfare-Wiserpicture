# 🚀 Guía de Lanzamiento — WiserPicture Workbooks

Todo el flujo de compra ya está integrado en el código. Esta guía cubre lo que
necesitas configurar **una sola vez** antes del lanzamiento, y el único paso
para lanzar.

---

## El flujo completo (ya implementado)

```
Cliente compra (LemonSqueezy o Stripe/OXXO)
        │
        ▼
Webhook en Cloudflare Pages (/api/lemon-webhook o /api/stripe-webhook)
        │
        ├─► Crea/actualiza usuario en Supabase con acceso a sus módulos
        ├─► Supabase envía email de invitación / magic link (login sin contraseña)
        ├─► Resend envía email de confirmación de compra (con link al portal)
        ├─► Resend programa email de follow-up a los 3 días
        └─► Mailchimp etiqueta al comprador
        │
        ▼
Cliente entra a /portal.html → ve solo SUS módulos desbloqueados
Su progreso del workbook se guarda en la nube (tabla workbook_progress)
```

---

## 1. Variables de entorno en Cloudflare Pages

En **Cloudflare Dashboard → tu proyecto Pages → Settings → Environment variables**
(producción), asegúrate de tener:

| Variable | Valor | ¿Ya existe? |
|---|---|---|
| `SUPABASE_URL` | `https://qwcagdlslkxrzqngystj.supabase.co` | ✅ (del setup anterior) |
| `SUPABASE_SERVICE_KEY` | Service role key de Supabase | ✅ |
| `SUPABASE_ANON_KEY` | Anon key de Supabase | ✅ |
| `LEMON_SQUEEZY_WEBHOOK_SECRET` | Secret del webhook en LemonSqueezy | ✅ |
| `MAILCHIMP_API_KEY` / `MAILCHIMP_AUDIENCE_ID` | Mailchimp | ✅ |
| `SITE_URL` | `https://wiserpicture.com` | ✅ |
| `RESEND_API_KEY` | **NUEVA** — API key de Resend (paso 2) | ⬜ |
| `RESEND_FROM` | **NUEVA** — ej. `Edgar de WiserPicture <hola@wiserpicture.com>` | ⬜ |
| `REPLY_TO_EMAIL` | **NUEVA** — `Chansolis.edgar@gmail.com` | ⬜ |
| `ADMIN_EMAILS` | **NUEVA** — `Chansolis.edgar@gmail.com` (puedes poner varios separados por coma) | ⬜ |
| `STRIPE_WEBHOOK_SECRET` | **NUEVA (opcional, para OXXO)** — `whsec_...` (paso 4) | ⬜ |

> Si no configuras `ADMIN_EMAILS`, el dashboard usa tu email
> (`chansolis.edgar@gmail.com`) como admin por defecto.

---

## 2. Emails automáticos con Resend (GRATIS)

**Por qué Resend:** plan gratuito de **3,000 emails/mes (100/día)**, API
simple, y se integra tanto al webhook como al SMTP de Supabase. No pagas nada
hasta superar 100 emails diarios.

**Sobre usar un "agente de Claude" para los emails:** Claude no es un servicio
de envío de correo — no tiene servidores SMTP ni reputación de dominio, así que
no puede entregar emails transaccionales por sí mismo. Lo correcto (y gratis)
es Resend para el envío; Claude Code te sirve para *redactar y mantener* las
secuencias (los templates están en `functions/_lib/provision.js` y puedes
pedirme que los cambie cuando quieras).

### Pasos (15 min, una sola vez):

1. Crea cuenta en [resend.com](https://resend.com) (gratis).
2. **Domains → Add Domain** → `wiserpicture.com` → agrega los registros DNS
   que te da Resend (SPF, DKIM) en Cloudflare DNS. Verifica.
3. **API Keys → Create API Key** → cópiala en Cloudflare Pages como
   `RESEND_API_KEY`.
4. **MUY IMPORTANTE — SMTP de Supabase:** el SMTP por defecto de Supabase está
   limitado a ~2 emails/hora (solo para pruebas). Si no cambias esto, los
   magic links NO llegarán a tus clientes en producción.
   - En Supabase: **Project Settings → Authentication → SMTP Settings → Enable Custom SMTP**
   - Host: `smtp.resend.com` · Port: `465` · User: `resend` · Password: tu `RESEND_API_KEY`
   - Sender: `hola@wiserpicture.com` (o el que verificaste)
5. (Opcional) En Supabase **Authentication → Email Templates** traduce al
   español las plantillas "Invite user" y "Magic Link".

### Emails que se envían automáticamente en cada compra:
- **Confirmación** (inmediato): paquete comprado, módulos, botón al portal.
- **Follow-up** (+3 días, programado con Resend): ánimo + versículo + CTA.
- **Invitación/magic link** (Supabase vía Resend SMTP): acceso a la cuenta.

---

## 3. Dashboard de administrador (tu acceso)

Ya está creado en **`wiserpicture.com/admin`**:

1. Entra a `wiserpicture.com/login.html` con **Chansolis.edgar@gmail.com**
   → te llega tu magic link (esto crea tu cuenta la primera vez).
2. Abre `wiserpicture.com/admin`.
3. La primera vez, el sistema te otorga automáticamente **rol admin + acceso
   a los 5 módulos**.

Qué ves: usuarios totales, compradores, acceso por módulo, progreso de cada
usuario (campos guardados), última compra y último acceso, con buscador.
Cualquier otro usuario que intente entrar verá "Acceso restringido".

---

## 4. Pago en efectivo OXXO (vía Stripe — LemonSqueezy NO soporta OXXO)

LemonSqueezy solo acepta tarjetas, PayPal, Apple/Google Pay, Alipay, WeChat y
Cash App. Para efectivo en OXXO la mejor opción gratuita (sin mensualidad,
solo comisión por venta ~3.6% + IVA) es **Stripe México**:

1. Crea cuenta en [stripe.com](https://stripe.com) (México) y actívala.
2. **Settings → Payment methods → habilita OXXO.**
3. Crea 3 **Payment Links** (Productos → Payment Links), uno por paquete:
   - Paquete Orden $349 MXN → en "Metadata" agrega: `modules` = `1,2,3`
   - Paquete Crecimiento $449 MXN → `modules` = `4,5`
   - Curso Completo $649 MXN → `modules` = `1,2,3,4,5`
   - En cada link, métodos de pago: tarjeta + OXXO.
4. **Developers → Webhooks → Add endpoint**:
   - URL: `https://wiserpicture.com/api/stripe-webhook`
   - Eventos: `checkout.session.completed` y `checkout.session.async_payment_succeeded`
   - Copia el "Signing secret" (`whsec_...`) → Cloudflare como `STRIPE_WEBHOOK_SECRET`.
5. Pega los 3 links de `buy.stripe.com/...` en
   [js/launch-config.js](js/launch-config.js) en la sección `oxxo`.

El cliente recibe un voucher, paga en cualquier OXXO (tiene ~3 días), y cuando
Stripe confirma el pago el webhook le da acceso y le envía sus emails — igual
que con LemonSqueezy. Si dejas los links vacíos, el botón de OXXO simplemente
no aparece (puedes lanzar sin OXXO y agregarlo después).

---

## 5. EL DÍA DEL LANZAMIENTO (1 solo cambio)

En [js/launch-config.js](js/launch-config.js):

```js
launched: false,  →  launched: true,
```

Commit + push. Con eso:
- Desaparecen los badges "Próximamente" y la lista de espera
- Aparecen los botones de compra de LemonSqueezy (checkout overlay)
- Aparece "Pagar en efectivo (OXXO)" si configuraste los links de Stripe

Después avisa a tu lista de espera desde Mailchimp con el link a
`wiserpicture.com/workbook.html#precios`.

---

## 6. Prueba antes de lanzar (recomendado)

1. En LemonSqueezy activa **Test Mode**, crea un checkout de prueba y verifica:
   - que te llega el email de confirmación (Resend),
   - que el usuario aparece en Supabase con sus `modules_access`,
   - que aparece en tu dashboard `/admin`,
   - que al hacer login solo ve sus módulos en el portal.
2. Verifica que el webhook de LemonSqueezy apunte a
   `https://wiserpicture.com/api/lemon-webhook` con el evento `order_created`.
3. Para OXXO: Stripe test mode tiene un OXXO de prueba que se "paga" solo.

---

## Resumen de costos mensuales

| Servicio | Plan | Costo |
|---|---|---|
| Cloudflare Pages + Functions | Free | $0 |
| Supabase (auth + progreso) | Free (hasta 50,000 usuarios activos/mes) | $0 |
| Resend (emails) | Free (3,000/mes) | $0 |
| Mailchimp (newsletter) | Free (hasta 500 contactos) | $0 |
| LemonSqueezy | Solo comisión por venta (5% + $0.50 USD) | $0 fijo |
| Stripe (OXXO) | Solo comisión por venta (~3.6% + IVA) | $0 fijo |

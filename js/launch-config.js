/**
 * ============================================================
 * CONFIGURACIÓN DE LANZAMIENTO — WiserPicture
 * ============================================================
 * Para lanzar los workbooks al público, cambia `launched` a true
 * y haz commit + push. Eso es todo:
 *   - Se ocultan los botones de "lista de espera"
 *   - Aparecen los botones de compra (LemonSqueezy, checkout overlay)
 *   - Si configuraste links de Stripe abajo, aparece "Pagar en OXXO"
 */
window.WP_LAUNCH = {
  launched: true, // 🚀 LANZADO — 16 jun 2026

  // Checkouts de LemonSqueezy (tarjeta, PayPal, Apple/Google Pay)
  checkout: {
    orden: 'https://finanzasconproposito.lemonsqueezy.com/checkout/buy/ba59433d-c0f7-4a06-9e3f-3126e22326fc?checkout[custom][modules]=1,2,3',
    crecimiento: 'https://finanzasconproposito.lemonsqueezy.com/checkout/buy/42624c45-58ad-461f-9d15-6a1e45ef3712?checkout[custom][modules]=4,5',
    completo: 'https://finanzasconproposito.lemonsqueezy.com/checkout/buy/f1032444-ec8c-41f5-b26b-795da959d006?checkout[custom][modules]=1,2,3,4,5'
  },

  // Pago en efectivo (OXXO) vía Stripe Payment Links.
  // Pega aquí tus links de Stripe (https://buy.stripe.com/...) cuando los crees.
  // Cada Payment Link debe tener metadata: modules = "1,2,3" / "4,5" / "1,2,3,4,5"
  // Si los dejas vacíos, el botón de OXXO simplemente no se muestra.
  oxxo: {
    orden:       'https://buy.stripe.com/dRm8wPftt05o4FF1tJ4Rq00',
    crecimiento: 'https://buy.stripe.com/6oU3cv3KL6tMgon2xN4Rq01',
    completo:    'https://buy.stripe.com/5kQ9ATa9919s1tt8Wb4Rq02'
  }
};

/**
 * Activa el modo lanzamiento en la página de precios (workbook.html).
 */
document.addEventListener('DOMContentLoaded', () => {
  if (!window.WP_LAUNCH.launched) return;

  // Títulos y avisos de preventa
  const title = document.getElementById('pricing-title');
  if (title) title.textContent = 'Elige tu paquete';
  const sub = document.getElementById('pricing-sub');
  if (sub) sub.textContent = 'La base bíblica del Módulo 1 seguirá siendo gratuita. Obtén acceso permanente e inmediato a los módulos completos, con tu progreso guardado en la nube.';
  const presaleNote = document.getElementById('pricing-presale-note');
  if (presaleNote) presaleNote.remove();

  // Quitar badges "Próximamente" y restaurar precios a opacidad completa
  document.querySelectorAll('.wp-coming-soon-badge').forEach(el => el.remove());
  document.querySelectorAll('.wp-price-row').forEach(el => el.classList.remove('opacity-70'));

  // Mostrar botones de compra, ocultar botones de lista de espera
  document.querySelectorAll('.wp-waitlist-btn').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.wp-buy-btn').forEach(btn => {
    const pkg = btn.getAttribute('data-package');
    const url = window.WP_LAUNCH.checkout[pkg];
    if (url) {
      btn.href = url;
      btn.classList.remove('hidden');
      btn.classList.add('lemonsqueezy-button'); // abre el checkout overlay de lemon.js
    }
  });

  // Re-inicializa lemon.js para que detecte los botones recién mostrados
  if (typeof window.createLemonSqueezy === 'function') {
    try { window.createLemonSqueezy(); } catch (e) { /* el link abre como página normal */ }
  }

  // Botón OXXO (solo si hay link de Stripe configurado)
  document.querySelectorAll('.wp-oxxo-btn').forEach(btn => {
    const pkg = btn.getAttribute('data-package');
    const url = window.WP_LAUNCH.oxxo[pkg];
    if (url) {
      btn.href = url;
      btn.classList.remove('hidden');
    }
  });

  // Ocultar el bloque de lista de espera
  const waitlist = document.getElementById('lista-espera');
  if (waitlist) waitlist.classList.add('hidden');
});

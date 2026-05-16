# Plan de Mejora — WiserPicture Website
## Auditoría de Contenido, Estructura y Mensajería

> **Visión del sitio:** Ser la plataforma práctica de referencia para cristianos hispanohablantes que quieran vivir bien — con sabiduría bíblica aplicada a la fe, el carácter, las finanzas y la vida cotidiana.

---

## 1. Diagnóstico General

### ✅ Lo que funciona bien
| Área | Detalle |
|------|---------|
| **Diseño visual** | "Ethereal Expertise" es premium, cohesivo y diferenciador. Tipografía Newsreader + Inter muy legible. |
| **Estructura de navegación** | 4 secciones claras (Blog, Podcast, Workbook, Recursos) con nav unificada en mobile y desktop. |
| **Workbook como producto central** | Bien posicionado con CTA persistente "Módulo Gratis" en header y lead magnet con captura de email. |
| **Blog categorizado** | Las 3 categorías (Sabiduría, Carácter, Mi Viaje de Fe) reflejan los pilares de contenido. |
| **Podcast migrado** | 8 episodios locales con show notes, bien organizados cronológicamente. |

### ⚠️ Problemas identificados

| # | Problema | Impacto | Página(s) |
|---|----------|---------|-----------|
| P1 | **Propuesta de valor difusa** — "Herramientas prácticas para tu vida" es genérico. No dice *para quién* ni *por qué WiserPicture*. | Alto | `index.html` |
| P2 | **Desconexión fe ↔ finanzas** — El blog habla de fe/carácter y el workbook exclusivamente de finanzas. No hay contenido puente que conecte ambos temas. | Alto | Todas |
| P3 | **Sin voz personal del autor** — No hay sección "Acerca de" ni bio visible. "Mi Viaje de Fe" es el único contenido personal pero está separado del resto. | Medio | `index.html`, `blog.html` |
| P4 | **Recursos sin enlaces reales** — Los 3 recursos (plantilla, guía CETES, simulador) tienen botones `href="#"`. La página promete pero no entrega. | Alto | `recursos.html` |
| P5 | **Redes sociales rotas** — Los links de Instagram y Facebook en el footer de `index.html`, `blog.html`, `podcast.html`, `workbook.html` y `recursos.html` apuntan a `"#"` sin URLs reales. | Medio | Footer global |
| P6 | **Meta description repetitiva** — Varias páginas usan frases casi idénticas. Falta keyword targeting diferenciado. | Bajo | Todas |
| P7 | **Artículo "Ser Discípulos" sin párrafo** — La tarjeta del blog carece del `<p>` descriptivo, produciendo una card visualmente más corta. | Bajo | `blog.html` L:217 |
| P8 | **Podcast links en Recursos apuntan a WordPress** — Los episodios en `recursos.html` redirigen a `wiserpicture.wordpress.com` en lugar de las páginas locales. | Medio | `recursos.html` |

---

## 2. Mejora de Textos (Copywriting)

### 2.1 Home Page — Hero (`index.html`)

**Actual:**
> "Herramientas prácticas para tu vida"
> "Podcast, artículos y recursos de finanzas personales desde una perspectiva cristiana."

**Propuesta:**
> **Headline:** "Vivir bien empieza con una decisión sabia"
> **Subheadline:** "Podcast, artículos y un workbook de finanzas personales que conectan la sabiduría bíblica con tu vida real. Todo diseñado para aplicarlo hoy."

**Razón:** La palabra "vivir bien" conecta la fe con la practicidad. "Una decisión sabia" es un gancho que enlaza naturalmente con el contenido del blog + el workbook.

### 2.2 Home Page — Tagline / Eyebrow
**Actual:** `SABIDURÍA QUE SE APLICA`
**Propuesta:** `SABIDURÍA PRÁCTICA PARA VIVIR MEJOR` — más claro y orientado al beneficio.

### 2.3 Home Page — Tarjetas de Navegación
| Tarjeta | Texto Actual | Propuesta |
|---------|-------------|-----------|
| Blog | "Artículos prácticos sobre fe, finanzas y vida cotidiana." | "Reflexiones breves sobre decisiones, carácter y cómo vivir con propósito." |
| Podcast | "8 episodios explorando sabiduría con refranes mexicanos." | "Episodios con refranes mexicanos que revelan principios bíblicos sorprendentes." |
| Workbook | "Finanzas personales con principios bíblicos. Módulo 1 gratis." | "Tu guía paso a paso para ordenar tus finanzas con principios bíblicos. Módulo 1 gratis." |
| Recursos | "Plantillas, calculadoras y herramientas listas para usar." | "Plantillas de presupuesto, simulador de deudas y guía de inversión – todo gratis." |

### 2.4 Sección Stats / Prueba social (`index.html`)
**Actual:** Datos estadísticos fríos (76%, 36%, etc.)
**Propuesta:** Agregar un encabezado que conecte emocionalmente:
> "En México, la mayoría tiene una cuenta de banco pero nadie les enseñó a usarla. **Este workbook cambia eso.**"

### 2.5 Blog Page — Subtítulo (`blog.html`)
**Actual:** "Reflexiones prácticas sobre fe, identidad, sabiduría y vida cotidiana."
**Propuesta:** "Ideas para tomar mejores decisiones, fortalecer tu carácter y caminar con propósito."

### 2.6 Podcast Page — Subtítulo (`podcast.html`)
**Actual:** "Explorando sabiduría práctica con refranes mexicanos."
**Propuesta:** "Cada refrán mexicano esconde un principio bíblico. Lo descubrimos juntos."

### 2.7 Workbook Page — Hero (`workbook.html`)
**Actual:** "Herramientas prácticas para el sistema financiero mexicano con un marco de valores cristianos."
**Propuesta:** "Un workbook que no te dice qué pensar sobre el dinero. Te guía paso a paso para que lo manejes con sabiduría bíblica — adaptado 100% al contexto mexicano."

---

## 3. Mejoras de Estructura

### 3.1 Agregar sección "Sobre WiserPicture" al Home Page
**Ubicación:** Entre la sección de Stats y la Quote de Mateo 25:21.
**Contenido sugerido:**
- Foto o ilustración de Edgar
- Breve bio (2-3 oraciones): "Soy Edgar Chan, nacido en México con titulo de teología por Ridley College en Australia. WiserPicture nace del deseo de compartir las herramientas practicas para vivir con sabiduría y aplicar la fé Cristiana."
- Link a "Mi Viaje de Fe" como testimonio completo

**Impacto:** Genera confianza, humaniza la marca, y conecta el blog personal con el workbook financiero.

### 3.2 Crear contenido puente: Fe → Finanzas
El mayor gap del sitio es que la sección de blog habla de fe/carácter y el workbook solo habla de técnicas financieras. Se necesitan **artículos puente** que conecten ambos mundos:

| Artículo Sugerido | Categoría | Concepto Bíblico |
|---|---|---|
| "La parábola de los talentos y tus finanzas" | Sabiduría | Mateo 25 — Administración fiel |
| "Diezmo, ofrendas y presupuesto: cómo dar sin quebrar" | Carácter | Generosidad bíblica + planificación |
| "¿Es malo querer más dinero?" | Sabiduría | 1 Tim 6:10 — Amar el dinero vs. administrarlo bien |
| "5 proverbios de Salomón sobre el dinero" | Sabiduría | Proverbios y sabiduría financiera |

### 3.3 Re-ordenar las categorías del Blog
**Orden actual:** Sabiduría → Carácter → Mi Viaje de Fe
**Orden propuesto:** Mi Viaje de Fe → Sabiduría → Carácter

**Razón:** Mi Viaje de Fe es el contenido más personal y diferenciador. Colocarlo primero engancha emocionalmente al visitante y le da contexto sobre *quién* escribe antes de presentar los artículos temáticos.

### 3.4 Añadir filtro/tabs de categoría en el Blog
Como el blog crece, un sistema de tabs (Todos / Sabiduría / Carácter / Mi Viaje de Fe / Finanzas) permitirá a los lectores navegar más fácilmente.

### 3.5 Conectar Podcast y Blog entre sí
Cada episodio del podcast tiene un tema que se complementa con un artículo del blog. Agregar al final de cada artículo:
> 🎧 *Escucha el episodio relacionado:* [Ep. X — "Nombre del episodio"]

Y viceversa en cada página de episodio:
> 📖 *Lee el artículo relacionado:* [Nombre del artículo]

### 3.6 Unificar CTAs hacia el Workbook
Actualmente hay CTAs al workbook en el hero, las tarjetas, la quote section, y un lead magnet. El mensaje debe ser consistente. Propuesta de CTA unificado:
> **"Descarga gratis el Módulo 1"** — siempre igual, siempre claro, siempre el mismo botón.

---

## 4. Mejoras de Contenido

### 4.1 Completar la página de Recursos (`recursos.html`)
| Recurso | Estado | Acción |
|---------|--------|--------|
| Plantilla de Presupuesto | `href="#"` | Crear Google Sheet: https://docs.google.com/spreadsheets/d/1oHCjVcbmJInmpvowGsdMfw_Bfei2Wecm/edit?usp=sharing&ouid=101016488133289829739&rtpof=true&sd=true |
| Guía CETES | `href="#"` | Crear PDF con capturas paso a paso |
| Simulador de Deudas | `href="#"` | Crear Google Sheet con fórmulas |
| Links del podcast | Apuntan a WordPress | Cambiar a las rutas locales (`podcast/ep3-...html`) |

### 4.2 Agregar Email Marketing / Newsletter
**Dónde:** Footer global + Blog sidebar/banner
**Copy:** "Suscríbete para recibir un consejo práctico — fe, finanzas y vida real."
**Herramienta:** Maierlite, Buttondown, o Substack (gratis para comenzar).

### 4.3 Crear "Quick Wins" — 1-2 artículos de finanzas rápidos
Artículos cortos (500 palabras) con alto valor práctico inmediato:
- "Cómo hacer tu primer presupuesto en 15 minutos"
- "3 apps mexicanas para controlar tus gastos"
Estos artículos sirven de puente directo al Workbook y refuerzan la personalidad práctica de la marca.

---

## 5. Correcciones Técnicas

| # | Corrección | Archivo(s) | Prioridad |
|---|-----------|-----------|-----------|
| T1 | Agregar párrafo faltante a la tarjeta "Ser Discípulos" | `blog.html` L:217 | Baja |
| T2 | Actualizar links de redes sociales en footers (https://www.facebook.com/wiserpicture, https://www.instagram.com/wiserpicture/) | Todos | Media |
| T3 | Actualizar links de podcast en `recursos.html` a rutas locales | `recursos.html` L:168-179 | Media |
Links podcast: https://open.spotify.com/show/3gZnwhumRcHcT3RxxpwQyq?si=d0f30ebcbedc4058
Ep 1: https://open.spotify.com/episode/1cATHYLt62O16cfpI2W2uE?si=sw-Adzt7Q-S_FIcaWOb_Nw
Ep 2: https://open.spotify.com/episode/2orsVlULDT2rEwfuuBaFaK?si=uXbzCtWZQF28W3S6312Z8w
Ep 3: https://open.spotify.com/episode/7CxaCMpd6rCct2qWmq3WUg?si=676ca4a2b7b043fd
Ep 4: https://open.spotify.com/episode/2orsVlULDT2rEwfuuBaFaK?si=21fe6d62b5fc4358
Ep 5: https://open.spotify.com/episode/1tLUugT4iGiCVKmqIivrOt?si=bcfdd3c6ac664e2c
Ep 6: https://open.spotify.com/episode/6XTsJThizspYOZ3Nv6CHbK?si=7b6d63b97bfa4bfb
Ep 7: https://open.spotify.com/episode/30Y6fe6YSJlJgz7jfOcix5?si=6f022d1940e140d0
Ep 8: https://open.spotify.com/episode/1O3ptDeU9c4y1s4ggmkEGJ?si=fa17425f14f44009

| T4 | Diferenciar meta descriptions por página con keywords específicas | Todos | Baja |
| T5 | Agregar `alt` descriptivos a las ilustraciones del background | Todas | Baja |

---

## 6. Roadmap Priorizado

### 🔴 Fase 1 — Impacto Inmediato (esta semana)
- [ ] Reescribir Hero copy del Home Page (2.1, 2.2)
- [ ] Corregir la tarjeta de "Ser Discípulos" (T1)
- [ ] Actualizar links de podcast en `recursos.html` (T3)
- [ ] Actualizar los links de redes sociales en todos los footers (T2)
- [ ] Reescribir tarjetas de navegación del Home (2.3)

### 🟡 Fase 2 — Contenido Puente (1-2 semanas)
- [ ] Agregar sección "Sobre WiserPicture" al Home Page (3.1)
- [ ] Crear 1-2 artículos de finanzas bíblicas como contenido puente (3.2)
- [ ] Actualizar copy de Blog, Podcast and Workbook heroes (2.5, 2.6, 2.7)
- [ ] Conectar podcast ↔ blog con links cruzados (3.5)

### 🟢 Fase 3 — Productos y Credibilidad (2-4 semanas)
- [ ] Crear los 3 recursos reales (plantilla, guía, simulador) y enlazar (4.2)
- [ ] Crear página "Acerca de" (4.1)
- [ ] Implementar email/newsletter (4.3)
- [ ] Agregar filtro de categorías al blog (3.4)

### 🔵 Fase 4 — Crecimiento (mes 2+)
- [ ] Escribir 2 "Quick Wins" artículos prácticos de finanzas (4.4)
- [ ] Re-ordenar categorías del blog (3.3)
- [ ] Optimizar meta descriptions por página (T4)
- [ ] Agregar testimoniales o métricas de impacto al Home

---

## 7. Resumen Ejecutivo

WiserPicture tiene una **base visual y estructural sólida**. El diseño es premium y la organización es clara. Los principales cuellos de botella son:

1. **Mensajería:** La propuesta de valor necesita decir "vivir bien" con claridad, no solo "herramientas prácticas". El visitante debe entender en 5 segundos que esto es sabiduría bíblica aplicada a la vida real.
2. **Contenido puente:** Fe y finanzas se sienten como dos sitios diferentes. Artículos que conecten Proverbios/principios bíblicos con el manejo del dinero romperían esa barrera.
3. **Credibilidad:** Sin la cara del autor y sin recursos funcionales, el sitio promete más de lo que entrega. La sección "Sobre" y los archivos reales de recursos son prioridad.
4. **Practicidad real:** Todo debe reforzar la idea de "esto lo puedo usar hoy". Cada página debería terminar con una acción directa.

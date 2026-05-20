import os, glob, re

base = "/Users/edgarchan/Documents/Consejos gratis/WiserPicture Website/Code"
all_html = glob.glob(f"{base}/*.html") + glob.glob(f"{base}/podcast/*.html")
log = []

# ─── SPOTIFY SVG constant ────────────────────────────────────────────────────
SPOTIFY_SVG = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>'

# ─── Ep8 card for podcast.html grid ─────────────────────────────────────────
EP8_CARD = '''
      <!-- Ep 8 -->
      <a href="podcast/ep8-haz-el-bien-sin-mirar-a-quien.html" class="warm-card rounded-2xl p-8 border border-outline-variant/30 group hover:border-primary/40 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden flex flex-col h-full shadow-md hover:shadow-xl">
        <div class="absolute -right-4 -bottom-8 text-on-surface-variant/5 font-headline text-8xl leading-none select-none transition-transform duration-500 group-hover:scale-110">8</div>
        <div class="relative z-10 flex flex-col h-full">
          <div class="flex items-center justify-between mb-6">
            <span class="text-[0.65rem] text-on-surface-variant/70 uppercase tracking-widest font-semibold block">2023</span>
            <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
              <span class="material-symbols-outlined text-xl" style="font-variation-settings: \'FILL\' 1;">play_arrow</span>
            </div>
          </div>
          <h3 class="text-xl font-headline text-on-surface mb-3 group-hover:text-primary transition-colors leading-snug">Haz El Bien Sin Mirar A Quien</h3>
          <p class="text-sm text-on-surface-variant leading-relaxed line-clamp-3 mb-8 flex-grow">Justicia, integridad y amor hacia el prójimo. Reflexionamos sobre la corrupción y el trato hacia los más vulnerables.</p>
          <div class="mt-auto border-t border-outline-variant/20 pt-5 flex items-center justify-between">
            <span class="text-xs text-on-surface-variant font-medium">Episodio 08</span>
            <span class="text-[#1DB954] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              ''' + SPOTIFY_SVG + '''
            </span>
          </div>
        </div>
      </a>

      <!-- Ep 7 -->'''

for filepath in all_html:
    fname = os.path.basename(filepath)
    with open(filepath) as f:
        c = f.read()
    orig = c

    # ── FIX #1 & #9 — ep3 only ──────────────────────────────────────────────
    if "ep3-dime-de-que-presumes" in filepath:
        # Badge: text-[#030711] → text-on-surface  (on gold bg)
        c = c.replace('bg-secondary text-[#030711] text-[0.5rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                       'bg-secondary text-on-surface text-[0.5rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full')
        # CTA button: replace bg-secondary text-[#030711] → bg-primary text-white
        c = c.replace(
            '<a href="../workbook.html" class="inline-flex bg-secondary text-[#030711] font-semibold py-2.5 px-7 rounded hover:scale-105 transition-transform text-sm">Ver el Workbook →</a>',
            '<a href="../workbook.html" class="inline-flex bg-primary text-white font-semibold py-2.5 px-7 rounded hover:scale-105 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-sm">Ver el Workbook →</a>'
        )
        # Also fix the inline button in the hero card
        c = c.replace(
            '<a href="../workbook.html" class="inline-flex items-center gap-2 bg-secondary/20 text-secondary border border-secondary/30 font-semibold py-2.5 px-5 rounded-full text-sm hover:scale-105 transition-transform">Ver Workbook →</a>',
            '<a href="../workbook.html" class="inline-flex items-center gap-2 border border-primary/40 text-primary font-semibold py-2.5 px-5 rounded-full text-sm hover:scale-105 active:scale-95 transition-transform">Ver Workbook →</a>'
        )
        if c != orig:
            log.append(f"[ep3] Fixed #1&#9: badge text + CTA button colors")

    # ── FIX #2 — workbook.html: bg-secondary text-white → text-on-surface ───
    if fname == "workbook.html":
        c = c.replace('class="lemonsqueezy-button bg-secondary text-white font-semibold py-3 rounded-lg text-center shadow-lg shadow-secondary/20 hover:scale-105 active:scale-95 transition-transform text-sm">Obtener Paquete Orden',
                       'class="lemonsqueezy-button bg-secondary text-on-surface font-semibold py-3 rounded-lg text-center shadow-lg shadow-secondary/20 hover:scale-105 active:scale-95 transition-transform text-sm">Obtener Paquete Orden')
        if c != orig:
            log.append(f"[workbook] Fixed #2: bg-secondary text-white → text-on-surface (WCAG fix)")

    # ── FIX #3 — podcast.html: add ep8 to grid + fix hero link ──────────────
    if fname == "podcast.html":
        # Add ep8 before ep7 in grid
        if "ep8-haz-el-bien" not in c[c.find('<div class="grid'):]:
            c = c.replace("\n      <!-- Ep 7 -->", EP8_CARD)
            log.append("[podcast] Fixed #3: Added ep8 to episode grid")
        # Fix hero link from open.spotify.com to local ep8 page
        c = c.replace(
            'href="https://open.spotify.com/episode/1O3ptDeU9c4y1s4ggmkEGJ?si=fa17425f14f44009" target="_blank" class="block warm-card',
            'href="podcast/ep8-haz-el-bien-sin-mirar-a-quien.html" class="block warm-card'
        )
        # Fix hero spotify button
        c = c.replace(
            'href="https://open.spotify.com" target="_blank" class="inline-flex items-center gap-3 bg-[#1DB954]',
            'href="https://open.spotify.com/show/wiserpicture" target="_blank" rel="noopener" class="inline-flex items-center gap-3 bg-[#1DB954]'
        )
        # Fix label: text-secondary → text-tertiary for section label
        c = c.replace(
            'class="text-[0.65rem] font-bold text-secondary uppercase tracking-widest mb-4 border-b border-secondary/30 pb-2 inline-block">Sabiduría en Audio',
            'class="text-[0.65rem] font-bold text-tertiary uppercase tracking-widest mb-4 border-b border-tertiary/30 pb-2 inline-block">Sabiduría en Audio'
        )
        # Fix rounded-3xl → rounded-2xl in hero
        c = c.replace('rounded-3xl p-8 md:p-12 border border-outline-variant/30 group hover:border-primary/50', 
                      'rounded-2xl p-8 md:p-12 border border-outline-variant/30 group hover:border-primary/50')
        c = c.replace('rounded-[2.5rem]', 'rounded-2xl')
        if c != orig:
            log.append("[podcast] Fixed #7,#8,#10: label color, rounded-3xl, hero link & spotify URL")

    # ── FIX #4 — all ep*.html: menu-toggle text-tertiary → text-primary ─────
    if "podcast/ep" in filepath:
        c = c.replace(
            'id="menu-toggle" class="material-symbols-outlined text-tertiary md:hidden"',
            'id="menu-toggle" class="material-symbols-outlined text-primary md:hidden"'
        )
        if c != orig:
            log.append(f"[{fname}] Fixed #4: hamburger text-tertiary → text-primary")

    # ── FIX #5 — all ep*.html: drawer active border-tertiary/20 → border-primary/20
    if "podcast/ep" in filepath:
        c = c.replace(
            'from-primary/10 to-transparent px-4 py-3 flex items-center gap-4 rounded-full border border-tertiary/20',
            'from-primary/10 to-transparent px-4 py-3 flex items-center gap-4 rounded-full border border-primary/20'
        )
        if c != orig:
            log.append(f"[{fname}] Fixed #5: drawer active border-tertiary/20 → border-primary/20")

    # ── FIX #6 — all ep*.html: hero card border-tertiary/20 → border-outline-variant/30
    if "podcast/ep" in filepath:
        c = c.replace(
            'warm-card rounded-2xl p-8 border border-tertiary/20 mb-10',
            'warm-card rounded-2xl p-8 border border-outline-variant/30 mb-10'
        )
        c = c.replace(
            'bg-primary/10 border border-tertiary/20 flex items-center justify-center flex-shrink-0',
            'bg-primary/10 border border-outline-variant/30 flex items-center justify-center flex-shrink-0'
        )
        if c != orig:
            log.append(f"[{fname}] Fixed #6: hero card border-tertiary/20 → border-outline-variant/30")

    # ── FIX #8 — blog.html: rounded-3xl → rounded-2xl ───────────────────────
    if fname == "blog.html":
        c = c.replace('warm-card rounded-3xl p-10 md:p-16', 'warm-card rounded-2xl p-10 md:p-16')
        if c != orig:
            log.append("[blog] Fixed #8: rounded-3xl → rounded-2xl")

    if c != orig:
        with open(filepath, "w") as f:
            f.write(c)

print("=" * 60)
print("ALL FIXES APPLIED:")
print("=" * 60)
for l in log:
    print(" ✅", l)
print(f"\nTotal: {len(log)} fix groups applied")

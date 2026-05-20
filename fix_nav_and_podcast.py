import os
import glob
import re

base_dir = "/Users/edgarchan/Documents/Consejos gratis/WiserPicture Website/Code"

# 1. Update main pages to add "Mi Cuenta" to main nav and drawer
main_files = ["index.html", "blog.html", "podcast.html", "workbook.html", "recursos.html"]

desktop_nav_item = '    <a class="text-on-surface hover:text-primary transition-colors font-medium text-sm tracking-wide" href="login.html">Mi Cuenta</a>\n  </div>'
drawer_nav_item = '    <a class="text-[#1A1C1B] opacity-80 px-4 py-3 flex items-center gap-4 hover:bg-[#E8E8E5] hover:text-primary transition-colors rounded-full" href="login.html"><span class="material-symbols-outlined">login</span><span class="font-medium font-body">Mi Cuenta</span></a>\n  </div>'

for f in main_files:
    filepath = os.path.join(base_dir, f)
    if os.path.exists(filepath):
        with open(filepath, "r") as file:
            content = file.read()
        
        # Add to desktop nav
        if "href=\"login.html\">Mi Cuenta</a>" not in content[:content.find("</header>")]:
            # Find the end of the desktop nav
            content = re.sub(r'(<a[^>]*href="recursos\.html"[^>]*>Recursos</a>\s*)</div>', r'\1' + desktop_nav_item, content, count=1)
            
        # Add to drawer nav
        drawer_end_idx = content.find("</nav>")
        if drawer_end_idx != -1 and "href=\"login.html\"" not in content[content.find("<nav"):drawer_end_idx]:
            # Fix links in drawer if they need correct paths
            content = re.sub(r'(<a[^>]*href="recursos\.html"[^>]*>.*?</a>\s*)</div>', r'\1' + drawer_nav_item, content, count=1)

        with open(filepath, "w") as file:
            file.write(content)

# 2. Rewrite podcast episode files
podcast_dir = os.path.join(base_dir, "podcast")
ep_files = glob.glob(os.path.join(podcast_dir, "ep*.html"))

light_head = """<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700;1,400;1,700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          "surface": "#FFFFFF",
          "surface-container-lowest": "#F9F9F6",
          "secondary": "#C9A84C",
          "surface-container": "#F4F4F1",
          "surface-container-low": "#F4F4F1",
          "surface-container-high": "#E8E8E5",
          "surface-container-highest": "#D8D8D5",
          "primary": "#334F2B",
          "background": "#F9F9F6",
          "outline-variant": "#C8C8C5",
          "on-surface-variant": "#666",
          "on-surface": "#1A1C1B",
          "secondary-fixed-dim": "#C9A84C",
          "on-primary-container": "#2A3F22",
          "on-primary": "#FFFFFF",
          "tertiary": "#C0603A"
        },
        fontFamily: {
          "headline": ["Lora", "serif"],
          "body": ["Manrope", "sans-serif"],
          "label": ["Manrope", "sans-serif"]
        },
        borderRadius: {"DEFAULT": "0.375rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
      },
    }
  }
</script>
<style>
  body { background-color: #F9F9F6; color: #1A1C1B; min-height: 100dvh; }
  .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
  .warm-card { background: #FFFFFF; border: 1px solid #E8E8E5; box-shadow: 0 1px 3px rgba(45,51,25,0.06), 0 1px 2px rgba(45,51,25,0.04); }
  .warm-card:hover { box-shadow: 0 4px 12px rgba(45,51,25,0.1); }
  .nav-drawer { transform: translateX(-100%); transition: transform 0.3s ease; }
  .nav-drawer.open { transform: translateX(0); }
  .nav-overlay { opacity: 0; pointer-events: none; transition: opacity 0.3s ease; }
  .nav-overlay.open { opacity: 1; pointer-events: auto; }
  .prose h2 { font-family: 'Lora', serif; font-size: 1.75rem; color: #1A1C1B; margin-top: 2.5rem; margin-bottom: 1rem; font-style: italic; }
  .prose h3 { font-family: 'Lora', serif; font-size: 1.35rem; color: #1A1C1B; margin-top: 2rem; margin-bottom: 0.75rem; }
  .prose p { color: #444; line-height: 1.8; margin-bottom: 1.5rem; font-size: 1.05rem; }
  .prose blockquote { border-left: 3px solid #C0603A; padding-left: 1.5rem; margin: 2rem 0; font-style: italic; color: #666; font-family: 'Lora', serif; font-size: 1.2rem; }
  .prose a { color: #334F2B; text-decoration: underline; text-underline-offset: 4px; }
</style>
</head>
<body class="font-body selection:bg-primary/20 selection:text-on-surface">

<!-- Header -->
<header class="bg-[#F9F9F6]/90 backdrop-blur-xl top-0 sticky z-50 shadow-[0_1px_3px_rgba(45,51,25,0.08)]">
<div class="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
  <div class="flex items-center gap-3">
    <button id="menu-toggle" class="material-symbols-outlined text-primary md:hidden">menu</button>
    <a href="../index.html"><img src="../assets/Wiserpicure Logo.png" alt="WiserPicture" class="h-12 w-auto"></a>
  </div>
  <div class="hidden md:flex flex-1 justify-center items-center gap-8">
    <a class="text-on-surface hover:text-primary transition-colors font-medium text-sm tracking-wide" href="../blog.html">Blog</a>
    <a class="text-primary font-medium text-sm tracking-wide" href="../podcast.html">Podcast</a>
    <a class="text-on-surface hover:text-primary transition-colors font-medium text-sm tracking-wide" href="../workbook.html">Workbook</a>
    <a class="text-on-surface hover:text-primary transition-colors font-medium text-sm tracking-wide" href="../recursos.html">Recursos</a>
    <a class="text-on-surface hover:text-primary transition-colors font-medium text-sm tracking-wide" href="../login.html">Mi Cuenta</a>
  </div>
  <div class="flex items-center gap-4">
    <a href="../workbook.html#lead-magnet" class="hidden md:inline-flex bg-primary text-white font-semibold py-2 px-5 rounded text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-transform">Módulo Gratis</a>
  </div>
</div>
</header>

<div id="nav-overlay" class="nav-overlay fixed inset-0 bg-black/30 z-[55]"></div>
<nav id="nav-drawer" class="nav-drawer fixed inset-y-0 left-0 z-[60] flex flex-col bg-[#F9F9F6]/98 backdrop-blur-2xl h-full w-80 shadow-2xl shadow-black/10">
<div class="p-8">
  <div class="flex justify-between items-center mb-10"><img src="../assets/Wiserpicure Logo.png" alt="WiserPicture" class="h-14 w-auto"><button id="menu-close" class="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">close</button></div>
  <div class="flex flex-col gap-2">
    <a class="text-[#1A1C1B] opacity-80 px-4 py-3 flex items-center gap-4 hover:bg-[#E8E8E5] hover:text-primary transition-colors rounded-full" href="../index.html"><span class="material-symbols-outlined">home</span><span class="font-medium font-body">Inicio</span></a>
    <a class="text-[#1A1C1B] opacity-80 px-4 py-3 flex items-center gap-4 hover:bg-[#E8E8E5] hover:text-primary transition-colors rounded-full" href="../blog.html"><span class="material-symbols-outlined">article</span><span class="font-medium font-body">Blog</span></a>
    <a class="text-[#1A1C1B] bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 flex items-center gap-4 rounded-full border border-primary/20" href="../podcast.html"><span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">mic</span><span class="font-medium font-body">Podcast</span></a>
    <a class="text-[#1A1C1B] opacity-80 px-4 py-3 flex items-center gap-4 hover:bg-[#E8E8E5] hover:text-primary transition-colors rounded-full" href="../workbook.html"><span class="material-symbols-outlined">menu_book</span><span class="font-medium font-body">Workbook</span></a>
    <a class="text-[#1A1C1B] opacity-80 px-4 py-3 flex items-center gap-4 hover:bg-[#E8E8E5] hover:text-primary transition-colors rounded-full" href="../recursos.html"><span class="material-symbols-outlined">handyman</span><span class="font-medium font-body">Recursos</span></a>
    <a class="text-[#1A1C1B] opacity-80 px-4 py-3 flex items-center gap-4 hover:bg-[#E8E8E5] hover:text-primary transition-colors rounded-full" href="../login.html"><span class="material-symbols-outlined">login</span><span class="font-medium font-body">Mi Cuenta</span></a>
  </div>
</div>
</nav>

<main class="max-w-3xl mx-auto px-6 py-16 relative z-10">"""

light_footer = """
<!-- ========== FOOTER ========== -->
<footer class="bg-[#C0603A] py-16 mt-16">
<div class="flex flex-col items-center text-center w-full px-8 max-w-7xl mx-auto">
  <img src="../assets/Wiserpicure Logo.png" alt="WiserPicture" class="h-12 w-auto mb-8">

  <!-- Footer Navigation -->
  <div class="flex flex-wrap justify-center gap-6 mb-8">
    <a class="text-white/80 hover:text-white transition-colors text-sm font-medium" href="../blog.html">Blog</a>
    <a class="text-white/80 hover:text-white transition-colors text-sm font-medium" href="../podcast.html">Podcast</a>
    <a class="text-white/80 hover:text-white transition-colors text-sm font-medium" href="../workbook.html">Workbook</a>
    <a class="text-white/80 hover:text-white transition-colors text-sm font-medium" href="../recursos.html">Recursos</a>
    <a class="text-white/60 hover:text-white transition-colors text-sm font-medium border-l border-white/20 pl-6" href="../login.html">Mi Cuenta</a>
  </div>

  <!-- Social -->
  <div class="flex gap-6 mb-8">
    <a class="text-white/70 hover:text-white transition-all flex flex-col items-center gap-1.5" href="https://www.instagram.com/wiserpicture/" target="_blank">
      <span class="material-symbols-outlined text-xl">photo_camera</span>
      <span class="text-[0.6rem] font-medium uppercase tracking-widest">Instagram</span>
    </a>
    <a class="text-white/70 hover:text-white transition-all flex flex-col items-center gap-1.5" href="https://www.facebook.com/wiserpicture" target="_blank">
      <span class="material-symbols-outlined text-xl">public</span>
      <span class="text-[0.6rem] font-medium uppercase tracking-widest">Facebook</span>
    </a>
  </div>

  <!-- Contact -->
  <div class="mb-10">
    <p class="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-white/60 mb-2">Contacto</p>
    <a class="text-white/80 hover:text-white transition-colors text-base" href="mailto:edgar@wiserpicture.com">
      edgar@wiserpicture.com
    </a>
  </div>

  <p class="text-[0.7rem] text-white/40">© 2026 WiserPicture. Todos los derechos reservados.</p>
</div>
</footer>
<script>
  const toggle=document.getElementById('menu-toggle'),drawer=document.getElementById('nav-drawer'),overlay=document.getElementById('nav-overlay'),closeBtn=document.getElementById('menu-close');
  function openMenu(){drawer.classList.add('open');overlay.classList.add('open')}
  function closeMenu(){drawer.classList.remove('open');overlay.classList.remove('open')}
  toggle.addEventListener('click',openMenu);closeBtn.addEventListener('click',closeMenu);overlay.addEventListener('click',closeMenu);
</script>
</body></html>"""

for f in ep_files:
    with open(f, "r") as file:
        content = file.read()
    
    # 1. Replace everything before <main...> with light_head
    # We need to preserve <title> and <meta name="description">
    title_match = re.search(r'<title>(.*?)</title>', content)
    desc_match = re.search(r'<meta name="description" content="(.*?)">', content)
    
    title = title_match.group(1) if title_match else "Podcast — WiserPicture"
    desc = desc_match.group(1) if desc_match else ""
    
    new_head = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:image" content="../assets/Wiserpicure Logo.png">
{light_head}"""

    content = re.sub(r'<!DOCTYPE html>.*?<main[^>]*>', new_head, content, flags=re.DOTALL)
    
    # 2. Replace everything after </main> with light_footer
    content = re.sub(r'</main>.*', '</main>\n' + light_footer, content, flags=re.DOTALL)
    
    # 3. Replace card classes and colors
    content = content.replace('glass-card', 'warm-card')
    content = content.replace('border-primary/20', 'border-tertiary/20')
    content = content.replace('hover:border-primary/30', 'hover:border-tertiary/30')
    
    # 4. Fix specific link colors
    content = content.replace('text-primary', 'text-tertiary')
    # except the Spotify button which has #1DB954 bg and text-white. 
    # Let's fix the specific text-primary backlink
    content = content.replace('group-hover:text-tertiary', 'group-hover:text-primary') # Restore primary for card hovers if we want? Actually tertiary is fine.
    
    # Replace the dark mode spotify button if it exists
    # The spotify button is bg-[#1DB954] text-white, so it's fine.
    
    # Replace any leftover dark mode text colors (text-on-surface etc are fine because they are in the new tailwind config as dark grays)
    # The new tailwind config maps "on-surface" to "#1A1C1B" (dark gray) and "on-surface-variant" to "#666".
    # So the existing classes like text-on-surface will work perfectly in light mode!
    
    with open(f, "w") as file:
        file.write(content)

print("Done updating nav and rewriting podcast episodes.")

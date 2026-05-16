import re
import os

def process_file(filepath, module_num, module_sections):
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Replace the <header> with the new <nav>
    nav_template = f"""<!-- Sticky Header with Nav -->
<nav class="bg-white/95 backdrop-blur-xl sticky top-0 z-50 border-b border-outline-variant/30">
  <div class="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
    
    <!-- Module Links -->
    <div class="flex gap-6 overflow-x-auto whitespace-nowrap w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
      <a href="portal.html" class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Mi Portal</a>
      <a href="modulo-1.html" class="text-sm font-medium {'text-primary border-b-2 border-secondary pb-1' if module_num == 1 else 'text-gray-500 hover:text-gray-900 transition-colors'}">Módulo 1</a>
      <a href="modulo-2.html" class="text-sm font-medium {'text-primary border-b-2 border-secondary pb-1' if module_num == 2 else 'text-gray-500 hover:text-gray-900 transition-colors'}">Módulo 2</a>
      <a href="modulo-3.html" class="text-sm font-medium {'text-primary border-b-2 border-secondary pb-1' if module_num == 3 else 'text-gray-500 hover:text-gray-900 transition-colors'}">Módulo 3</a>
      <a href="modulo-4.html" class="text-sm font-medium {'text-primary border-b-2 border-secondary pb-1' if module_num == 4 else 'text-gray-500 hover:text-gray-900 transition-colors'}">Módulo 4</a>
      <a href="modulo-5.html" class="text-sm font-medium {'text-primary border-b-2 border-secondary pb-1' if module_num == 5 else 'text-gray-500 hover:text-gray-900 transition-colors'}">Módulo 5</a>
    </div>
    
    <!-- Utilities -->
    <div class="flex items-center gap-4 self-end md:self-auto">
      <div id="save-status" class="flex items-center gap-1.5 text-xs font-semibold text-[#1E8E3E] opacity-0 transition-opacity duration-300">
        <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">cloud_done</span>
        Guardado
      </div>
      
      <div class="relative">
        <button id="outline-toggle" class="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-semibold bg-white border border-outline-variant/50 px-4 py-2 rounded-full shadow-sm hover:shadow-md">
          <span class="material-symbols-outlined text-[1.1rem]">format_list_bulleted</span>
          <span class="hidden sm:inline">Índice</span>
        </button>
        <!-- Dropdown Menu -->
        <div id="outline-menu" class="absolute right-0 mt-2 w-64 bg-white border border-outline-variant/30 rounded-xl shadow-xl py-2 opacity-0 pointer-events-none transform scale-95 origin-top-right transition-all duration-200">
          <div class="px-4 py-3 border-b border-outline-variant/20 mb-1 bg-surface-container-lowest rounded-t-xl">
            <span class="text-xs font-bold text-secondary uppercase tracking-widest">Navegación del Módulo</span>
          </div>
          <a href="#intro" class="block px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-primary/5 hover:text-primary transition-colors border-l-2 border-transparent hover:border-primary">Introducción</a>"""

    for i, sec_name in enumerate(module_sections):
        nav_template += f"""\n          <a href="#seccion-{i+1}" class="block px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-primary/5 hover:text-primary transition-colors border-l-2 border-transparent hover:border-primary">{i+1}. {sec_name}</a>"""

    nav_template += """\n          <div class="border-t border-outline-variant/20 my-1"></div>
          <a href="#resumen" class="block px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/5 transition-colors border-l-2 border-transparent hover:border-primary">Resumen Final</a>
        </div>
      </div>
    </div>
    
  </div>
</nav>"""

    # Replace <header>...</header> entirely.
    # Note: the file has another <header> inside <main> for the cover.
    # We must only replace the first one.
    content = re.sub(r'<!-- Sticky Header -->\s*<header class="[^"]*top-0 sticky[^"]*">.*?</header>', nav_template, content, count=1, flags=re.DOTALL)

    # 2. Add <section> wrappers.
    # For intro:
    intro_regex = re.compile(r'<div id="intro" class="flex items-center gap-4 mb-6 scroll-mt-24">.*?</div>', re.DOTALL)
    new_intro = f"""<section id="intro" class="mb-16 scroll-mt-24">
      <p class="text-secondary font-bold tracking-wide uppercase text-sm mb-4">Módulo {module_num}</p>
      <div class="flex items-center gap-4 mb-8">
        <h2 class="text-3xl font-headline font-bold text-primary italic">Introducción</h2>
      </div>"""
    content = intro_regex.sub(new_intro, content)

    # For seccion 1 to 5:
    for i in range(1, 6):
        # Depending on the file, the h2 might have an inline class or just be <h2 id="seccion-X" class="scroll-mt-24">TITLE</h2>
        # We find the <div class="flex items-center gap-4 ..."> that precedes the section, and the <h2>
        sec_regex = re.compile(r'<div class="flex items-center gap-4 mb-6 mt-[0-9]+">.*?<h2 id="seccion-' + str(i) + r'"[^>]*>(.*?)</h2>', re.DOTALL)
        
        progress_bar = f"""</section>

    <section id="seccion-{i}" class="mb-16 scroll-mt-24">
      <!-- Progress Bar -->
      <div class="sticky top-[73px] z-40 bg-[#F9F9F6]/95 backdrop-blur-md py-4 -mx-6 px-6 mb-8 flex gap-2">"""
        
        for j in range(1, 6):
            if j < i:
                bg = "bg-[#8C3A20]"
            elif j == i:
                bg = "bg-secondary"
            else:
                bg = "bg-outline-variant/30"
            progress_bar += f"""\n        <a href="#seccion-{j}" class="h-1.5 flex-1 rounded-full {bg} hover:opacity-80 transition-colors" title="Sección {j}"></a>"""
            
        progress_bar += f"""\n      </div>
      <p class="text-secondary font-bold tracking-wide uppercase text-sm mb-4">Sección {i}</p>
      <div class="flex items-center gap-4 mb-8">
        <h2 class="text-3xl font-headline font-bold text-primary italic">\\1</h2>
      </div>"""
      
        content = sec_regex.sub(progress_bar, content)

    # For resumen:
    resumen_regex = re.compile(r'<div id="resumen" class="flex items-center gap-4 mb-6 mt-[0-9]+ scroll-mt-24">.*?<h2>(.*?)</h2>', re.DOTALL)
    new_resumen = f"""</section>

    <section id="resumen" class="mb-16 scroll-mt-24">
      <!-- Progress Bar Final -->
      <div class="sticky top-[73px] z-40 bg-[#F9F9F6]/95 backdrop-blur-md py-4 -mx-6 px-6 mb-8 flex gap-2">
        <a href="#seccion-1" class="h-1.5 flex-1 rounded-full bg-[#8C3A20] hover:opacity-80 transition-colors"></a>
        <a href="#seccion-2" class="h-1.5 flex-1 rounded-full bg-[#8C3A20] hover:opacity-80 transition-colors"></a>
        <a href="#seccion-3" class="h-1.5 flex-1 rounded-full bg-[#8C3A20] hover:opacity-80 transition-colors"></a>
        <a href="#seccion-4" class="h-1.5 flex-1 rounded-full bg-[#8C3A20] hover:opacity-80 transition-colors"></a>
        <a href="#seccion-5" class="h-1.5 flex-1 rounded-full bg-[#8C3A20] hover:opacity-80 transition-colors"></a>
      </div>
      <p class="text-secondary font-bold tracking-wide uppercase text-sm mb-4">Resumen</p>
      <div class="flex items-center gap-4 mb-8">
        <h2 class="text-3xl font-headline font-bold text-primary italic">\\1</h2>
      </div>"""
    content = resumen_regex.sub(new_resumen, content)
    
    # Close the last section before </article>
    content = content.replace("</article>", "</section>\n</article>")

    with open(filepath, 'w') as f:
        f.write(content)

# Define sections
mod1_sections = ["Dios Provee", "Mayordomía", "Trabajo Diligente", "Contentamiento", "Generosidad"]
mod2_sections = ["Conoce tus números", "Sé intencional, no impulsivo", "Los gastos que no ves venir", "Simplifica lo que tienes", "Construye tu Presupuesto"]
mod3_sections = ["Tu situación real", "No toda deuda es igual", "Los hábitos que te metieron aquí", "Tu plan de salida", "La Mejor Deuda es la que Nunca Tienes"]

process_file('/Users/edgarchan/Documents/Consejos gratis/WiserPicture Website/Code/modulo-1.html', 1, mod1_sections)
process_file('/Users/edgarchan/Documents/Consejos gratis/WiserPicture Website/Code/modulo-2.html', 2, mod2_sections)
process_file('/Users/edgarchan/Documents/Consejos gratis/WiserPicture Website/Code/modulo-3.html', 3, mod3_sections)
print("Transformation script finished.")

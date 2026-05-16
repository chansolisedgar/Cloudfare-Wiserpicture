import re

def fix_mod4_mod5(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
        
    # 1. Remove progress bar from intro section.
    # We find the <section id="intro" ...> and remove the <div class="flex gap-2 mb-8">...</div> block inside it.
    intro_match = re.search(r'<section id="intro"[^>]*>.*?</section>', content, re.DOTALL)
    if intro_match:
        intro_content = intro_match.group(0)
        # Find the first progress bar inside it
        prog_match = re.search(r'<!-- Progress Bar -->\s*<div class="flex gap-2 mb-8">.*?</div>', intro_content, re.DOTALL)
        if prog_match:
            new_intro_content = intro_content.replace(prog_match.group(0), '')
            content = content.replace(intro_content, new_intro_content)
    
    # 2. Add sticky classes to all remaining progress bars
    content = content.replace('<div class="flex gap-2 mb-8">', '<div class="sticky top-[73px] z-40 bg-[#F9F9F6]/95 backdrop-blur-md py-4 -mx-6 px-6 mb-8 flex gap-2">')
    
    with open(filepath, 'w') as f:
        f.write(content)

fix_mod4_mod5('/Users/edgarchan/Documents/Consejos gratis/WiserPicture Website/Code/modulo-4.html')
fix_mod4_mod5('/Users/edgarchan/Documents/Consejos gratis/WiserPicture Website/Code/modulo-5.html')
print("Transformation 2 finished.")

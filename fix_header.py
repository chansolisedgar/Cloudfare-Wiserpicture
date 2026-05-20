import os
import glob
import re

base_dir = "/Users/edgarchan/Documents/Consejos gratis/WiserPicture Website/Code"
html_files = glob.glob(os.path.join(base_dir, "*.html")) + glob.glob(os.path.join(base_dir, "podcast", "*.html"))

for filepath in html_files:
    if "portal.html" in filepath or "login.html" in filepath or "modulo-" in filepath:
        continue # Skip portal and login and modules
        
    with open(filepath, "r") as file:
        content = file.read()
        
    header_end = content.find("</header>")
    if header_end == -1: continue
    
    header_content = content[:header_end]
    
    prefix = "../" if "podcast/ep" in filepath else ""
    login_btn = f'\n    <a href="{prefix}login.html" class="hidden md:inline-flex text-on-surface hover:text-primary font-medium text-sm transition-colors items-center gap-2 mr-2">\n      <span class="material-symbols-outlined text-[1.1rem]">account_circle</span> Mi Cuenta\n    </a>'
    
    if "account_circle" not in header_content:
        # replace <div class="flex items-center gap-4"> with <div ...> + login_btn
        header_content = header_content.replace('<div class="flex items-center gap-4">', '<div class="flex items-center gap-4">' + login_btn)
    
    content = header_content + content[header_end:]
    
    with open(filepath, "w") as file:
        file.write(content)

print("Headers updated successfully!")

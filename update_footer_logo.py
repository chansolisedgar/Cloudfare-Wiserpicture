import os
import glob
import re

base_dir = "/Users/edgarchan/Documents/Consejos gratis/WiserPicture Website/Code"
html_files = glob.glob(os.path.join(base_dir, "*.html")) + glob.glob(os.path.join(base_dir, "podcast", "*.html"))

for filepath in html_files:
    if "portal.html" in filepath or "login.html" in filepath or "modulo-" in filepath:
        continue # Skip these as they don't have this footer
        
    with open(filepath, "r") as file:
        content = file.read()
        
    footer_start = content.find("<footer")
    if footer_start == -1: continue
    
    footer_content = content[footer_start:]
    
    # Replace the logo in the footer
    footer_content = footer_content.replace('Wiserpicure Logo.png', 'Logo footer.png')
    
    content = content[:footer_start] + footer_content
    
    with open(filepath, "w") as file:
        file.write(content)

print("Footer logos updated successfully!")

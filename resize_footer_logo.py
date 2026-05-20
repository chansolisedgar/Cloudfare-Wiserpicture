import os
import glob

base_dir = "/Users/edgarchan/Documents/Consejos gratis/WiserPicture Website/Code"
html_files = glob.glob(os.path.join(base_dir, "*.html")) + glob.glob(os.path.join(base_dir, "podcast", "*.html"))

for filepath in html_files:
    if "portal.html" in filepath or "login.html" in filepath or "modulo-" in filepath:
        continue # Skip these
        
    with open(filepath, "r") as file:
        content = file.read()
        
    footer_start = content.find("<footer")
    if footer_start == -1: continue
    
    footer_content = content[footer_start:]
    
    # Replace Logo footer.png with twice height h-24
    footer_content = footer_content.replace('Logo footer.png" alt="WiserPicture" class="h-12 w-auto mb-8"', 'Logo footer.png" alt="WiserPicture" class="h-24 w-auto mb-8"')
    
    content = content[:footer_start] + footer_content
    
    with open(filepath, "w") as file:
        file.write(content)

print("Footer logo resized to double height successfully!")

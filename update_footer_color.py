import os
import glob

base_dir = "/Users/edgarchan/Documents/Consejos gratis/WiserPicture Website/Code"
html_files = glob.glob(os.path.join(base_dir, "*.html")) + glob.glob(os.path.join(base_dir, "podcast", "*.html"))

for filepath in html_files:
    if "portal.html" in filepath or "login.html" in filepath or "modulo-" in filepath:
        continue # Skip portal, login, and modules (they have different footers or no footers like this)
        
    with open(filepath, "r") as file:
        content = file.read()
        
    # Replaces the orange background with bg-primary
    content = content.replace('class="bg-[#C0603A]', 'class="bg-primary')
    
    with open(filepath, "w") as file:
        file.write(content)

print("Footers updated to primary color successfully!")

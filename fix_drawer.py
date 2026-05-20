import os
import re

base_dir = "/Users/edgarchan/Documents/Consejos gratis/WiserPicture Website/Code"
main_files = ["blog.html", "podcast.html", "workbook.html", "recursos.html"]

drawer_nav_item = '    <a class="text-[#1A1C1B] opacity-80 px-4 py-3 flex items-center gap-4 hover:bg-[#E8E8E5] hover:text-primary transition-colors rounded-full" href="login.html">\n      <span class="material-symbols-outlined">login</span>\n      <span class="font-medium font-body">Mi Cuenta</span>\n    </a>\n  </div>'

for f in main_files:
    filepath = os.path.join(base_dir, f)
    if os.path.exists(filepath):
        with open(filepath, "r") as file:
            content = file.read()
            
        drawer_end_idx = content.find("</nav>")
        if drawer_end_idx != -1 and "href=\"login.html\"" not in content[content.find("<nav"):drawer_end_idx]:
            # Replace the last </div> before </nav>
            # The structure is usually </div>\n</div>\n</nav>
            content = re.sub(r'(\s*)</div>\n</div>\n</nav>', r'\n' + drawer_nav_item + r'\n</div>\n</nav>', content, count=1)

        with open(filepath, "w") as file:
            file.write(content)
print("Done fixing drawers")

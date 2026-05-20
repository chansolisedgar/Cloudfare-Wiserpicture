import os
import glob
import re

base_dir = "/Users/edgarchan/Documents/Consejos gratis/WiserPicture Website/Code"
html_files = glob.glob(os.path.join(base_dir, "*.html")) + glob.glob(os.path.join(base_dir, "podcast", "*.html"))

fixes_applied = []

for filepath in html_files:
    with open(filepath, "r") as file:
        content = file.read()
    original = content
    filename = os.path.basename(filepath)

    # -------------------------------------------------------
    # FIX 1: on-surface-variant #666 → #6B705C (muted olive)
    # -------------------------------------------------------
    if '"on-surface-variant": "#666"' in content:
        content = content.replace('"on-surface-variant": "#666"', '"on-surface-variant": "#6B705C"')
        fixes_applied.append(f"[{filename}] Fixed on-surface-variant: #666 → #6B705C")

    # -------------------------------------------------------
    # FIX 2: outline-variant #C8C8C5 (was #C8C8C5 - fine)
    # Some pages might have old value - standardize
    # -------------------------------------------------------
    if '"outline-variant": "#C4C0B6"' in content:
        content = content.replace('"outline-variant": "#C4C0B6"', '"outline-variant": "#C8C8C5"')
        fixes_applied.append(f"[{filename}] Fixed outline-variant → #C8C8C5")

    # -------------------------------------------------------
    # FIX 3: Add focus-visible states to primary CTA buttons
    # Pattern: bg-primary ... hover:scale-105 active:scale-95 transition-transform"
    # -------------------------------------------------------
    old_btn = 'hover:scale-105 active:scale-95 transition-transform"'
    new_btn = 'hover:scale-105 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"'
    if old_btn in content and new_btn not in content:
        content = content.replace(old_btn, new_btn)
        fixes_applied.append(f"[{filename}] Added focus-visible states to CTA buttons")

    # -------------------------------------------------------
    # FIX 4: Add focus-visible to podcast episode nav links
    # hover:scale-[1.02] transition-transform"
    # -------------------------------------------------------
    old_btn2 = 'hover:scale-[1.02] transition-transform"'
    new_btn2 = 'hover:scale-[1.02] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"'
    if old_btn2 in content and new_btn2 not in content:
        content = content.replace(old_btn2, new_btn2)
        fixes_applied.append(f"[{filename}] Added focus-visible states to portal buttons")

    # -------------------------------------------------------
    # FIX 5: Bible verse attribution color #755B00 → text-secondary
    # (used in Verse Plate section of index.html)
    # -------------------------------------------------------
    if 'text-[#755B00]' in content:
        content = content.replace('text-[#755B00]', 'text-secondary')
        fixes_applied.append(f"[{filename}] Fixed #755B00 → text-secondary (official gold)")

    # -------------------------------------------------------
    # FIX 6: Social links in footer - add aria-label
    # -------------------------------------------------------
    content = content.replace(
        'href="https://www.instagram.com/wiserpicture/" target="_blank">',
        'href="https://www.instagram.com/wiserpicture/" target="_blank" aria-label="WiserPicture en Instagram" rel="noopener">'
    )
    content = content.replace(
        'href="https://www.facebook.com/wiserpicture" target="_blank">',
        'href="https://www.facebook.com/wiserpicture" target="_blank" aria-label="WiserPicture en Facebook" rel="noopener">'
    )

    if content != original:
        with open(filepath, "w") as file:
            file.write(content)

print("=" * 60)
print("FIXES APPLIED:")
print("=" * 60)
for fix in fixes_applied:
    print(fix)
print(f"\nTotal: {len(fixes_applied)} fixes in {len(set([f.split(']')[0][1:] for f in fixes_applied]))} files")

import re
import sys

def process_file(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()
    
    out_lines = []
    in_logical_section = False
    
    for i, line in enumerate(lines):
        # If we see a logical section start
        if '<section id="' in line:
            # If we were already in one, we should have closed it.
            # But wait, we will close it when we see the last </section> before this.
            pass
            
        # If it's a generic section
        if '<section class="mb-16">' in line:
            line = line.replace('<section class="mb-16">', '<div class="mb-16">')
            
        # If it's a closing section
        if '</section>' in line:
            # We need to know if this closing section is the END of a logical section.
            # It is the end of a logical section if the NEXT section tag is a logical section
            # OR if it's the last section in the document.
            
            # Look ahead for the next <section
            is_end_of_logical = False
            for j in range(i+1, len(lines)):
                if '<section ' in lines[j] or '<section>' in lines[j] or 'id="seccion-' in lines[j] or 'id="resumen"' in lines[j]:
                    if 'id=' in lines[j]:
                        is_end_of_logical = True
                    break
            
            # If there are no more <section> tags at all, it's the end of resumen
            has_more_sections = any('<section' in l for l in lines[i+1:])
            if not has_more_sections:
                is_end_of_logical = True
                
            if not is_end_of_logical:
                line = line.replace('</section>', '</div>')
                
        out_lines.append(line)
        
    with open(filename, 'w') as f:
        f.writelines(out_lines)
    print(f"Fixed {filename}")

process_file('modulo-4.html')
process_file('modulo-5.html')

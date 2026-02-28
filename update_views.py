import os
import re

views_dir = 'views'
ejs_files = [f for f in os.listdir(views_dir) if f.endswith('.ejs')]

# Regex to match the head/navbar and the footer/scripts
header_pattern = re.compile(r'<!DOCTYPE html>.*?</nav>', re.DOTALL | re.IGNORECASE)
footer_pattern = re.compile(r'<!-- ================= FOOTER ================= -->.*?</html>', re.DOTALL | re.IGNORECASE)

header_repl = '<%- include(\'partials/header\') %>'
footer_repl = '<%- include(\'partials/footer\') %>'

for file_name in ejs_files:
    file_path = os.path.join(views_dir, file_name)
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Some pages have a dashboard sidebar or specific head layout that might not perfectly match the standard index nav.
        # However, for most pages, this straight replacement of the nav block works well.
        # Let's be careful with the dashboard files which might have a different structure.
        if 'dashboard' in file_name:
            print(f"Skipping {file_name} as it has a custom dashboard layout.")
            continue

        new_content = header_pattern.sub(header_repl, content)
        new_content = footer_pattern.sub(footer_repl, new_content)
        
        # Also fix internal links since we removed .html extensions
        new_content = re.sub(r'href="(.*?)\.html"', r'href="/\1"', new_content)
        # Handle index.html -> /
        new_content = new_content.replace('href="/index"', 'href="/"')

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Successfully updated {file_name}")

    except Exception as e:
        print(f"Error processing {file_name}: {e}")

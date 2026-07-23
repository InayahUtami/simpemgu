#!/usr/bin/env python3

file_path = 'src/app/admin/dashboard/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Count how many unwrapped year filters we have (where label is direct child of flex-end div)
pattern_count = content.count('<div style={{ display: \'flex\', alignItems: \'flex-end\', gap: \'8px\' }}>\n                    <label')

print(f"Found {pattern_count} unwrapped year filters")

# Let's find all occurrences and replace one by one based on position
import re

# Find all occurrences
pattern = r'<div style=\{\{\s*display:\s*[\'"]flex[\'"],\s*alignItems:\s*[\'"]flex-end[\'"],\s*gap:\s*[\'"]8px[\'"]}\}>\s*<label'

matches = list(re.finditer(pattern, content))
print(f"Found {len(matches)} matches")

for i, match in enumerate(matches):
    print(f"Match {i+1} at position {match.start()}")
    # Show context
    start = max(0, match.start() - 100)
    end = min(len(content), match.end() + 100)
    context = content[start:end].replace('\n', '\\n')
    print(f"  Context: ...{context[-60:]}...")

# Now replace them - we need to wrap the label and its following input div in a container div
# For each occurrence, we need to:
# 1. Add <div> after the opening flex div
# 2. Add </div> before the closing flex div

# Let's do this in reverse order so positions don't shift

for match_index in range(len(matches) - 1, -1, -1):
    match = matches[match_index]
    
    # Find the start of the flex-end div
    flex_start = match.start()
    flex_open_end = match.end() - len('<label')  # position is at the end of the pattern
    
    # Find the closing </div> for the flex container
    # We need to find the matching closing div
    # Look for "                  </div>" (dedented to match opening)
    
    search_start = match.end()
    flex_close = content.find('\n                  </div>\n', search_start)
    
    if flex_close == -1:
        flex_close = content.find('\n                </div>\n', search_start)
    
    if flex_close != -1:
        print(f"  Replacing match {match_index + 1}: positions {flex_start} to {flex_close}")
        
        # Insert opening wrapper div right after the opening flex div
        # Find the line break after the opening flex div
        newline_after_opener = content.find('\n', flex_start)
        if newline_after_opener != -1:
            insert_pos1 = newline_after_opener + 1
            # Find the indent at this position
            line_start = content.rfind('\n', 0, insert_pos1) + 1
            line = content[line_start:insert_pos1]
            indent = line[:len(line) - len(line.lstrip())]
            
            # Add wrapper opening
            wrapper_open = indent + '<div>\n'
            content = content[:insert_pos1] + wrapper_open + content[insert_pos1:]
            
            # We inserted text, so adjust flex_close
            flex_close += len(wrapper_open)
            
            # Now add closing wrapper div before the closing flex div
            wrapper_close = indent + '</div>\n'
            content = content[:flex_close] + wrapper_close + content[flex_close:]
            
            print(f"  Successfully replaced match {match_index + 1}")


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("File updated successfully")

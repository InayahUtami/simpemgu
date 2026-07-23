#!/usr/bin/env python3

file_path = 'src/app/admin/dashboard/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and fix the problematic year filters by wrapping the label
# We're looking for patterns where label is directly under the flex container

result = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # Check if this is a Year Range Filter opener without a wrapper div
    if "Year Range Filter" in line and i + 1 < len(lines):
        result.append(line)  # Add the comment
        i += 1
        
        if "display: 'flex', alignItems: 'flex-end'" in lines[i]:
            result.append(lines[i])  # Add the opening flex div
            i += 1
            
            # Check if next line is a label (not wrapped in div)
            if "<label" in lines[i] and "Year Range Filter" not in lines[i-2]:
                # We need to insert a wrapper div
                result.append(lines[i][:lines[i].index('<')] + '<div>\n')  # Add opening wrapper div
                
                # Now add the label
                result.append(lines[i])  # The label line
                i += 1
                
                # Skip until we find the closing </div> for the inputs, then add closing wrapper div
                input_div_depth = 0
                while i < len(lines):
                    result.append(lines[i])
                    if '<div' in lines[i]:
                        input_div_depth += 1
                    if '</div>' in lines[i]:
                        input_div_depth -= 1
                        if input_div_depth < 0:
                            # This is the closing of the flex container
                            # Insert closing wrapper div before this
                            indent = lines[i][:len(lines[i]) - len(lines[i].lstrip())]
                            result.insert(-1, indent + '    </div>\n')
                            break
                    i += 1
                i += 1
                continue
    
    result.append(line)
    i += 1

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(result)

print("File fixed")

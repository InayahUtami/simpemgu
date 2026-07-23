#!/usr/bin/env python3

file_path = 'src/app/admin/dashboard/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Lines to wrap: 1112, 1320, 1527 (1-indexed, so 1111, 1319, 1526 in 0-indexed)
bare_label_lines = [1111, 1319, 1526]

for line_idx in bare_label_lines:
    if line_idx < len(lines):
        # Get the indentation from the label line
        label_line = lines[line_idx]
        indent = label_line[:len(label_line) - len(label_line.lstrip())]
        inner_indent = '  '  # Two more spaces for nested content
        
        # Insert opening div before the label
        lines.insert(line_idx, indent + '<div>\n')
        
        # Now find the closing </div> for the inputs and add closing wrapper after it
        # We need to find the pattern:  </div> followed by blank line or  </div> for flex container
        # The structure is:
        # <label>
        # </label>
        # <div (for inputs)>
        # ...inputs...
        # </div> <- closing inputs div
        # </div> <- closing flex container div
        
        # Let's find where this section ends
        search_start = line_idx + 1
        # Look for the next </div> that's at the same indent level as the opening flex div
        flex_container_indent = indent
        
        for i in range(search_start, min(search_start + 100, len(lines))):
            if '</div>' in lines[i]:
                line_indent = lines[i][:len(lines[i]) - len(lines[i].lstrip())]
                if line_indent == flex_container_indent:
                    # Found it - add wrapper closing before this line
                    lines.insert(i, indent + '    </div>\n')
                    print(f"Wrapped section at line {line_idx + 1} to line {i + 1}")
                    # Increment remaining indices since we've added lines
                    for j in range(len(bare_label_lines)):
                        if bare_label_lines[j] > line_idx:
                            bare_label_lines[j] += 2  # We added 2 lines
                    break

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Done wrapping all bare labels")

#!/usr/bin/env python3

file_path = 'src/app/admin/dashboard/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the malformed structure
# The problem is that the closing </div> for inputs got messed up
# Current bad structure:  
# <div> (wrapper - properly added)
# <label>...
# <div (inputs)>
# ...inputs...
# </div> </div> (both on same line, wrong indents)

# We need:
# <div> (wrapper)
# <label>...
# <div (inputs)>
# ...inputs...
# </div> (close inputs)
# </div> (close wrapper)

# Let's fix by finding these patterns and correcting them

# Pattern 1: Find closing tags that don't match indentation
lines = content.split('\n')
result_lines = []

i = 0
while i < len(lines):
    line = lines[i]
    
    # Check if this line has a closing tag in the middle of the indentation
    if '</div>' in line:
        # Count dedents in this line
        dedent_count = line.count('</div>')
        
        if dedent_count > 1:
            # We have multiple closes on one line - need to split them
            indent_level = len(line) - len(line.lstrip())
            indent = line[:indent_level]
            
            # Check the context - what tags are we closing?
            # For now, just split them onto separate lines with correct indentation
            if i > 0:
                prev_line = lines[i-1] if i < len(lines) else ''
                
                # Check if this is the problematic pattern
                if 'Input> closing' pattern - let's manually fix it  
                content = content.replace(
                    '''                      />
                        </div>
                    </div>''',
                    '''                      />
                      </div>
                    </div>'''
                )
                
                print("Fixed closing div indentation")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed malformed structure")

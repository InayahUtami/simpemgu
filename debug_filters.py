#!/usr/bin/env python3

file_path = 'src/app/admin/dashboard/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all year range filters where label is a direct child
# Pattern: <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
#          followed by <label (with possible whitespace and newline)

import re

# More flexible pattern
pattern = r'(<div style=\{\{ display: \'flex\', alignItems: \'flex-end\', gap: \'8px\' \}\}>\s*)<label'

matches = list(re.finditer(pattern, content))
print(f"Found {len(matches)} matches")

for i, match in enumerate(matches):
    print(f"Match {i+1} at position {match.start()}")

# Strategy: for each match, we'll:
# 1. Find where we are (which tab this is)
# 2. Find the matching closing </div>
# 3. Insert wrapper divs appropriately

# Let's do direct string replacements
# First, count instances of the bare pattern to understand what we're dealing with

bare_filter_count = content.count('<div style={{ display: \'flex\', alignItems: \'flex-end\', gap: \'8px\' }}>\n                    <label')
print(f"Found {bare_filter_count} bare filters (label as direct child)")

# Now let's replace them one by one
# We'll replace the specific pattern where label comes right after flex div opening

# The pattern is:
# <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
# <spaces><label ...

# And we want to change it to:
# <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
# <spaces><div>
# <spaces><label ...

# And before the closing </div> of the flex container, add:
# <spaces></div>

# Let me use a simpler approach - find and replace the exact strings

old_pattern = '''<div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px', display: 'block' }}>
                      Tahun
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>'''

new_pattern = '''<div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px', display: 'block' }}>
                        Tahun
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>'''

# Count occurrences
count = content.count(old_pattern)
print(f"\nFound {count} instances of the full pattern")

if count > 0:
    # Replace only the bare ones (not the ones that already have a wrapper div)
    # We can't replace all because some may already be wrapped
    pass

# Let's use a different approach - list positions and verify which ones to fix
lines = content.split('\n')
for i, line in enumerate(lines):
    if '<label style={{ fontSize: \'13px\'' in line and i > 0:
        prev_line = lines[i-1]
        if 'alignItems: \'flex-end\'' in prev_line:
            print(f"Found bare label at line {i+1}")
            print(f"  Prev: {prev_line.strip()[:80]}")
            print(f"  Current: {line.strip()[:80]}")

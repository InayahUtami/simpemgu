#!/usr/bin/env python3
import re

file_path = 'src/app/admin/dashboard/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern for siswa and rombel - label as direct child of flex container
pattern = r'(<div style=\{\{\s*display:\s*[\'"]flex[\'"],\s*alignItems:\s*[\'"]flex-end[\'"],\s*gap:\s*[\'"]8px[\'"]}\}>\s*)<label\s+style=\{\{\s*fontSize:\s*[\'"]13px[\'"],\s*fontWeight:\s*[\'"]600[\'"],\s*color:\s*[\'"]#374151[\'"],\s*marginBottom:\s*[\'"]4px[\'"],\s*display:\s*[\'"]block[\'"]}\}>'

# This pattern is complex. Let me instead do direct string replacements for each section.

# Find Siswa section (looking for unique context)
siswa_marker = "Tren Data Siswa Per Kecamatan"
siswa_pos = content.find(siswa_marker)

# Find Rombel section
rombel_marker = "Tren Data Rombel Per Kecamatan"
rombel_pos = content.find(rombel_marker)

# Find Statistics/Statistik section  
stats_search_starts = content.rfind("Tren Data")  # Last occurrence

# Now let's search backwards from these positions to find the year filter

# For Siswa - find the year filter before the chart title
siswa_search_start = max(0, siswa_pos - 2000)
siswa_section = content[siswa_search_start:siswa_pos]

# Check if we can find the pattern in Siswa
if '<label style={{ fontSize: \'13px\', fontWeight: \'600\', color: \'#374151\', marginBottom: \'4px\', display: \'block\' }}>' in siswa_section:
    print("Found label in Siswa section")
    
# Let me do more targeted replacements
# Replace where we have year filter without wrapper div, right before chart declarations

# Pattern 1: Siswa - find the label that comes right after the flex-end container opening
old_siswa = '''<div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px', display: 'block' }}>
                      Tahun
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        min={availableYears[0] || 2020}
                        max={yearRange.to}
                        value={yearRange.from}
                        onChange={(e) => setYearRange(r => ({ ...r, from: Math.max(availableYears[0] || 2020, Math.min(Number(e.target.value), r.to)) }))}
                        style={{
                            width: '70px',
                            padding: '8px 8px',
                            border: '1.5px solid #e5e7eb',
                            borderRadius: '6px',
                            textAlign: 'center',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: '#f9fafb'
                          }}
                      />
                      <span style={{ fontWeight: '700', color: '#9ca3af', fontSize: '12px' }}>–</span>
                      <input
                        type="number"
                        min={yearRange.from}
                        max={availableYears[availableYears.length - 1] || 2027}
                        value={yearRange.to}
                        onChange={(e) => setYearRange(r => ({ ...r, to: Math.min(availableYears[availableYears.length - 1] || 2027, Math.max(Number(e.target.value), r.from)) }))}
                        style={{
                            width: '70px',
                            padding: '8px 8px',
                            border: '1.5px solid #e5e7eb',
                            borderRadius: '6px',
                            textAlign: 'center',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: '#f9fafb'
                          }}
                      />
                    </div>
                  </div>

                {/* Chart */}
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '32px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: '1.5px solid #e5e7eb'
                }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users2Icon style={{ width: 22, height: 22, color: '#8b5cf6' }} />
                    Tren Data Siswa Per Kecamatan'''

new_siswa = '''<div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px', display: 'block' }}>
                        Tahun
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          min={availableYears[0] || 2020}
                          max={yearRange.to}
                          value={yearRange.from}
                          onChange={(e) => setYearRange(r => ({ ...r, from: Math.max(availableYears[0] || 2020, Math.min(Number(e.target.value), r.to)) }))}
                          style={{
                            width: '70px',
                            padding: '8px 8px',
                            border: '1.5px solid #e5e7eb',
                            borderRadius: '6px',
                            textAlign: 'center',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: '#f9fafb'
                          }}
                        />
                        <span style={{ fontWeight: '700', color: '#9ca3af', fontSize: '12px' }}>–</span>
                        <input
                          type="number"
                          min={yearRange.from}
                          max={availableYears[availableYears.length - 1] || 2027}
                          value={yearRange.to}
                          onChange={(e) => setYearRange(r => ({ ...r, to: Math.min(availableYears[availableYears.length - 1] || 2027, Math.max(Number(e.target.value), r.from)) }))}
                          style={{
                            width: '70px',
                            padding: '8px 8px',
                            border: '1.5px solid #e5e7eb',
                            borderRadius: '6px',
                            textAlign: 'center',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: '#f9fafb'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                {/* Chart */}
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '32px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: '1.5px solid #e5e7eb'
                }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users2Icon style={{ width: 22, height: 22, color: '#8b5cf6' }} />
                    Tren Data Siswa Per Kecamatan'''

if old_siswa in content:
    content = content.replace(old_siswa, new_siswa, 1)
    print("Replaced Siswa section")
else:
    print("Siswa pattern not found")

# Pattern 2: Rombel - same issue
old_rombel = '''<div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px', display: 'block' }}>
                      Tahun
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        min={availableYears[0] || 2020}
                        max={yearRange.to}
                        value={yearRange.from}
                        onChange={(e) => setYearRange(r => ({ ...r, from: Math.max(availableYears[0] || 2020, Math.min(Number(e.target.value), r.to)) }))}
                        style={{
                            width: '70px',
                            padding: '8px 8px',
                            border: '1.5px solid #e5e7eb',
                            borderRadius: '6px',
                            textAlign: 'center',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: '#f9fafb'
                          }}
                      />
                      <span style={{ fontWeight: '700', color: '#9ca3af', fontSize: '12px' }}>–</span>
                      <input
                        type="number"
                        min={yearRange.from}
                        max={availableYears[availableYears.length - 1] || 2027}
                        value={yearRange.to}
                        onChange={(e) => setYearRange(r => ({ ...r, to: Math.min(availableYears[availableYears.length - 1] || 2027, Math.max(Number(e.target.value), r.from)) }))}
                        style={{
                            width: '70px',
                            padding: '8px 8px',
                            border: '1.5px solid #e5e7eb',
                            borderRadius: '6px',
                            textAlign: 'center',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: '#f9fafb'
                          }}
                      />
                    </div>
                  </div>

                {/* Chart */}
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '32px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: '1.5px solid #e5e7eb'
                }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LayoutGridIcon style={{ width: 22, height: 22, color: '#f59e0b' }} />
                    Tren Data Rombel Per Kecamatan'''

new_rombel = '''<div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px', display: 'block' }}>
                        Tahun
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          min={availableYears[0] || 2020}
                          max={yearRange.to}
                          value={yearRange.from}
                          onChange={(e) => setYearRange(r => ({ ...r, from: Math.max(availableYears[0] || 2020, Math.min(Number(e.target.value), r.to)) }))}
                          style={{
                            width: '70px',
                            padding: '8px 8px',
                            border: '1.5px solid #e5e7eb',
                            borderRadius: '6px',
                            textAlign: 'center',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: '#f9fafb'
                          }}
                        />
                        <span style={{ fontWeight: '700', color: '#9ca3af', fontSize: '12px' }}>–</span>
                        <input
                          type="number"
                          min={yearRange.from}
                          max={availableYears[availableYears.length - 1] || 2027}
                          value={yearRange.to}
                          onChange={(e) => setYearRange(r => ({ ...r, to: Math.min(availableYears[availableYears.length - 1] || 2027, Math.max(Number(e.target.value), r.from)) }))}
                          style={{
                            width: '70px',
                            padding: '8px 8px',
                            border: '1.5px solid #e5e7eb',
                            borderRadius: '6px',
                            textAlign: 'center',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: '#f9fafb'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                {/* Chart */}
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '32px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: '1.5px solid #e5e7eb'
                }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LayoutGridIcon style={{ width: 22, height: 22, color: '#f59e0b' }} />
                    Tren Data Rombel Per Kecamatan'''

if old_rombel in content:
    content = content.replace(old_rombel, new_rombel, 1)
    print("Replaced Rombel section")
else:
    print("Rombel pattern not found")

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("File updated")

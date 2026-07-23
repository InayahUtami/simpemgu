import React from 'react';

interface KecamatanTableBodyProps {
  cluster: any;
  isMobile: boolean;
  expandedKecamatan: Set<number>;
  toggleExpandKecamatan: (id: number) => void;
  sekolahDataCache: Map<number, any>;
  loadingSekolah: Set<number>;
  silhouetteByKecamatan: Map<string, number>;
}

export default function KecamatanTableBody({
  cluster,
  isMobile,
  expandedKecamatan,
  toggleExpandKecamatan,
  sekolahDataCache,
  loadingSekolah,
  silhouetteByKecamatan
}: KecamatanTableBodyProps) {
  return (
    <>
      {cluster.kecamatanList.map((kec: any, index: number) => {
        const isExpanded = expandedKecamatan.has(kec.id);
        const sekolahData = sekolahDataCache.get(kec.id);
        const isLoadingSekolah = loadingSekolah.has(kec.id);
        const silhouetteValue = silhouetteByKecamatan.get(String(kec.kecamatan || '').trim().toLowerCase());
        const rasioValue = Number(kec.rasioSiswaGuru || 0);

        const rasioKeterangan = (ratio: number) => {
          if (!Number.isFinite(ratio) || ratio <= 0) return '-';
          if (ratio < 18) return 'Kelebihan';
          if (ratio <= 20) return 'Merata';
          return 'Kekurangan';
        };

        const keterangan = rasioKeterangan(rasioValue);
        const allSchools = (sekolahData?.sekolahList || [])
          .sort((a: any, b: any) => Number(b.rasioSiswaGuru || 0) - Number(a.rasioSiswaGuru || 0))
          .slice();

        const getStatusStyle = (status: string) => {
          if (status === 'Kelebihan Guru') {
            return { bg: '#fef3c7', text: '#92400e' };
          }
          if (status === 'Seimbang') {
            return { bg: '#dcfce7', text: '#166534' };
          }
          return { bg: '#fee2e2', text: '#991b1b' };
        };

        const statusCounts = allSchools.reduce((acc: Record<string, number>, sd: any) => {
          const status = sd.kondisiPemerataan || 'Tidak diketahui';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        return (
          <React.Fragment key={kec.id}>
            {/* Kecamatan Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '46px 1fr 72px 72px 96px' : '70px 1fr 110px 110px 140px',
                backgroundColor: isExpanded ? '#f0f9ff' : 'white',
                borderBottom: '1px solid #e5e7eb',
                transition: 'background-color 0.15s ease',
                cursor: 'pointer'
              }}
              onClick={() => toggleExpandKecamatan(kec.id)}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = isExpanded ? '#e0f2fe' : '#f9fafb';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = isExpanded ? '#f0f9ff' : 'white';
              }}
            >
              {/* No Column with Expand Icon */}
              <div
                style={{
                  padding: isMobile ? '12px 8px' : '14px 16px',
                  textAlign: 'center',
                  fontWeight: '600',
                  color: '#6b7280',
                  fontSize: isMobile ? '13px' : '14px',
                  borderRight: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span style={{ marginRight: '4px', fontSize: '12px', transition: 'transform 0.2s' }}>
                  {isExpanded ? '▼' : '▶'}
                </span>
                {kec.nomor}
              </div>

              {/* Nama Kecamatan Column */}
              <div
                style={{
                  padding: isMobile ? '12px 8px' : '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: '2px',
                  borderRight: '1px solid #e5e7eb'
                }}
              >
                <div
                  style={{
                    fontWeight: '600',
                    color: '#111827',
                    fontSize: isMobile ? '13px' : '15px'
                  }}
                >
                  {kec.kecamatan}
                </div>
                {!isMobile && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#475569',
                      fontWeight: '500'
                    }}
                  >
                    Klik untuk melihat detail rasio siswa/guru dan prioritas sekolah dasar.
                  </div>
                )}
                {isMobile && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#475569',
                      lineHeight: 1.35
                    }}
                  >
                    Ketuk untuk melihat detail rasio siswa/guru.
                  </div>
                )}
              </div>

              {/* Silhouette Column */}
              <div
                style={{
                  padding: isMobile ? '12px 6px' : '14px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: isMobile ? '12px' : '13px',
                  color: typeof silhouetteValue === 'number' ? '#0f172a' : '#64748b',
                  borderRight: '1px solid #e5e7eb'
                }}
              >
                {typeof silhouetteValue === 'number' ? silhouetteValue.toFixed(3) : '-'}
              </div>

              <div
                style={{
                  padding: isMobile ? '12px 6px' : '14px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: isMobile ? '12px' : '13px',
                  color: '#0f172a',
                  borderRight: '1px solid #e5e7eb'
                }}
              >
                {Number.isFinite(rasioValue) && rasioValue > 0 ? rasioValue.toFixed(2) : '-'}
              </div>

              <div
                style={{
                  padding: isMobile ? '12px 6px' : '14px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span style={{
                  backgroundColor: keterangan === 'Kekurangan' ? '#fee2e2' : keterangan === 'Merata' ? '#dcfce7' : '#fef3c7',
                  color: keterangan === 'Kekurangan' ? '#991b1b' : keterangan === 'Merata' ? '#166534' : '#92400e',
                  border: keterangan === 'Kekurangan' ? '1px solid #fca5a5' : keterangan === 'Merata' ? '1px solid #86efac' : '1px solid #fcd34d',
                  padding: isMobile ? '3px 6px' : '4px 8px',
                  borderRadius: '999px',
                  fontSize: isMobile ? '10px' : '11px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap'
                }}>
                  {keterangan}
                </span>
              </div>




            </div>

            {/* Expandable SD Detail Row */}
            {isExpanded && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  backgroundColor: '#f0f9ff',
                  borderBottom: '2px solid #0284c7',
                  padding: isMobile ? '12px 8px' : '16px 20px'
                }}
              >
                {isLoadingSekolah ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                    Memuat data sekolah...
                  </div>
                ) : sekolahData && sekolahData.sekolahList && sekolahData.sekolahList.length > 0 ? (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
                      Tabel Semua SD
                    </div>
                    <div style={{ fontSize: '12px', color: '#334155', marginBottom: '10px' }}>
                      Menampilkan seluruh sekolah dasar dalam kecamatan ini, diurutkan dari rasio siswa/guru tertinggi ke terendah.
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      <span style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', padding: '4px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700 }}>
                        Kelebihan Guru: {statusCounts['Kelebihan Guru'] || 0}
                      </span>
                      <span style={{ backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #86efac', padding: '4px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700 }}>
                        Seimbang: {statusCounts['Seimbang'] || 0}
                      </span>
                      <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '4px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700 }}>
                        Kekurangan Guru: {statusCounts['Kekurangan Guru'] || 0}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: '#475569', marginBottom: '10px', lineHeight: 1.5 }}>
                      Aturan status: rasio siswa/guru &lt; 18 = <strong>Kelebihan Guru</strong>, rasio 18–20 = <strong>Seimbang</strong>, rasio &gt; 20 = <strong>Kekurangan Guru</strong>.
                    </div>

                    {allSchools.length > 0 ? (
                      isMobile ? (
                        <div style={{ display: 'grid', gap: '8px' }}>
                          {allSchools.map((sd: any, sdIdx: number) => (
                            (() => {
                              const statusStyle = getStatusStyle(sd.kondisiPemerataan || 'Kekurangan Guru');
                              return (
                            <div
                              key={`${kec.id}-sd-mobile-${sd.id}`}
                              style={{
                                backgroundColor: 'white',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                padding: '10px'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#1e3a8a' }}>SD {sdIdx + 1}</div>
                                <span style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, padding: '3px 8px', borderRadius: '999px', fontWeight: 700, fontSize: '10px' }}>
                                  {sd.kondisiPemerataan || '-'}
                                </span>
                              </div>
                              <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: 700, marginBottom: '6px' }}>{sd.nama}</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
                                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px' }}>
                                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>Guru</div>
                                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>{Number(sd.jumlahGuru || 0).toLocaleString('id-ID')}</div>
                                </div>
                                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px' }}>
                                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>Siswa</div>
                                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>{Number(sd.jumlahSiswa || 0).toLocaleString('id-ID')}</div>
                                </div>
                                <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px', padding: '6px' }}>
                                  <div style={{ fontSize: '10px', color: '#9a3412', fontWeight: 700 }}>Rasio S/G</div>
                                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#b91c1c' }}>{Number(sd.rasioSiswaGuru || 0).toFixed(2)}</div>
                                </div>
                              </div>
                            </div>
                              );
                            })()
                          ))}
                        </div>
                      ) : (
                        <div style={{ overflowX: 'auto', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#f8fafc', color: '#334155' }}>
                                <th style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>No</th>
                                <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Nama SD</th>
                                <th style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>Guru</th>
                                <th style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>Siswa</th>
                                <th style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>Rasio S/G</th>
                                <th style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {allSchools.map((sd: any, sdIdx: number) => {
                                const statusStyle = getStatusStyle(sd.kondisiPemerataan || 'Kekurangan Guru');
                                return (
                                <tr key={`${kec.id}-sd-${sd.id}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#1e3a8a' }}>{sdIdx + 1}</td>
                                  <td style={{ padding: '10px 8px', color: '#0f172a', fontWeight: 600 }}>{sd.nama}</td>
                                  <td style={{ padding: '10px 8px', textAlign: 'right', color: '#334155' }}>{Number(sd.jumlahGuru || 0).toLocaleString('id-ID')}</td>
                                  <td style={{ padding: '10px 8px', textAlign: 'right', color: '#334155' }}>{Number(sd.jumlahSiswa || 0).toLocaleString('id-ID')}</td>
                                  <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: '#b91c1c' }}>{Number(sd.rasioSiswaGuru || 0).toFixed(2)}</td>
                                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                                    <span style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, padding: '4px 8px', borderRadius: '999px', fontWeight: 700 }}>
                                      {sd.kondisiPemerataan || '-'}
                                    </span>
                                  </td>
                                </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )
                    ) : (
                      <div style={{ textAlign: 'center', padding: '12px', color: '#64748b', fontSize: '12px' }}>
                        Tidak ada data SD pada periode ini.
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                    {sekolahData?.error || 'Tidak ada data sekolah untuk periode ini'}
                  </div>
                )}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

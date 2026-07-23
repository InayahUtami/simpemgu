'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface ComprehensiveDashboardAnalysisProps {
  pertumbuhanData: Array<{ year: number; tingkat: number }>;
  jumlahPendudukData: Array<{ year: number; jumlahPenduduk: number }>;
  jumlahPendudukDisdukcapilData?: Array<{ year: number; jumlahPendudukDisdukcapil: number }>;
  kelahiranData?: any[];
  kematianData?: any[];
  migrasiData?: any[];
  pyramidData: Array<{ kelompokUmur: string; 'Laki-laki': number; Perempuan: number }>;
  kepadatanData: Array<{ name: string; value: number }>;
  selectedDistrict?: string;
  yearRange?: { from: number; to: number };
  selectedYear?: number;
  activeTab?: string;
  className?: string;
  pieKepadatanMode?: 'kecamatan' | 'tahun';
  kepYear?: number;
  piePersentaseMode?: 'kecamatan' | 'tahun';
  persYear?: number;
  jumlahPendudukDataFromDB?: any[];
  luasWilayahDataFromDB?: any[];
  demogYear?: number;
  pieLuasMode?: 'kecamatan' | 'tahun';
  pieLuasYear?: number | null;
  pieLuasAvailableYears?: number[];
  kelompokUmurDataFromDB?: any[];
  onShowAnalysisChange?: (show: boolean) => void;
  onRefresh?: () => void;
  refreshTrigger?: number;
}

export default function ComprehensiveDashboardAnalysis({
  pertumbuhanData,
  jumlahPendudukData,
  jumlahPendudukDisdukcapilData,
  kelahiranData,
  kematianData,
  migrasiData,
  pyramidData,
  kepadatanData,
  selectedDistrict = '',
  yearRange = { from: 2018, to: 2024 },
  selectedYear,
  activeTab = 'overview',
  className = '',
  pieKepadatanMode = 'kecamatan',
  kepYear,
  piePersentaseMode = 'kecamatan',
  persYear,
  jumlahPendudukDataFromDB = [],
  luasWilayahDataFromDB = [],
  demogYear,
  pieLuasMode = 'kecamatan',
  pieLuasYear,
  pieLuasAvailableYears = [],
  kelompokUmurDataFromDB = [],
  onShowAnalysisChange,
  onRefresh,
  refreshTrigger = 0
}: ComprehensiveDashboardAnalysisProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  // Notify parent when showAnalysis changes
  React.useEffect(() => {
    if (onShowAnalysisChange) {
      onShowAnalysisChange(showAnalysis);
    }
  }, [showAnalysis, onShowAnalysisChange]);
  
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debug log
  React.useEffect(() => {
    console.log('ComprehensiveDashboardAnalysis mounted', {
      pertumbuhanDataLength: pertumbuhanData.length,
      jumlahPendudukDataLength: jumlahPendudukData.length,
      pyramidDataLength: pyramidData.length,
      kepadatanDataLength: kepadatanData.length,
      selectedDistrict,
      yearRange
    });
  }, [pertumbuhanData, jumlahPendudukData, pyramidData, kepadatanData, selectedDistrict, yearRange]);

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Add minimum delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Filter data based on yearRange
      const filteredPertumbuhan = pertumbuhanData.filter(d => d.year >= yearRange.from && d.year <= yearRange.to);
      const filteredJumlahPendudukBPS = jumlahPendudukData.filter(d => d.year >= yearRange.from && d.year <= yearRange.to);
      const filteredJumlahPendudukDisdukcapil = (jumlahPendudukDisdukcapilData || []).filter(d => d.year >= yearRange.from && d.year <= yearRange.to);
      
      // Generate interpretation
      let interpretation = '';
      
      const locationTitle = selectedDistrict ? `Kecamatan ${selectedDistrict}` : `Kota Palembang`;
      
      // Generate different interpretations based on active tab
      if (activeTab === 'overview') {
        interpretation = generateOverviewInterpretation(locationTitle, filteredPertumbuhan, filteredJumlahPendudukBPS, filteredJumlahPendudukDisdukcapil);
      } else if (activeTab === 'districts') {
        interpretation = generateDistrictsInterpretation(locationTitle);
      } else if (activeTab === 'demographics') {
        interpretation = generateDemographicsInterpretation(locationTitle);
      } else if (activeTab === 'growth') {
        interpretation = generateGrowthInterpretation(locationTitle);
      } else {
        interpretation = generateOverviewInterpretation(locationTitle, filteredPertumbuhan, filteredJumlahPendudukBPS, filteredJumlahPendudukDisdukcapil);
      }
      
      setAnalysis(interpretation);
      setShowAnalysis(true);
    } catch (err) {
      console.error('Error generating analysis:', err);
      setError('Terjadi kesalahan saat menganalisis data.');
    } finally {
      setLoading(false);
    }
  };
  
  // Auto-run analysis when refresh is triggered (placed after handleAnalyze definition)
  React.useEffect(() => {
    if (refreshTrigger > 0) {
      handleAnalyze();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);
  
  const generateOverviewInterpretation = (locationTitle: string, filteredPertumbuhan: any[], filteredJumlahPendudukBPS: any[], filteredJumlahPendudukDisdukcapil: any[]) => {
    let interpretation = '';
      
      // 1. LAJU PERTUMBUHAN PENDUDUK BPS
      interpretation += `**1. Laju Pertumbuhan Penduduk ${locationTitle} (${yearRange.from}-${yearRange.to})**\n\n`;
      
      if (filteredPertumbuhan.length > 0) {
        // Check if first year has 0 value (no previous year data)
        const hasZeroFirstYear = filteredPertumbuhan[0].tingkat === 0;
        
        if (hasZeroFirstYear && filteredPertumbuhan.length > 1) {
          interpretation += `Pada tahun ${filteredPertumbuhan[0].year}, laju pertumbuhan tercatat 0% karena tidak tersedia data tahun sebelumnya (${filteredPertumbuhan[0].year - 1}) sebagai pembanding. `;
        }
        
        for (let i = 0; i < filteredPertumbuhan.length; i++) {
          const current = filteredPertumbuhan[i];
          
          // Skip first year if it's 0 (already explained above)
          if (i === 0 && current.tingkat === 0 && filteredPertumbuhan.length > 1) {
            continue;
          }
          
          if (i === 0 || (i === 1 && filteredPertumbuhan[0].tingkat === 0)) {
            interpretation += `Pada tahun ${current.year}, laju pertumbuhan penduduk tercatat sebesar ${current.tingkat.toFixed(2)}%. `;
          } else {
            const previous = filteredPertumbuhan[i - 1];
            const change = current.tingkat - previous.tingkat;
            
            if (change > 0) {
              interpretation += `Tahun ${current.year} mengalami peningkatan dari ${previous.tingkat.toFixed(2)}% menjadi ${current.tingkat.toFixed(2)}%. `;
            } else if (change < 0) {
              interpretation += `Tahun ${current.year} mengalami penurunan dari ${previous.tingkat.toFixed(2)}% menjadi ${current.tingkat.toFixed(2)}%. `;
            } else {
              interpretation += `Tahun ${current.year} tetap stabil pada ${current.tingkat.toFixed(2)}%. `;
            }
          }
        }
        
        // Find first non-zero year and last year for overall trend
        const firstNonZeroIndex = filteredPertumbuhan.findIndex(d => d.tingkat !== 0);
        if (firstNonZeroIndex >= 0 && firstNonZeroIndex < filteredPertumbuhan.length - 1) {
          const firstYear = filteredPertumbuhan[firstNonZeroIndex];
          const lastYear = filteredPertumbuhan[filteredPertumbuhan.length - 1];
          const overallChange = lastYear.tingkat - firstYear.tingkat;
          
          interpretation += `Secara keseluruhan dari tahun ${firstYear.year} hingga ${lastYear.year}, laju pertumbuhan penduduk `;
          if (overallChange > 0) {
            interpretation += `mengalami tren peningkatan dari ${firstYear.tingkat.toFixed(2)}% menjadi ${lastYear.tingkat.toFixed(2)}%.\n\n`;
          } else if (overallChange < 0) {
            interpretation += `mengalami tren penurunan dari ${firstYear.tingkat.toFixed(2)}% menjadi ${lastYear.tingkat.toFixed(2)}%.\n\n`;
          } else {
            interpretation += `relatif stabil pada ${firstYear.tingkat.toFixed(2)}%.\n\n`;
          }
        } else {
          interpretation += '\n\n';
        }
      } else {
        interpretation += 'Data tidak tersedia untuk periode yang dipilih.\n\n';
      }
      
      // 2. LAJU PERTUMBUHAN LPLKM DINAS PENDIDIKAN KOTA PALEMBANG (calculated from kelahiran, kematian, migrasi)
      interpretation += `**2. Laju Pertumbuhan LPLKM ${locationTitle} (${yearRange.from}-${yearRange.to})**\n\n`;
      
      if (kelahiranData && kematianData && migrasiData && filteredJumlahPendudukDisdukcapil.length > 0) {
        // Calculate LPLKM for each year
        const lplkmData: { year: number; lplkm: number; kelahiran: number; kematian: number; migrasiMasuk: number; migrasiKeluar: number }[] = [];
        
        for (let year = yearRange.from; year <= yearRange.to; year++) {
          // Sum kelahiran for the year
          let totalKelahiran = 0;
          kelahiranData.forEach((item: any) => {
            if (selectedDistrict) {
              if (item.kecamatan === selectedDistrict) {
                totalKelahiran += item.dataByYear?.[year]?.kelahiran || 0;
              }
            } else {
              totalKelahiran += item.dataByYear?.[year]?.kelahiran || 0;
            }
          });
          
          // Sum kematian for the year
          let totalKematian = 0;
          kematianData.forEach((item: any) => {
            if (selectedDistrict) {
              if (item.kecamatan === selectedDistrict) {
                totalKematian += item.dataByYear?.[year]?.kematian || 0;
              }
            } else {
              totalKematian += item.dataByYear?.[year]?.kematian || 0;
            }
          });
          
          // Sum migrasi for the year
          let totalMigrasiMasuk = 0;
          let totalMigrasiKeluar = 0;
          migrasiData.forEach((item: any) => {
            if (selectedDistrict) {
              if (item.kecamatan === selectedDistrict) {
                totalMigrasiMasuk += item.dataByYear?.[year]?.masuk || 0;
                totalMigrasiKeluar += item.dataByYear?.[year]?.keluar || 0;
              }
            } else {
              totalMigrasiMasuk += item.dataByYear?.[year]?.masuk || 0;
              totalMigrasiKeluar += item.dataByYear?.[year]?.keluar || 0;
            }
          });
          
          // Get population for the year
          const pendudukData = filteredJumlahPendudukDisdukcapil.find(d => d.year === year);
          const jumlahPenduduk = pendudukData?.jumlahPendudukDisdukcapil || 0;
          
          // Calculate LPLKM: ((L - M) + (Mi - Mo)) / P * 100
          const pertumbuhanAlami = totalKelahiran - totalKematian;
          const migrasiNeto = totalMigrasiMasuk - totalMigrasiKeluar;
          const lplkm = jumlahPenduduk > 0 ? ((pertumbuhanAlami + migrasiNeto) / jumlahPenduduk) * 100 : 0;
          
          lplkmData.push({
            year,
            lplkm,
            kelahiran: totalKelahiran,
            kematian: totalKematian,
            migrasiMasuk: totalMigrasiMasuk,
            migrasiKeluar: totalMigrasiKeluar
          });
        }
        
        // Generate interpretation
        for (let i = 0; i < lplkmData.length; i++) {
          const current = lplkmData[i];
          const pertumbuhanAlami = current.kelahiran - current.kematian;
          const migrasiNeto = current.migrasiMasuk - current.migrasiKeluar;
          
          // Check if LPLKM is 0 due to missing population data
          if (current.lplkm === 0 && (current.kelahiran > 0 || current.kematian > 0 || current.migrasiMasuk > 0 || current.migrasiKeluar > 0)) {
            interpretation += `Pada tahun ${current.year}, LPLKM tercatat 0% karena data jumlah penduduk tidak tersedia, meskipun terdapat kelahiran ${current.kelahiran.toLocaleString('id-ID')} jiwa, kematian ${current.kematian.toLocaleString('id-ID')} jiwa, migrasi masuk ${current.migrasiMasuk.toLocaleString('id-ID')} jiwa, dan migrasi keluar ${current.migrasiKeluar.toLocaleString('id-ID')} jiwa. `;
            continue;
          }
          
          // Check if all data is 0 (no data available)
          if (current.lplkm === 0 && current.kelahiran === 0 && current.kematian === 0 && current.migrasiMasuk === 0 && current.migrasiKeluar === 0) {
            interpretation += `Pada tahun ${current.year}, LPLKM tercatat 0% karena data kelahiran, kematian, dan migrasi belum tersedia. `;
            continue;
          }
          
          if (i === 0) {
            interpretation += `Pada tahun ${current.year}, LPLKM tercatat sebesar ${current.lplkm.toFixed(2)}% dengan kelahiran ${current.kelahiran.toLocaleString('id-ID')} jiwa, kematian ${current.kematian.toLocaleString('id-ID')} jiwa (pertumbuhan alami: ${pertumbuhanAlami.toLocaleString('id-ID')} jiwa), migrasi masuk ${current.migrasiMasuk.toLocaleString('id-ID')} jiwa, dan migrasi keluar ${current.migrasiKeluar.toLocaleString('id-ID')} jiwa. `;
          } else {
            const previous = lplkmData[i - 1];
            const change = current.lplkm - previous.lplkm;
            
            if (change > 0) {
              interpretation += `Tahun ${current.year} mengalami peningkatan dari ${previous.lplkm.toFixed(2)}% menjadi ${current.lplkm.toFixed(2)}% dengan kelahiran ${current.kelahiran.toLocaleString('id-ID')} jiwa, kematian ${current.kematian.toLocaleString('id-ID')} jiwa (pertumbuhan alami: ${pertumbuhanAlami.toLocaleString('id-ID')} jiwa), migrasi masuk ${current.migrasiMasuk.toLocaleString('id-ID')} jiwa dan migrasi keluar ${current.migrasiKeluar.toLocaleString('id-ID')} jiwa. `;
            } else if (change < 0) {
              interpretation += `Tahun ${current.year} mengalami penurunan dari ${previous.lplkm.toFixed(2)}% menjadi ${current.lplkm.toFixed(2)}% dengan kelahiran ${current.kelahiran.toLocaleString('id-ID')} jiwa, kematian ${current.kematian.toLocaleString('id-ID')} jiwa (pertumbuhan alami: ${pertumbuhanAlami.toLocaleString('id-ID')} jiwa), migrasi masuk ${current.migrasiMasuk.toLocaleString('id-ID')} jiwa dan migrasi keluar ${current.migrasiKeluar.toLocaleString('id-ID')} jiwa. `;
            } else {
              interpretation += `Tahun ${current.year} tetap stabil pada ${current.lplkm.toFixed(2)}% dengan kelahiran ${current.kelahiran.toLocaleString('id-ID')} jiwa, kematian ${current.kematian.toLocaleString('id-ID')} jiwa (pertumbuhan alami: ${pertumbuhanAlami.toLocaleString('id-ID')} jiwa), migrasi masuk ${current.migrasiMasuk.toLocaleString('id-ID')} jiwa dan migrasi keluar ${current.migrasiKeluar.toLocaleString('id-ID')} jiwa. `;
            }
          }
        }
        
        if (lplkmData.length > 0) {
          const firstYear = lplkmData[0];
          const lastYear = lplkmData[lplkmData.length - 1];
          const overallChange = lastYear.lplkm - firstYear.lplkm;
          
          interpretation += `Secara keseluruhan dalam periode ${yearRange.from}-${yearRange.to}, LPLKM `;
          if (overallChange > 0) {
            interpretation += `mengalami tren peningkatan dari ${firstYear.lplkm.toFixed(2)}% menjadi ${lastYear.lplkm.toFixed(2)}%.\n\n`;
          } else if (overallChange < 0) {
            interpretation += `mengalami tren penurunan dari ${firstYear.lplkm.toFixed(2)}% menjadi ${lastYear.lplkm.toFixed(2)}%.\n\n`;
          } else {
            interpretation += `relatif stabil pada ${firstYear.lplkm.toFixed(2)}%.\n\n`;
          }
        }
      } else {
        interpretation += 'Data LPLKM tidak tersedia atau data penduduk Dinas Pendidikan Kota Palembang tidak lengkap untuk periode yang dipilih.\n\n';
      }
      
      // 3. JUMLAH PENDUDUK BPS
      interpretation += `**3. Jumlah Penduduk BPS ${locationTitle} (${yearRange.from}-${yearRange.to})**\n\n`;
      
      if (filteredJumlahPendudukBPS.length > 0) {
        for (let i = 0; i < filteredJumlahPendudukBPS.length; i++) {
          const current = filteredJumlahPendudukBPS[i];
          if (i === 0) {
            interpretation += `Pada tahun ${current.year}, jumlah penduduk tercatat sebesar ${current.jumlahPenduduk.toLocaleString('id-ID')} jiwa. `;
          } else {
            const previous = filteredJumlahPendudukBPS[i - 1];
            const change = current.jumlahPenduduk - previous.jumlahPenduduk;
            
            if (change > 0) {
              interpretation += `Tahun ${current.year} mengalami peningkatan dari ${previous.jumlahPenduduk.toLocaleString('id-ID')} jiwa menjadi ${current.jumlahPenduduk.toLocaleString('id-ID')} jiwa. `;
            } else if (change < 0) {
              interpretation += `Tahun ${current.year} mengalami penurunan dari ${previous.jumlahPenduduk.toLocaleString('id-ID')} jiwa menjadi ${current.jumlahPenduduk.toLocaleString('id-ID')} jiwa. `;
            } else {
              interpretation += `Tahun ${current.year} tetap stabil pada ${current.jumlahPenduduk.toLocaleString('id-ID')} jiwa. `;
            }
          }
        }
        
        const firstYearBPS = filteredJumlahPendudukBPS[0];
        const lastYearBPS = filteredJumlahPendudukBPS[filteredJumlahPendudukBPS.length - 1];
        const overallChangeBPS = lastYearBPS.jumlahPenduduk - firstYearBPS.jumlahPenduduk;
        
        interpretation += `Secara keseluruhan dalam periode ${yearRange.from}-${yearRange.to}, jumlah penduduk `;
        if (overallChangeBPS > 0) {
          interpretation += `mengalami peningkatan dari ${firstYearBPS.jumlahPenduduk.toLocaleString('id-ID')} jiwa menjadi ${lastYearBPS.jumlahPenduduk.toLocaleString('id-ID')} jiwa.\n\n`;
        } else if (overallChangeBPS < 0) {
          interpretation += `mengalami penurunan dari ${firstYearBPS.jumlahPenduduk.toLocaleString('id-ID')} jiwa menjadi ${lastYearBPS.jumlahPenduduk.toLocaleString('id-ID')} jiwa.\n\n`;
        } else {
          interpretation += `relatif stabil pada ${firstYearBPS.jumlahPenduduk.toLocaleString('id-ID')} jiwa.\n\n`;
        }
      } else {
        interpretation += 'Data tidak tersedia untuk periode yang dipilih.\n\n';
      }
      
      // 4. JUMLAH PENDUDUK DINAS PENDIDIKAN KOTA PALEMBANG
      interpretation += `**4. Jumlah Penduduk Dinas Pendidikan Kota Palembang ${locationTitle} (${yearRange.from}-${yearRange.to})**\n\n`;
      
      if (filteredJumlahPendudukDisdukcapil.length > 0) {
        for (let i = 0; i < filteredJumlahPendudukDisdukcapil.length; i++) {
          const current = filteredJumlahPendudukDisdukcapil[i];
          if (i === 0) {
            interpretation += `Pada tahun ${current.year}, jumlah penduduk tercatat sebesar ${current.jumlahPendudukDisdukcapil.toLocaleString('id-ID')} jiwa. `;
          } else {
            const previous = filteredJumlahPendudukDisdukcapil[i - 1];
            const change = current.jumlahPendudukDisdukcapil - previous.jumlahPendudukDisdukcapil;
            
            if (change > 0) {
              interpretation += `Tahun ${current.year} mengalami peningkatan dari ${previous.jumlahPendudukDisdukcapil.toLocaleString('id-ID')} jiwa menjadi ${current.jumlahPendudukDisdukcapil.toLocaleString('id-ID')} jiwa. `;
            } else if (change < 0) {
              interpretation += `Tahun ${current.year} mengalami penurunan dari ${previous.jumlahPendudukDisdukcapil.toLocaleString('id-ID')} jiwa menjadi ${current.jumlahPendudukDisdukcapil.toLocaleString('id-ID')} jiwa. `;
            } else {
              interpretation += `Tahun ${current.year} tetap stabil pada ${current.jumlahPendudukDisdukcapil.toLocaleString('id-ID')} jiwa. `;
            }
          }
        }
        
        const firstYearDisdukcapil = filteredJumlahPendudukDisdukcapil[0];
        const lastYearDisdukcapil = filteredJumlahPendudukDisdukcapil[filteredJumlahPendudukDisdukcapil.length - 1];
        const overallChangeDisdukcapil = lastYearDisdukcapil.jumlahPendudukDisdukcapil - firstYearDisdukcapil.jumlahPendudukDisdukcapil;
        
        interpretation += `Secara keseluruhan dalam periode ${yearRange.from}-${yearRange.to}, jumlah penduduk `;
        if (overallChangeDisdukcapil > 0) {
          interpretation += `mengalami peningkatan dari ${firstYearDisdukcapil.jumlahPendudukDisdukcapil.toLocaleString('id-ID')} jiwa menjadi ${lastYearDisdukcapil.jumlahPendudukDisdukcapil.toLocaleString('id-ID')} jiwa.`;
        } else if (overallChangeDisdukcapil < 0) {
          interpretation += `mengalami penurunan dari ${firstYearDisdukcapil.jumlahPendudukDisdukcapil.toLocaleString('id-ID')} jiwa menjadi ${lastYearDisdukcapil.jumlahPendudukDisdukcapil.toLocaleString('id-ID')} jiwa.`;
        } else {
          interpretation += `relatif stabil pada ${firstYearDisdukcapil.jumlahPendudukDisdukcapil.toLocaleString('id-ID')} jiwa.`;
        }
      } else {
        interpretation += 'Data tidak tersedia untuk periode yang dipilih.';
      }
      
      return interpretation;
    };
  
  const generateDistrictsInterpretation = (locationTitle: string) => {
    let interpretation = `**Analisis Grafik Populasi ${locationTitle}**\n\n`;
    
    // 1. Kelahiran & Kematian
    interpretation += `**1. Grafik Kelahiran & Kematian (${yearRange.from}-${yearRange.to})**\n\n`;
    
    if (kelahiranData && kematianData) {
      const yearData: { year: number; kelahiran: number; kematian: number }[] = [];
      
      for (let year = yearRange.from; year <= yearRange.to; year++) {
        let totalKelahiran = 0;
        let totalKematian = 0;
        
        kelahiranData.forEach((item: any) => {
          if (selectedDistrict) {
            if (item.kecamatan === selectedDistrict) {
              totalKelahiran += item.dataByYear?.[year]?.kelahiran || 0;
            }
          } else {
            totalKelahiran += item.dataByYear?.[year]?.kelahiran || 0;
          }
        });
        
        kematianData.forEach((item: any) => {
          if (selectedDistrict) {
            if (item.kecamatan === selectedDistrict) {
              totalKematian += item.dataByYear?.[year]?.kematian || 0;
            }
          } else {
            totalKematian += item.dataByYear?.[year]?.kematian || 0;
          }
        });
        
        yearData.push({ year, kelahiran: totalKelahiran, kematian: totalKematian });
      }
      
      for (let i = 0; i < yearData.length; i++) {
        const current = yearData[i];
        const pertumbuhanAlami = current.kelahiran - current.kematian;
        
        if (i === 0) {
          interpretation += `Pada tahun ${current.year}, terdapat ${current.kelahiran.toLocaleString('id-ID')} kelahiran dan ${current.kematian.toLocaleString('id-ID')} kematian, menghasilkan pertumbuhan alami sebesar ${pertumbuhanAlami.toLocaleString('id-ID')} jiwa. `;
        } else {
          const previous = yearData[i - 1];
          interpretation += `Tahun ${current.year} mencatat ${current.kelahiran.toLocaleString('id-ID')} kelahiran dan ${current.kematian.toLocaleString('id-ID')} kematian (pertumbuhan alami: ${pertumbuhanAlami.toLocaleString('id-ID')} jiwa). `;
        }
      }
      interpretation += '\n\n';
    } else {
      interpretation += 'Data kelahiran dan kematian tidak tersedia.\n\n';
    }
    
    // 2. Migrasi
    interpretation += `**2. Grafik Migrasi Masuk & Keluar (${yearRange.from}-${yearRange.to})**\n\n`;
    
    if (migrasiData) {
      const yearData: { year: number; masuk: number; keluar: number }[] = [];
      
      for (let year = yearRange.from; year <= yearRange.to; year++) {
        let totalMasuk = 0;
        let totalKeluar = 0;
        
        migrasiData.forEach((item: any) => {
          if (selectedDistrict) {
            if (item.kecamatan === selectedDistrict) {
              totalMasuk += item.dataByYear?.[year]?.masuk || 0;
              totalKeluar += item.dataByYear?.[year]?.keluar || 0;
            }
          } else {
            totalMasuk += item.dataByYear?.[year]?.masuk || 0;
            totalKeluar += item.dataByYear?.[year]?.keluar || 0;
          }
        });
        
        yearData.push({ year, masuk: totalMasuk, keluar: totalKeluar });
      }
      
      for (let i = 0; i < yearData.length; i++) {
        const current = yearData[i];
        
        interpretation += `Tahun ${current.year}: ${current.masuk.toLocaleString('id-ID')} migrasi masuk, ${current.keluar.toLocaleString('id-ID')} migrasi keluar. `;
      }
      interpretation += '\n\n';
    } else {
      interpretation += 'Data migrasi tidak tersedia.\n\n';
    }
    
    // 3. Kepadatan Penduduk
    interpretation += `**3. Kepadatan Penduduk**\n\n`;
    
    if (jumlahPendudukDataFromDB.length > 0 && luasWilayahDataFromDB.length > 0) {
      const yearForDensity = kepYear || selectedYear || yearRange.to;
      
      if (pieKepadatanMode === 'kecamatan') {
        // Mode per kecamatan - hitung kepadatan setiap kecamatan untuk tahun dipilih
        const kepadatanByKec = jumlahPendudukDataFromDB.map((jpItem: any) => {
          const kecamatanName = jpItem.kecamatan;
          const jumlahPenduduk = jpItem.dataByYear?.[yearForDensity]?.jumlahPenduduk || 0;
          const luasItem = luasWilayahDataFromDB.find((lw: any) => lw.kecamatan === kecamatanName);
          const luasWilayah = luasItem?.dataByYear?.[yearForDensity]?.luasWilayah || 0;
          const value = luasWilayah > 0 ? jumlahPenduduk / luasWilayah : 0;
          return { name: kecamatanName, value };
        }).filter((d: any) => d.value > 0).sort((a: any, b: any) => b.value - a.value);
        
        interpretation += `Pada tahun ${yearForDensity}, distribusi kepadatan penduduk per kecamatan menunjukkan variasi yang signifikan. `;
        
        if (kepadatanByKec.length > 0) {
          const tertinggi = kepadatanByKec[0];
          const terendah = kepadatanByKec[kepadatanByKec.length - 1];
          
          interpretation += `Kecamatan dengan kepadatan tertinggi adalah ${tertinggi.name} dengan ${tertinggi.value.toFixed(2)} jiwa/kmÂ², `;
          interpretation += `sedangkan kepadatan terendah berada di ${terendah.name} dengan ${terendah.value.toFixed(2)} jiwa/kmÂ². `;
          
          interpretation += `\n\nData Lengkap Kepadatan Penduduk Semua Kecamatan (Tahun ${yearForDensity}):\n`;
          kepadatanByKec.forEach((item: any, index: number) => {
            interpretation += `${index + 1}. ${item.name}: ${item.value.toFixed(2)} jiwa/kmÂ²\n`;
          });
        }
      } else {
        // Mode per tahun - total kepadatan rata-rata per tahun
        const yearSet = new Set<number>();
        jumlahPendudukDataFromDB.forEach((item: any) => {
          Object.keys(item.dataByYear || {}).forEach((year: string) => yearSet.add(parseInt(year)));
        });
        const years = Array.from(yearSet).sort((a, b) => a - b);
        
        const kepadatanByYear: { year: number; kepadatan: number }[] = [];
        years.forEach(year => {
          let totalPenduduk = 0;
          let totalLuas = 0;
          jumlahPendudukDataFromDB.forEach((jpItem: any) => {
            totalPenduduk += jpItem.dataByYear?.[year]?.jumlahPenduduk || 0;
            const luasItem = luasWilayahDataFromDB.find((lw: any) => lw.kecamatan === jpItem.kecamatan);
            totalLuas += luasItem?.dataByYear?.[year]?.luasWilayah || 0;
          });
          const kepadatanTotal = totalLuas > 0 ? totalPenduduk / totalLuas : 0;
          kepadatanByYear.push({ year, kepadatan: kepadatanTotal });
        });
        
        if (kepadatanByYear.length > 0) {
          const tertinggi = kepadatanByYear.reduce((max, item) => item.kepadatan > max.kepadatan ? item : max, kepadatanByYear[0]);
          const terendah = kepadatanByYear.reduce((min, item) => item.kepadatan < min.kepadatan ? item : min, kepadatanByYear[0]);
          
          interpretation += `Perkembangan kepadatan penduduk rata-rata Kota Palembang menunjukkan dinamika dari tahun ke tahun. `;
          interpretation += `Kepadatan tertinggi tercatat pada tahun ${tertinggi.year} dengan ${tertinggi.kepadatan.toFixed(2)} jiwa/kmÂ², `;
          interpretation += `sedangkan kepadatan terendah terjadi pada tahun ${terendah.year} dengan ${terendah.kepadatan.toFixed(2)} jiwa/kmÂ². `;
          
          // Analisis tren
          if (kepadatanByYear.length >= 2) {
            const awal = kepadatanByYear[0];
            const akhir = kepadatanByYear[kepadatanByYear.length - 1];
            const perubahan = ((akhir.kepadatan - awal.kepadatan) / awal.kepadatan * 100).toFixed(2);
            const tren = akhir.kepadatan > awal.kepadatan ? 'meningkat' : 'menurun';
            interpretation += `Dari tahun ${awal.year} hingga ${akhir.year}, kepadatan penduduk ${tren} sebesar ${Math.abs(parseFloat(perubahan))}%.`;
          }
          
          interpretation += `\n\nData Lengkap Kepadatan Penduduk per Tahun:\n`;
          kepadatanByYear.forEach((item, index) => {
            interpretation += `${index + 1}. Tahun ${item.year}: ${item.kepadatan.toFixed(2)} jiwa/kmÂ²\n`;
          });
        }
      }
      interpretation += '\n';
    } else {
      interpretation += 'Data kepadatan penduduk tidak tersedia.\n\n';
    }
    
    // 4. Persentase Penduduk
    interpretation += `**4. Persentase Penduduk**\n\n`;
    
    if (jumlahPendudukDataFromDB.length > 0) {
      const yearForPercentage = persYear || selectedYear || yearRange.to;
      
      if (piePersentaseMode === 'kecamatan') {
        // Mode per kecamatan - hitung persentase setiap kecamatan untuk tahun dipilih
        let totalPenduduk = 0;
        jumlahPendudukDataFromDB.forEach((item: any) => {
          totalPenduduk += item.dataByYear?.[yearForPercentage]?.jumlahPenduduk || 0;
        });
        
        if (totalPenduduk > 0) {
          const kecamatanPercentages = jumlahPendudukDataFromDB
            .map((item: any) => {
              const jumlah = item.dataByYear?.[yearForPercentage]?.jumlahPenduduk || 0;
              const persentase = (jumlah / totalPenduduk) * 100;
              return {
                name: item.kecamatan,
                jumlah: jumlah,
                persentase: persentase.toFixed(2)
              };
            })
            .filter((d: any) => d.jumlah > 0)
            .sort((a: any, b: any) => b.jumlah - a.jumlah);
          
          interpretation += `Pada tahun ${yearForPercentage}, total penduduk keseluruhan: ${totalPenduduk.toLocaleString('id-ID')} jiwa.\n\n`;
          interpretation += `Data Lengkap Persentase Penduduk Semua Kecamatan:\n`;
          kecamatanPercentages.forEach((item: any, index: number) => {
            interpretation += `${index + 1}. ${item.name}: ${item.jumlah.toLocaleString('id-ID')} jiwa (${item.persentase}%)\n`;
          });
        } else {
          interpretation += `Data jumlah penduduk tidak tersedia untuk tahun ${yearForPercentage}.\n\n`;
        }
      } else {
        // Mode per tahun - total penduduk per tahun dengan analisis pertumbuhan
        const yearSet = new Set<number>();
        jumlahPendudukDataFromDB.forEach((item: any) => {
          Object.keys(item.dataByYear || {}).forEach((year: string) => yearSet.add(parseInt(year)));
        });
        const years = Array.from(yearSet).sort((a, b) => a - b);
        
        const pendudukByYear: { year: number; jumlah: number }[] = [];
        years.forEach(year => {
          let totalPenduduk = 0;
          jumlahPendudukDataFromDB.forEach((item: any) => {
            totalPenduduk += item.dataByYear?.[year]?.jumlahPenduduk || 0;
          });
          pendudukByYear.push({ year, jumlah: totalPenduduk });
        });
        
        if (pendudukByYear.length > 0) {
          const tertinggi = pendudukByYear.reduce((max, item) => item.jumlah > max.jumlah ? item : max, pendudukByYear[0]);
          const terendah = pendudukByYear.reduce((min, item) => item.jumlah < min.jumlah ? item : min, pendudukByYear[0]);
          
          interpretation += `Perkembangan total jumlah penduduk Kota Palembang menunjukkan dinamika dari tahun ke tahun. `;
          interpretation += `Jumlah penduduk tertinggi tercatat pada tahun ${tertinggi.year} dengan ${tertinggi.jumlah.toLocaleString('id-ID')} jiwa, `;
          interpretation += `sedangkan jumlah terendah berada pada tahun ${terendah.year} dengan ${terendah.jumlah.toLocaleString('id-ID')} jiwa. `;
          
          // Analisis pertumbuhan
          if (pendudukByYear.length >= 2) {
            const awal = pendudukByYear[0];
            const akhir = pendudukByYear[pendudukByYear.length - 1];
            const pertumbuhan = akhir.jumlah - awal.jumlah;
            const persentasePertumbuhan = ((pertumbuhan / awal.jumlah) * 100).toFixed(2);
            const tren = pertumbuhan > 0 ? 'bertambah' : 'berkurang';
            interpretation += `Dari tahun ${awal.year} ke ${akhir.year}, penduduk ${tren} sebanyak ${Math.abs(pertumbuhan).toLocaleString('id-ID')} jiwa atau ${Math.abs(parseFloat(persentasePertumbuhan))}%.`;
          }
          
          interpretation += `\n\nData Lengkap Jumlah Penduduk per Tahun:\n`;
          pendudukByYear.forEach((item, index) => {
            interpretation += `${index + 1}. Tahun ${item.year}: ${item.jumlah.toLocaleString('id-ID')} jiwa\n`;
          });
        }
      }
      interpretation += '\n';
    } else {
      interpretation += 'Data jumlah penduduk tidak tersedia.\n\n';
    }
    
    return interpretation;
  };
  
  const generateDemographicsInterpretation = (locationTitle: string) => {
    let interpretation = `**Analisis Demografi Penduduk ${locationTitle}**\n\n`;
    
    const yearForDemog = demogYear || selectedYear || yearRange.to;
    
    // Population Pyramid Analysis
    interpretation += `**1. Piramida Penduduk (Tahun ${yearForDemog})**\n\n`;
    
    if (kelompokUmurDataFromDB && kelompokUmurDataFromDB.length > 0) {
      // Build pyramid data from kelompokUmurDataFromDB
      const flatData: any[] = [];
      kelompokUmurDataFromDB.forEach((item: any) => {
        const yearData = item.dataByYear?.[yearForDemog];
        if (yearData && item.kelompokUmur) {
          flatData.push({
            kelompokUmur: item.kelompokUmur,
            lakiLaki: yearData.laki_laki || 0,
            perempuan: yearData.perempuan || 0
          });
        }
      });
      
      // Filter skip '101'/'100' and empty
      const filtered = flatData.filter((d: any) => d.kelompokUmur && d.kelompokUmur !== '101' && d.kelompokUmur !== '100');
      
      // Sort by kelompokUmur
      filtered.sort((a: any, b: any) => {
        const getStart = (s: string) => parseInt((s || '').split('-')[0]) || 0;
        return getStart(a.kelompokUmur) - getStart(b.kelompokUmur);
      });
      
      let totalLakiLaki = 0;
      let totalPerempuan = 0;
      
      filtered.forEach(item => {
        totalLakiLaki += item.lakiLaki || 0;
        totalPerempuan += item.perempuan || 0;
      });
      
      const totalPenduduk = totalLakiLaki + totalPerempuan;
      const rasioJK = totalPerempuan > 0 ? (totalLakiLaki / totalPerempuan * 100).toFixed(2) : '0';
      
      interpretation += `Struktur penduduk menunjukkan distribusi sebanyak ${totalLakiLaki.toLocaleString('id-ID')} laki-laki dan ${totalPerempuan.toLocaleString('id-ID')} perempuan dengan total ${totalPenduduk.toLocaleString('id-ID')} jiwa. Rasio jenis kelamin tercatat ${rasioJK}%, yang berarti terdapat ${rasioJK} laki-laki untuk setiap 100 perempuan.\n\n`;
      
      // Analyze age groups
      const youngAge = filtered.filter(item => {
        const age = parseInt(item.kelompokUmur.split('-')[0]);
        return age < 15;
      });
      const productiveAge = filtered.filter(item => {
        const age = parseInt(item.kelompokUmur.split('-')[0]);
        return age >= 15 && age < 65;
      });
      const elderlyAge = filtered.filter(item => {
        const age = parseInt(item.kelompokUmur.split('-')[0]);
        return age >= 65 || item.kelompokUmur.includes('+');
      });
      
      let youngTotal = 0, productiveTotal = 0, elderlyTotal = 0;
      youngAge.forEach(item => youngTotal += (item.lakiLaki || 0) + (item.perempuan || 0));
      productiveAge.forEach(item => productiveTotal += (item.lakiLaki || 0) + (item.perempuan || 0));
      elderlyAge.forEach(item => elderlyTotal += (item.lakiLaki || 0) + (item.perempuan || 0));
      
      const youngPct = ((youngTotal / totalPenduduk) * 100).toFixed(2);
      const productivePct = ((productiveTotal / totalPenduduk) * 100).toFixed(2);
      const elderlyPct = ((elderlyTotal / totalPenduduk) * 100).toFixed(2);
      
      interpretation += `**Distribusi Kelompok Umur:**\n`;
      interpretation += `- Usia Muda (0-14 tahun): ${youngTotal.toLocaleString('id-ID')} jiwa (${youngPct}%)\n`;
      interpretation += `- Usia Produktif (15-64 tahun): ${productiveTotal.toLocaleString('id-ID')} jiwa (${productivePct}%)\n`;
      interpretation += `- Lansia (65+ tahun): ${elderlyTotal.toLocaleString('id-ID')} jiwa (${elderlyPct}%)\n\n`;
      
      // Detail lengkap per kelompok umur
      interpretation += `**Data Lengkap Kelompok Umur (Tahun ${yearForDemog}):**\n\n`;
      filtered.forEach((item: any, index: number) => {
        const total = (item.lakiLaki || 0) + (item.perempuan || 0);
        const pct = totalPenduduk > 0 ? ((total / totalPenduduk) * 100).toFixed(2) : '0';
        interpretation += `${index + 1}. Kelompok ${item.kelompokUmur} tahun:\n`;
        interpretation += `   - Laki-laki: ${(item.lakiLaki || 0).toLocaleString('id-ID')} jiwa\n`;
        interpretation += `   - Perempuan: ${(item.perempuan || 0).toLocaleString('id-ID')} jiwa\n`;
        interpretation += `   - Total: ${total.toLocaleString('id-ID')} jiwa (${pct}%)\n\n`;
      });
      
      // Rasio Jenis Kelamin per Kelompok Umur
      interpretation += `**2. Rasio Jenis Kelamin per Kelompok Umur (Tahun ${yearForDemog})**\n\n`;
      interpretation += `Rasio jenis kelamin menunjukkan jumlah laki-laki per 100 perempuan pada setiap kelompok umur. Rasio di atas 100 menunjukkan laki-laki lebih banyak, sedangkan di bawah 100 menunjukkan perempuan lebih banyak.\n\n`;
      interpretation += `**Data Lengkap Rasio Jenis Kelamin per Kelompok Umur:**\n\n`;
      filtered.forEach((item: any, index: number) => {
        const rasio = (item.perempuan || 0) > 0 ? ((item.lakiLaki / item.perempuan) * 100).toFixed(2) : '0';
        const status = parseFloat(rasio) > 100 ? '(Laki-laki > Perempuan)' : parseFloat(rasio) < 100 ? '(Perempuan > Laki-laki)' : '(Seimbang)';
        interpretation += `${index + 1}. Kelompok ${item.kelompokUmur} tahun: ${rasio} ${status}\n`;
      });
      interpretation += '\n';
    } else {
      interpretation += 'Data piramida penduduk tidak tersedia.\n\n';
    }
    
    return interpretation;
  };
  
  const generateGrowthInterpretation = (locationTitle: string) => {
    let interpretation = `**Analisis Luas Wilayah ${locationTitle}**\n\n`;
    
    interpretation += `**Distribusi Luas Wilayah**\n\n`;
    
    if (luasWilayahDataFromDB && luasWilayahDataFromDB.length > 0) {
      // Use pieLuasYear if set, otherwise use latest year from available years
      const defaultYear = pieLuasAvailableYears.length > 0 ? pieLuasAvailableYears[pieLuasAvailableYears.length - 1] : (selectedYear || yearRange.to);
      const yearForLuas = pieLuasYear !== null && pieLuasYear !== undefined ? pieLuasYear : defaultYear;
      
      if (pieLuasMode === 'kecamatan') {
        // Mode per kecamatan - tampilkan luas wilayah setiap kecamatan untuk tahun dipilih
        const luasByKec = luasWilayahDataFromDB.map((item: any) => {
          const kecamatanName = item.kecamatan;
          const luasWilayah = item.dataByYear?.[yearForLuas]?.luasWilayah || 0;
          return { name: kecamatanName, value: luasWilayah };
        }).filter((d: any) => d.value > 0).sort((a: any, b: any) => b.value - a.value);
        
        if (luasByKec.length > 0) {
          const totalLuas = luasByKec.reduce((sum: number, item: any) => sum + item.value, 0);
          const terluas = luasByKec[0];
          const tersempit = luasByKec[luasByKec.length - 1];
          
          interpretation += `Pada tahun ${yearForLuas}, total luas wilayah Kota Palembang adalah ${totalLuas.toFixed(2)} kmÂ². `;
          interpretation += `Kecamatan dengan luas wilayah terbesar adalah ${terluas.name} dengan ${terluas.value.toFixed(2)} kmÂ², `;
          interpretation += `sedangkan kecamatan dengan luas wilayah terkecil adalah ${tersempit.name} dengan ${tersempit.value.toFixed(2)} kmÂ².\n\n`;
          
          interpretation += `**Data Lengkap Luas Wilayah Semua Kecamatan (Tahun ${yearForLuas}):**\n\n`;
          luasByKec.forEach((item: any, index: number) => {
            const persentase = totalLuas > 0 ? ((item.value / totalLuas) * 100).toFixed(2) : '0';
            interpretation += `${index + 1}. ${item.name}: ${item.value.toFixed(2)} kmÂ² (${persentase}%)\n`;
          });
        } else {
          interpretation += `Data luas wilayah tidak tersedia untuk tahun ${yearForLuas}.\n\n`;
        }
      } else {
        // Mode per tahun - total luas wilayah per tahun dengan analisis
        const yearSet = new Set<number>();
        luasWilayahDataFromDB.forEach((item: any) => {
          Object.keys(item.dataByYear || {}).forEach((year: string) => yearSet.add(parseInt(year)));
        });
        const years = Array.from(yearSet).sort((a, b) => a - b);
        
        const luasByYear: { year: number; luas: number }[] = [];
        years.forEach(year => {
          let totalLuas = 0;
          luasWilayahDataFromDB.forEach((item: any) => {
            totalLuas += item.dataByYear?.[year]?.luasWilayah || 0;
          });
          luasByYear.push({ year, luas: totalLuas });
        });
        
        if (luasByYear.length > 0) {
          const tertinggi = luasByYear.reduce((max, item) => item.luas > max.luas ? item : max, luasByYear[0]);
          const terendah = luasByYear.reduce((min, item) => item.luas < min.luas ? item : min, luasByYear[0]);
          
          interpretation += `Perkembangan total luas wilayah Kota Palembang dari tahun ke tahun menunjukkan `;
          
          // Check if luas is consistent
          const allSame = luasByYear.every(item => Math.abs(item.luas - luasByYear[0].luas) < 0.01);
          
          if (allSame) {
            interpretation += `konsistensi dengan luas wilayah yang relatif tetap sekitar ${luasByYear[0].luas.toFixed(2)} kmÂ². `;
            interpretation += `Hal ini menunjukkan bahwa tidak ada perubahan signifikan dalam batas wilayah administratif Kota Palembang selama periode pengamatan.`;
          } else {
            interpretation += `dinamika perubahan wilayah administratif. `;
            interpretation += `Luas wilayah terbesar tercatat pada tahun ${tertinggi.year} dengan ${tertinggi.luas.toFixed(2)} kmÂ², `;
            interpretation += `sedangkan luas terkecil berada pada tahun ${terendah.year} dengan ${terendah.luas.toFixed(2)} kmÂ². `;
            
            if (luasByYear.length >= 2) {
              const awal = luasByYear[0];
              const akhir = luasByYear[luasByYear.length - 1];
              const perubahan = akhir.luas - awal.luas;
              const persentase = ((perubahan / awal.luas) * 100).toFixed(2);
              const tren = perubahan > 0 ? 'bertambah' : 'berkurang';
              interpretation += `Dari tahun ${awal.year} ke ${akhir.year}, luas wilayah ${tren} sebesar ${Math.abs(perubahan).toFixed(2)} kmÂ² atau ${Math.abs(parseFloat(persentase))}%.`;
            }
          }
          
          interpretation += `\n\nData Lengkap Luas Wilayah per Tahun:\n`;
          luasByYear.forEach((item, index) => {
            interpretation += `${index + 1}. Tahun ${item.year}: ${item.luas.toFixed(2)} kmÂ²\n`;
          });
        }
      }
      interpretation += '\n';
    } else {
      interpretation += 'Data luas wilayah tidak tersedia untuk periode ini.\n\n';
    }
    
    return interpretation;
  };

  const handleRefresh = async () => {
    setShowAnalysis(false);
    setAnalysis('');
    if (onRefresh) {
      onRefresh();
    }
    // Re-run analysis with delay
    await handleAnalyze();
  };

  return (
    <div>
      {/* Main Button - Hide when analysis is shown */}
      {!showAnalysis && (
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className={`${className}`}
        style={{
          background: loading 
            ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
            : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
          color: 'white',
          padding: '14px 28px',
          borderRadius: '12px',
          border: 'none',
          fontSize: '15px',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: loading 
            ? '0 4px 12px rgba(100, 116, 139, 0.3)'
            : '0 4px 16px rgba(139, 92, 246, 0.4)',
          transition: 'all 0.3s ease',
          opacity: loading ? 0.7 : 1,
          width: '100%',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.5)';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.4)';
          }
        }}
      >
        {loading ? (
          <>
            <div style={{
              width: '18px',
              height: '18px',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              borderTop: '3px solid white',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            Membaca data...
          </>
        ) : (
          'Mulai'
        )}
        </button>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          marginTop: '16px',
          padding: '16px',
          background: '#dbeafe',
          border: '1px solid #93c5fd',
          borderRadius: '12px',
          color: '#1e40af',
          fontSize: '14px'
        }}>
          <strong>Error:</strong> {error}
          <button
            onClick={handleAnalyze}
            style={{
              marginLeft: '12px',
              padding: '6px 16px',
              background: '#1e3a8a',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Analysis Result - Inline Display */}
      {showAnalysis && analysis && (
        <div
          style={{
            marginTop: '24px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
            borderRadius: '16px',
            padding: '32px',
            border: '2px solid #e0e7ff',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.12)',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '2px solid #c7d2fe'
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '20px', 
              fontWeight: 700,
              color: '#4338ca',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 3v18h18"/>
                <path d="M18 17V9"/>
                <path d="M13 17V5"/>
                <path d="M8 17v-3"/>
              </svg>
              Interpretasi Grafik 
            </h3>
          </div>

          {/* Content */}
          <div style={{
            fontSize: '15px',
            lineHeight: '1.8',
            color: '#1f2937'
          }}>
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p style={{ 
                    marginBottom: '18px', 
                    textAlign: 'justify',
                    color: '#374151',
                    fontSize: '15px',
                    lineHeight: '1.8'
                  }}>
                    {children}
                  </p>
                ),
                strong: ({ children }) => (
                  <strong style={{ 
                    color: '#6366f1', 
                    fontWeight: 700 
                  }}>
                    {children}
                  </strong>
                ),
                ul: ({ children }) => (
                  <ul style={{ 
                    marginBottom: '16px', 
                    paddingLeft: '28px',
                    listStyleType: 'disc'
                  }}>
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol style={{ 
                    marginBottom: '16px', 
                    paddingLeft: '28px'
                  }}>
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li style={{ 
                    marginBottom: '8px',
                    color: '#4b5563',
                    lineHeight: '1.7'
                  }}>
                    {children}
                  </li>
                ),
                h1: ({ children }) => (
                  <h1 style={{ 
                    fontSize: '22px', 
                    fontWeight: 700, 
                    marginBottom: '16px',
                    color: '#1f2937'
                  }}>
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 style={{ 
                    fontSize: '19px', 
                    fontWeight: 700, 
                    marginBottom: '14px',
                    color: '#374151'
                  }}>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 style={{ 
                    fontSize: '17px', 
                    fontWeight: 600, 
                    marginBottom: '12px',
                    color: '#4b5563'
                  }}>
                    {children}
                  </h3>
                )
              }}
            >
              {analysis}
            </ReactMarkdown>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}



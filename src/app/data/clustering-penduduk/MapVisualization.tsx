"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Helper untuk dapatkan centroid polygon
function getPolygonCentroid(coords: any): [number, number] {
  // Polygon: [ [ [lng, lat], ... ] ]
  let points = coords[0];
  let x = 0, y = 0, area = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    let xi = points[i][0], yi = points[i][1];
    let xj = points[j][0], yj = points[j][1];
    let f = xi * yj - xj * yi;
    x += (xi + xj) * f;
    y += (yi + yj) * f;
    area += f;
  }
  area = area / 2;
  if (area === 0) return [points[0][1], points[0][0]];
  x = x / (6 * area);
  y = y / (6 * area);
  return [y, x]; // [lat, lng]
}

interface KecamatanData {
  id: number;
  nomor: number;
  kecamatan: string;
  jumlahPenduduk: number;
  jumlahPendudukFormatted: string;
}

interface ClusterData {
  cluster: number;
  category: string;
  color: string;
  count: number;
  average: number;
  averageFormatted: string;
  min: number;
  minFormatted: string;
  max: number;
  maxFormatted: string;
  kecamatanList: KecamatanData[];
}

interface MapVisualizationProps {
  clusters: ClusterData[];
}

// Mapping nama kecamatan dari database ke GeoJSON
const kecamatanNameMapping: { [key: string]: string } = {
  'Ilir Barat I': 'Ilir Barat Satu',
  'Ilir Barat II': 'Ilir Barat Dua',
  'Ilir Timur I': 'Ilir Timur Satu',
  'Ilir Timur II': 'Ilir Timur Dua',
  'Ilir Timur III': 'Ilir Timur Tiga',
  'Bukit Kecil': 'Bukitkecil',
  'Seberang Ulu I': 'Seberang Ulu Satu',
  'Seberang Ulu II': 'Seberang Ulu Dua',
  'Sematang Borang': 'Sematangborang',
  'Alang-Alang Lebar': 'Alang-alang Lebar',
  'Gandus': 'Gandus',
  'Kertapati': 'Kertapati',
  'Plaju': 'Plaju',
  'Sako': 'Sako',
  'Sukarami': 'Sukarami',
  'Kalidoni': 'Kalidoni',
  'Kemuning': 'Kemuning',
  'Jakabaring': 'Jakabaring',
};

// Component untuk fit bounds setelah map ready
function FitBounds({ geoData }: { geoData: any }) {
  const map = useMap();
  
  useEffect(() => {
    if (geoData && map) {
      const geoJsonLayer = L.geoJSON(geoData);
      const bounds = geoJsonLayer.getBounds();
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [geoData, map]);
  
  return null;
}

export default function MapVisualization({ clusters }: MapVisualizationProps) {
  const [geoData, setGeoData] = useState<any>(null);
  const [luasWilayahData, setLuasWilayahData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCluster, setShowCluster] = useState(true);
  const [showPopulation, setShowPopulation] = useState(true);
  const [showDensity, setShowDensity] = useState(true);
  const mapRef = useRef<L.Map>(null);

  // Load GeoJSON data dan data luas wilayah
  useEffect(() => {
    Promise.all([
      fetch('/geojson/kecamatan_palembang.geojson').then(res => res.json()),
      fetch('/api/data/luas-wilayah-kecamatan').then(res => res.json())
    ])
      .then(([geoJsonData, luasData]) => {
        setGeoData(geoJsonData);
        setLuasWilayahData(luasData.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading data:', err);
        setLoading(false);
      });
  }, []);

  // Flatten all kecamatan data dengan mapping nama
  const allKecamatan = clusters.flatMap(cluster => 
    cluster.kecamatanList.map(kec => ({
      ...kec,
      geojsonName: kecamatanNameMapping[kec.kecamatan] || kec.kecamatan,
      cluster: cluster.cluster,
      category: cluster.category,
      color: cluster.color,
      density: kec.jumlahPenduduk / (geoData?.features?.find((f: any) => 
        f.properties.WADMKC === (kecamatanNameMapping[kec.kecamatan] || kec.kecamatan)
      )?.properties.LUASWH || 1) * 100 // LUASWH dalam km²
    }))
  );

  // Create lookup map untuk data kecamatan
  const kecamatanDataMap = new Map(
    allKecamatan.map(kec => [kec.geojsonName.toLowerCase().replace(/\s+/g, ''), kec])
  );

  // Get color based on clustering category
  const getClusterColor = (category: string) => {
    if (category.includes('Relatif Merata')) {
      return '#15803d'; // Dark green
    } else if (category.includes('Cukup Merata')) {
      return '#1e3a8a'; // Dark blue
    } else if (category.includes('Belum Merata')) {
      return '#dc2626'; // Dark red
    }
    return '#475569'; // Default dark gray
  };

  // Get color based on clustering
  const getFeatureColor = (feature: any) => {
    const kecName = feature.properties.WADMKC.toLowerCase().replace(/\s+/g, '');
    const kecData = kecamatanDataMap.get(kecName);
    
    if (!kecData) return '#94a3b8'; // Default gray
    return getClusterColor(kecData.category); // Use solid color based on category
  };

  // Style untuk GeoJSON polygons
  const style = (feature: any) => ({
    fillColor: getFeatureColor(feature),
    fillOpacity: 0.7,
    color: '#334155', // Border color
    weight: 2,
    opacity: 1,
  });

  // Hover effect
  const onEachFeature = (feature: any, layer: any) => {
    const kecName = feature.properties.WADMKC.toLowerCase().replace(/\s+/g, '');
    const kecData = kecamatanDataMap.get(kecName);

    if (!kecData) return;

    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 4,
          color: '#fff',
          fillOpacity: 0.85
        });
        layer.bringToFront();
      },
      mouseout: (e: any) => {
        const layer = e.target;
        layer.setStyle(style(feature));
      },
    });

    // Tooltip
    layer.bindTooltip(
      `<div style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">
        ${feature.properties.WADMKC}
      </div>
      <div style="font-size: 13px; color: #64748b;">
        ${kecData.jumlahPendudukFormatted} jiwa
      </div>`,
      {
        direction: 'top',
        offset: [0, -10],
        opacity: 0.95,
        className: 'custom-tooltip'
      }
    );

    // Popup - konten dinamis berdasarkan checkbox
    const popupContent = () => {
      const solidColor = getClusterColor(kecData.category);
      let content = `<div style="min-width: 240px;">
        <div style="font-weight: 700; font-size: 16px; margin-bottom: 12px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
          📍 ${feature.properties.WADMKC}
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">`;
      
      // Cluster info dengan rentang nilai
      if (showCluster) {
        // Ambil data cluster lengkap untuk rentang nilai
        const clusterInfo = clusters.find(c => c.cluster === kecData.cluster);
        content += `
          <div style="display: flex; flex-direction: column; gap: 4px; padding: 8px; background-color: ${solidColor}15; border-radius: 8px; border-left: 3px solid ${solidColor};">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 13px; color: #64748b; font-weight: 500;">Cluster:</span>
              <span style="font-size: 14px; font-weight: 700; color: ${solidColor};">
                ${kecData.category}
              </span>
            </div>
            ${clusterInfo ? `
            <div style="font-size: 12px; color: #64748b; line-height: 1.4;">
              <div>Rentang: ${clusterInfo.minFormatted} - ${clusterInfo.maxFormatted} jiwa</div>
              <div>Rata-rata: ${clusterInfo.averageFormatted} jiwa</div>
              <div>Jumlah kecamatan: ${clusterInfo.count}</div>
            </div>
            ` : ''}
          </div>`;
      }
      
      // Jumlah Penduduk info
      if (showPopulation) {
        content += `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; color: #64748b; font-weight: 500;">Penduduk:</span>
            <span style="font-size: 14px; font-weight: 700; color: #1e293b;">
              ${kecData.jumlahPendudukFormatted}
            </span>
          </div>`;
      }
      
      // Luas wilayah - dari API luas-wilayah-kec (selalu ditampilkan)
      const luasFromAPI = luasWilayahData.find((item: any) => 
        item.kecamatan.toLowerCase().replace(/\s+/g, '') === kecData.kecamatan.toLowerCase().replace(/\s+/g, '')
      );
      const luasKm2 = luasFromAPI ? Number(luasFromAPI.luas_wilayah).toFixed(2) : (feature.properties.LUASWH / 100).toFixed(2);
      content += `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; color: #64748b; font-weight: 500;">Luas Wilayah:</span>
            <span style="font-size: 14px; font-weight: 700; color: #1e293b;">
              ${luasKm2} km²
            </span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; font-style: italic; margin-top: -4px;">
            Sumber: ${luasFromAPI ? 'API Data Luas Wilayah Kecamatan' : 'BPS - ADMINISTRASI_AR_KECAMATAN'}
          </div>`;
      
      // Kepadatan info
      if (showDensity) {
        content += `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; color: #64748b; font-weight: 500;">Kepadatan:</span>
            <span style="font-size: 14px; font-weight: 700; color: #1e293b;">
              ${Math.round(kecData.density).toLocaleString('id-ID')} jiwa/km²
            </span>
          </div>`;
      }
      
      content += `
        </div>
      </div>`;
      return content;
    };

    layer.bindPopup(popupContent(), { className: 'custom-popup' });
  };

  if (loading || !geoData) {
    return (
      <div style={{ 
        height: '600px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: '16px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', color: '#64748b', fontWeight: '500' }}>
            Memuat peta kecamatan...
          </div>
        </div>
      </div>
    );
  }

  // --- LABEL KECAMATAN ---
  const [labelOverlay, setLabelOverlay] = useState<React.ReactElement | null>(null);

  // Fungsi untuk update label overlay
  const updateLabelOverlay = useCallback(() => {
    if (geoData && geoData.features && mapRef.current) {
      const map = mapRef.current;
      const size = map.getSize();
      // Debug log
      console.log('[LabelOverlay] mapRef ready:', !!map, 'geoData:', geoData.features.length, 'size:', size);
      setLabelOverlay(
        <svg
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', width: '100%', height: '100%', zIndex: 500 }}
          width={size.x}
          height={size.y}
        >
          {geoData.features.map((feature: any, idx: number) => {
            let coords = feature.geometry.coordinates;
            let centroid: [number, number] = [0, 0];
            if (feature.geometry.type === 'Polygon') {
              centroid = getPolygonCentroid(coords);
            } else if (feature.geometry.type === 'MultiPolygon') {
              centroid = getPolygonCentroid(coords[0]);
            }
            const point = map.latLngToContainerPoint(centroid);
            // Debug log per label
            console.log('[LabelOverlay] Label', feature.properties.WADMKC, 'centroid:', centroid, 'point:', point);
            return (
              <text
                key={feature.properties.WADMKC + idx}
                x={point.x}
                y={point.y}
                textAnchor="middle"
                alignmentBaseline="middle"
                fontSize="13"
                fontWeight="bold"
                fill="#1e293b"
                stroke="#fff"
                strokeWidth="2"
                paintOrder="stroke"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {feature.properties.WADMKC}
              </text>
            );
          })}
        </svg>
      );
    } else {
      console.warn('[LabelOverlay] Tidak bisa render label: mapRef?', !!mapRef.current, 'geoData?', !!geoData);
      setLabelOverlay(null);
    }
  }, [geoData]);

  // Update labelOverlay saat geoData atau mapRef berubah
  useEffect(() => {
    updateLabelOverlay();
    let interval: NodeJS.Timeout | null = null;
    // Jika mapRef.current belum siap, cek setiap 200ms
    if (!mapRef.current) {
      interval = setInterval(() => {
        if (mapRef.current) {
          updateLabelOverlay();
          if (interval) clearInterval(interval);
          // Tambahkan event listener setelah map siap
          const map = mapRef.current;
          map.on('move zoom', updateLabelOverlay);
        }
      }, 200);
    } else {
      const map = mapRef.current;
      map.on('move zoom', updateLabelOverlay);
    }
    return () => {
      if (interval) clearInterval(interval);
      if (mapRef.current) {
        mapRef.current.off('move zoom', updateLabelOverlay);
      }
    };
  }, [geoData, updateLabelOverlay, mapRef.current]);

  return (
    <div style={{ width: '100%', height: '600px', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
      {/* Checkbox Info Display */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        zIndex: 1000,
        backgroundColor: 'white',
        padding: '12px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        gap: '10px',
        flexDirection: 'column'
      }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
          Tampilkan Info
        </div>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
          <input
            type="checkbox"
            checked={showCluster}
            onChange={(e) => setShowCluster(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <span style={{ fontWeight: '500', color: '#334155' }}>🎯 Cluster</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
          <input
            type="checkbox"
            checked={showPopulation}
            onChange={(e) => setShowPopulation(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <span style={{ fontWeight: '500', color: '#334155' }}>👥 Jumlah Penduduk</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
          <input
            type="checkbox"
            checked={showDensity}
            onChange={(e) => setShowDensity(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <span style={{ fontWeight: '500', color: '#334155' }}>📊 Kepadatan</span>
        </label>
      </div>

      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        {/* Warning jika labelOverlay gagal */}
        {!labelOverlay && (
          <div style={{position:'absolute',top:10,right:10,zIndex:2000,background:'#fffbe8',color:'#b45309',padding:'8px 16px',borderRadius:8,border:'1px solid #fde68a',fontWeight:600}}>
            Label kecamatan tidak bisa dirender. Lihat console untuk debug.
          </div>
        )}
        <MapContainer
          center={[-2.976, 104.756]}
          zoom={11}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={true}
          ref={mapRef}
        >
          <FitBounds geoData={geoData} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <GeoJSON 
            key={`${showCluster}-${showPopulation}-${showDensity}`}
            data={geoData} 
            style={style}
            onEachFeature={onEachFeature}
          />
        </MapContainer>
        {/* SVG overlay label kecamatan */}
        {labelOverlay}
      </div>

      <style jsx global>{`
        .custom-tooltip {
          background-color: rgba(255, 255, 255, 0.98) !important;
          border: 2px solid #3b82f6 !important;
          border-radius: 10px !important;
          padding: 10px 14px !important;
          box-shadow: 0 6px 16px rgba(0,0,0,0.2) !important;
          font-family: inherit !important;
        }
        
        .custom-tooltip::before {
          border-top-color: rgba(255, 255, 255, 0.98) !important;
        }

        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 14px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2) !important;
          border: 2px solid #e2e8f0 !important;
        }
        
        .custom-popup .leaflet-popup-tip {
          box-shadow: 0 3px 10px rgba(0,0,0,0.15) !important;
        }

        .leaflet-container {
          font-family: inherit !important;
        }
      `}</style>
    </div>
  );
}


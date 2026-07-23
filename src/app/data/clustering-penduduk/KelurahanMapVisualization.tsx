"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, Tooltip, useMap, Marker, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Helper untuk dapatkan centroid polygon
function getPolygonCentroid(coords: any) {
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

const { BaseLayer, Overlay } = LayersControl;

interface KecamatanData {
  id: number;
  nomor: number;
  kecamatan: string;
  skorPemerataan?: number;
  skorPemerataanFormatted?: string;
  jumlahPenduduk: number;
  jumlahPendudukFormatted: string;
  jumlahGuru?: number;
  jumlahSiswa?: number;
  jumlahRombel?: number;
  rasioSiswaGuru?: number;
  indeksGuru?: string;
  indeksSiswa?: string;
  indeksRombel?: string;
  indeksRasio?: string;
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

interface MapProps {
  clusters: ClusterData[];
  mapControls: {
    showPopup: boolean;
    showJumlahPenduduk: boolean;
    showClustering: boolean;
    showOutlineOnly: boolean;
  };
}

// Mapping nama kecamatan
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
};

// Component untuk fit bounds
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

// Component untuk custom pane marker
function MarkerPane() {
  const map = useMap();
  
  useEffect(() => {
    if (!map.getPane('markerPane')) {
      const pane = map.createPane('markerPane');
      pane.style.zIndex = '650';
    }
  }, [map]);
  
  return null;
}

export default function KelurahanMapVisualization({ clusters, mapControls }: MapProps) {
  const [kecamatanGeoData, setKecamatanGeoData] = useState<any>(null);
  const [kelurahanGeoData, setKelurahanGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [mapKey, setMapKey] = useState(() => Date.now());

  // Ensure component only renders on client side with stronger guarantees
  useEffect(() => {
    // Delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 150);
    
    return () => {
      clearTimeout(timer);
      setIsMounted(false);
      // Force new key on cleanup
      setTimeout(() => {
        setMapKey(Date.now());
      }, 0);
    };
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/geojson/kecamatan_palembang.geojson').then(res => res.json()),
      fetch('/geojson/kelurahan_palembang.geojson').then(res => res.json())
    ])
      .then(([kecData, kelData]) => {
        console.log('Kecamatan loaded:', kecData.features?.length);
        console.log('Kelurahan loaded:', kelData.features?.length);
        setKecamatanGeoData(kecData);
        setKelurahanGeoData(kelData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading GeoJSON:', err);
        setLoading(false);
      });
  }, []);

  // Create kecamatan data map - dengan useMemo
  const kecamatanDataMap = useMemo(() => {
    return new Map(
      clusters.flatMap(cluster => 
        cluster.kecamatanList.map(kec => [
          (kecamatanNameMapping[kec.kecamatan] || kec.kecamatan).toLowerCase().replace(/\s+/g, ''),
          {
            ...kec,
            cluster: cluster.cluster,
            category: cluster.category,
            color: cluster.color
          }
        ])
      )
    );
  }, [clusters]);

  const getFeatureColor = (feature: any) => {
    const kecName = feature.properties.WADMKC.toLowerCase().replace(/\s+/g, '');
    const kecData = kecamatanDataMap.get(kecName);
    return kecData ? kecData.color : '#94a3b8';
  };

  // Style untuk polygon kecamatan
  const kecamatanStyle = (feature: any) => {
    const baseColor = mapControls.showClustering ? getFeatureColor(feature) : '#cbd5e1';
    const fillOpacity = mapControls.showOutlineOnly ? 0 : (mapControls.showClustering ? 0.15 : 0.05);
    
    return {
      fillColor: baseColor,
      fillOpacity: fillOpacity,
      color: mapControls.showOutlineOnly ? '#1e3a8a' : '#334155',
      weight: mapControls.showOutlineOnly ? 2.5 : 1.5,
      opacity: 1,
      dashArray: mapControls.showOutlineOnly ? '15, 5' : undefined, // Merah lebih panjang, putih pendek
    };
  };

  // Style untuk white border background (hanya untuk outline mode)
  const whiteBorderStyle = () => ({
    fillColor: 'transparent',
    fillOpacity: 0,
    color: '#ffffff',
    weight: 5,
    opacity: 1,
    dashArray: '15, 5', // Sama dengan merah agar sinkron
  });

  // Hover dan popup untuk kecamatan - dengan useCallback untuk optimize
  const onEachKecamatan = useCallback((feature: any, layer: any) => {
    const kecName = feature.properties.WADMKC.toLowerCase().replace(/\s+/g, '');
    const kecData = kecamatanDataMap.get(kecName);
    
    // Get cluster info untuk menampilkan statistik
    const clusterInfo = kecData ? clusters.find(c => c.cluster === kecData.cluster) : null;
    
    // Get list of kelurahan in this kecamatan
    const kelurahanList = kelurahanGeoData?.features
      ?.filter((kel: any) => kel.properties.WADMKC === feature.properties.WADMKC)
      ?.map((kel: any) => kel.properties.WADMKD) || [];

    // Hover effect
    layer.on({
      mouseover: (e: any) => {
        if (!mapControls.showOutlineOnly) {
          e.target.setStyle({
            weight: 2.5,
            color: '#fff',
            fillOpacity: mapControls.showClustering ? 0.35 : 0.15
          });
        }
      },
      mouseout: (e: any) => {
        if (!mapControls.showOutlineOnly) {
          e.target.setStyle({
            weight: 1.5,
            color: '#334155',
            fillOpacity: mapControls.showClustering ? 0.15 : 0.05
          });
        }
      }
    });

    // Tooltip nama kecamatan selalu tampil
    if (kecData) {
      layer.bindTooltip(feature.properties.WADMKC, {
        permanent: true,
        direction: 'center',
        className: 'kecamatan-label-tooltip',
        opacity: 0.85,
        interactive: false,
        sticky: false,
      });
    }

    // Popup - hanya tampil jika showPopup aktif
    if (mapControls.showPopup && kecData) {
      layer.bindPopup(
        `<div style="
          font-family: 'Segoe UI', 'Arial', sans-serif;
          padding: 10px 8px 8px 8px;
          max-width: 300px;
        ">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid ${kecData.color};">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: ${kecData.color}; display: flex; align-items: center; justify-content: center; font-weight: 800; color: white; font-size: 15px; flex-shrink: 0;">${kecData.nomor}</div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 15px; font-weight: 800; color: #1e293b; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.2px;">
                ${feature.properties.WADMKC}
              </div>
              <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Cluster <span style="color: ${kecData.color}; font-weight: 700;">${kecData.cluster}</span> &mdash; <span style="color: ${kecData.color}; font-weight: 700;">${kecData.category}</span>
              </div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="padding: 7px 8px; background: #f0f9ff; border-left: 3px solid #0284c7; border-radius: 5px;">
              <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px;">Rincian Variabel</div>
              <div style="font-size: 12px; color: #334155; line-height: 1.5; margin-bottom: 2px;">
                <span style="font-weight: 600; color: #0284c7;">Guru:</span> ${kecData.jumlahGuru || 0} &nbsp;|&nbsp;
                <span style="font-weight: 600; color: #0284c7;">Siswa:</span> ${kecData.jumlahSiswa || 0}
              </div>
              <div style="font-size: 12px; color: #334155; line-height: 1.5; margin-bottom: 2px;">
                <span style="font-weight: 600; color: #0284c7;">Rombel:</span> ${kecData.jumlahRombel || 0} &nbsp;|&nbsp;
                <span style="font-weight: 600; color: #0284c7;">Rasio Siswa/Guru:</span> ${kecData.rasioSiswaGuru || 0}
              </div>
              <div style="font-size: 12px; font-weight: 700; color: #0284c7; margin-top: 3px;">
                ${kecData.jumlahPendudukFormatted} <span style="font-size: 10px; font-weight: 500;">jiwa</span>
              </div>
            </div>

            <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
              <a href="/data/kecamatan-detail/${kecData.id}?type=rasio&name=${encodeURIComponent(feature.properties.WADMKC || '')}"
                style="display: inline-block; width: 100%; text-align: center; padding: 10px 12px; background: #0284c7; color: white; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 13px;">
                Lihat Sekolah
              </a>
            </div>
          </div>
        </div>`,
        {
          className: 'custom-popup',
          maxWidth: 320,
          autoClose: true,
          closeOnClick: true,
          closeButton: true
        }
      );
    }
  }, [kecamatanDataMap, clusters, mapControls, kelurahanGeoData]);

  // Function to get kelurahan centroid
  const getKelurahanCentroid = (feature: any) => {
    if (feature.geometry.type === 'Polygon') {
      const coords = feature.geometry.coordinates[0];
      const lats = coords.map((c: number[]) => c[1]);
      const lngs = coords.map((c: number[]) => c[0]);
      return [
        lats.reduce((a: number, b: number) => a + b) / lats.length,
        lngs.reduce((a: number, b: number) => a + b) / lngs.length
      ];
    } else if (feature.geometry.type === 'MultiPolygon') {
      const coords = feature.geometry.coordinates[0][0];
      const lats = coords.map((c: number[]) => c[1]);
      const lngs = coords.map((c: number[]) => c[0]);
      return [
        lats.reduce((a: number, b: number) => a + b) / lats.length,
        lngs.reduce((a: number, b: number) => a + b) / lngs.length
      ];
    }
    return [0, 0];
  };

  if (!isMounted || loading || !kecamatanGeoData || !kelurahanGeoData || typeof window === 'undefined') {
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
            Memuat peta kelurahan...
          </div>
        </div>
      </div>
    );
  }

  // Ensure we only render map on client side
  if (typeof window === 'undefined' || !isMounted || !kecamatanGeoData) {
    return (
      <div style={{ 
        width: '100%', 
        height: '600px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: '16px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', color: '#64748b', fontWeight: '500' }}>
            Memuat peta...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div key={`map-wrapper-${mapKey}`} style={{ width: '100%', height: '600px', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '1px solid #e2e8f0', zIndex: 10 }}>
      <MapContainer
          key={`leaflet-map-${mapKey}-${Date.now()}`}
          center={[-2.976, 104.756]}
          zoom={13}
          style={{ width: '100%', height: '100%', position: 'relative', zIndex: 10 }}
          scrollWheelZoom={true}
          closePopupOnClick={true}
          dragging={true}
          doubleClickZoom={true}
          zoomControl={true}
          maxZoom={22}
          minZoom={10}
        >
        <LayersControl position="topright">
          <BaseLayer checked name="Default">
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              attribution='&copy; Google Maps'
              maxZoom={22}
              maxNativeZoom={21}
            />
          </BaseLayer>

          <BaseLayer name="Satelit">
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              attribution='&copy; Google Maps'
              maxZoom={22}
              maxNativeZoom={21}
            />
          </BaseLayer>

          <BaseLayer name="Peta Standar">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              maxZoom={19}
              maxNativeZoom={19}
            />
          </BaseLayer>
        </LayersControl>

        {/* White Border Background (hanya saat outline only) */}
        {mapControls.showOutlineOnly && (
          <GeoJSON 
            key={`white-border-${mapControls.showOutlineOnly}`}
            data={kecamatanGeoData} 
            style={whiteBorderStyle}
            interactive={false}
          />
        )}

        {/* Polygon Kecamatan */}
        <GeoJSON 
          key={`kecamatan-${mapControls.showClustering}-${mapControls.showOutlineOnly}-${mapControls.showPopup}-${mapControls.showJumlahPenduduk}`}
          data={kecamatanGeoData} 
          style={kecamatanStyle}
          onEachFeature={onEachKecamatan}
        />

        <FitBounds geoData={kecamatanGeoData} />
      </MapContainer>

      <style jsx global>{`
        .custom-tooltip {
          background-color: rgba(255, 255, 255, 0.98) !important;
          border: 2px solid #3b82f6 !important;
          border-radius: 10px !important;
          padding: 8px 12px !important;
          box-shadow: 0 6px 16px rgba(0,0,0,0.2) !important;
          font-family: inherit !important;
        }

        .kecamatan-label-tooltip {
          background: rgba(255, 255, 255, 0.9) !important;
          border: none !important;
          color: #0f172a !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          padding: 2px 6px !important;
          border-radius: 6px !important;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.18) !important;
          pointer-events: none !important;
        }

        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 14px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2) !important;
          border: 2px solid #e2e8f0 !important;
        }

        .leaflet-container {
          font-family: inherit !important;
        }

        .leaflet-control-zoom {
          position: sticky !important;
          float: right !important;
          top: 20px !important;
          right: 10px !important;
          z-index: 1000 !important;
        }
      `}</style>
    </div>
  );
}


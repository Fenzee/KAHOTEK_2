"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { MapPin, Loader2 } from "lucide-react";

// Koordinat center Indonesia
const INDONESIA_CENTER = [-2.5489, 118.0149];
const INDONESIA_ZOOM = 5;

// Daftar 38 provinsi di Indonesia dengan koordinat center
const INDONESIAN_PROVINCES = [
  { name: "Aceh", coordinates: [4.6951, 96.7494], code: "ID-AC" },
  { name: "Sumatera Utara", coordinates: [2.1154, 99.5451], code: "ID-SU" },
  { name: "Sumatera Barat", coordinates: [-0.7393, 100.8008], code: "ID-SB" },
  { name: "Riau", coordinates: [0.2933, 101.7068], code: "ID-RI" },
  { name: "Kepulauan Riau", coordinates: [3.9456, 108.1428], code: "ID-KR" },
  { name: "Jambi", coordinates: [-1.6101, 103.6131], code: "ID-JA" },
  { name: "Sumatera Selatan", coordinates: [-3.3194, 104.9144], code: "ID-SS" },
  { name: "Bangka Belitung", coordinates: [-2.7411, 106.4406], code: "ID-BB" },
  { name: "Bengkulu", coordinates: [-3.5778, 102.3464], code: "ID-BE" },
  { name: "Lampung", coordinates: [-4.5586, 105.4068], code: "ID-LA" },
  { name: "DKI Jakarta", coordinates: [-6.2088, 106.8456], code: "ID-JK" },
  { name: "Jawa Barat", coordinates: [-7.0909, 107.6689], code: "ID-JB" },
  { name: "Banten", coordinates: [-6.4058, 106.0640], code: "ID-BT" },
  { name: "Jawa Tengah", coordinates: [-7.1510, 110.1403], code: "ID-JT" },
  { name: "DI Yogyakarta", coordinates: [-7.7956, 110.3695], code: "ID-YO" },
  { name: "Jawa Timur", coordinates: [-7.5360, 112.2384], code: "ID-JI" },
  { name: "Bali", coordinates: [-8.3405, 115.0920], code: "ID-BA" },
  { name: "Nusa Tenggara Barat", coordinates: [-8.6529, 117.3616], code: "ID-NB" },
  { name: "Nusa Tenggara Timur", coordinates: [-8.6574, 121.0794], code: "ID-NT" },
  { name: "Kalimantan Barat", coordinates: [0.2787, 111.4753], code: "ID-KB" },
  { name: "Kalimantan Tengah", coordinates: [-1.6813, 113.3823], code: "ID-KT" },
  { name: "Kalimantan Selatan", coordinates: [-3.0926, 115.2838], code: "ID-KS" },
  { name: "Kalimantan Timur", coordinates: [0.5387, 116.4193], code: "ID-KI" },
  { name: "Kalimantan Utara", coordinates: [3.0731, 116.0414], code: "ID-KU" },
  { name: "Sulawesi Utara", coordinates: [0.6246, 123.9750], code: "ID-SA" },
  { name: "Gorontalo", coordinates: [0.6999, 122.4467], code: "ID-GO" },
  { name: "Sulawesi Tengah", coordinates: [-1.4300, 121.4456], code: "ID-ST" },
  { name: "Sulawesi Barat", coordinates: [-2.8441, 119.2321], code: "ID-SR" },
  { name: "Sulawesi Selatan", coordinates: [-3.6687, 119.9740], code: "ID-SN" },
  { name: "Sulawesi Tenggara", coordinates: [-4.1449, 122.1746], code: "ID-SG" },
  { name: "Maluku", coordinates: [-3.2385, 130.1453], code: "ID-MA" },
  { name: "Maluku Utara", coordinates: [1.5709, 127.8087], code: "ID-MU" },
  { name: "Papua", coordinates: [-4.2699, 138.0804], code: "ID-PA" },
  { name: "Papua Barat", coordinates: [-1.3361, 133.1747], code: "ID-PB" },
  { name: "Papua Selatan", coordinates: [-5.6816, 140.0350], code: "ID-PS" },
  { name: "Papua Tengah", coordinates: [-3.3194, 138.6763], code: "ID-PT" },
  { name: "Papua Pegunungan", coordinates: [-4.2478, 138.8164], code: "ID-PP" },
  { name: "Papua Barat Daya", coordinates: [-1.8267, 132.2515], code: "ID-PD" }
];

// Fix untuk Leaflet marker icon di Next.js
const fixLeafletIcon = () => {
  if (typeof window !== "undefined") {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png"
    });
  }
};

// Custom marker untuk menampilkan avatar pengguna
const createUserMarker = (avatarUrl: string | null, username: string) => {
  const defaultAvatar = "https://robohash.org/user.png";
  
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div class="relative group">
        <div class="w-10 h-10 bg-white rounded-full border-2 border-blue-500 shadow-lg overflow-hidden">
          <img src="${avatarUrl || defaultAvatar}" alt="${username}" class="w-full h-full object-cover" />
        </div>
        <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40]
  });
};

// Tipe untuk pengguna
interface User {
  id: string;
  username: string;
  avatar_url: string | null;
  country: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface IndonesiaMapProps {
  title?: string;
  height?: string;
}

export default function IndonesiaMap({ 
  title = "", 
  height = "320px" 
}: IndonesiaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk fetch data pengguna dengan lokasi
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users/locations');
      
      if (!res.ok) {
        throw new Error('Gagal mengambil data pengguna');
      }
      
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Fix Leaflet icon issue
    fixLeafletIcon();
    
    if (!mapRef.current) return;
    
    // Hanya initialize map ketika belum ada instance
    if (!mapInstanceRef.current) {
      // Buat map baru
      const map = L.map(mapRef.current, {
        center: INDONESIA_CENTER,
        zoom: INDONESIA_ZOOM,
        minZoom: 5,
        maxBounds: [
          [-11, 95], // South-west corner
          [6, 141]   // North-east corner
        ],
        maxBoundsViscosity: 1.0
      });
      
      // Tambahkan OpenStreetMap tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      // Tampilkan garis batas provinsi Indonesia
      INDONESIAN_PROVINCES.forEach(province => {
        // Tambahkan marker untuk setiap provinsi
        L.marker(province.coordinates as L.LatLngExpression, {
          icon: L.divIcon({
            className: 'province-marker',
            html: `<div class="flex items-center justify-center w-6 h-6 bg-gray-100 bg-opacity-70 rounded-full text-xs font-medium">${province.name.substring(0, 2)}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        })
        .bindPopup(`<b>${province.name}</b>`)
        .addTo(map);
      });
      
      // Simpan instance map untuk cleanup
      mapInstanceRef.current = map;
    }
    
    // Update markers ketika data user berubah
    if (mapInstanceRef.current && users.length > 0) {
      const map = mapInstanceRef.current;
      
      // Hapus marker users yang sudah ada
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker && layer.getElement()?.classList.contains('custom-user-marker')) {
          map.removeLayer(layer);
        }
      });
      
      // Tambahkan marker untuk setiap user
      users.forEach(user => {
        if (user.latitude && user.longitude) {
          const marker = L.marker([user.latitude, user.longitude], {
            icon: createUserMarker(user.avatar_url, user.username)
          }).addTo(map);
          
          // Tambahkan popup dengan info user
          marker.bindPopup(`
            <div class="p-2">
              <div class="font-bold">${user.username}</div>
              ${user.location ? `<div class="text-sm">${user.location}</div>` : ''}
            </div>
          `);
        }
      });
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [users]);

  return (
    <Card className="bg-white/90 border-none shadow-md h-full">
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[250px]">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
            <p className="text-sm text-gray-500">Memuat peta...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[250px] text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          <div 
            ref={mapRef} 
            style={{ 
              height, 
              width: "100%", 
              borderRadius: "0.5rem",
              overflow: "hidden"
            }}
            className="border border-gray-200 shadow-inner"
          />
        )}
      </CardContent>
    </Card>
  );
} 
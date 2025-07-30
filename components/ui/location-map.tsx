"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for Leaflet marker icon in Next.js
const fixLeafletIcon = () => {
  // Only run on client side
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

interface LocationMapProps {
  latitude: number;
  longitude: number;
  address?: string;
  height?: string;
  zoom?: number;
}

export function LocationMap({
  latitude,
  longitude,
  address,
  height = "300px",
  zoom = 15
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Fix Leaflet icon issue
    fixLeafletIcon();
    
    if (!mapRef.current) return;

    // Initialize map only if it doesn't exist
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([latitude, longitude], zoom);
      
      // Add OpenStreetMap tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Add marker for the location
      const marker = L.marker([latitude, longitude]).addTo(map);
      
      // Add popup with address if provided
      if (address) {
        marker.bindPopup(address).openPopup();
      }
      
      // Store map instance for cleanup
      mapInstanceRef.current = map;
    } else {
      // If map already exists, just update the view and marker
      const map = mapInstanceRef.current;
      map.setView([latitude, longitude], zoom);
      
      // Clear existing markers
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });
      
      // Add new marker
      const marker = L.marker([latitude, longitude]).addTo(map);
      
      // Add popup with address if provided
      if (address) {
        marker.bindPopup(address).openPopup();
      }
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, address, zoom]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        height, 
        width: "100%", 
        borderRadius: "0.75rem",
        overflow: "hidden"
      }}
      className="border-2 border-gray-200"
    />
  );
} 
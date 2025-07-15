
import React, { useEffect, useRef } from 'react';

interface MapLocation {
  lat: number;
  lng: number;
  title: string;
  description?: string;
}

interface InteractiveMapProps {
  locations: MapLocation[];
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export function InteractiveMap({ 
  locations, 
  center = { lat: -22.9068, lng: -43.1729 }, // Rio de Janeiro como padrão
  zoom = 12,
  className = "w-full h-96 rounded-lg"
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    // Criar o mapa
    const map = new window.google.maps.Map(mapRef.current, {
      center: locations.length > 0 ? { lat: locations[0].lat, lng: locations[0].lng } : center,
      zoom: zoom,
      styles: [
        {
          "featureType": "all",
          "elementType": "geometry.fill",
          "stylers": [{"weight": "2.00"}]
        },
        {
          "featureType": "all",
          "elementType": "geometry.stroke",
          "stylers": [{"color": "#9c9c9c"}]
        },
        {
          "featureType": "all",
          "elementType": "labels.text",
          "stylers": [{"visibility": "on"}]
        }
      ]
    });

    mapInstance.current = map;

    // Adicionar marcadores
    const bounds = new window.google.maps.LatLngBounds();
    
    locations.forEach((location, index) => {
      const marker = new window.google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: location.title,
        label: (index + 1).toString(),
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="#667EEA" stroke="white" stroke-width="2"/>
              <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">${index + 1}</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32)
        }
      });

      // Info window para cada marcador
      if (location.description) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 200px;">
              <h4 style="margin: 0 0 8px 0; font-weight: bold;">${location.title}</h4>
              <p style="margin: 0; font-size: 14px;">${location.description}</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      }

      bounds.extend({ lat: location.lat, lng: location.lng });
    });

    // Ajustar zoom para mostrar todos os marcadores
    if (locations.length > 1) {
      map.fitBounds(bounds);
    }
  };

  useEffect(() => {
    // Carregar Google Maps API se não estiver carregada
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    } else {
      initializeMap();
    }
  }, [locations]);

  return (
    <div className={className}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      {locations.length === 0 && (
        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Nenhuma localização disponível para exibir no mapa</p>
        </div>
      )}
    </div>
  );
}

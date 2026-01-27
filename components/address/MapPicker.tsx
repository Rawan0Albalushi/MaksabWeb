'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { MapConfig } from '@/utils/mapConfig';

// Declare google maps types
declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps: () => void;
  }
}

interface MapPickerProps {
  center: [number, number]; // [latitude, longitude]
  onLocationChange: (lat: number, lng: number) => void;
  zoom?: number;
  height?: string;
}

const MapPicker = ({ center, onLocationChange, zoom = MapConfig.defaultZoom, height = '300px' }: MapPickerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load Google Maps Script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        setIsLoaded(true);
        setIsLoading(false);
      });
      return;
    }

    // Load script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MapConfig.googleApiKey}&libraries=places&language=ar`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsLoaded(true);
      setIsLoading(false);
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps');
      setIsLoading(false);
    };
    document.head.appendChild(script);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google?.maps) return;

    // If map already exists, just update the center
    if (mapInstanceRef.current) {
      const newCenter = new window.google.maps.LatLng(center[0], center[1]);
      mapInstanceRef.current.setCenter(newCenter);
      if (markerRef.current) {
        markerRef.current.setPosition(newCenter);
      }
      return;
    }

    // Create map
    const mapOptions: google.maps.MapOptions = {
      center: { lat: center[0], lng: center[1] },
      zoom: zoom,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_CENTER,
      },
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      gestureHandling: 'greedy',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    };

    const map = new window.google.maps.Map(mapRef.current, mapOptions);

    // Create draggable marker
    const marker = new window.google.maps.Marker({
      position: { lat: center[0], lng: center[1] },
      map: map,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 0, // We'll use a custom HTML overlay instead
      },
    });

    // Custom marker overlay
    const markerElement = document.createElement('div');
    markerElement.innerHTML = `
      <div style="
        width: 50px;
        height: 50px;
        position: relative;
        transform: translate(-50%, -100%);
      ">
        <div style="
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #FF3D00 0%, #ff6b3d 100%);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(255, 61, 0, 0.4);
          border: 3px solid white;
          position: absolute;
          top: 0;
          left: 5px;
        ">
          <div style="
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
        <div style="
          width: 10px;
          height: 10px;
          background: rgba(255, 61, 0, 0.3);
          border-radius: 50%;
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
        "></div>
      </div>
    `;

    // Create overlay
    class CustomMarker extends window.google.maps.OverlayView {
      private position: google.maps.LatLng;
      private div: HTMLDivElement;

      constructor(position: google.maps.LatLng, map: google.maps.Map) {
        super();
        this.position = position;
        this.div = markerElement as HTMLDivElement;
        this.setMap(map);
      }

      onAdd() {
        const panes = this.getPanes();
        panes?.overlayMouseTarget.appendChild(this.div);

        // Make it draggable
        this.div.style.cursor = 'grab';
        let isDragging = false;
        let startPos = { x: 0, y: 0 };

        this.div.addEventListener('mousedown', (e) => {
          isDragging = true;
          startPos = { x: e.clientX, y: e.clientY };
          this.div.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
          if (!isDragging) return;
          const overlay = this.getProjection();
          if (!overlay) return;
          
          const point = overlay.fromLatLngToDivPixel(this.position);
          if (!point) return;
          
          point.x += e.clientX - startPos.x;
          point.y += e.clientY - startPos.y;
          startPos = { x: e.clientX, y: e.clientY };
          
          this.position = overlay.fromDivPixelToLatLng(point) as google.maps.LatLng;
          this.draw();
        });

        window.addEventListener('mouseup', () => {
          if (isDragging) {
            isDragging = false;
            this.div.style.cursor = 'grab';
            onLocationChange(this.position.lat(), this.position.lng());
          }
        });
      }

      draw() {
        const overlayProjection = this.getProjection();
        if (!overlayProjection) return;

        const pos = overlayProjection.fromLatLngToDivPixel(this.position);
        if (!pos) return;

        this.div.style.left = pos.x + 'px';
        this.div.style.top = pos.y + 'px';
        this.div.style.position = 'absolute';
      }

      onRemove() {
        this.div.parentNode?.removeChild(this.div);
      }

      setPosition(position: google.maps.LatLng) {
        this.position = position;
        this.draw();
      }

      getPosition() {
        return this.position;
      }
    }

    const customMarker = new CustomMarker(
      new window.google.maps.LatLng(center[0], center[1]),
      map
    );

    // Handle map click to move marker
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        customMarker.setPosition(e.latLng);
        onLocationChange(e.latLng.lat(), e.latLng.lng());
      }
    });

    // Handle marker drag end
    marker.addListener('dragend', () => {
      const pos = marker.getPosition();
      if (pos) {
        customMarker.setPosition(pos);
        onLocationChange(pos.lat(), pos.lng());
      }
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Store custom marker reference for updates
    (mapInstanceRef.current as any)._customMarker = customMarker;

  }, [isLoaded, zoom, onLocationChange]);

  // Update marker position when center changes externally
  useEffect(() => {
    if (!isLoaded || !window.google?.maps) return;
    
    if (mapInstanceRef.current) {
      const newPos = new window.google.maps.LatLng(center[0], center[1]);
      
      // Update map center with animation
      mapInstanceRef.current.panTo(newPos);
      
      // Update custom marker if exists
      if ((mapInstanceRef.current as any)._customMarker) {
        const customMarker = (mapInstanceRef.current as any)._customMarker;
        customMarker.setPosition(newPos);
      }
      
      // Update hidden marker if exists
      if (markerRef.current) {
        markerRef.current.setPosition(newPos);
      }
    }
  }, [isLoaded, center[0], center[1]]);

  if (isLoading) {
    return (
      <div 
        style={{ height }}
        className="w-full bg-gray-100 rounded-xl flex flex-col items-center justify-center"
      >
        <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mb-3">
          <Loader2 size={24} className="text-[var(--primary)] animate-spin" />
        </div>
        <p className="text-sm text-gray-500">جاري تحميل الخريطة...</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div 
        style={{ height }}
        className="w-full bg-gray-100 rounded-xl flex flex-col items-center justify-center"
      >
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
          <MapPin size={24} className="text-red-500" />
        </div>
        <p className="text-sm text-red-500">فشل تحميل الخريطة</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        style={{ height }}
        className="w-full rounded-xl z-0"
      />
      
      {/* Instruction overlay */}
      <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-center shadow-lg">
        <p className="text-xs text-gray-600">
          اسحب الدبوس أو انقر على الخريطة لتحديد الموقع
        </p>
      </div>
    </div>
  );
};

export default MapPicker;

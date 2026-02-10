
import React, { useEffect, useRef, useState } from 'react';
import { Airport } from '../types.ts';
import { AIRPLANE_ICON_SVG } from '../constants.tsx';

declare const L: any;

interface MapViewProps {
  from: Airport | null;
  to: Airport | null;
  progress: number;
  isFlying: boolean;
}

const MapView: React.FC<MapViewProps> = ({ from, to, progress, isFlying }) => {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<any>(null);
  const planeRef = useRef<any>(null);
  const [rotation, setRotation] = useState(0);
  const [isLocked, setIsLocked] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(4);

  // Helper to calculate geodesic (curved) points with a more pronounced arc
  const getGeodesicPath = (start: [number, number], end: [number, number], segments = 100) => {
    const points: [number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      const f = i / segments;
      const lat = start[0] + (end[0] - start[0]) * f;
      const lon = start[1] + (end[1] - start[1]) * f;
      
      const dist = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
      // More curvature for longer flights
      const offset = Math.sin(Math.PI * f) * (dist * 0.2); 
      
      const angle = Math.atan2(end[0] - start[0], end[1] - start[1]);
      const curvedLat = lat + Math.cos(angle + Math.PI/2) * offset;
      const curvedLon = lon + Math.sin(angle + Math.PI/2) * offset;
      
      points.push([curvedLat, curvedLon]);
    }
    return points;
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 2,
      maxZoom: 10,
    }).setView([20, 0], 2);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(mapRef.current);

    mapRef.current.on('zoomend', () => {
      setZoomLevel(mapRef.current.getZoom());
    });
  }, []);

  const calculateRotation = (currentPos: [number, number], nextPos: [number, number]) => {
    if (!mapRef.current) return;
    const p1 = mapRef.current.latLngToContainerPoint(currentPos);
    const p2 = mapRef.current.latLngToContainerPoint(nextPos);
    const angleRad = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const angleDeg = angleRad * (180 / Math.PI);
    setRotation(angleDeg + 90);
  };

  useEffect(() => {
    if (!mapRef.current) return;

    if (pathRef.current) mapRef.current.removeLayer(pathRef.current);
    if (planeRef.current) mapRef.current.removeLayer(planeRef.current);

    if (from && to) {
      const fullCurve = getGeodesicPath([from.lat, from.lon], [to.lat, to.lon]);
      
      pathRef.current = L.polyline(fullCurve, {
        color: '#fbbf24',
        weight: 2,
        dashArray: '8, 8',
        opacity: 0.3
      }).addTo(mapRef.current);

      const index = Math.min(Math.floor(progress * (fullCurve.length - 1)), fullCurve.length - 2);
      const currentPos = fullCurve[index];
      const nextPos = fullCurve[index + 1] || currentPos;

      calculateRotation(currentPos, nextPos);
      
      const planeIcon = L.divIcon({
        html: `<div style="transform: rotate(${rotation}deg); color: #fbbf24; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">${AIRPLANE_ICON_SVG}</div>`,
        className: 'custom-plane-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      planeRef.current = L.marker(currentPos, { 
        icon: planeIcon,
        zIndexOffset: 1000 
      }).addTo(mapRef.current);

      if (isFlying && isLocked) {
        mapRef.current.setView(currentPos, mapRef.current.getZoom(), { animate: true });
      } else if (!isFlying) {
        mapRef.current.fitBounds(pathRef.current.getBounds(), { padding: [100, 100] });
      }
    }
  }, [from, to, progress, isFlying, rotation, isLocked]);

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseInt(e.target.value);
    setZoomLevel(newZoom);
    if (mapRef.current) {
      mapRef.current.setZoom(newZoom);
    }
  };

  return (
    <div className="absolute inset-0 z-0">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Map Controls */}
      {isFlying && (
        <div className="absolute bottom-12 right-12 z-[1000] flex flex-col items-end gap-6">
          {/* Zoom Slider (Free Slider) */}
          <div className="flex flex-col items-center gap-2 bg-slate-900/80 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Zoom</span>
            <input 
              type="range" 
              min="2" 
              max="10" 
              step="1" 
              value={zoomLevel} 
              onChange={handleZoomChange}
              className="accent-yellow-400 h-32 w-2 cursor-pointer appearance-none bg-slate-800 rounded-full"
              style={{ writingMode: 'bt-lr' as any, appearance: 'slider-vertical' as any }}
            />
          </div>

          {/* Camera Lock Toggle */}
          <button 
            onClick={() => setIsLocked(!isLocked)}
            className={`group relative flex items-center gap-4 px-6 py-4 rounded-3xl border-2 backdrop-blur-xl transition-all shadow-2xl overflow-hidden
              ${isLocked ? 'bg-yellow-400 border-white text-black' : 'bg-slate-900/80 border-white/10 text-white'}
            `}
          >
            <div className={`w-3 h-3 rounded-full transition-colors ${isLocked ? 'bg-black' : 'bg-yellow-400 animate-pulse'}`}></div>
            <span className="font-black uppercase tracking-widest text-xs">
              {isLocked ? 'Camera Locked' : 'Free Camera'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MapView;

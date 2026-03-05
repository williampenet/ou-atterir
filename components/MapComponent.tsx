import React, { useEffect, useCallback, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import { RefreshCw } from 'lucide-react';
import L from 'leaflet';
import { MapMarker, MapBounds, SearchFilters } from '../types';
import { BLOC_COLORS } from '../constants';
import { searchCommunesForMap } from '../services/communeService';
import MapMarkerCard from './MapMarkerCard';

import 'leaflet/dist/leaflet.css';

const FRANCE_CENTER: L.LatLngExpression = [46.5, 2.5];
const FRANCE_ZOOM = 6;

function getBoundsFromMap(map: L.Map): MapBounds {
  const b = map.getBounds();
  return {
    latMin: b.getSouth(),
    latMax: b.getNorth(),
    lngMin: b.getWest(),
    lngMax: b.getEast(),
  };
}

// ── Public component ──

interface Props {
  filters: SearchFilters;
  selectedInsee: string | null;
  onOpenDrawer: (insee: string) => void;
  isVisible?: boolean;
}

const MapComponent: React.FC<Props> = ({ filters, selectedInsee, onOpenDrawer, isVisible }) => {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [hasMoved, setHasMoved] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current && isVisible) {
      setTimeout(() => mapRef.current?.invalidateSize(), 100);
    }
  }, [isVisible]);

  // Reset selected marker when filters change
  useEffect(() => {
    setSelectedMarker(null);
  }, [JSON.stringify(filters)]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMarkersLoaded = useCallback((data: MapMarker[]) => {
    setMarkers(data);
    setHasMoved(false);
  }, []);

  const handleMarkerClick = useCallback((marker: MapMarker) => {
    setSelectedMarker(marker);
  }, []);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={FRANCE_CENTER}
        zoom={FRANCE_ZOOM}
        scrollWheelZoom
        className="h-full w-full z-0"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapInner
          filters={filters}
          selectedInsee={selectedInsee}
          onMarkersLoaded={handleMarkersLoaded}
          onMarkerClick={handleMarkerClick}
          markers={markers}
          refreshKey={refreshKey}
          onMoveChange={setHasMoved}
        />
      </MapContainer>

      {/* "Rechercher dans cette zone" */}
      {hasMoved && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[400]">
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
            Rechercher dans cette zone
          </button>
        </div>
      )}

      {selectedMarker && (
        <MapMarkerCard
          marker={selectedMarker}
          onClose={() => setSelectedMarker(null)}
          onOpenDrawer={onOpenDrawer}
        />
      )}
    </div>
  );
};

// Inner component that lives inside MapContainer and can use hooks
interface MapInnerProps {
  filters: SearchFilters;
  selectedInsee: string | null;
  onMarkersLoaded: (markers: MapMarker[]) => void;
  onMarkerClick: (marker: MapMarker) => void;
  markers: MapMarker[];
  refreshKey: number;
  onMoveChange: (moved: boolean) => void;
}

const MapInner: React.FC<MapInnerProps> = ({
  filters,
  selectedInsee,
  onMarkersLoaded,
  onMarkerClick,
  markers,
  refreshKey,
  onMoveChange,
}) => {
  const map = useMap();
  const isInitialLoad = useRef(true);
  const skipNextMove = useRef(false);
  const pendingFitDept = useRef<string | null>(null);
  const prevDeptRef = useRef<string | undefined>(filters.department);

  const loadMarkers = useCallback(async () => {
    const bounds = pendingFitDept.current ? null : getBoundsFromMap(map);
    try {
      const data = await searchCommunesForMap(filters, bounds);
      onMarkersLoaded(data);
      if (pendingFitDept.current && data.length > 0) {
        pendingFitDept.current = null;
        const markerBounds = L.latLngBounds(data.map(m => [m.lat, m.lng] as L.LatLngTuple));
        if (markerBounds.isValid()) {
          skipNextMove.current = true;
          map.fitBounds(markerBounds, { padding: [40, 40], maxZoom: 10 });
        }
      }
    } catch {
      onMarkersLoaded([]);
    }
  }, [filters, map, onMarkersLoaded]);

  // Initial load — wait for container to have real dimensions before loading
  useEffect(() => {
    if (!isInitialLoad.current) return;

    const tryLoad = () => {
      map.invalidateSize();
      const h = map.getContainer().clientHeight;
      const bounds = getBoundsFromMap(map);
      if (h > 0 && bounds.latMin !== bounds.latMax) {
        isInitialLoad.current = false;
        if (filters.department) pendingFitDept.current = filters.department;
        loadMarkers();
      } else {
        requestAnimationFrame(tryLoad);
      }
    };

    const timer = setTimeout(tryLoad, 50);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when filters change — set pendingFitDept BEFORE calling loadMarkers
  useEffect(() => {
    if (isInitialLoad.current) return;
    if (filters.department !== prevDeptRef.current) {
      pendingFitDept.current = filters.department ?? null;
      prevDeptRef.current = filters.department;
    }
    onMoveChange(false);
    loadMarkers();
  }, [JSON.stringify(filters)]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when user clicks refresh
  useEffect(() => {
    if (refreshKey === 0) return;
    onMoveChange(false);
    loadMarkers();
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useMapEvents({
    moveend: () => {
      if (isInitialLoad.current) return;
      if (skipNextMove.current) {
        skipNextMove.current = false;
        return;
      }
      onMoveChange(true);
    },
  });

  return (
    <>
      {markers.map((marker) => {
        const color = marker.latestBloc ? (BLOC_COLORS[marker.latestBloc] ?? '#94a3b8') : '#94a3b8';
        const selected = marker.insee === selectedInsee;
        return (
          <CircleMarker
            key={marker.insee}
            center={[marker.lat, marker.lng]}
            radius={selected ? 7 : 5}
            pathOptions={{
              fillColor: color,
              color: '#fff',
              weight: selected ? 3 : 2,
              fillOpacity: selected ? 1 : 0.85,
              opacity: 1,
            }}
            eventHandlers={{ click: () => onMarkerClick(marker) }}
          />
        );
      })}
    </>
  );
};

export default MapComponent;

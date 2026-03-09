import React, { useEffect, useCallback, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapMarker, MapBounds } from '../types';
import { BLOC_COLORS } from '../constants';
import MapMarkerCard from './MapMarkerCard';

import 'leaflet/dist/leaflet.css';

const FRANCE_CENTER: L.LatLngExpression = [46.5, 2.5];
const FRANCE_ZOOM = 6;
const FRANCE_BOUNDS: L.LatLngBoundsExpression = [
  [41.2, -5.5],  // Sud-Ouest (inclut la Corse au sud ~41.4)
  [51.2, 9.8],   // Nord-Est
];

function getBoundsFromMap(map: L.Map): MapBounds {
  const b = map.getBounds();
  return {
    latMin: b.getSouth(),
    latMax: b.getNorth(),
    lngMin: b.getWest(),
    lngMax: b.getEast(),
  };
}

interface Props {
  markers: MapMarker[];
  selectedInsee: string | null;
  onOpenDrawer: (insee: string) => void;
  onBoundsChange: (bounds: MapBounds) => void;
  fitBoundsKey?: number;
  isVisible?: boolean;
}

const MapComponent: React.FC<Props> = ({
  markers,
  selectedInsee,
  onOpenDrawer,
  onBoundsChange,
  fitBoundsKey = 0,
  isVisible,
}) => {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current && isVisible) {
      setTimeout(() => mapRef.current?.invalidateSize(), 100);
    }
  }, [isVisible]);

  useEffect(() => {
    setSelectedMarker(null);
  }, [markers]);

  const handleMarkerClick = useCallback((marker: MapMarker) => {
    setSelectedMarker(marker);
  }, []);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={FRANCE_CENTER}
        zoom={FRANCE_ZOOM}
        scrollWheelZoom
        maxBounds={FRANCE_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={5}
        className="h-full w-full z-0"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapInner
          markers={markers}
          selectedInsee={selectedInsee}
          onMarkerClick={handleMarkerClick}
          onBoundsChange={onBoundsChange}
          fitBoundsKey={fitBoundsKey}
        />
      </MapContainer>

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

interface MapInnerProps {
  markers: MapMarker[];
  selectedInsee: string | null;
  onMarkerClick: (marker: MapMarker) => void;
  onBoundsChange: (bounds: MapBounds) => void;
  fitBoundsKey: number;
}

const MapInner: React.FC<MapInnerProps> = ({
  markers,
  selectedInsee,
  onMarkerClick,
  onBoundsChange,
  fitBoundsKey,
}) => {
  const map = useMap();
  const initialRef = useRef(true);
  const skipNextMove = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const tryReport = () => {
      map.invalidateSize();
      const h = map.getContainer().clientHeight;
      const bounds = getBoundsFromMap(map);
      if (h > 0 && bounds.latMin !== bounds.latMax) {
        initialRef.current = false;
        onBoundsChange(bounds);
      } else {
        requestAnimationFrame(tryReport);
      }
    };
    const timer = setTimeout(tryReport, 50);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (fitBoundsKey === 0 || markers.length === 0) return;
    const markerBounds = L.latLngBounds(
      markers.map(m => [m.lat, m.lng] as L.LatLngTuple)
    );
    if (markerBounds.isValid()) {
      skipNextMove.current = true;
      map.fitBounds(markerBounds, { padding: [40, 40], maxZoom: 10 });
    }
  }, [fitBoundsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useMapEvents({
    moveend: () => {
      if (initialRef.current) return;
      if (skipNextMove.current) {
        skipNextMove.current = false;
        onBoundsChange(getBoundsFromMap(map));
        return;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onBoundsChange(getBoundsFromMap(map));
      }, 500);
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

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Commune } from '../types';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Props {
  center: [number, number];
  communes: Commune[];
  selectedId?: string;
  isVisible?: boolean;
}

const MapComponent: React.FC<Props> = ({ center, communes, selectedId, isVisible }) => {
  const [map, setMap] = useState<L.Map | null>(null);

  useEffect(() => {
    if (map) {
      map.invalidateSize();
      setTimeout(() => map.invalidateSize(), 100);
      setTimeout(() => map.invalidateSize(), 300);
    }
  }, [map, isVisible]);

  useEffect(() => {
    if (map) {
      map.flyTo(center, 12, { animate: true });
    }
  }, [center, map]);

  return (
    <div className="h-full w-full rounded-xl overflow-hidden z-0 border border-slate-200 shadow-inner">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full"
        ref={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerClusterGroup chunkedLoading>
          {communes.map((commune) => (
            <Marker
              key={commune.insee}
              position={commune.coordinates}
              opacity={commune.insee === selectedId ? 1 : 0.7}
            >
              <Popup>
                <div className="text-center">
                  <h3 className="font-bold text-slate-800">{commune.name}</h3>
                  <p className="text-slate-600 text-xs">{commune.stability}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};

export default MapComponent;

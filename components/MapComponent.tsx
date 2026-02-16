import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Commune } from '../types';
import L from 'leaflet';

// Fix for Leaflet default icon not loading in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Props {
  center: [number, number];
  communes: Commune[];
  selectedId?: string;
}

const MapComponent: React.FC<Props> = ({ center, communes, selectedId }) => {
  const [map, setMap] = useState<L.Map | null>(null);

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
        {communes.map((commune) => (
          <React.Fragment key={commune.insee}>
            <Marker position={commune.coordinates}>
              <Popup>
                <div className="text-center">
                  <h3 className="font-bold text-slate-800">{commune.name}</h3>
                  <p className="text-slate-600 text-xs">{commune.stability}</p>
                </div>
              </Popup>
            </Marker>
            {/* Visual circle indicating influence/area - styling depends on last winner color could be added here */}
             <Circle 
                center={commune.coordinates}
                pathOptions={{ 
                    fillColor: commune.insee === selectedId ? '#4f46e5' : '#94a3b8', 
                    color: commune.insee === selectedId ? '#4f46e5' : '#94a3b8', 
                    opacity: 0.5,
                    fillOpacity: 0.2
                }}
                radius={800}
            />
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;

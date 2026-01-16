import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite/Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Set default icon
const defaultIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Location {
  city: string;
  address: string;
  phone: string;
  tollFree: string;
  coords: [number, number]; // [lat, lng]
}

interface LocationsMapProps {
  locations: Location[];
}

export default function LocationsMap({ locations }: LocationsMapProps) {
  // Center of Russia for initial view
  const center: [number, number] = [52.0, 40.0];

  return (
    <MapContainer
      center={center}
      zoom={4}
      style={{ height: '450px', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((location, index) => (
        <Marker
          key={index}
          position={location.coords}
          icon={defaultIcon}
        >
          <Popup>
            <div className="text-sm">
              <h3 className="font-bold text-base mb-1">г. {location.city}</h3>
              <p className="mb-1">{location.address}</p>
              <p className="text-gray-600">{location.phone}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

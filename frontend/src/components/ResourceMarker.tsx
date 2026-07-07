import { getDistance } from "geolib";
import { Marker, Popup } from "react-leaflet";

export interface ResourceMapItem {
  id: string;
  title: string;
  category: string;
  city: string;
  latitude: number;
  longitude: number;
  distanceKm?: number | null;
}

interface ResourceMarkerProps {
  resource: ResourceMapItem;
  userLocation: { latitude: number; longitude: number } | null;
  onSelect: (resource: ResourceMapItem) => void;
}

function formatDistance(resource: ResourceMapItem, userLocation: ResourceMarkerProps["userLocation"]) {
  if (typeof resource.distanceKm === "number") {
    return `${resource.distanceKm.toFixed(2)} km`;
  }

  if (!userLocation) {
    return "Enable location to calculate distance";
  }

  const meters = getDistance(userLocation, {
    latitude: resource.latitude,
    longitude: resource.longitude
  });

  return `${(meters / 1000).toFixed(2)} km`;
}

export function ResourceMarker({ resource, userLocation, onSelect }: ResourceMarkerProps) {
  return (
    <Marker
      position={[resource.latitude, resource.longitude]}
      eventHandlers={{
        click: () => onSelect(resource)
      }}
    >
      <Popup>
        <div className="resource-popup">
          <strong>{resource.title}</strong>
          <span>{resource.category}</span>
          <span>{resource.city}</span>
          <span>{formatDistance(resource, userLocation)}</span>
          <button type="button" onClick={() => onSelect(resource)}>
            Show route
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

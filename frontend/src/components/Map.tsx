import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Loader, LocateFixed } from "lucide-react";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { ResourceMarker, type ResourceMapItem } from "./ResourceMarker";
import { RouteMap } from "./RouteMap";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

interface MapProps {
  center: { latitude: number; longitude: number };
  userLocation: { latitude: number; longitude: number } | null;
  resources: ResourceMapItem[];
  selectedResource: ResourceMapItem | null;
  isLoading: boolean;
  onResourceSelect: (resource: ResourceMapItem) => void;
  onLocateUser: () => void;
}

function MapCenter({ center }: { center: MapProps["center"] }) {
  const map = useMap();

  useEffect(() => {
    map.setView([center.latitude, center.longitude], map.getZoom());
  }, [center, map]);

  return null;
}

export function Map({
  center,
  userLocation,
  resources,
  selectedResource,
  isLoading,
  onResourceSelect,
  onLocateUser
}: MapProps) {
  return (
    <div className="resource-map-shell">
      <MapContainer center={[center.latitude, center.longitude]} zoom={12} scrollWheelZoom className="resource-map-canvas">
        <MapCenter center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation ? <Marker position={[userLocation.latitude, userLocation.longitude]} /> : null}
        {resources.map((resource) => (
          <ResourceMarker key={resource.id} resource={resource} userLocation={userLocation} onSelect={onResourceSelect} />
        ))}
        <RouteMap
          origin={userLocation}
          destination={
            selectedResource
              ? {
                  latitude: selectedResource.latitude,
                  longitude: selectedResource.longitude
                }
              : null
          }
        />
      </MapContainer>
      <button className="map-locate-button" type="button" onClick={onLocateUser} aria-label="Center map on current location">
        <LocateFixed className="h-5 w-5" />
      </button>
      {isLoading ? (
        <div className="map-loading" role="status">
          <Loader className="h-5 w-5 animate-spin" />
          Loading resources
        </div>
      ) : null}
    </div>
  );
}

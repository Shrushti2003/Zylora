import { useEffect, useState } from "react";
import { Polyline } from "react-leaflet";

interface RouteMapProps {
  origin: { latitude: number; longitude: number } | null;
  destination: { latitude: number; longitude: number } | null;
}

type RouteState = {
  coordinates: [number, number][];
  error: string;
  isLoading: boolean;
};

export function RouteMap({ origin, destination }: RouteMapProps) {
  const [route, setRoute] = useState<RouteState>({
    coordinates: [],
    error: "",
    isLoading: false
  });

  useEffect(() => {
    if (!origin || !destination) {
      setRoute({ coordinates: [], error: "", isLoading: false });
      return;
    }

    const controller = new AbortController();
    const routeOrigin = origin;
    const routeDestination = destination;

    async function loadRoute() {
      setRoute((current) => ({ ...current, isLoading: true, error: "" }));

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${routeOrigin.longitude},${routeOrigin.latitude};${routeDestination.longitude},${routeDestination.latitude}?overview=full&geometries=geojson`;
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new Error("OSRM route request failed.");
        }

        const payload = (await response.json()) as {
          routes?: Array<{
            geometry?: {
              coordinates?: [number, number][];
            };
          }>;
        };

        const coordinates = payload.routes?.[0]?.geometry?.coordinates;

        if (!coordinates?.length) {
          throw new Error("No route found for this resource.");
        }

        setRoute({
          coordinates: coordinates.map(([longitude, latitude]) => [latitude, longitude]),
          error: "",
          isLoading: false
        });
      } catch (caughtError) {
        if (controller.signal.aborted) {
          return;
        }

        setRoute({
          coordinates: [],
          error: caughtError instanceof Error ? caughtError.message : "Could not draw route.",
          isLoading: false
        });
      }
    }

    void loadRoute();

    return () => controller.abort();
  }, [destination, origin]);

  return (
    <>
      {route.coordinates.length ? <Polyline positions={route.coordinates} pathOptions={{ color: "#c27b66", weight: 5 }} /> : null}
      {route.isLoading || route.error ? (
        <div className="route-status" role={route.error ? "alert" : "status"}>
          {route.error || "Loading route..."}
        </div>
      ) : null}
    </>
  );
}

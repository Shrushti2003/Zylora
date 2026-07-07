import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Loader, MapPin, Navigation, PlusCircle } from "lucide-react";
import { Map } from "../components/Map";
import { type ResourceMapItem } from "../components/ResourceMarker";
import { SearchBar } from "../components/SearchBar";
import { PageShell, SurfaceCard } from "../components/common/PageShell";
import { PlatformLayout } from "../components/layout/PlatformLayout";
import { httpClient } from "../api/httpClient";
import { categories, citySuggestions, createId, loadResources as loadStoredResources, saveResource, type ResourceCategory, type ResourceListing } from "../data/mvpData";
import { projectPhotos } from "../data/visuals";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

const DEFAULT_CENTER = {
  latitude: 19.076,
  longitude: 72.8777
};

const radiusOptions = [5, 10, 25, 50];

type CreateFormState = {
  title: string;
  category: ResourceCategory;
  city: string;
  address: string;
};

export function ResourceMap() {
  const [resources, setResources] = useState<ResourceMapItem[]>([]);
  const [userLocation, setUserLocation] = useState<typeof DEFAULT_CENTER | null>(null);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [radius, setRadius] = useState(10);
  const [selectedResource, setSelectedResource] = useState<ResourceMapItem | null>(null);
  const [titleFilter, setTitleFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const debouncedTitleFilter = useDebouncedValue(titleFilter, 350);
  const debouncedCategoryFilter = useDebouncedValue(categoryFilter, 350);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [form, setForm] = useState<CreateFormState>({
    title: "Leftover cement and tiles",
    category: "Construction Materials",
    city: "",
    address: ""
  });

  const resourcesEndpoint = useMemo(() => {
    if (!userLocation) {
      return "/resources";
    }

    const params = new URLSearchParams({
      latitude: String(userLocation.latitude),
      longitude: String(userLocation.longitude),
      radius: String(radius)
    });

    return `/resources/nearby?${params.toString()}`;
  }, [radius, userLocation]);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesTitle = !debouncedTitleFilter || resource.title.toLowerCase().includes(debouncedTitleFilter.toLowerCase());
      const matchesCategory = !debouncedCategoryFilter || resource.category === debouncedCategoryFilter;
      return matchesTitle && matchesCategory;
    });
  }, [debouncedCategoryFilter, debouncedTitleFilter, resources]);

  const titleOptions = useMemo(() => {
    const storedTitles = loadStoredResources().map((resource) => resource.title);
    const exampleTitles = categories.flatMap((item) => item.examples);
    return Array.from(new Set([...storedTitles, ...exampleTitles])).sort((a, b) => a.localeCompare(b));
  }, []);

  const loadResources = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError("");
    const localResources = loadStoredResources().map((resource) => ({
      id: resource.id,
      title: resource.title,
      category: resource.category,
      city: resource.city,
      address: resource.address,
      latitude: resource.latitude,
      longitude: resource.longitude
    }));

    try {
      const response = await httpClient.get<{ resources: ResourceMapItem[] }>(resourcesEndpoint, { signal });
      if (signal?.aborted) return;
      const merged = [...localResources, ...response.data.resources].filter((resource) => Number.isFinite(resource.latitude) && Number.isFinite(resource.longitude));
      setResources(Array.from(new globalThis.Map(merged.map((resource) => [resource.id, resource])).values()));
      setIsLoading(false);
    } catch {
      if (signal?.aborted) return;
      setResources(localResources.filter((resource) => Number.isFinite(resource.latitude) && Number.isFinite(resource.longitude)));
      setError("Showing local demo resources because live map data is unavailable.");
      setIsLoading(false);
    }
  }, [resourcesEndpoint]);

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Browser geolocation is not available.");
      return;
    }

    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setUserLocation(nextLocation);
        setCenter(nextLocation);
      },
      () => {
        setError("Location permission was denied or unavailable.");
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000
      }
    );
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadResources(controller.signal);
    return () => controller.abort();
  }, [loadResources]);

  async function handleCreateResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setCreateMessage("");

    try {
      const coordinates = await geocodeCity(form.city);
      const localResource: ResourceListing = {
        id: createId("map-resource"),
        title: form.title,
        category: form.category,
        city: form.city,
        address: form.address,
        condition: "Good",
        seller: "Current Zylora user",
        recipient: "Map search result",
        material: form.title,
        value: "Donation",
        quantity: "Available on request",
        expiry: "Recipient should inspect during pickup",
        score: 82,
        image: projectPhotos.logistics,
        description: `${form.title} available at ${form.address}, ${form.city}.`,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        postedAt: new Date().toISOString(),
        availabilityStatus: "Available",
        verificationStatus: "Unverified"
      };
      saveResource(localResource);
      const syncedResource = await httpClient
        .post<{ resource: ResourceMapItem }>("/resources", { ...form, latitude: coordinates.latitude, longitude: coordinates.longitude })
        .then((response) => response.data.resource)
        .catch(() => null);
      const localMapResource: ResourceMapItem = {
        id: localResource.id,
        title: localResource.title,
        category: localResource.category,
        city: localResource.city,
        latitude: localResource.latitude,
        longitude: localResource.longitude
      };
      setResources((current) => Array.from(new globalThis.Map([
        ...current,
        localMapResource,
        ...(syncedResource ? [syncedResource] : [])
      ].map((resource) => [resource.id, resource])).values()));
      setCreateMessage("Resource created with OpenStreetMap coordinates and added to Browse, Buyer Dashboard, and Map Results.");
      setForm({ title: "Leftover cement and tiles", category: "Construction Materials", city: "", address: "" });
    } catch {
      setCreateMessage("Could not create resource. Check the city/address and try again.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <PlatformLayout>
      <PageShell
        eyebrow="Resource map"
        title="Find nearby circular economy resources on OpenStreetMap."
        description="Search by city, browse live and local resources, filter by radius, and choose when to share your current location."
        image="/Maps.png"
        imageAlt="Resource logistics and neighborhood matching"
      >
        <div className="resource-map-layout">
          <SurfaceCard className="resource-map-panel">
            <SearchBar
              onCityFound={(location) => {
                setCenter(location);
                setError(`Centered on ${location.label}`);
              }}
            />
            <div className="radius-controls" aria-label="Radius filter">
              {radiusOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={radius === option ? "active" : ""}
                  onClick={() => setRadius(option)}
                >
                  {option} km
                </button>
              ))}
            </div>
            <button className="map-action-button" type="button" onClick={locateUser}>
              <Navigation className="h-4 w-4" />
              Use current location
            </button>
            <div className="map-filter-grid">
              <label>
                <span>Filter title</span>
                <input list="map-title-filter-options" value={titleFilter} onChange={(event) => setTitleFilter(event.target.value)} placeholder="Search or select title" />
                <datalist id="map-title-filter-options">
                  {titleOptions.map((title) => <option key={title} value={title} />)}
                </datalist>
              </label>
              <label>
                <span>Filter category</span>
                <input list="map-category-filter-options" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} placeholder="Search or select category" />
                <datalist id="map-category-filter-options">
                  {categories.map((item) => <option key={item.name} value={item.name} />)}
                </datalist>
              </label>
            </div>
            {error ? <p className="map-message" role="status">{error}</p> : null}
            <div className="resource-list">
              {filteredResources.map((resource) => (
                <button
                  type="button"
                  key={resource.id}
                  className={selectedResource?.id === resource.id ? "selected" : ""}
                  onClick={() => {
                    setSelectedResource(resource);
                    setCenter({ latitude: resource.latitude, longitude: resource.longitude });
                  }}
                >
                  <span>
                    <MapPin className="h-4 w-4" />
                    {resource.title}
                  </span>
                  <small>{resource.category} - {resource.city}</small>
                  {typeof resource.distanceKm === "number" ? <em>{resource.distanceKm.toFixed(2)} km</em> : null}
                </button>
              ))}
              {!filteredResources.length && !isLoading ? <p>No resources found for this title/category/radius.</p> : null}
            </div>
          </SurfaceCard>

          <Map
            center={center}
            userLocation={userLocation}
            resources={filteredResources}
            selectedResource={selectedResource}
            isLoading={isLoading}
            onResourceSelect={(resource) => {
              setSelectedResource(resource);
              setCenter({ latitude: resource.latitude, longitude: resource.longitude });
            }}
            onLocateUser={locateUser}
          />
        </div>

        <SurfaceCard className="mt-6">
          <div className="map-form-heading">
            <PlusCircle className="h-6 w-6" />
            <h2>Create a mapped resource</h2>
          </div>
          <form className="resource-create-form" onSubmit={handleCreateResource}>
            <label>
              <span>title</span>
              <input list="resource-title-options" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
              <datalist id="resource-title-options">
                {titleOptions.map((title) => <option key={title} value={title} />)}
              </datalist>
            </label>
            <label>
              <span>category</span>
              <input list="resource-category-options" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as ResourceCategory }))} required />
              <datalist id="resource-category-options">
                {categories.map((item) => <option key={item.name}>{item.name}</option>)}
              </datalist>
            </label>
            <label>
              <span>city</span>
              <input
                list="city-autocomplete"
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                placeholder="Type rai for Raipur, Raigarh, Raisen..."
                required
              />
              <datalist id="city-autocomplete">
                {citySuggestions.map((city) => <option key={city} value={city} />)}
              </datalist>
            </label>
            <label>
              <span>address</span>
              <input
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                placeholder="Street, area, landmark"
                required
              />
            </label>
            <button type="submit" disabled={isCreating}>
              {isCreating ? <Loader className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
              Create resource
            </button>
          </form>
          {createMessage ? <p className="map-message" role="status">{createMessage}</p> : null}
        </SurfaceCard>
      </PageShell>
    </PlatformLayout>
  );
}

async function geocodeCity(city: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", city);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  const results = response.ok ? await response.json() as Array<{ lat: string; lon: string }> : [];
  const first = results[0];

  return first
    ? { latitude: Number(first.lat), longitude: Number(first.lon) }
    : { latitude: DEFAULT_CENTER.latitude, longitude: DEFAULT_CENTER.longitude };
}

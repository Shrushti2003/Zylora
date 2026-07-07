import { FormEvent, useEffect, useState } from "react";
import { Loader, Search } from "lucide-react";
import { citySuggestions } from "../data/mvpData";

interface SearchBarProps {
  onCityFound: (location: { latitude: number; longitude: number; label: string }) => void;
}

export function SearchBar({ onCityFound }: SearchBarProps) {
  const [city, setCity] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ label: string; latitude?: number; longitude?: number }>>([]);

  useEffect(() => {
    const query = city.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const fallback = citySuggestions
      .filter((item) => item.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6)
      .map((label) => ({ label }));
    setSuggestions(fallback);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", query);
      url.searchParams.set("format", "json");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("countrycodes", "in");
      url.searchParams.set("limit", "6");

      fetch(url.toString(), { headers: { Accept: "application/json" }, signal: controller.signal })
        .then((response) => response.ok ? response.json() : [])
        .then((results: Array<{ lat: string; lon: string; display_name: string }>) => {
          const apiSuggestions = results.map((item) => ({
            label: item.display_name,
            latitude: Number(item.lat),
            longitude: Number(item.lon)
          }));
          setSuggestions(apiSuggestions.length ? apiSuggestions : fallback);
        })
        .catch(() => setSuggestions(fallback));
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [city]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = city.trim();

    if (!query) {
      setError("Enter a city name.");
      return;
    }

    setIsSearching(true);
    setError("");

    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", query);
      url.searchParams.set("format", "json");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("countrycodes", "in");
      url.searchParams.set("limit", "1");

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("OpenStreetMap search failed.");
      }

      const results = (await response.json()) as Array<{
        lat: string;
        lon: string;
        display_name: string;
      }>;
      const firstResult = results[0];

      if (!firstResult) {
        throw new Error("No matching city found.");
      }

      onCityFound({
        latitude: Number(firstResult.lat),
        longitude: Number(firstResult.lon),
        label: firstResult.display_name
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "City search failed.");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <form className="map-search" onSubmit={handleSubmit}>
      <label>
        <Search className="h-5 w-5" />
        <input
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="Search city with OpenStreetMap"
          aria-label="Search city"
        />
      </label>
      <button type="submit" disabled={isSearching}>
        {isSearching ? <Loader className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        Search
      </button>
      {suggestions.length ? (
        <div className="map-suggestions">
          {suggestions.map((suggestion) => (
            <button
              type="button"
              key={suggestion.label}
              onClick={() => {
                setCity(suggestion.label);
                if (typeof suggestion.latitude === "number" && typeof suggestion.longitude === "number") {
                  onCityFound({ latitude: suggestion.latitude, longitude: suggestion.longitude, label: suggestion.label });
                }
              }}
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}

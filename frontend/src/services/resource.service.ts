import { httpClient } from "../api/httpClient";
import { removeResource } from "../data/mvpData";

export interface OwnedResource {
  id: string;
  clientResourceId?: string;
  title: string;
  description: string;
  category: string;
  resourceType: string;
  condition: string;
  status: string;
  city: string;
  address: string;
  images: string[];
  datePosted?: string;
  createdAt?: string;
  updatedAt?: string;
  views?: number;
  owner?: {
    id: string;
    name: string;
    username: string;
    photoUrl: string;
    isVerified: boolean;
    badge: string;
  } | null;
}

export interface CreateResourceInput {
  clientResourceId?: string;
  title: string;
  description?: string;
  category: string;
  resourceType?: "Sell" | "Buy" | "Donate";
  condition?: string;
  status?: "draft" | "available" | "matched" | "picked_up" | "closed";
  city: string;
  address: string;
  images?: string[];
  latitude?: number;
  longitude?: number;
}

const maxApiImageLength = 900_000;

export function prepareResourceImages(images: Array<string | undefined>, fallbackImage?: string) {
  const safeImages = images
    .filter((image): image is string => Boolean(image?.trim()))
    .map((image) => image.trim())
    .filter((image) => {
      if (image.length > maxApiImageLength) return false;
      return image.startsWith("https://")
        || image.startsWith("/")
        || image.startsWith("data:image/");
    });

  if (safeImages.length) return safeImages.slice(0, 8);
  return fallbackImage ? [fallbackImage] : [];
}

export async function loadMyResources() {
  const { data } = await httpClient.get<{ resources: OwnedResource[] }>("/resources/me");
  return data.resources;
}

export async function loadResource(resourceId: string) {
  const { data } = await httpClient.get<{ resource: OwnedResource }>(`/resources/${encodeURIComponent(resourceId)}`);
  return data.resource;
}

export async function createResource(input: CreateResourceInput) {
  const { data } = await httpClient.post<{ resource: OwnedResource }>("/resources", input);
  return data.resource;
}

export async function deleteResource(resourceId: string, clientResourceId?: string) {
  const { data } = await httpClient.delete<{ deleted: boolean; resourceId: string }>(`/resources/${encodeURIComponent(resourceId)}`);
  removeResource(resourceId, clientResourceId);
  return data;
}

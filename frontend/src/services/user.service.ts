import { httpClient } from "../api/httpClient";

export interface PublicUserProfile {
  id: string;
  name: string;
  email: string;
  username: string;
  bio: string;
  organizationName: string;
  profileImage: string;
  photoUrl: string;
  location: string;
  joinedAt?: string;
  postCount: number;
  savedResourceCount: number | null;
  isOnlineVisible: boolean;
  allowMessageRequests: boolean;
  isVerified: boolean;
  badge: string;
}

export interface PublicUserPost {
  id: string;
  clientResourceId?: string;
  authorId: string;
  title: string;
  description: string;
  category: string;
  resourceType: string;
  condition?: string;
  status: string;
  city: string;
  address: string;
  location?: string;
  images: string[];
  datePosted?: string;
  createdAt?: string;
  updatedAt?: string;
  views?: number;
  likes: number;
  comments: number;
  saveCount: number;
  shareCount: number;
  author: PublicUserProfile | null;
}

export async function loadPublicProfile(identifier: string) {
  const { data } = await httpClient.get<{ user: PublicUserProfile }>(`/users/${encodeURIComponent(identifier)}`);
  return data.user;
}

export async function loadPublicProfilePosts(identifier: string) {
  const { data } = await httpClient.get<{ user: PublicUserProfile; posts: PublicUserPost[] }>(`/users/${encodeURIComponent(identifier)}/posts`);
  return data;
}

export async function searchPublicUsers(query: string) {
  const { data } = await httpClient.get<{ users: PublicUserProfile[] }>("/users/search", { params: { q: query } });
  return data.users;
}

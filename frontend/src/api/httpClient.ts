import axios, { type InternalAxiosRequestConfig } from "axios";
import { auth } from "../config/firebase";

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retriedWithFreshToken?: boolean };

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

httpClient.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  const hasAuthorizationHeader = Boolean(config.headers.Authorization);

  if (currentUser && !hasAuthorizationHeader) {
    config.headers.Authorization = `Bearer ${await currentUser.getIdToken()}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetriableRequestConfig | undefined;

    if (error.response?.status !== 401 || !config || config._retriedWithFreshToken || !auth.currentUser) {
      return Promise.reject(error);
    }

    config._retriedWithFreshToken = true;
    config.headers.Authorization = `Bearer ${await auth.currentUser.getIdToken(true)}`;
    return httpClient(config);
  }
);

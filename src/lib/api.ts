import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { authStorage } from "./auth-storage";
import { env } from "./env";

export const api = axios.create({
  baseURL: `${env.apiUrl}/api/v1`,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authStorage.get();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;
let onLocked: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export function setLockedHandler(handler: (() => void) | null): void {
  onLocked = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    if (status === 401) {
      authStorage.clear();
      onUnauthorized?.();
    } else if (status === 423) {
      onLocked?.();
    }
    return Promise.reject(error);
  },
);

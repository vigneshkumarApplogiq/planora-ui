/**
 * API Configuration
 * Centralized API base URL configuration for the entire application
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Application Version Information
export const APP_VERSION = {
  version: '1.5.0',
  buildDate: '2025-01-22',
  environment: (import.meta as any).env?.MODE || 'development'
};

// Helper function to construct full API URLs
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function to construct asset URLs (for user profiles, etc.)
export const getAssetUrl = (path: string): string => {
  return `${API_BASE_URL}${path}`;
};
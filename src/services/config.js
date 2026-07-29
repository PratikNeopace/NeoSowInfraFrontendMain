/**
 * API Environment Configuration
 * 
 * Toggle the boolean `isProduction` below to switch environments:
 * - true  => Production URL: https://api.neosowinfra.com/api/v1
 * - false => Localhost URL:  http://localhost:8080/api/v1
 */
export const isProduction = false; // Change this to true to run on production URL

// Production API URL (suffix with /v1 to match backend routes)
export const PRODUCTION_API_URL = 'https://api.neosowinfra.com/api/v1';

// Localhost API URL
export const LOCAL_API_URL = 'http://localhost:8080/api/v1';

// Active Base URL based on the toggle
export const API_BASE_URL = isProduction ? PRODUCTION_API_URL : LOCAL_API_URL;

/**
 * API Context Configuration File
 * 
 * Toggle the boolean `USE_PRODUCTION` below to switch environments:
 * - true  => Production URL: https://api.neosowinfra.com/api
 * - false => Localhost URL:  http://localhost:8080/api
 */
export const USE_PRODUCTION = false; // Change this to true to run on production URL

// Production API URL
export const PRODUCTION_API_URL = 'https://api.neosowinfra.com/api';

// Localhost API URL (update port/path if your local backend runs elsewhere)
export const LOCAL_API_URL = 'http://localhost:8080/api';

// Active API Base URL
export const API_BASE_URL = USE_PRODUCTION ? PRODUCTION_API_URL : LOCAL_API_URL;

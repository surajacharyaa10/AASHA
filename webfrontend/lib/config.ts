/**
 * Central backend URL config for the web dashboard.
 *
 * In development this falls back to http://localhost:4000.
 * For production deployments set the env variable:
 *   NEXT_PUBLIC_BACKEND_URL=https://your-production-backend.com
 */
const BACKEND_URL: string =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';

export default BACKEND_URL;

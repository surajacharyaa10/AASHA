import { Platform } from 'react-native';

/**
 * Central backend URL config for the mobile app.
 *
 * IMPORTANT: Use your machine's local LAN IP (not `localhost`) when
 * testing on a physical device — `localhost` only resolves inside simulators.
 *
 * To find your IP on macOS: System Settings → Wi-Fi → Details → IP Address
 * Then update the value below:  e.g. 'http://192.168.x.x:4000'
 */
const BACKEND_URL: string = Platform.select({
  ios:     'http://192.168.18.39:4000',
  android: 'http://192.168.18.39:4000',
  default: 'http://192.168.18.39:4000',
}) as string;

export default BACKEND_URL;

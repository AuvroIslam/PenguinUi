/** The sub-path the site is hosted under, empty in development. */
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Prefixes a public asset path. Links through `next/link` get the base path on their own. */
export function asset(path: string) {
  return `${BASE}${path}`;
}

/** The live, interactive preview of one component: the real React Native code, built for the web. */
export function previewUrl(id: string, theme: 'dark' | 'light' = 'dark') {
  // The directory, not index.html: the app inside routes on its path and treats `/` as home.
  return `${BASE}/preview/?c=${encodeURIComponent(id)}&theme=${theme}`;
}

export function thumbUrl(id: string) {
  return `${BASE}/thumbs/${id}.webp`;
}

export const GITHUB = 'https://github.com/AuvroIslam/PenguinUi';

export const PEERS = 'npx expo install react-native-reanimated react-native-gesture-handler react-native-svg react-native-worklets expo-haptics';

export type LastSearch = {
  query: string;
  location: string;
  coords?: { latitude: number; longitude: number } | null;
  filters?: string[];
  timestamp: number;
};

const KEY = 'ryb:lastSearch';

export function setLastSearch(s: LastSearch) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch (e) {
    // ignore
  }
}

export function getLastSearch(): LastSearch | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(KEY);
    return v ? JSON.parse(v) : null;
  } catch (e) {
    return null;
  }
}

export function clearLastSearch() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(KEY);
  } catch (e) {}
}

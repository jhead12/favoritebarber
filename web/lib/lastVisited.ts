export type LastVisitedBarber = {
  id: string | number;
  name?: string;
  shop?: string;
  timestamp: number;
};

const KEY = 'ryb:lastVisitedBarber';

export function setLastVisitedBarber(b: LastVisitedBarber) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(b));
  } catch (e) {
    // ignore storage errors
  }
}

export function getLastVisitedBarber(): LastVisitedBarber | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(KEY);
    return v ? JSON.parse(v) : null;
  } catch (e) {
    return null;
  }
}

export function clearLastVisitedBarber() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    // ignore
  }
}

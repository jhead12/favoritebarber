import React, { useState, useEffect } from 'react';
import { getLastSearch, setLastSearch, LastSearch } from '../lib/lastSearch';

type Props = {
  onSearch?: (query: string, location: string, coords?: { latitude: number; longitude: number } | null, filters?: string[]) => void;
};

export default function SearchBar({ onSearch }: Props) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('San Francisco, CA');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [usingLocation, setUsingLocation] = useState(false);
  const [filters, setFilters] = useState<string[]>([]);

  useEffect(() => {
    // Prefill from cached location if available
    let mounted = true;
    (async () => {
      try {
        // Load last explicit search first (if any)
        const last = getLastSearch();
        if (last && mounted) {
          setQuery(last.query || '');
          setLocation(last.location || 'San Francisco, CA');
          if (last.coords) setCoords(last.coords as { latitude: number; longitude: number });
          if (last.filters) setFilters(last.filters);
          return;
        }

        const { getCachedLocation, reverseGeocode } = await import('../lib/location');
        const cached = getCachedLocation();
        if (cached && mounted) {
          setCoords(cached);
          // Try to reverse-geocode to friendly label
          try {
            const label = await reverseGeocode(cached.latitude, cached.longitude);
            if (label) setLocation(label);
            else setLocation(`${cached.latitude.toFixed(5)},${cached.longitude.toFixed(5)}`);
          } catch (e) {
            setLocation(`${cached.latitude.toFixed(5)},${cached.longitude.toFixed(5)}`);
          }
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query, location, coords, filters);
    try {
      const s: LastSearch = { query: query || '', location: location || '', coords: coords || null, filters, timestamp: Date.now() };
      setLastSearch(s);
    } catch (e) {
      // ignore storage errors
    }
  };

  const toggleFilter = (f: string) => {
    if (filters.includes(f)) {
      setFilters(filters.filter(x => x !== f));
    } else {
      setFilters([...filters, f]);
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="search-shell">
        <div className="inputs">
          <div className="field">
            <label>Find</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Fade, beard trim, or barber name"
            />
          </div>
          <div className="field">
            <label>Near</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or ZIP"
            />
            <div style={{ marginTop: 6 }}>
              <button type="button" onClick={async () => {
                setUsingLocation(true);
                try {
                  const { requestLocation } = await import('../lib/location');
                  const c = await requestLocation();
                  setCoords(c);
                  setLocation(`${c.latitude.toFixed(5)},${c.longitude.toFixed(5)}`);
                } catch (e) {
                  // ignore, could show message later
                  console.error('geo error', e);
                } finally {
                  setUsingLocation(false);
                }
              }} style={{ padding: '6px 8px', marginTop: 6 }}>
                {usingLocation ? 'Locating…' : 'Use my location'}
              </button>
            </div>
          </div>
        </div>
        <button type="submit">Search</button>
      </form>
      <div className="filters">
        {['Fade', 'Beard trim', 'Mobile', 'Open now'].map(f => (
          <button
            key={f}
            type="button"
            className={filters.includes(f) ? 'active' : ''}
            onClick={() => toggleFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <style jsx>{`
        .search-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .search-shell {
          display: flex;
          gap: 12px;
          align-items: flex-end;
          background: #0c1116;
          border: 1px solid #1f2b36;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.35);
        }
        .inputs { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        label { font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase; color: #8fa3b5; }
        input {
          border: 1px solid #1f2b36;
          border-radius: 10px;
          padding: 12px 14px;
          background: #0f1620;
          color: #e7eef7;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        input:focus { border-color: #4fb4ff; box-shadow: 0 0 0 3px rgba(79,180,255,0.2); }
        button {
          border: none;
          background: linear-gradient(135deg, #4fb4ff, #6dd5fa);
          color: #041019;
          padding: 12px 18px;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.1s ease, box-shadow 0.15s ease;
        }
        button:hover { transform: translateY(-1px); box-shadow: 0 10px 25px rgba(79,180,255,0.3); }
        @media (max-width: 720px) {
          .inputs { grid-template-columns: 1fr; }
          .search-shell { flex-direction: column; align-items: stretch; }
          button { width: 100%; }
        }
        .filters { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
        .filters button { padding: 8px 12px; border-radius: 10px; border: 1px solid #1f2b36; background: #0f1620; color: #d9e3ee; cursor: pointer; font-weight: 500; }
        .filters button:hover { border-color: #4fb4ff; transform: none; box-shadow: none; }
        .filters button.active { background: #4fb4ff; color: #0f1620; border-color: #4fb4ff; }
      `}</style>
    </div>
  );
}

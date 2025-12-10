import React, { useState } from 'react';

type Props = {
  onSearch?: (query: string, location: string, coords?: { latitude: number; longitude: number } | null) => void;
};

export default function SearchBar({ onSearch }: Props) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('San Francisco, CA');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [usingLocation, setUsingLocation] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query, location, coords);
  };

  return (
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
      <style jsx>{`
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
      `}</style>
    </form>
  );
}

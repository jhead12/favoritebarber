import React, { useState } from 'react';

export default function AdminReconciler() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runReconciler = async () => {
    setError(null);
    setResults(null);
    const stored = window.localStorage.getItem('adminApiKey');
    let key = stored || '';
    if (!key) {
      const entered = window.prompt('Enter admin API key to run reconciler (will be saved to localStorage):');
      if (!entered) return;
      key = entered.trim();
      try { window.localStorage.setItem('adminApiKey', key); } catch (e) { }
    }

    setLoading(true);
    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== '') ? process.env.NEXT_PUBLIC_API_URL : window.location.origin;
      const url = new URL('/api/admin/reconcile-socials', apiBase).toString();
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-api-key': key } });
      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        throw new Error(txt || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setResults(Array.isArray(data.results) ? data.results : [data]);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={runReconciler} style={{ padding: '8px 12px', borderRadius: 8, background: '#10282f', color: '#bfeafc', border: '1px solid #1f3b44', cursor: 'pointer' }}>
        {loading ? 'Running…' : 'Run Reconciler'}
      </button>
      {error && <div style={{ color: '#f87272', fontSize: 13 }}>Error: {error}</div>}
      {results && (
        <div style={{ background: '#071018', border: '1px solid rgba(255,255,255,0.02)', padding: 8, borderRadius: 8, maxWidth: 520 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>Results ({results.length}):</div>
          <div style={{ maxHeight: 220, overflow: 'auto', fontSize: 13 }}>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(results, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

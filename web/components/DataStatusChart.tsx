import React, { useEffect, useRef, useState } from 'react';

type Props = {
  endpoint?: string;
};

export default function DataStatusChart({ endpoint = '/api/admin/data-status' }: Props) {
  const [data, setData] = useState<any | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error('fetch failed');
        const j = await res.json();
        if (!mounted) return;
        setData(j);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { mounted = false; };
  }, [endpoint]);

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    // Lazy-load Chart.js to avoid forcing dependency for all dev setups
    let cancelled = false;
    (async () => {
      try {
        const Chart = (await import('chart.js/auto')).default;
        if (cancelled) return;
        const ctx = canvasRef.current!.getContext('2d')!;
        if (chartRef.current) chartRef.current.destroy();

        const labels = ['<20', '20-39', '40-59', '60-79', '80+'];
        const values = [
          Number(data?.distr?.lt20 || 0),
          Number(data?.distr?.bt20_40 || 0),
          Number(data?.distr?.bt40_60 || 0),
          Number(data?.distr?.bt60_80 || 0),
          Number(data?.distr?.gte80 || 0),
        ];

        chartRef.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{ label: 'Barber trust distribution', data: values, backgroundColor: ['#ef4444','#f59e0b','#facc15','#34d399','#60a5fa'] }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        });
      } catch (e) {
        console.error('Chart load failed', e);
      }
    })();
    return () => { cancelled = true; if (chartRef.current) chartRef.current.destroy(); };
  }, [data]);

  if (!data) return <div>Loading dashboard…</div>;

  const totalBarbers = Number(data?.counts?.barbers_count || 0);
  const values = [
    Number(data?.distr?.lt20 || 0),
    Number(data?.distr?.bt20_40 || 0),
    Number(data?.distr?.bt40_60 || 0),
    Number(data?.distr?.bt60_80 || 0),
    Number(data?.distr?.gte80 || 0),
  ];
  if (totalBarbers === 0 && values.reduce((s, v) => s + v, 0) === 0) {
    return <div style={{ padding: 20 }}>No data available yet — background workers will populate collections shortly.</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 6 }}>Data Collections</h2>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 14, color: '#374151' }}>
          <div><strong>Barbers</strong>: {data.counts.barbers_count}</div>
          <div><strong>Shops</strong>: {data.counts.shops_count}</div>
          <div><strong>Locations</strong>: {data.counts.locations_count}</div>
          <div><strong>Images</strong>: {data.counts.images_count}</div>
          <div><strong>Reviews</strong>: {data.counts.reviews_count}</div>
        </div>
        <div style={{ fontSize: 14, color: '#374151' }}>
          <div>Avg barber trust: <strong>{Number(data.aggs.avg_barber_trust || 0).toFixed(1)}</strong></div>
          <div>Avg shop trust: <strong>{Number(data.aggs.avg_shop_trust || 0).toFixed(1)}</strong></div>
          <div>Locations verified: <strong>{Number(data.verified.pct_locations_verified || 0).toFixed(1)}%</strong></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ width: '60%', height: 360, background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 6px 18px rgba(2,6,23,0.08)' }}>
          <canvas ref={canvasRef} />
        </div>
        <div style={{ width: '35%' }}>
          <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 6px 18px rgba(2,6,23,0.08)' }}>
            <h4 style={{ marginTop: 0 }}>Legend</h4>
            {['<20', '20-39', '40-59', '60-79', '80+'].map((lbl, i) => (
              <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 18, height: 12, background: ['#ef4444','#f59e0b','#facc15','#34d399','#60a5fa'][i], borderRadius: 3 }} />
                <div style={{ flex: 1 }}>{lbl}</div>
                <div style={{ fontWeight: 700 }}>{values[i]}{totalBarbers ? ` (${((values[i]/totalBarbers)*100).toFixed(1)}%)` : ''}</div>
              </div>
            ))}
            <hr />
            <small style={{ color: '#6b7280' }}>This chart shows the distribution of barber trust scores across the dataset. Higher trust indicates better reliability based on aggregated signals.</small>
          </div>
        </div>
      </div>
    </div>
  );
}

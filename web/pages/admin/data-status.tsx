import React from 'react';
import dynamic from 'next/dynamic';
const DataStatusChart = dynamic(() => import('../../components/DataStatusChart'), { ssr: false });

export default function DataStatusPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Data Status Dashboard</h1>
      <DataStatusChart />
    </main>
  );
}

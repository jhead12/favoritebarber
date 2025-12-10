import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLastVisitedBarber, LastVisitedBarber } from '../lib/lastVisited';

export default function LastVisitedBarber(): JSX.Element | null {
  const [last, setLast] = useState<LastVisitedBarber | null>(null);

  useEffect(() => {
    try {
      const v = getLastVisitedBarber();
      setLast(v);
    } catch (e) {
      setLast(null);
    }
  }, []);

  if (!last) return null;

  return (
    <div style={{ padding: '8px 12px', background: '#fafafa', borderBottom: '1px solid #eee' }}>
      <small>Last visited: </small>
      <Link href={`/barber/${last.id}`}>{last.name || `Barber ${last.id}`}</Link>
    </div>
  );
}

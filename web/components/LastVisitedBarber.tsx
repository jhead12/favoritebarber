import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLastVisitedBarber } from '../lib/lastVisited';
import type { LastVisitedBarber as LastVisitedBarberType } from '../lib/lastVisited';

export default function LastVisitedBarber(): React.ReactElement | null {
  const [last, setLast] = useState<LastVisitedBarberType | null>(null);

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
      <Link href={`/barbers/${last.id}`}>{last.name || `Barber ${last.id}`}</Link>
    </div>
  );
}

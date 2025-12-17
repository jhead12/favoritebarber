import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LastVisitedBarber from './LastVisitedBarber';

export default function Header(): React.ReactElement {
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #e6eef9', background: 'linear-gradient(90deg,#fff,#f8fafc)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#0f172a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', display: 'inline-block' }}>
              <Image src="/logo.png" alt="Favorite Barber Logo" width={36} height={36} style={{ objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Favorite Barber</div>
              <div style={{ fontSize: 12, color: '#475569' }}>Find trusted barbers nearby</div>
            </div>
          </div>
        </Link>
        <nav style={{ display: 'flex', gap: 10 }}>
          <Link href="/admin/data-status" style={{ color: '#0f172a', textDecoration: 'none', fontSize: 14 }}>Dashboard</Link>
          <Link href="/shop/1" style={{ color: '#0f172a', textDecoration: 'none', fontSize: 14 }}>Shops</Link>
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 13, color: '#475569' }}>Welcome</div>
        <div style={{ minWidth: 220 }}>
          <LastVisitedBarber />
        </div>
      </div>
    </header>
  );
}

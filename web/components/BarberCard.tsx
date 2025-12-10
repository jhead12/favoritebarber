import React from 'react';

export default function BarberCard({ name, trust }: { name:string, trust:number }) {
  return (
    <div>
      <h3>{name}</h3>
      <p>Trust score: {trust}</p>
    </div>
  );
}

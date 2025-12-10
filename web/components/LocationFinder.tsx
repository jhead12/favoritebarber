import React from 'react';

export default function LocationFinder({ onLocate }: { onLocate?: (lat:number,lng:number)=>void }) {
  return (
    <div>
      <input placeholder="Enter address or use my location" />
      <button onClick={()=>onLocate && onLocate(0,0)}>Use My Location</button>
    </div>
  );
}

import React from 'react';

export default function Map({ markers }: { markers?: Array<{lat:number,lng:number}> }) {
  return (
    <div>
      <p>Map placeholder — markers: {markers ? markers.length : 0}</p>
    </div>
  );
}

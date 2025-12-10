// web/lib/adapters.ts
// Central adapters to convert API shapes to UI shapes

export type UiBarber = {
  id: string | number;
  name: string;
  shop: string;
  distance: string;
  trust: number;
  specialties: any[];
  price: string;
  thumb: string;
};

export function mapApiBarberToUi(b: any): UiBarber {
  // DB-backed barber
  if (b && (b.trust_score || b.thumbnail_url || b.distance_m !== undefined)) {
    const trustVal = b.trust_score ? (typeof b.trust_score.value === 'number' ? b.trust_score.value : Number(b.trust_score.value)) : 0;
    // Normalize shop field: it may be an object (shop row) or a string
    let shopStr = '';
    if (b.primary_location && b.primary_location.formatted_address) shopStr = b.primary_location.formatted_address;
    else if (b.shop) {
      if (typeof b.shop === 'string') shopStr = b.shop;
      else if (typeof b.shop === 'object') shopStr = b.shop.name || b.shop.formatted_address || JSON.stringify({ id: b.shop.id }).replace(/[{}\"]+/g, '') || '';
    }

    return {
      id: b.id,
      name: b.name || '',
      shop: shopStr,
      distance: b.distance_m ? `${(b.distance_m/1609).toFixed(1)} mi` : (b.distance || ''),
      trust: Number.isFinite(trustVal) ? trustVal : 0,
      specialties: b.top_tags || b.specialties || [],
      price: b.price || '$$?',
      thumb: b.thumbnail_url || b.image_url || b.thumb || '',
    };
  }

  // Yelp-like result
  return {
    id: b.id,
    name: b.name || '',
    shop: b.address || '',
    distance: b.distance_m ? `${(b.distance_m/1609).toFixed(1)} mi` : (b.distance || ''),
    trust: Math.min(100, Math.round((b.rating || 0) / 5 * 100)),
    specialties: b.categories || [],
    price: b.price || '$$?',
    thumb: b.image_url || '',
  };
}

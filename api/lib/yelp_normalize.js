/**
 * Normalize Yelp REST and GraphQL responses into a canonical business shape
 * used by the frontend and internal services.
 */

function buildAddressFromGraphql(loc) {
  if (!loc) return '';
  const parts = [loc.address1, loc.address2, loc.address3, loc.city, loc.state, loc.postal_code || loc.postalCode || loc.zip_code].filter(Boolean);
  return parts.join(', ');
}

function buildAddressFromRest(loc) {
  if (!loc) return '';
  if (Array.isArray(loc.display_address)) return loc.display_address.join(', ');
  // fallback to normalized pieces if provided
  return [loc.address1, loc.address2, loc.address3, loc.city, loc.state, loc.postal_code].filter(Boolean).join(', ');
}

function mapRestBusiness(b) {
  if (!b) return null;
  return {
    id: b.id,
    name: b.name,
    yelp_url: b.url || b.yelp_url || null,
    phone: b.display_phone || b.phone || null,
    rating: b.rating || null,
    review_count: b.review_count || null,
    address: buildAddressFromRest(b.location),
    coordinates: b.coordinates || {},
    images: (b.photos || (b.photos === undefined && b.photos) || b.photos) ? (b.photos || []) : (b.photos || []),
    image_url: b.image_url || null,
    categories: (b.categories || []).map(c => c.title || c),
    raw: b
  };
}

function mapGraphqlBusiness(b) {
  if (!b) return null;
  const images = [];
  if (Array.isArray(b.photos)) {
    b.photos.forEach(p => { if (!p) return; if (typeof p === 'string') images.push({ url: p }); else if (p.url) images.push({ url: p.url }); });
  }
  return {
    id: b.id,
    name: b.name,
    yelp_url: b.url || null,
    rating: b.rating || null,
    review_count: b.review_count || null,
    address: buildAddressFromGraphql(b.location),
    images,
    categories: (b.categories || []).map(c => c.title || c),
    hours: b.hours || null,
    raw: b
  };
}

module.exports = { mapRestBusiness, mapGraphqlBusiness };

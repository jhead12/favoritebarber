const express = require('express');
const router = express.Router();
const geocodeCache = require('../lib/geocodeCache');
const redisClient = require('../lib/redisClient');

// Server-side geocode endpoint. Uses server-side GOOGLE_MAPS_API_KEY when available.
// GET /api/geocode?lat=..&lon=..
router.get('/', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'missing_coords' });

    // Check Redis cache first (if available), then fallback to in-memory cache
    try {
      const rkey = `geocode:${Number(lat).toFixed(6)},${Number(lon).toFixed(6)}`;
      const redisVal = await redisClient.get(rkey).catch(() => null);
      if (redisVal) {
        return res.json({ address: redisVal.address, provider: redisVal.provider, cached: true, store: 'redis' });
      }
    } catch (e) {
      console.warn('redis cache read error', e);
    }
    try {
      const cached = geocodeCache.get(lat, lon);
      if (cached) {
        return res.json({ address: cached.address, provider: cached.provider, cached: true, store: 'memory' });
      }
    } catch (e) {
      console.warn('geocode cache error', e);
    }

    const gKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (gKey) {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.set('latlng', `${lat},${lon}`);
      url.searchParams.set('key', String(gKey));
      const r = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
      if (!r.ok) return res.status(502).json({ error: 'geocode_failed' });
      const j = await r.json();
      const formatted = (j && Array.isArray(j.results) && j.results[0] && j.results[0].formatted_address) ? j.results[0].formatted_address : null;
      const out = { address: formatted, provider: 'google' };
      try { geocodeCache.set(lat, lon, out); } catch (e) {}
      try { await redisClient.set(`geocode:${Number(lat).toFixed(6)},${Number(lon).toFixed(6)}`, out, 24*60*60*1000); } catch (e) {}
      return res.json(out);
    }

    // Fallback to Nominatim
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lon));
    const r2 = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!r2.ok) return res.status(502).json({ error: 'geocode_failed' });
    const j2 = await r2.json();
    const formatted2 = j2 && j2.display_name ? j2.display_name : null;
    const out2 = { address: formatted2, provider: 'nominatim' };
    try { geocodeCache.set(lat, lon, out2); } catch (e) {}
    try { await redisClient.set(`geocode:${Number(lat).toFixed(6)},${Number(lon).toFixed(6)}`, out2, 24*60*60*1000); } catch (e) {}
    return res.json(out2);
  } catch (e) {
    console.error('geocode error', e);
    return res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;

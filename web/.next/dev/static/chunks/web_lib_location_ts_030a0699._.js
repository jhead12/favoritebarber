(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/web/lib/location.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cacheLocation",
    ()=>cacheLocation,
    "getCachedLocation",
    ()=>getCachedLocation,
    "requestLocation",
    ()=>requestLocation,
    "reverseGeocode",
    ()=>reverseGeocode
]);
const KEY = 'ryb:lastLocation';
function cacheLocation(c) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        localStorage.setItem(KEY, JSON.stringify(c));
    } catch (e) {}
}
function getCachedLocation() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        const v = localStorage.getItem(KEY);
        return v ? JSON.parse(v) : null;
    } catch (e) {
        return null;
    }
}
function requestLocation(timeout = 10000) {
    return new Promise((resolve, reject)=>{
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            return reject(new Error('Geolocation not available'));
        }
        const onSuccess = (pos)=>{
            const coords = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
            };
            try {
                cacheLocation(coords);
            } catch (e) {}
            resolve(coords);
        };
        const onError = (err)=>reject(err);
        const id = navigator.geolocation.getCurrentPosition(onSuccess, onError, {
            maximumAge: 60_000,
            timeout
        });
    // no cleanup required here; caller may ignore
    });
}
async function reverseGeocode(lat, lon) {
    // Prefer server-side geocoding via `/api/geocode` so the Google API key can remain secret.
    try {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const base = '';
        const url = new URL(`/api/geocode?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`, window.location.origin || base || window.location.href);
        const res = await fetch(url.toString(), {
            headers: {
                Accept: 'application/json'
            }
        });
        if (!res.ok) return null;
        const j = await res.json();
        return j && j.address ? j.address : null;
    } catch (e) {
        return null;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=web_lib_location_ts_030a0699._.js.map
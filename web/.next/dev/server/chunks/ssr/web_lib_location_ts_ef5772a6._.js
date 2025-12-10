module.exports = [
"[project]/web/lib/location.ts [ssr] (ecmascript)", ((__turbopack_context__) => {
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
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
}
function getCachedLocation() {
    if ("TURBOPACK compile-time truthy", 1) return null;
    //TURBOPACK unreachable
    ;
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
        if ("TURBOPACK compile-time truthy", 1) {
            return null;
        }
        //TURBOPACK unreachable
        ;
        const base = undefined;
        const url = undefined;
        const res = undefined;
        const j = undefined;
    } catch (e) {
        return null;
    }
}
}),
];

//# sourceMappingURL=web_lib_location_ts_ef5772a6._.js.map
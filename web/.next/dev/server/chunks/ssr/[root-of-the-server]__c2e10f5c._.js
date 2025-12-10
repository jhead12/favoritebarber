module.exports = [
"[externals]/styled-jsx/style.js [external] (styled-jsx/style.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("styled-jsx/style.js", () => require("styled-jsx/style.js"));

module.exports = mod;
}),
"[project]/web/components/SearchBar.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SearchBar
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/styled-jsx/style.js [external] (styled-jsx/style.js, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
;
;
;
function SearchBar({ onSearch }) {
    const [query, setQuery] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [location, setLocation] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('San Francisco, CA');
    const [coords, setCoords] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [usingLocation, setUsingLocation] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        // Prefill from cached location if available
        let mounted = true;
        (async ()=>{
            try {
                const { getCachedLocation, reverseGeocode } = await __turbopack_context__.A("[project]/web/lib/location.ts [ssr] (ecmascript, async loader)");
                const cached = getCachedLocation();
                if (cached && mounted) {
                    setCoords(cached);
                    // Try to reverse-geocode to friendly label
                    try {
                        const label = await reverseGeocode(cached.latitude, cached.longitude);
                        if (label) setLocation(label);
                        else setLocation(`${cached.latitude.toFixed(5)},${cached.longitude.toFixed(5)}`);
                    } catch (e) {
                        setLocation(`${cached.latitude.toFixed(5)},${cached.longitude.toFixed(5)}`);
                    }
                }
            } catch (e) {
            // ignore
            }
        })();
        return ()=>{
            mounted = false;
        };
    }, []);
    const handleSubmit = (e)=>{
        e.preventDefault();
        onSearch?.(query, location, coords);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("form", {
        onSubmit: handleSubmit,
        className: "jsx-cd98c2986fa48398" + " " + "search-shell",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "jsx-cd98c2986fa48398" + " " + "inputs",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "jsx-cd98c2986fa48398" + " " + "field",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                className: "jsx-cd98c2986fa48398",
                                children: "Find"
                            }, void 0, false, {
                                fileName: "[project]/web/components/SearchBar.tsx",
                                lineNumber: 47,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                value: query,
                                onChange: (e)=>setQuery(e.target.value),
                                placeholder: "Fade, beard trim, or barber name",
                                className: "jsx-cd98c2986fa48398"
                            }, void 0, false, {
                                fileName: "[project]/web/components/SearchBar.tsx",
                                lineNumber: 48,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/components/SearchBar.tsx",
                        lineNumber: 46,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "jsx-cd98c2986fa48398" + " " + "field",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                className: "jsx-cd98c2986fa48398",
                                children: "Near"
                            }, void 0, false, {
                                fileName: "[project]/web/components/SearchBar.tsx",
                                lineNumber: 55,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                value: location,
                                onChange: (e)=>setLocation(e.target.value),
                                placeholder: "City or ZIP",
                                className: "jsx-cd98c2986fa48398"
                            }, void 0, false, {
                                fileName: "[project]/web/components/SearchBar.tsx",
                                lineNumber: 56,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    marginTop: 6
                                },
                                className: "jsx-cd98c2986fa48398",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: async ()=>{
                                        setUsingLocation(true);
                                        try {
                                            const { requestLocation } = await __turbopack_context__.A("[project]/web/lib/location.ts [ssr] (ecmascript, async loader)");
                                            const c = await requestLocation();
                                            setCoords(c);
                                            setLocation(`${c.latitude.toFixed(5)},${c.longitude.toFixed(5)}`);
                                        } catch (e) {
                                            // ignore, could show message later
                                            console.error('geo error', e);
                                        } finally{
                                            setUsingLocation(false);
                                        }
                                    },
                                    style: {
                                        padding: '6px 8px',
                                        marginTop: 6
                                    },
                                    className: "jsx-cd98c2986fa48398",
                                    children: usingLocation ? 'Locating…' : 'Use my location'
                                }, void 0, false, {
                                    fileName: "[project]/web/components/SearchBar.tsx",
                                    lineNumber: 62,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/web/components/SearchBar.tsx",
                                lineNumber: 61,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/components/SearchBar.tsx",
                        lineNumber: 54,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/web/components/SearchBar.tsx",
                lineNumber: 45,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                type: "submit",
                className: "jsx-cd98c2986fa48398",
                children: "Search"
            }, void 0, false, {
                fileName: "[project]/web/components/SearchBar.tsx",
                lineNumber: 81,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"], {
                id: "cd98c2986fa48398",
                children: ".search-shell.jsx-cd98c2986fa48398{background:#0c1116;border:1px solid #1f2b36;border-radius:12px;align-items:flex-end;gap:12px;padding:16px;display:flex;box-shadow:0 10px 40px #00000059}.inputs.jsx-cd98c2986fa48398{flex:1;grid-template-columns:1fr 1fr;gap:12px;display:grid}.field.jsx-cd98c2986fa48398{flex-direction:column;gap:6px;display:flex}label.jsx-cd98c2986fa48398{letter-spacing:.5px;text-transform:uppercase;color:#8fa3b5;font-size:12px}input.jsx-cd98c2986fa48398{color:#e7eef7;background:#0f1620;border:1px solid #1f2b36;border-radius:10px;outline:none;padding:12px 14px;transition:border-color .15s,box-shadow .15s}input.jsx-cd98c2986fa48398:focus{border-color:#4fb4ff;box-shadow:0 0 0 3px #4fb4ff33}button.jsx-cd98c2986fa48398{color:#041019;cursor:pointer;background:linear-gradient(135deg,#4fb4ff,#6dd5fa);border:none;border-radius:10px;padding:12px 18px;font-weight:700;transition:transform .1s,box-shadow .15s}button.jsx-cd98c2986fa48398:hover{transform:translateY(-1px);box-shadow:0 10px 25px #4fb4ff4d}@media (width<=720px){.inputs.jsx-cd98c2986fa48398{grid-template-columns:1fr}.search-shell.jsx-cd98c2986fa48398{flex-direction:column;align-items:stretch}button.jsx-cd98c2986fa48398{width:100%}}"
            }, void 0, false, void 0, this)
        ]
    }, void 0, true, {
        fileName: "[project]/web/components/SearchBar.tsx",
        lineNumber: 44,
        columnNumber: 5
    }, this);
}
}),
"[project]/web/components/TrustScoreBadge.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TrustScoreBadge
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/styled-jsx/style.js [external] (styled-jsx/style.js, cjs)");
;
;
function TrustScoreBadge({ score }) {
    const tone = score >= 85 ? '#38d996' : score >= 70 ? '#ffb74d' : '#f87272';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
        className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
            [
                "105b11cffaaec3b5",
                [
                    tone,
                    tone
                ]
            ]
        ]) + " " + "trust",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                    [
                        "105b11cffaaec3b5",
                        [
                            tone,
                            tone
                        ]
                    ]
                ]) + " " + "dot"
            }, void 0, false, {
                fileName: "[project]/web/components/TrustScoreBadge.tsx",
                lineNumber: 9,
                columnNumber: 7
            }, this),
            "Trust ",
            score,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"], {
                id: "105b11cffaaec3b5",
                dynamic: [
                    tone,
                    tone
                ],
                children: `.trust.__jsx-style-dynamic-selector{color:#e7eef7;background:#ffffff0d;border:1px solid #ffffff14;border-radius:999px;align-items:center;gap:6px;padding:6px 10px;font-size:13px;font-weight:700;display:inline-flex}.dot.__jsx-style-dynamic-selector{background:${tone};width:10px;height:10px;box-shadow:0 0 12px ${tone};border-radius:999px}`
            }, void 0, false, void 0, this)
        ]
    }, void 0, true, {
        fileName: "[project]/web/components/TrustScoreBadge.tsx",
        lineNumber: 8,
        columnNumber: 5
    }, this);
}
}),
"[project]/web/lib/adapters.ts [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// web/lib/adapters.ts
// Central adapters to convert API shapes to UI shapes
__turbopack_context__.s([
    "mapApiBarberToUi",
    ()=>mapApiBarberToUi
]);
function mapApiBarberToUi(b) {
    // DB-backed barber
    if (b && (b.trust_score || b.thumbnail_url || b.distance_m !== undefined)) {
        const trustVal = b.trust_score ? typeof b.trust_score.value === 'number' ? b.trust_score.value : Number(b.trust_score.value) : 0;
        // Normalize shop field: it may be an object (shop row) or a string
        let shopStr = '';
        if (b.primary_location && b.primary_location.formatted_address) shopStr = b.primary_location.formatted_address;
        else if (b.shop) {
            if (typeof b.shop === 'string') shopStr = b.shop;
            else if (typeof b.shop === 'object') shopStr = b.shop.name || b.shop.formatted_address || JSON.stringify({
                id: b.shop.id
            }).replace(/[{}\"]+/g, '') || '';
        }
        return {
            id: b.id,
            name: b.name || '',
            shop: shopStr,
            distance: b.distance_m ? `${(b.distance_m / 1609).toFixed(1)} mi` : b.distance || '',
            trust: Number.isFinite(trustVal) ? trustVal : 0,
            specialties: b.top_tags || b.specialties || [],
            price: b.price || '$$?',
            thumb: b.thumbnail_url || b.image_url || b.thumb || ''
        };
    }
    // Yelp-like result
    return {
        id: b.id,
        name: b.name || '',
        shop: b.address || '',
        distance: b.distance_m ? `${(b.distance_m / 1609).toFixed(1)} mi` : b.distance || '',
        trust: Math.min(100, Math.round((b.rating || 0) / 5 * 100)),
        specialties: b.categories || [],
        price: b.price || '$$?',
        thumb: b.image_url || ''
    };
}
}),
"[project]/web/pages/index.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/styled-jsx/style.js [external] (styled-jsx/style.js, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$SearchBar$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/components/SearchBar.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$TrustScoreBadge$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/components/TrustScoreBadge.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$adapters$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/adapters.ts [ssr] (ecmascript)");
;
;
;
;
;
;
const MOCK_BARBERS = [
    {
        id: 'b1',
        name: 'Tony “Fade Lab” Rivera',
        shop: 'Mission Cuts',
        distance: '0.4 mi',
        trust: 92,
        specialties: [
            'Low fade',
            'Skin fade',
            'Beard trim'
        ],
        price: '$45+',
        thumb: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=60'
    },
    {
        id: 'b2',
        name: 'Samir K.',
        shop: 'SoMa Barber Co.',
        distance: '1.1 mi',
        trust: 85,
        specialties: [
            'Taper',
            'Textured crop',
            'Pompadour'
        ],
        price: '$50+',
        thumb: 'https://images.unsplash.com/photo-1503951914909-04e7d77c5cde?auto=format&fit=crop&w=400&q=60'
    },
    {
        id: 'b3',
        name: 'Alex “Clipper” Chen',
        shop: 'Independent • Mobile',
        distance: '2.3 mi',
        trust: 77,
        specialties: [
            'Buzz',
            'Crew',
            'Line-up'
        ],
        price: '$40+',
        thumb: 'https://images.unsplash.com/photo-1503951914646-5700dea92f62?auto=format&fit=crop&w=400&q=60'
    }
];
function Home() {
    const [results, setResults] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(MOCK_BARBERS);
    const [latestPositive, setLatestPositive] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        let cancelled = false;
        const apiBase = ("TURBOPACK compile-time value", "http://localhost:3000") || 'http://localhost:3000';
        const fetchLatest = async (lat, lon)=>{
            try {
                const url = new URL('/api/reviews/most-recent-positive', apiBase);
                url.searchParams.set('latitude', String(lat));
                url.searchParams.set('longitude', String(lon));
                url.searchParams.set('radius_miles', '20');
                const res = await fetch(url.toString());
                if (!res.ok) return;
                const data = await res.json();
                if (cancelled) return;
                if (data && data.found) setLatestPositive(data);
            } catch (e) {
            // ignore
            }
        };
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos)=>fetchLatest(pos.coords.latitude, pos.coords.longitude), ()=>{
                // fallback center (San Francisco)
                fetchLatest(37.7749, -122.4194);
            }, {
                timeout: 5000
            });
        } else {
            fetchLatest(37.7749, -122.4194);
        }
        return ()=>{
            cancelled = true;
        };
    }, []);
    const handleSearch = async (term, location)=>{
        // (old signature supported only term+location). If caller supplies coords, they will be appended.
        setLoading(true);
        setError(null);
        try {
            // Prefer explicit API URL via `NEXT_PUBLIC_API_URL` (set to e.g. http://localhost:3000 or http://api:3000 in compose).
            const apiBase = ("TURBOPACK compile-time value", "http://localhost:3000") || 'http://localhost:3000';
            // Prefer the API search endpoint which returns normalized DB-backed results.
            // The SearchBar may pass coordinates in the location string as `lat,lon`. Detect that.
            const url = new URL('/api/yelp-search', apiBase);
            url.searchParams.set('term', term || 'barber');
            // If the location looks like `lat,lon` use latitude & longitude parameters, else use location text
            const maybeCoords = (location || '').split(',');
            if (maybeCoords.length === 2 && !isNaN(Number(maybeCoords[0])) && !isNaN(Number(maybeCoords[1]))) {
                url.searchParams.set('latitude', String(Number(maybeCoords[0])));
                url.searchParams.set('longitude', String(Number(maybeCoords[1])));
            } else {
                url.searchParams.set('location', location || 'San Francisco, CA');
            }
            const res = await fetch(url.toString());
            if (!res.ok) throw new Error(`Search failed (${res.status})`);
            const data = await res.json();
            const items = data.results || data || [];
            const mapped = items.map((b)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$adapters$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["mapApiBarberToUi"])(b));
            setResults(mapped);
        } catch (err) {
            setError(err.message || 'Search failed');
        } finally{
            setLoading(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("main", {
        className: "jsx-e088e8d6ccfada59" + " " + "page",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("section", {
                className: "jsx-e088e8d6ccfada59" + " " + "hero",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "jsx-e088e8d6ccfada59",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                className: "jsx-e088e8d6ccfada59" + " " + "eyebrow",
                                children: "Find your next barber"
                            }, void 0, false, {
                                fileName: "[project]/web/pages/index.tsx",
                                lineNumber: 118,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                                className: "jsx-e088e8d6ccfada59",
                                children: "Search barbers by style, trust, and distance"
                            }, void 0, false, {
                                fileName: "[project]/web/pages/index.tsx",
                                lineNumber: 119,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                className: "jsx-e088e8d6ccfada59" + " " + "lede",
                                children: "See real trust scores, recent cuts, and specialties before you book."
                            }, void 0, false, {
                                fileName: "[project]/web/pages/index.tsx",
                                lineNumber: 120,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "jsx-e088e8d6ccfada59" + " " + "hero-card",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$SearchBar$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        onSearch: handleSearch
                                    }, void 0, false, {
                                        fileName: "[project]/web/pages/index.tsx",
                                        lineNumber: 122,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "jsx-e088e8d6ccfada59" + " " + "filters",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                className: "jsx-e088e8d6ccfada59",
                                                children: "Fade"
                                            }, void 0, false, {
                                                fileName: "[project]/web/pages/index.tsx",
                                                lineNumber: 124,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                className: "jsx-e088e8d6ccfada59",
                                                children: "Beard trim"
                                            }, void 0, false, {
                                                fileName: "[project]/web/pages/index.tsx",
                                                lineNumber: 125,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                className: "jsx-e088e8d6ccfada59",
                                                children: "Mobile"
                                            }, void 0, false, {
                                                fileName: "[project]/web/pages/index.tsx",
                                                lineNumber: 126,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                className: "jsx-e088e8d6ccfada59",
                                                children: "Open now"
                                            }, void 0, false, {
                                                fileName: "[project]/web/pages/index.tsx",
                                                lineNumber: 127,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/web/pages/index.tsx",
                                        lineNumber: 123,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/web/pages/index.tsx",
                                lineNumber: 121,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/pages/index.tsx",
                        lineNumber: 117,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "jsx-e088e8d6ccfada59" + " " + "map-shell",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "jsx-e088e8d6ccfada59" + " " + "map-placeholder",
                                children: "Map preview"
                            }, void 0, false, {
                                fileName: "[project]/web/pages/index.tsx",
                                lineNumber: 132,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                className: "jsx-e088e8d6ccfada59" + " " + "map-note",
                                children: "Map wiring TBD — will show clusters and pin cards."
                            }, void 0, false, {
                                fileName: "[project]/web/pages/index.tsx",
                                lineNumber: 133,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/pages/index.tsx",
                        lineNumber: 131,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/web/pages/index.tsx",
                lineNumber: 116,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("section", {
                className: "jsx-e088e8d6ccfada59" + " " + "results",
                children: [
                    latestPositive && latestPositive.barber && latestPositive.review && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            marginBottom: 18,
                            padding: 14,
                            border: '1px solid rgba(255,255,255,0.04)',
                            borderRadius: 10,
                            background: '#071018'
                        },
                        className: "jsx-e088e8d6ccfada59",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                style: {
                                    margin: '0 0 6px'
                                },
                                className: "jsx-e088e8d6ccfada59",
                                children: "Latest positive comment nearby"
                            }, void 0, false, {
                                fileName: "[project]/web/pages/index.tsx",
                                lineNumber: 140,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                style: {
                                    margin: 0
                                },
                                className: "jsx-e088e8d6ccfada59",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                                        className: "jsx-e088e8d6ccfada59",
                                        children: latestPositive.barber.name
                                    }, void 0, false, {
                                        fileName: "[project]/web/pages/index.tsx",
                                        lineNumber: 142,
                                        columnNumber: 15
                                    }, this),
                                    latestPositive.barber.distance_m ? ` — ${(latestPositive.barber.distance_m / 1609.34).toFixed(1)} mi` : ''
                                ]
                            }, void 0, true, {
                                fileName: "[project]/web/pages/index.tsx",
                                lineNumber: 141,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                style: {
                                    margin: '6px 0 8px'
                                },
                                className: "jsx-e088e8d6ccfada59",
                                children: latestPositive.review.summary
                            }, void 0, false, {
                                fileName: "[project]/web/pages/index.tsx",
                                lineNumber: 145,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                href: `/barber/${latestPositive.barber.id}`,
                                className: "jsx-e088e8d6ccfada59" + " " + "link",
                                children: "Open profile →"
                            }, void 0, false, {
                                fileName: "[project]/web/pages/index.tsx",
                                lineNumber: 146,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/pages/index.tsx",
                        lineNumber: 139,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "jsx-e088e8d6ccfada59" + " " + "results-head",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                                className: "jsx-e088e8d6ccfada59",
                                children: "Top nearby barbers"
                            }, void 0, false, {
                                fileName: "[project]/web/pages/index.tsx",
                                lineNumber: 150,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                className: "jsx-e088e8d6ccfada59",
                                children: loading ? 'Searching Yelp…' : 'Powered by Yelp proxy'
                            }, void 0, false, {
                                fileName: "[project]/web/pages/index.tsx",
                                lineNumber: 151,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/pages/index.tsx",
                        lineNumber: 149,
                        columnNumber: 9
                    }, this),
                    error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                        style: {
                            color: '#f87272'
                        },
                        className: "jsx-e088e8d6ccfada59",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/web/pages/index.tsx",
                        lineNumber: 153,
                        columnNumber: 19
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "jsx-e088e8d6ccfada59" + " " + "grid",
                        children: results.map((b)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("article", {
                                className: "jsx-e088e8d6ccfada59" + " " + "card",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        style: {
                                            backgroundImage: `url(${b.thumb})`
                                        },
                                        className: "jsx-e088e8d6ccfada59" + " " + "thumb"
                                    }, void 0, false, {
                                        fileName: "[project]/web/pages/index.tsx",
                                        lineNumber: 157,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "jsx-e088e8d6ccfada59" + " " + "card-body",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "jsx-e088e8d6ccfada59" + " " + "row",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                        className: "jsx-e088e8d6ccfada59",
                                                        children: b.name
                                                    }, void 0, false, {
                                                        fileName: "[project]/web/pages/index.tsx",
                                                        lineNumber: 160,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$TrustScoreBadge$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                        score: b.trust
                                                    }, void 0, false, {
                                                        fileName: "[project]/web/pages/index.tsx",
                                                        lineNumber: 161,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/web/pages/index.tsx",
                                                lineNumber: 159,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                className: "jsx-e088e8d6ccfada59" + " " + "muted",
                                                children: [
                                                    b.shop,
                                                    " · ",
                                                    b.distance
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/web/pages/index.tsx",
                                                lineNumber: 163,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                className: "jsx-e088e8d6ccfada59" + " " + "chips",
                                                children: b.specialties.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                        className: "jsx-e088e8d6ccfada59",
                                                        children: s
                                                    }, s, false, {
                                                        fileName: "[project]/web/pages/index.tsx",
                                                        lineNumber: 166,
                                                        columnNumber: 21
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/web/pages/index.tsx",
                                                lineNumber: 164,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "jsx-e088e8d6ccfada59" + " " + "row bottom",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                        className: "jsx-e088e8d6ccfada59" + " " + "price",
                                                        children: b.price
                                                    }, void 0, false, {
                                                        fileName: "[project]/web/pages/index.tsx",
                                                        lineNumber: 170,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                        href: `/barber/${b.id}`,
                                                        className: "jsx-e088e8d6ccfada59" + " " + "link",
                                                        children: "View profile →"
                                                    }, void 0, false, {
                                                        fileName: "[project]/web/pages/index.tsx",
                                                        lineNumber: 171,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/web/pages/index.tsx",
                                                lineNumber: 169,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/web/pages/index.tsx",
                                        lineNumber: 158,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, b.id, true, {
                                fileName: "[project]/web/pages/index.tsx",
                                lineNumber: 156,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/web/pages/index.tsx",
                        lineNumber: 154,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/web/pages/index.tsx",
                lineNumber: 137,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"], {
                id: "e088e8d6ccfada59",
                children: ".page.jsx-e088e8d6ccfada59{color:#e7eef7;background:radial-gradient(circle at 10% 20%,#4fb4ff14,#0000 35%),#05090f;min-height:100vh;padding:32px 24px 48px}.hero.jsx-e088e8d6ccfada59{grid-template-columns:1.2fr 1fr;align-items:center;gap:32px;display:grid}h1.jsx-e088e8d6ccfada59{margin:6px 0 12px;font-size:38px}.eyebrow.jsx-e088e8d6ccfada59{letter-spacing:1px;text-transform:uppercase;color:#8fa3b5;font-size:12px}.lede.jsx-e088e8d6ccfada59{color:#b9c7d6;max-width:560px}.hero-card.jsx-e088e8d6ccfada59{flex-direction:column;gap:12px;margin-top:18px;display:flex}.filters.jsx-e088e8d6ccfada59{flex-wrap:wrap;gap:8px;display:flex}.filters.jsx-e088e8d6ccfada59 button.jsx-e088e8d6ccfada59{color:#d9e3ee;cursor:pointer;background:#0f1620;border:1px solid #1f2b36;border-radius:10px;padding:8px 12px}.filters.jsx-e088e8d6ccfada59 button.jsx-e088e8d6ccfada59:hover{border-color:#4fb4ff}.map-shell.jsx-e088e8d6ccfada59{align-self:stretch}.map-placeholder.jsx-e088e8d6ccfada59{color:#7da4c0;background:#0b111a;border:1px dashed #294055;border-radius:14px;place-items:center;height:260px;display:grid}.map-note.jsx-e088e8d6ccfada59{color:#8fa3b5;margin-top:8px;font-size:13px}.results.jsx-e088e8d6ccfada59{margin-top:48px}.results-head.jsx-e088e8d6ccfada59{flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:12px;display:flex}.grid.jsx-e088e8d6ccfada59{grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;margin-top:16px;display:grid}.card.jsx-e088e8d6ccfada59{background:#0b111a;border:1px solid #1f2b36;border-radius:14px;grid-template-rows:180px 1fr;display:grid;overflow:hidden;box-shadow:0 10px 40px #00000059}.thumb.jsx-e088e8d6ccfada59{background-position:50%;background-size:cover}.card-body.jsx-e088e8d6ccfada59{flex-direction:column;gap:6px;padding:14px;display:flex}.row.jsx-e088e8d6ccfada59{justify-content:space-between;align-items:center;gap:10px;display:flex}h3.jsx-e088e8d6ccfada59{margin:0;font-size:18px}.muted.jsx-e088e8d6ccfada59{color:#8fa3b5;margin:0;font-size:14px}.chips.jsx-e088e8d6ccfada59{flex-wrap:wrap;gap:6px;margin:0;display:flex}.chips.jsx-e088e8d6ccfada59 span.jsx-e088e8d6ccfada59{background:#ffffff0d;border:1px solid #ffffff0f;border-radius:999px;padding:6px 10px;font-size:13px}.bottom.jsx-e088e8d6ccfada59{margin-top:6px}.price.jsx-e088e8d6ccfada59{color:#d1e2f4;font-weight:700}.link.jsx-e088e8d6ccfada59{color:#4fb4ff;font-weight:600;text-decoration:none}.link.jsx-e088e8d6ccfada59:hover{text-decoration:underline}@media (width<=960px){.hero.jsx-e088e8d6ccfada59{grid-template-columns:1fr}}"
            }, void 0, false, void 0, this)
        ]
    }, void 0, true, {
        fileName: "[project]/web/pages/index.tsx",
        lineNumber: 115,
        columnNumber: 5
    }, this);
}
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__c2e10f5c._.js.map
module.exports = [
"[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("react/jsx-dev-runtime", () => require("react/jsx-dev-runtime"));

module.exports = mod;
}),
"[externals]/styled-jsx/style.js [external] (styled-jsx/style.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("styled-jsx/style.js", () => require("styled-jsx/style.js"));

module.exports = mod;
}),
"[project]/components/SearchBar.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
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
    const handleSubmit = (e)=>{
        e.preventDefault();
        onSearch?.(query, location);
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
                                fileName: "[project]/components/SearchBar.tsx",
                                lineNumber: 20,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                value: query,
                                onChange: (e)=>setQuery(e.target.value),
                                placeholder: "Fade, beard trim, or barber name",
                                className: "jsx-cd98c2986fa48398"
                            }, void 0, false, {
                                fileName: "[project]/components/SearchBar.tsx",
                                lineNumber: 21,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/SearchBar.tsx",
                        lineNumber: 19,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "jsx-cd98c2986fa48398" + " " + "field",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                className: "jsx-cd98c2986fa48398",
                                children: "Near"
                            }, void 0, false, {
                                fileName: "[project]/components/SearchBar.tsx",
                                lineNumber: 28,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                value: location,
                                onChange: (e)=>setLocation(e.target.value),
                                placeholder: "City or ZIP",
                                className: "jsx-cd98c2986fa48398"
                            }, void 0, false, {
                                fileName: "[project]/components/SearchBar.tsx",
                                lineNumber: 29,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/SearchBar.tsx",
                        lineNumber: 27,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/SearchBar.tsx",
                lineNumber: 18,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                type: "submit",
                className: "jsx-cd98c2986fa48398",
                children: "Search"
            }, void 0, false, {
                fileName: "[project]/components/SearchBar.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"], {
                id: "cd98c2986fa48398",
                children: ".search-shell.jsx-cd98c2986fa48398{background:#0c1116;border:1px solid #1f2b36;border-radius:12px;align-items:flex-end;gap:12px;padding:16px;display:flex;box-shadow:0 10px 40px #00000059}.inputs.jsx-cd98c2986fa48398{flex:1;grid-template-columns:1fr 1fr;gap:12px;display:grid}.field.jsx-cd98c2986fa48398{flex-direction:column;gap:6px;display:flex}label.jsx-cd98c2986fa48398{letter-spacing:.5px;text-transform:uppercase;color:#8fa3b5;font-size:12px}input.jsx-cd98c2986fa48398{color:#e7eef7;background:#0f1620;border:1px solid #1f2b36;border-radius:10px;outline:none;padding:12px 14px;transition:border-color .15s,box-shadow .15s}input.jsx-cd98c2986fa48398:focus{border-color:#4fb4ff;box-shadow:0 0 0 3px #4fb4ff33}button.jsx-cd98c2986fa48398{color:#041019;cursor:pointer;background:linear-gradient(135deg,#4fb4ff,#6dd5fa);border:none;border-radius:10px;padding:12px 18px;font-weight:700;transition:transform .1s,box-shadow .15s}button.jsx-cd98c2986fa48398:hover{transform:translateY(-1px);box-shadow:0 10px 25px #4fb4ff4d}@media (width<=720px){.inputs.jsx-cd98c2986fa48398{grid-template-columns:1fr}.search-shell.jsx-cd98c2986fa48398{flex-direction:column;align-items:stretch}button.jsx-cd98c2986fa48398{width:100%}}"
            }, void 0, false, void 0, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/SearchBar.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/TrustScoreBadge.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
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
                fileName: "[project]/components/TrustScoreBadge.tsx",
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
        fileName: "[project]/components/TrustScoreBadge.tsx",
        lineNumber: 8,
        columnNumber: 5
    }, this);
}
}),
"[project]/pages/index.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/styled-jsx/style.js [external] (styled-jsx/style.js, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$SearchBar$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/SearchBar.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$TrustScoreBadge$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/TrustScoreBadge.tsx [ssr] (ecmascript)");
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
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const handleSearch = async (term, location)=>{
        setLoading(true);
        setError(null);
        try {
            const apiBase = ("TURBOPACK compile-time value", "http://localhost:3001") || 'http://http://192.168.1.233/:3001';
            const url = new URL('/api/yelp-search', apiBase);
            url.searchParams.set('term', term || 'barber');
            url.searchParams.set('location', location || 'San Francisco, CA');
            const res = await fetch(url.toString());
            if (!res.ok) throw new Error(`Search failed (${res.status})`);
            const data = await res.json();
            const mapped = (data.results || []).map((b)=>({
                    id: b.id,
                    name: b.name,
                    shop: b.address,
                    distance: b.distance_m ? `${(b.distance_m / 1609).toFixed(1)} mi` : '',
                    trust: Math.min(100, Math.round((b.rating || 0) / 5 * 100)),
                    specialties: b.categories || [],
                    price: b.price || '$$?',
                    thumb: b.image_url
                }));
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
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 76,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                                className: "jsx-e088e8d6ccfada59",
                                children: "Search barbers by style, trust, and distance"
                            }, void 0, false, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 77,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                className: "jsx-e088e8d6ccfada59" + " " + "lede",
                                children: "See real trust scores, recent cuts, and specialties before you book."
                            }, void 0, false, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 78,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "jsx-e088e8d6ccfada59" + " " + "hero-card",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$SearchBar$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        onSearch: handleSearch
                                    }, void 0, false, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 80,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "jsx-e088e8d6ccfada59" + " " + "filters",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                className: "jsx-e088e8d6ccfada59",
                                                children: "Fade"
                                            }, void 0, false, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 82,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                className: "jsx-e088e8d6ccfada59",
                                                children: "Beard trim"
                                            }, void 0, false, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 83,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                className: "jsx-e088e8d6ccfada59",
                                                children: "Mobile"
                                            }, void 0, false, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 84,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                className: "jsx-e088e8d6ccfada59",
                                                children: "Open now"
                                            }, void 0, false, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 85,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 81,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 79,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 75,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "jsx-e088e8d6ccfada59" + " " + "map-shell",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "jsx-e088e8d6ccfada59" + " " + "map-placeholder",
                                children: "Map preview"
                            }, void 0, false, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 90,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                className: "jsx-e088e8d6ccfada59" + " " + "map-note",
                                children: "Map wiring TBD — will show clusters and pin cards."
                            }, void 0, false, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 91,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 89,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/index.tsx",
                lineNumber: 74,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("section", {
                className: "jsx-e088e8d6ccfada59" + " " + "results",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "jsx-e088e8d6ccfada59" + " " + "results-head",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                                className: "jsx-e088e8d6ccfada59",
                                children: "Top nearby barbers"
                            }, void 0, false, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 97,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                className: "jsx-e088e8d6ccfada59",
                                children: loading ? 'Searching Yelp…' : 'Powered by Yelp proxy'
                            }, void 0, false, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 98,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 96,
                        columnNumber: 9
                    }, this),
                    error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                        style: {
                            color: '#f87272'
                        },
                        className: "jsx-e088e8d6ccfada59",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 100,
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
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 104,
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
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 107,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$TrustScoreBadge$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                        score: b.trust
                                                    }, void 0, false, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 108,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 106,
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
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 110,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                className: "jsx-e088e8d6ccfada59" + " " + "chips",
                                                children: b.specialties.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                        className: "jsx-e088e8d6ccfada59",
                                                        children: s
                                                    }, s, false, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 113,
                                                        columnNumber: 21
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 111,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "jsx-e088e8d6ccfada59" + " " + "row bottom",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                        className: "jsx-e088e8d6ccfada59" + " " + "price",
                                                        children: b.price
                                                    }, void 0, false, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 117,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                        href: `/barbers/${b.id}`,
                                                        className: "jsx-e088e8d6ccfada59" + " " + "link",
                                                        children: "View profile →"
                                                    }, void 0, false, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 118,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 116,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 105,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, b.id, true, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 103,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 101,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/index.tsx",
                lineNumber: 95,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"], {
                id: "e088e8d6ccfada59",
                children: ".page.jsx-e088e8d6ccfada59{color:#e7eef7;background:radial-gradient(circle at 10% 20%,#4fb4ff14,#0000 35%),#05090f;min-height:100vh;padding:32px 24px 48px}.hero.jsx-e088e8d6ccfada59{grid-template-columns:1.2fr 1fr;align-items:center;gap:32px;display:grid}h1.jsx-e088e8d6ccfada59{margin:6px 0 12px;font-size:38px}.eyebrow.jsx-e088e8d6ccfada59{letter-spacing:1px;text-transform:uppercase;color:#8fa3b5;font-size:12px}.lede.jsx-e088e8d6ccfada59{color:#b9c7d6;max-width:560px}.hero-card.jsx-e088e8d6ccfada59{flex-direction:column;gap:12px;margin-top:18px;display:flex}.filters.jsx-e088e8d6ccfada59{flex-wrap:wrap;gap:8px;display:flex}.filters.jsx-e088e8d6ccfada59 button.jsx-e088e8d6ccfada59{color:#d9e3ee;cursor:pointer;background:#0f1620;border:1px solid #1f2b36;border-radius:10px;padding:8px 12px}.filters.jsx-e088e8d6ccfada59 button.jsx-e088e8d6ccfada59:hover{border-color:#4fb4ff}.map-shell.jsx-e088e8d6ccfada59{align-self:stretch}.map-placeholder.jsx-e088e8d6ccfada59{color:#7da4c0;background:#0b111a;border:1px dashed #294055;border-radius:14px;place-items:center;height:260px;display:grid}.map-note.jsx-e088e8d6ccfada59{color:#8fa3b5;margin-top:8px;font-size:13px}.results.jsx-e088e8d6ccfada59{margin-top:48px}.results-head.jsx-e088e8d6ccfada59{flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:12px;display:flex}.grid.jsx-e088e8d6ccfada59{grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;margin-top:16px;display:grid}.card.jsx-e088e8d6ccfada59{background:#0b111a;border:1px solid #1f2b36;border-radius:14px;grid-template-rows:180px 1fr;display:grid;overflow:hidden;box-shadow:0 10px 40px #00000059}.thumb.jsx-e088e8d6ccfada59{background-position:50%;background-size:cover}.card-body.jsx-e088e8d6ccfada59{flex-direction:column;gap:6px;padding:14px;display:flex}.row.jsx-e088e8d6ccfada59{justify-content:space-between;align-items:center;gap:10px;display:flex}h3.jsx-e088e8d6ccfada59{margin:0;font-size:18px}.muted.jsx-e088e8d6ccfada59{color:#8fa3b5;margin:0;font-size:14px}.chips.jsx-e088e8d6ccfada59{flex-wrap:wrap;gap:6px;margin:0;display:flex}.chips.jsx-e088e8d6ccfada59 span.jsx-e088e8d6ccfada59{background:#ffffff0d;border:1px solid #ffffff0f;border-radius:999px;padding:6px 10px;font-size:13px}.bottom.jsx-e088e8d6ccfada59{margin-top:6px}.price.jsx-e088e8d6ccfada59{color:#d1e2f4;font-weight:700}.link.jsx-e088e8d6ccfada59{color:#4fb4ff;font-weight:600;text-decoration:none}.link.jsx-e088e8d6ccfada59:hover{text-decoration:underline}@media (width<=960px){.hero.jsx-e088e8d6ccfada59{grid-template-columns:1fr}}"
            }, void 0, false, void 0, this)
        ]
    }, void 0, true, {
        fileName: "[project]/pages/index.tsx",
        lineNumber: 73,
        columnNumber: 5
    }, this);
}
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__bcdb165f._.js.map
module.exports = [
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/react-dom [external] (react-dom, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("react-dom", () => require("react-dom"));

module.exports = mod;
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
"[project]/web/pages/shop/[id].tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ShopPage
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/router.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$adapters$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/adapters.ts [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$lastVisited$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/lib/lastVisited.ts [ssr] (ecmascript)");
;
;
;
;
;
function ShopPage() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const { id } = router.query;
    const [barber, setBarber] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (!id) return;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const apiBase = ("TURBOPACK compile-time value", "http://localhost:3000") || '';
                const res = await fetch(`${apiBase}/api/barbers/${id}`);
                if (res.status === 404) {
                    setError('Barber not found');
                    setBarber(null);
                } else if (!res.ok) {
                    throw new Error(`fetch failed: ${res.status}`);
                } else {
                    const raw = await res.json();
                    setBarber((0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$adapters$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["mapApiBarberToUi"])(raw));
                    try {
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$lastVisited$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["setLastVisitedBarber"])({
                            id: raw.id,
                            name: raw.name || '',
                            shop: raw.primary_location && raw.primary_location.formatted_address || '',
                            timestamp: Date.now()
                        });
                    } catch (e) {}
                }
            } catch (err) {
                setError(err.message || String(err));
                setBarber(null);
            } finally{
                setLoading(false);
            }
        }
        load();
    }, [
        id
    ]);
    if (loading) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        children: "Loading shop..."
    }, void 0, false, {
        fileName: "[project]/web/pages/shop/[id].tsx",
        lineNumber: 45,
        columnNumber: 23
    }, this);
    if (error) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        children: [
            "Error: ",
            error
        ]
    }, void 0, true, {
        fileName: "[project]/web/pages/shop/[id].tsx",
        lineNumber: 46,
        columnNumber: 21
    }, this);
    if (!barber) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        children: "No barber data available"
    }, void 0, false, {
        fileName: "[project]/web/pages/shop/[id].tsx",
        lineNumber: 47,
        columnNumber: 23
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("main", {
        style: {
            padding: 20
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    marginBottom: 12
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                    onClick: ()=>router.back(),
                    style: {
                        padding: '6px 10px'
                    },
                    children: "← Back"
                }, void 0, false, {
                    fileName: "[project]/web/pages/shop/[id].tsx",
                    lineNumber: 52,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/web/pages/shop/[id].tsx",
                lineNumber: 51,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                children: barber.name
            }, void 0, false, {
                fileName: "[project]/web/pages/shop/[id].tsx",
                lineNumber: 54,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                        children: "Shop:"
                    }, void 0, false, {
                        fileName: "[project]/web/pages/shop/[id].tsx",
                        lineNumber: 55,
                        columnNumber: 10
                    }, this),
                    " ",
                    barber.shop
                ]
            }, void 0, true, {
                fileName: "[project]/web/pages/shop/[id].tsx",
                lineNumber: 55,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                        children: "Distance:"
                    }, void 0, false, {
                        fileName: "[project]/web/pages/shop/[id].tsx",
                        lineNumber: 56,
                        columnNumber: 10
                    }, this),
                    " ",
                    barber.distance
                ]
            }, void 0, true, {
                fileName: "[project]/web/pages/shop/[id].tsx",
                lineNumber: 56,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                        children: "Trust:"
                    }, void 0, false, {
                        fileName: "[project]/web/pages/shop/[id].tsx",
                        lineNumber: 57,
                        columnNumber: 10
                    }, this),
                    " ",
                    barber.trust
                ]
            }, void 0, true, {
                fileName: "[project]/web/pages/shop/[id].tsx",
                lineNumber: 57,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                        children: "Specialties:"
                    }, void 0, false, {
                        fileName: "[project]/web/pages/shop/[id].tsx",
                        lineNumber: 58,
                        columnNumber: 10
                    }, this),
                    " ",
                    barber.specialties?.join ? barber.specialties.join(', ') : JSON.stringify(barber.specialties)
                ]
            }, void 0, true, {
                fileName: "[project]/web/pages/shop/[id].tsx",
                lineNumber: 58,
                columnNumber: 7
            }, this),
            barber.thumb ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("img", {
                src: barber.thumb,
                alt: `${barber.name} thumbnail`,
                style: {
                    maxWidth: 300
                }
            }, void 0, false, {
                fileName: "[project]/web/pages/shop/[id].tsx",
                lineNumber: 59,
                columnNumber: 23
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/web/pages/shop/[id].tsx",
        lineNumber: 50,
        columnNumber: 5
    }, this);
}
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0cf9ad93._.js.map
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
"[project]/web/pages/barber/[id].tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>BarberProfilePage,
    "getServerSideProps",
    ()=>getServerSideProps
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
function BarberProfilePage({ barberRaw }) {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const barber = barberRaw ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$adapters$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["mapApiBarberToUi"])(barberRaw) : null;
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (!barberRaw) return;
        try {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$lib$2f$lastVisited$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["setLastVisitedBarber"])({
                id: barberRaw.id,
                name: barberRaw.name || '',
                shop: barberRaw.primary_location && (barberRaw.primary_location.name || barberRaw.primary_location.formatted_address) || barberRaw.shop && barberRaw.shop.name || '',
                timestamp: Date.now()
            });
        } catch (e) {}
    }, [
        barberRaw
    ]);
    if (!barberRaw || !barber) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        children: "No barber found"
    }, void 0, false, {
        fileName: "[project]/web/pages/barber/[id].tsx",
        lineNumber: 26,
        columnNumber: 37
    }, this);
    const barberVerified = barberRaw.verified === true || barberRaw.is_verified === true || !!barberRaw.verified_at || barberRaw.status === 'verified';
    const shop = barberRaw.primary_location || barberRaw.shop || null;
    const shopVerified = !!shop && (shop.verified === true || shop.is_verified === true || !!shop.verified_at || shop.status === 'verified');
    const hasBusinessProfile = barberRaw.business_profile === true || barberRaw.has_business_profile === true || !!barberRaw.business_profile_id;
    const creditsBarber = Number(barberRaw.credits || barberRaw.reward_points || 0);
    const creditsShop = Number(shop && (shop.credits || shop.reward_points) ? shop.credits || shop.reward_points : 0);
    const combinedCredits = creditsBarber + creditsShop;
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
                    fileName: "[project]/web/pages/barber/[id].tsx",
                    lineNumber: 41,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/web/pages/barber/[id].tsx",
                lineNumber: 40,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                children: barber.name
            }, void 0, false, {
                fileName: "[project]/web/pages/barber/[id].tsx",
                lineNumber: 45,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center'
                },
                children: [
                    barber.thumb ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("img", {
                        src: barber.thumb,
                        alt: `${barber.name} thumb`,
                        style: {
                            width: 140,
                            height: 140,
                            objectFit: 'cover',
                            borderRadius: 6
                        }
                    }, void 0, false, {
                        fileName: "[project]/web/pages/barber/[id].tsx",
                        lineNumber: 47,
                        columnNumber: 25
                    }, this) : null,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                style: {
                                    margin: 0
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                                        children: "Shop:"
                                    }, void 0, false, {
                                        fileName: "[project]/web/pages/barber/[id].tsx",
                                        lineNumber: 49,
                                        columnNumber: 36
                                    }, this),
                                    " ",
                                    barber.shop || 'Independent'
                                ]
                            }, void 0, true, {
                                fileName: "[project]/web/pages/barber/[id].tsx",
                                lineNumber: 49,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                style: {
                                    margin: 0
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                                        children: "Distance:"
                                    }, void 0, false, {
                                        fileName: "[project]/web/pages/barber/[id].tsx",
                                        lineNumber: 50,
                                        columnNumber: 36
                                    }, this),
                                    " ",
                                    barber.distance
                                ]
                            }, void 0, true, {
                                fileName: "[project]/web/pages/barber/[id].tsx",
                                lineNumber: 50,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                style: {
                                    margin: 0
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                                        children: "Trust:"
                                    }, void 0, false, {
                                        fileName: "[project]/web/pages/barber/[id].tsx",
                                        lineNumber: 51,
                                        columnNumber: 36
                                    }, this),
                                    " ",
                                    barber.trust
                                ]
                            }, void 0, true, {
                                fileName: "[project]/web/pages/barber/[id].tsx",
                                lineNumber: 51,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/pages/barber/[id].tsx",
                        lineNumber: 48,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/web/pages/barber/[id].tsx",
                lineNumber: 46,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("section", {
                style: {
                    marginTop: 18
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                        children: "Verification"
                    }, void 0, false, {
                        fileName: "[project]/web/pages/barber/[id].tsx",
                        lineNumber: 56,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                                children: "Barber verified:"
                            }, void 0, false, {
                                fileName: "[project]/web/pages/barber/[id].tsx",
                                lineNumber: 58,
                                columnNumber: 11
                            }, this),
                            " ",
                            barberVerified ? 'Yes' : 'No',
                            ' ',
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                                children: "Shop verified:"
                            }, void 0, false, {
                                fileName: "[project]/web/pages/barber/[id].tsx",
                                lineNumber: 60,
                                columnNumber: 11
                            }, this),
                            " ",
                            shopVerified ? 'Yes' : 'No'
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/pages/barber/[id].tsx",
                        lineNumber: 57,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                                children: "Business profile:"
                            }, void 0, false, {
                                fileName: "[project]/web/pages/barber/[id].tsx",
                                lineNumber: 63,
                                columnNumber: 11
                            }, this),
                            " ",
                            hasBusinessProfile ? 'Exists' : 'None'
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/pages/barber/[id].tsx",
                        lineNumber: 62,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/web/pages/barber/[id].tsx",
                lineNumber: 55,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("section", {
                style: {
                    marginTop: 18
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                        children: "Credits"
                    }, void 0, false, {
                        fileName: "[project]/web/pages/barber/[id].tsx",
                        lineNumber: 68,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                                children: "Barber credits:"
                            }, void 0, false, {
                                fileName: "[project]/web/pages/barber/[id].tsx",
                                lineNumber: 69,
                                columnNumber: 12
                            }, this),
                            " ",
                            creditsBarber
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/pages/barber/[id].tsx",
                        lineNumber: 69,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                                children: "Shop credits:"
                            }, void 0, false, {
                                fileName: "[project]/web/pages/barber/[id].tsx",
                                lineNumber: 70,
                                columnNumber: 12
                            }, this),
                            " ",
                            creditsShop
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/pages/barber/[id].tsx",
                        lineNumber: 70,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                                children: "Combined credits:"
                            }, void 0, false, {
                                fileName: "[project]/web/pages/barber/[id].tsx",
                                lineNumber: 71,
                                columnNumber: 12
                            }, this),
                            " ",
                            combinedCredits
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/pages/barber/[id].tsx",
                        lineNumber: 71,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                        style: {
                            color: '#555'
                        },
                        children: "If both the barber and the shop are verified, the barber can earn credits from both pages."
                    }, void 0, false, {
                        fileName: "[project]/web/pages/barber/[id].tsx",
                        lineNumber: 72,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/web/pages/barber/[id].tsx",
                lineNumber: 67,
                columnNumber: 7
            }, this),
            barberRaw.reviews && barberRaw.reviews.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("section", {
                style: {
                    marginTop: 18
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                        children: "Recent comments"
                    }, void 0, false, {
                        fileName: "[project]/web/pages/barber/[id].tsx",
                        lineNumber: 77,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        children: barberRaw.reviews.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: '10px 0',
                                    borderBottom: '1px solid #eee'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                        style: {
                                            margin: 0
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                                                children: r.sanitized ? 'Summary' : 'Comment'
                                            }, void 0, false, {
                                                fileName: "[project]/web/pages/barber/[id].tsx",
                                                lineNumber: 82,
                                                columnNumber: 19
                                            }, this),
                                            r.rating ? ` — ${r.rating}/5` : '',
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                style: {
                                                    color: '#666',
                                                    marginLeft: 8
                                                },
                                                children: r.created_at ? new Date(r.created_at).toLocaleDateString() : ''
                                            }, void 0, false, {
                                                fileName: "[project]/web/pages/barber/[id].tsx",
                                                lineNumber: 84,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/web/pages/barber/[id].tsx",
                                        lineNumber: 81,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                        style: {
                                            margin: '6px 0 0'
                                        },
                                        children: r.summary || 'No text available'
                                    }, void 0, false, {
                                        fileName: "[project]/web/pages/barber/[id].tsx",
                                        lineNumber: 86,
                                        columnNumber: 17
                                    }, this),
                                    r.sanitized && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                        style: {
                                            fontSize: 12,
                                            color: '#666',
                                            margin: '6px 0 0'
                                        },
                                        children: "Sanitized summary (LLM)"
                                    }, void 0, false, {
                                        fileName: "[project]/web/pages/barber/[id].tsx",
                                        lineNumber: 87,
                                        columnNumber: 33
                                    }, this)
                                ]
                            }, r.id, true, {
                                fileName: "[project]/web/pages/barber/[id].tsx",
                                lineNumber: 80,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/web/pages/barber/[id].tsx",
                        lineNumber: 78,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/web/pages/barber/[id].tsx",
                lineNumber: 76,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("section", {
                style: {
                    marginTop: 18
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                        children: "Actions"
                    }, void 0, false, {
                        fileName: "[project]/web/pages/barber/[id].tsx",
                        lineNumber: 95,
                        columnNumber: 9
                    }, this),
                    !hasBusinessProfile && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                        onClick: ()=>alert('Claim Business Profile flow not yet implemented'),
                        style: {
                            padding: '8px 12px'
                        },
                        children: "Claim Business Profile"
                    }, void 0, false, {
                        fileName: "[project]/web/pages/barber/[id].tsx",
                        lineNumber: 97,
                        columnNumber: 11
                    }, this),
                    hasBusinessProfile && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                        onClick: ()=>alert('Manage business profile (not implemented)'),
                        style: {
                            padding: '8px 12px'
                        },
                        children: "Manage Business Profile"
                    }, void 0, false, {
                        fileName: "[project]/web/pages/barber/[id].tsx",
                        lineNumber: 102,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/web/pages/barber/[id].tsx",
                lineNumber: 94,
                columnNumber: 7
            }, this),
            shop && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("section", {
                style: {
                    marginTop: 18
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                        children: "Shop"
                    }, void 0, false, {
                        fileName: "[project]/web/pages/barber/[id].tsx",
                        lineNumber: 110,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                                children: "Name:"
                            }, void 0, false, {
                                fileName: "[project]/web/pages/barber/[id].tsx",
                                lineNumber: 111,
                                columnNumber: 14
                            }, this),
                            " ",
                            shop.name || shop.formatted_address || barber.shop
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/pages/barber/[id].tsx",
                        lineNumber: 111,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                                children: "Verified:"
                            }, void 0, false, {
                                fileName: "[project]/web/pages/barber/[id].tsx",
                                lineNumber: 112,
                                columnNumber: 14
                            }, this),
                            " ",
                            shopVerified ? 'Yes' : 'No'
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/pages/barber/[id].tsx",
                        lineNumber: 112,
                        columnNumber: 11
                    }, this),
                    shop.id ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                            href: `/shop/${shop.id}`,
                            children: "Open shop page"
                        }, void 0, false, {
                            fileName: "[project]/web/pages/barber/[id].tsx",
                            lineNumber: 114,
                            columnNumber: 16
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/web/pages/barber/[id].tsx",
                        lineNumber: 114,
                        columnNumber: 13
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/web/pages/barber/[id].tsx",
                lineNumber: 109,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/web/pages/barber/[id].tsx",
        lineNumber: 39,
        columnNumber: 5
    }, this);
}
async function getServerSideProps(context) {
    const { id } = context.params || {};
    const apiBase = ("TURBOPACK compile-time value", "http://localhost:3000") || 'http://localhost:3000';
    try {
        const res = await fetch(`${apiBase}/api/barbers/${id}`);
        if (res.status === 404) return {
            notFound: true
        };
        if (!res.ok) return {
            props: {
                barberRaw: null
            }
        };
        const barberRaw = await res.json();
        return {
            props: {
                barberRaw
            }
        };
    } catch (e) {
        return {
            props: {
                barberRaw: null
            }
        };
    }
}
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__a836a73e._.js.map
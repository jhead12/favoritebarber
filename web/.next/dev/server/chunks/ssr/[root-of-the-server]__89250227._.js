module.exports = [
"[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("react/jsx-dev-runtime", () => require("react/jsx-dev-runtime"));

module.exports = mod;
}),
"[externals]/styled-jsx/style.js [external] (styled-jsx/style.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("styled-jsx/style.js", () => require("styled-jsx/style.js"));

module.exports = mod;
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
"[project]/web/pages/barbers/[id].tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>BarberProfile
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/styled-jsx/style.js [external] (styled-jsx/style.js, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$TrustScoreBadge$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/components/TrustScoreBadge.tsx [ssr] (ecmascript)");
;
;
;
const MOCK = {
    name: 'Tony “Fade Lab” Rivera',
    shop: 'Mission Cuts · San Francisco',
    trust: 92,
    hero: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=60',
    tagline: 'Precision fades, beard sculpting, and calm chair-side vibe.',
    specialties: [
        'Low fade',
        'Skin fade',
        'Beard trim',
        'Line-up'
    ],
    hairstyles: [
        'Fade',
        'Taper',
        'Beard Trim'
    ],
    services: [
        {
            name: 'Skin Fade + Beard',
            price: '$65',
            duration: '50 min'
        },
        {
            name: 'Classic Fade',
            price: '$45',
            duration: '35 min'
        },
        {
            name: 'Beard Sculpt',
            price: '$30',
            duration: '20 min'
        }
    ],
    gallery: [
        'https://images.unsplash.com/photo-1503951914909-04e7d77c5cde?auto=format&fit=crop&w=600&q=60',
        'https://images.unsplash.com/photo-1503951914646-5700dea92f62?auto=format&fit=crop&w=600&q=60',
        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=60'
    ],
    reviews: [
        {
            author: 'Maria G.',
            text: 'Best skin fade I’ve had in SF. Super clean lines, chill playlist.',
            rating: 5
        },
        {
            author: 'Andre P.',
            text: 'Booked last minute, Tony nailed the taper. Will return.',
            rating: 5
        }
    ],
    claimed: false
};
function BarberProfile() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("main", {
        className: "jsx-166128e3c1a8ce1" + " " + "page",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("section", {
                style: {
                    backgroundImage: `url(${MOCK.hero})`
                },
                className: "jsx-166128e3c1a8ce1" + " " + "hero",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "jsx-166128e3c1a8ce1" + " " + "overlay"
                    }, void 0, false, {
                        fileName: "[project]/web/pages/barbers/[id].tsx",
                        lineNumber: 33,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "jsx-166128e3c1a8ce1" + " " + "hero-content",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$components$2f$TrustScoreBadge$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                score: MOCK.trust
                            }, void 0, false, {
                                fileName: "[project]/web/pages/barbers/[id].tsx",
                                lineNumber: 35,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                                className: "jsx-166128e3c1a8ce1",
                                children: MOCK.name
                            }, void 0, false, {
                                fileName: "[project]/web/pages/barbers/[id].tsx",
                                lineNumber: 36,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                className: "jsx-166128e3c1a8ce1" + " " + "muted",
                                children: MOCK.shop
                            }, void 0, false, {
                                fileName: "[project]/web/pages/barbers/[id].tsx",
                                lineNumber: 37,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                className: "jsx-166128e3c1a8ce1" + " " + "lede",
                                children: MOCK.tagline
                            }, void 0, false, {
                                fileName: "[project]/web/pages/barbers/[id].tsx",
                                lineNumber: 38,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "jsx-166128e3c1a8ce1" + " " + "chips",
                                children: MOCK.specialties.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                        className: "jsx-166128e3c1a8ce1",
                                        children: s
                                    }, s, false, {
                                        fileName: "[project]/web/pages/barbers/[id].tsx",
                                        lineNumber: 40,
                                        columnNumber: 42
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/web/pages/barbers/[id].tsx",
                                lineNumber: 39,
                                columnNumber: 11
                            }, this),
                            MOCK.claimed ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "jsx-166128e3c1a8ce1" + " " + "cta",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                        className: "jsx-166128e3c1a8ce1",
                                        children: "Book"
                                    }, void 0, false, {
                                        fileName: "[project]/web/pages/barbers/[id].tsx",
                                        lineNumber: 44,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                        className: "jsx-166128e3c1a8ce1" + " " + "ghost",
                                        children: "Message"
                                    }, void 0, false, {
                                        fileName: "[project]/web/pages/barbers/[id].tsx",
                                        lineNumber: 45,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/web/pages/barbers/[id].tsx",
                                lineNumber: 43,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "jsx-166128e3c1a8ce1" + " " + "unclaimed",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                        className: "jsx-166128e3c1a8ce1" + " " + "pill",
                                        children: "Unclaimed profile"
                                    }, void 0, false, {
                                        fileName: "[project]/web/pages/barbers/[id].tsx",
                                        lineNumber: 49,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                        className: "jsx-166128e3c1a8ce1" + " " + "muted",
                                        children: "Booking and messaging are unavailable until this barber verifies ownership. Currently showing scraped info only."
                                    }, void 0, false, {
                                        fileName: "[project]/web/pages/barbers/[id].tsx",
                                        lineNumber: 50,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/web/pages/barbers/[id].tsx",
                                lineNumber: 48,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/pages/barbers/[id].tsx",
                        lineNumber: 34,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/web/pages/barbers/[id].tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("section", {
                className: "jsx-166128e3c1a8ce1" + " " + "two-col",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "jsx-166128e3c1a8ce1" + " " + "left",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                                className: "jsx-166128e3c1a8ce1",
                                children: "Services"
                            }, void 0, false, {
                                fileName: "[project]/web/pages/barbers/[id].tsx",
                                lineNumber: 60,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "jsx-166128e3c1a8ce1" + " " + "panel",
                                children: MOCK.services.map((svc)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "jsx-166128e3c1a8ce1" + " " + "svc",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "jsx-166128e3c1a8ce1",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                        className: "jsx-166128e3c1a8ce1" + " " + "svc-name",
                                                        children: svc.name
                                                    }, void 0, false, {
                                                        fileName: "[project]/web/pages/barbers/[id].tsx",
                                                        lineNumber: 65,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                        className: "jsx-166128e3c1a8ce1" + " " + "muted",
                                                        children: svc.duration
                                                    }, void 0, false, {
                                                        fileName: "[project]/web/pages/barbers/[id].tsx",
                                                        lineNumber: 66,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/web/pages/barbers/[id].tsx",
                                                lineNumber: 64,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                className: "jsx-166128e3c1a8ce1" + " " + "svc-price",
                                                children: svc.price
                                            }, void 0, false, {
                                                fileName: "[project]/web/pages/barbers/[id].tsx",
                                                lineNumber: 68,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, svc.name, true, {
                                        fileName: "[project]/web/pages/barbers/[id].tsx",
                                        lineNumber: 63,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/web/pages/barbers/[id].tsx",
                                lineNumber: 61,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                                className: "jsx-166128e3c1a8ce1",
                                children: "Reviews"
                            }, void 0, false, {
                                fileName: "[project]/web/pages/barbers/[id].tsx",
                                lineNumber: 73,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "jsx-166128e3c1a8ce1" + " " + "panel",
                                children: MOCK.reviews.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "jsx-166128e3c1a8ce1" + " " + "review",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "jsx-166128e3c1a8ce1" + " " + "review-head",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                                                        className: "jsx-166128e3c1a8ce1",
                                                        children: r.author
                                                    }, void 0, false, {
                                                        fileName: "[project]/web/pages/barbers/[id].tsx",
                                                        lineNumber: 78,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                        className: "jsx-166128e3c1a8ce1",
                                                        children: '★'.repeat(r.rating)
                                                    }, void 0, false, {
                                                        fileName: "[project]/web/pages/barbers/[id].tsx",
                                                        lineNumber: 79,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/web/pages/barbers/[id].tsx",
                                                lineNumber: 77,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                className: "jsx-166128e3c1a8ce1",
                                                children: r.text
                                            }, void 0, false, {
                                                fileName: "[project]/web/pages/barbers/[id].tsx",
                                                lineNumber: 81,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, r.author, true, {
                                        fileName: "[project]/web/pages/barbers/[id].tsx",
                                        lineNumber: 76,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/web/pages/barbers/[id].tsx",
                                lineNumber: 74,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/pages/barbers/[id].tsx",
                        lineNumber: 59,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "jsx-166128e3c1a8ce1" + " " + "right",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                                className: "jsx-166128e3c1a8ce1",
                                children: "Gallery"
                            }, void 0, false, {
                                fileName: "[project]/web/pages/barbers/[id].tsx",
                                lineNumber: 88,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "jsx-166128e3c1a8ce1" + " " + "gallery",
                                children: MOCK.gallery.map((src, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        style: {
                                            backgroundImage: `url(${src})`
                                        },
                                        className: "jsx-166128e3c1a8ce1" + " " + "shot"
                                    }, i, false, {
                                        fileName: "[project]/web/pages/barbers/[id].tsx",
                                        lineNumber: 91,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/web/pages/barbers/[id].tsx",
                                lineNumber: 89,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                                className: "jsx-166128e3c1a8ce1",
                                children: "Hairstyles"
                            }, void 0, false, {
                                fileName: "[project]/web/pages/barbers/[id].tsx",
                                lineNumber: 95,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "jsx-166128e3c1a8ce1" + " " + "chips",
                                children: MOCK.hairstyles.map((h)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                        className: "jsx-166128e3c1a8ce1",
                                        children: h
                                    }, h, false, {
                                        fileName: "[project]/web/pages/barbers/[id].tsx",
                                        lineNumber: 97,
                                        columnNumber: 41
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/web/pages/barbers/[id].tsx",
                                lineNumber: 96,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/pages/barbers/[id].tsx",
                        lineNumber: 87,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/web/pages/barbers/[id].tsx",
                lineNumber: 58,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"], {
                id: "166128e3c1a8ce1",
                children: ".page.jsx-166128e3c1a8ce1{color:#e7eef7;background:#05090f;min-height:100vh}.hero.jsx-166128e3c1a8ce1{background-position:50%;background-size:cover;padding:60px 24px 80px;position:relative}.overlay.jsx-166128e3c1a8ce1{background:linear-gradient(#05090f8c,#05090f 80%);position:absolute;inset:0}.hero-content.jsx-166128e3c1a8ce1{z-index:1;gap:10px;max-width:720px;display:grid;position:relative}h1.jsx-166128e3c1a8ce1{margin:0;font-size:36px}.muted.jsx-166128e3c1a8ce1{color:#9bb0c4;margin:0}.lede.jsx-166128e3c1a8ce1{color:#cdd9e5;margin:4px 0 8px}.chips.jsx-166128e3c1a8ce1{flex-wrap:wrap;gap:8px;display:flex}.chips.jsx-166128e3c1a8ce1 span.jsx-166128e3c1a8ce1{background:#ffffff0f;border:1px solid #ffffff14;border-radius:12px;padding:8px 10px;font-size:13px}.cta.jsx-166128e3c1a8ce1{gap:10px;margin-top:8px;display:flex}.unclaimed.jsx-166128e3c1a8ce1{gap:6px;max-width:520px;margin-top:8px;display:grid}.pill.jsx-166128e3c1a8ce1{letter-spacing:.5px;text-transform:uppercase;background:#ffffff14;border:1px solid #ffffff1f;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:700;display:inline-flex}button.jsx-166128e3c1a8ce1{cursor:pointer;color:#041019;background:linear-gradient(135deg,#4fb4ff,#6dd5fa);border:none;border-radius:10px;padding:12px 16px;font-weight:700}.ghost.jsx-166128e3c1a8ce1{color:#e7eef7;background:#ffffff14;border:1px solid #ffffff1f}.two-col.jsx-166128e3c1a8ce1{grid-template-columns:1.1fr .9fr;gap:24px;padding:0 24px 48px;display:grid}h2.jsx-166128e3c1a8ce1{margin:18px 0 10px}.panel.jsx-166128e3c1a8ce1{background:#0b111a;border:1px solid #1f2b36;border-radius:14px;gap:12px;padding:14px;display:grid;box-shadow:0 10px 30px #00000059}.svc.jsx-166128e3c1a8ce1{border-bottom:1px solid #1a2430;justify-content:space-between;align-items:center;padding-bottom:10px;display:flex}.svc.jsx-166128e3c1a8ce1:last-child{border-bottom:none;padding-bottom:0}.svc-name.jsx-166128e3c1a8ce1{margin:0;font-weight:700}.svc-price.jsx-166128e3c1a8ce1{color:#d1e2f4;margin:0;font-weight:700}.review.jsx-166128e3c1a8ce1{border-bottom:1px solid #1a2430;padding-bottom:10px}.review.jsx-166128e3c1a8ce1:last-child{border-bottom:none;padding-bottom:0}.review-head.jsx-166128e3c1a8ce1{justify-content:space-between;display:flex}.gallery.jsx-166128e3c1a8ce1{grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;display:grid}.shot.jsx-166128e3c1a8ce1{background-position:50%;background-size:cover;border:1px solid #1f2b36;border-radius:12px;height:140px}@media (width<=960px){.two-col.jsx-166128e3c1a8ce1{grid-template-columns:1fr}}"
            }, void 0, false, void 0, this)
        ]
    }, void 0, true, {
        fileName: "[project]/web/pages/barbers/[id].tsx",
        lineNumber: 31,
        columnNumber: 5
    }, this);
}
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__89250227._.js.map
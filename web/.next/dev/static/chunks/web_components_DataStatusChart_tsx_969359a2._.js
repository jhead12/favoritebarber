(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/web/components/DataStatusChart.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DataStatusChart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/react/index.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
function DataStatusChart({ endpoint = '/api/admin/data-status' }) {
    _s();
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const chartRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DataStatusChart.useEffect": ()=>{
            let mounted = true;
            ({
                "DataStatusChart.useEffect": async ()=>{
                    try {
                        const res = await fetch(endpoint);
                        if (!res.ok) throw new Error('fetch failed');
                        const j = await res.json();
                        if (!mounted) return;
                        setData(j);
                    } catch (e) {
                        console.error(e);
                    }
                }
            })["DataStatusChart.useEffect"]();
            return ({
                "DataStatusChart.useEffect": ()=>{
                    mounted = false;
                }
            })["DataStatusChart.useEffect"];
        }
    }["DataStatusChart.useEffect"], [
        endpoint
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DataStatusChart.useEffect": ()=>{
            if (!data || !canvasRef.current) return;
            // Lazy-load Chart.js to avoid forcing dependency for all dev setups
            let cancelled = false;
            ({
                "DataStatusChart.useEffect": async ()=>{
                    try {
                        const Chart = (await __turbopack_context__.A("[project]/web/node_modules/chart.js/auto/auto.js [client] (ecmascript, async loader)")).default;
                        if (cancelled) return;
                        const ctx = canvasRef.current.getContext('2d');
                        if (chartRef.current) chartRef.current.destroy();
                        const labels = [
                            '<20',
                            '20-39',
                            '40-59',
                            '60-79',
                            '80+'
                        ];
                        const values = [
                            data.distr.lt20 || 0,
                            data.distr.bt20_40 || 0,
                            data.distr.bt40_60 || 0,
                            data.distr.bt60_80 || 0,
                            data.distr.gte80 || 0
                        ];
                        chartRef.current = new Chart(ctx, {
                            type: 'bar',
                            data: {
                                labels,
                                datasets: [
                                    {
                                        label: 'Barber trust distribution',
                                        data: values,
                                        backgroundColor: [
                                            '#ef4444',
                                            '#f59e0b',
                                            '#facc15',
                                            '#34d399',
                                            '#60a5fa'
                                        ]
                                    }
                                ]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false
                            }
                        });
                    } catch (e) {
                        console.error('Chart load failed', e);
                    }
                }
            })["DataStatusChart.useEffect"]();
            return ({
                "DataStatusChart.useEffect": ()=>{
                    cancelled = true;
                    if (chartRef.current) chartRef.current.destroy();
                }
            })["DataStatusChart.useEffect"];
        }
    }["DataStatusChart.useEffect"], [
        data
    ]);
    if (!data) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: "Loading dashboard…"
    }, void 0, false, {
        fileName: "[project]/web/components/DataStatusChart.tsx",
        lineNumber: 63,
        columnNumber: 21
    }, this);
    const totalBarbers = Number(data.counts.barbers_count || 0);
    const values = [
        Number(data.distr.lt20 || 0),
        Number(data.distr.bt20_40 || 0),
        Number(data.distr.bt40_60 || 0),
        Number(data.distr.bt60_80 || 0),
        Number(data.distr.gte80 || 0)
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            padding: 20
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                style: {
                    marginBottom: 6
                },
                children: "Data Collections"
            }, void 0, false, {
                fileName: "[project]/web/components/DataStatusChart.tsx",
                lineNumber: 76,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: 'flex',
                    gap: 18,
                    alignItems: 'center',
                    marginBottom: 12
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            fontSize: 14,
                            color: '#374151'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Barbers"
                                    }, void 0, false, {
                                        fileName: "[project]/web/components/DataStatusChart.tsx",
                                        lineNumber: 79,
                                        columnNumber: 16
                                    }, this),
                                    ": ",
                                    data.counts.barbers_count
                                ]
                            }, void 0, true, {
                                fileName: "[project]/web/components/DataStatusChart.tsx",
                                lineNumber: 79,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Shops"
                                    }, void 0, false, {
                                        fileName: "[project]/web/components/DataStatusChart.tsx",
                                        lineNumber: 80,
                                        columnNumber: 16
                                    }, this),
                                    ": ",
                                    data.counts.shops_count
                                ]
                            }, void 0, true, {
                                fileName: "[project]/web/components/DataStatusChart.tsx",
                                lineNumber: 80,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Locations"
                                    }, void 0, false, {
                                        fileName: "[project]/web/components/DataStatusChart.tsx",
                                        lineNumber: 81,
                                        columnNumber: 16
                                    }, this),
                                    ": ",
                                    data.counts.locations_count
                                ]
                            }, void 0, true, {
                                fileName: "[project]/web/components/DataStatusChart.tsx",
                                lineNumber: 81,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Images"
                                    }, void 0, false, {
                                        fileName: "[project]/web/components/DataStatusChart.tsx",
                                        lineNumber: 82,
                                        columnNumber: 16
                                    }, this),
                                    ": ",
                                    data.counts.images_count
                                ]
                            }, void 0, true, {
                                fileName: "[project]/web/components/DataStatusChart.tsx",
                                lineNumber: 82,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Reviews"
                                    }, void 0, false, {
                                        fileName: "[project]/web/components/DataStatusChart.tsx",
                                        lineNumber: 83,
                                        columnNumber: 16
                                    }, this),
                                    ": ",
                                    data.counts.reviews_count
                                ]
                            }, void 0, true, {
                                fileName: "[project]/web/components/DataStatusChart.tsx",
                                lineNumber: 83,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/components/DataStatusChart.tsx",
                        lineNumber: 78,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            fontSize: 14,
                            color: '#374151'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    "Avg barber trust: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: Number(data.aggs.avg_barber_trust || 0).toFixed(1)
                                    }, void 0, false, {
                                        fileName: "[project]/web/components/DataStatusChart.tsx",
                                        lineNumber: 86,
                                        columnNumber: 34
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/web/components/DataStatusChart.tsx",
                                lineNumber: 86,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    "Avg shop trust: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: Number(data.aggs.avg_shop_trust || 0).toFixed(1)
                                    }, void 0, false, {
                                        fileName: "[project]/web/components/DataStatusChart.tsx",
                                        lineNumber: 87,
                                        columnNumber: 32
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/web/components/DataStatusChart.tsx",
                                lineNumber: 87,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    "Locations verified: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: [
                                            Number(data.verified.pct_locations_verified || 0).toFixed(1),
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/web/components/DataStatusChart.tsx",
                                        lineNumber: 88,
                                        columnNumber: 36
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/web/components/DataStatusChart.tsx",
                                lineNumber: 88,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/web/components/DataStatusChart.tsx",
                        lineNumber: 85,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/web/components/DataStatusChart.tsx",
                lineNumber: 77,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: 'flex',
                    gap: 20,
                    alignItems: 'flex-start'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            width: '60%',
                            height: 360,
                            background: '#fff',
                            padding: 12,
                            borderRadius: 8,
                            boxShadow: '0 6px 18px rgba(2,6,23,0.08)'
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                            ref: canvasRef
                        }, void 0, false, {
                            fileName: "[project]/web/components/DataStatusChart.tsx",
                            lineNumber: 94,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/web/components/DataStatusChart.tsx",
                        lineNumber: 93,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            width: '35%'
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                background: '#fff',
                                padding: 12,
                                borderRadius: 8,
                                boxShadow: '0 6px 18px rgba(2,6,23,0.08)'
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    style: {
                                        marginTop: 0
                                    },
                                    children: "Legend"
                                }, void 0, false, {
                                    fileName: "[project]/web/components/DataStatusChart.tsx",
                                    lineNumber: 98,
                                    columnNumber: 13
                                }, this),
                                [
                                    '<20',
                                    '20-39',
                                    '40-59',
                                    '60-79',
                                    '80+'
                                ].map((lbl, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            marginBottom: 8
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    width: 18,
                                                    height: 12,
                                                    background: [
                                                        '#ef4444',
                                                        '#f59e0b',
                                                        '#facc15',
                                                        '#34d399',
                                                        '#60a5fa'
                                                    ][i],
                                                    borderRadius: 3
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/web/components/DataStatusChart.tsx",
                                                lineNumber: 101,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    flex: 1
                                                },
                                                children: lbl
                                            }, void 0, false, {
                                                fileName: "[project]/web/components/DataStatusChart.tsx",
                                                lineNumber: 102,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    fontWeight: 700
                                                },
                                                children: [
                                                    values[i],
                                                    totalBarbers ? ` (${(values[i] / totalBarbers * 100).toFixed(1)}%)` : ''
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/web/components/DataStatusChart.tsx",
                                                lineNumber: 103,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, lbl, true, {
                                        fileName: "[project]/web/components/DataStatusChart.tsx",
                                        lineNumber: 100,
                                        columnNumber: 15
                                    }, this)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("hr", {}, void 0, false, {
                                    fileName: "[project]/web/components/DataStatusChart.tsx",
                                    lineNumber: 106,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                    style: {
                                        color: '#6b7280'
                                    },
                                    children: "This chart shows the distribution of barber trust scores across the dataset. Higher trust indicates better reliability based on aggregated signals."
                                }, void 0, false, {
                                    fileName: "[project]/web/components/DataStatusChart.tsx",
                                    lineNumber: 107,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/web/components/DataStatusChart.tsx",
                            lineNumber: 97,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/web/components/DataStatusChart.tsx",
                        lineNumber: 96,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/web/components/DataStatusChart.tsx",
                lineNumber: 92,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/web/components/DataStatusChart.tsx",
        lineNumber: 75,
        columnNumber: 5
    }, this);
}
_s(DataStatusChart, "dnuZYWQmI2LaWpSFJQPfcYKUNfQ=");
_c = DataStatusChart;
var _c;
__turbopack_context__.k.register(_c, "DataStatusChart");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/web/components/DataStatusChart.tsx [client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/web/components/DataStatusChart.tsx [client] (ecmascript)"));
}),
]);

//# sourceMappingURL=web_components_DataStatusChart_tsx_969359a2._.js.map
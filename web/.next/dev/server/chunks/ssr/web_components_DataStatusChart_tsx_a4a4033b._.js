module.exports = [
"[project]/web/components/DataStatusChart.tsx [ssr] (ecmascript, next/dynamic entry, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/ssr/[externals]_chart_js_auto_fed4b0f1._.js",
  "server/chunks/ssr/web_components_DataStatusChart_tsx_d08c4757._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/web/components/DataStatusChart.tsx [ssr] (ecmascript, next/dynamic entry)");
    });
});
}),
];
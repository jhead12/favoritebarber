module.exports = [
"[externals]/chart.js/auto [external] (chart.js/auto, esm_import, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/ssr/[externals]_chart_js_auto_2e1b82ba._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[externals]/chart.js/auto [external] (chart.js/auto, esm_import)");
    });
});
}),
];
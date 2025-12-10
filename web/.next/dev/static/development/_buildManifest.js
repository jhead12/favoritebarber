self.__BUILD_MANIFEST = {
  "/": [
    "static/chunks/pages/index.js"
  ],
  "/_error": [
    "static/chunks/pages/_error.js"
  ],
  "/admin/data-status": [
    "static/chunks/pages/admin/data-status.js"
  ],
  "/barber/[id]": [
    "static/chunks/pages/barber/[id].js"
  ],
  "/shop/[id]": [
    "static/chunks/pages/shop/[id].js"
  ],
  "__rewrites": {
    "afterFiles": [
      {
        "source": "/api/:path*"
      }
    ],
    "beforeFiles": [],
    "fallback": []
  },
  "sortedPages": [
    "/",
    "/_app",
    "/_error",
    "/admin/data-status",
    "/barber/[id]",
    "/barber/[id]/photos",
    "/barbers/[id]",
    "/shop/[id]"
  ]
};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()
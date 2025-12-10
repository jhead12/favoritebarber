/**
 * Next.js config
 * Adds allowedDevOrigins to allow LAN dev access (e.g., 192.168.x.x)
 */
const defaultOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://192.168.1.233:3000',
];

const envOrigins = process.env.ALLOWED_DEV_ORIGINS
  ? process.env.ALLOWED_DEV_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: [...new Set([...defaultOrigins, ...envOrigins])],
  },
  // During local development, proxy `/api/*` requests to the backend server
  // so client-side code can call `/api/...` without CORS/host issues.
  async rewrites() {
    const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiHost}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

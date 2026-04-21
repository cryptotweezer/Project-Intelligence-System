/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30, // Next.js 14.2+ defaults to 0 — restore 30s router cache
    },
  },
  allowedDevOrigins: ["192.168.8.111"],
};

export default nextConfig;

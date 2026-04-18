/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
  allowedDevOrigins: ["192.168.8.111"],
};

export default nextConfig;

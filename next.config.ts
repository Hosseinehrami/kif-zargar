import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.100.88",
    "localhost",
    "127.0.0.1",
    "wide-melons-swim.loca.lt",
    "gold-poems-wear.loca.lt", // 👈 دامنه فعلی لینک تونل رو اینجا اضافه کنید
  ],
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
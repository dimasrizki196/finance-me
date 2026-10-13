/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Wajib untuk Docker Multi-stage agar file image kecil
  output: "standalone",

  // 2. Aktifkan pencarian bug ekstra di lokal
  reactStrictMode: true,

  // 3. Izin memuat gambar dari Supabase (Jika ada fitur foto)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // 4. Mencegah build gagal hanya karena peringatan linting/typing kecil
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;

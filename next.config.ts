import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // компактная сборка для Docker/своего сервера (минимальный standalone-сервер)
  output: 'standalone',
  images: {
    // разрешаем загрузку фото по любой внешней https-ссылке
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
};

export default nextConfig;

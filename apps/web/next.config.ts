import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@prayerflow/db', '@prayerflow/shared'],
};

export default nextConfig;

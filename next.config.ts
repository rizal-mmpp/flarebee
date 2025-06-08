
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '157.245.58.91',
        port: '8080',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'erpnext.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'flarebee.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ptrio.j.erpnext.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

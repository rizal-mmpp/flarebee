
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_ERPNEXT_API_URL}/api/:path*`,
      },
    ];
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
        hostname: 'rio-assets.com', // Updated from flarebee.com
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ptrio.j.erpnext.com',
        port: '',
        pathname: '/**',
      },
      // Add Vercel Blob storage hostname if not covered by a wildcard
      // Vercel Blob URLs typically look like: <random_string>.<random_string>.blob.storage.vercel-infra.com
      // Using a more generic pattern might be necessary if the subdomain parts vary widely.
      // Or, if your Blob store has a consistent prefix, use that.
      // For example, if all your blobs are under `public.blob.vercel-storage.com` (this is an example, check your actual blob URLs)
      // {
      //   protocol: 'https',
      //   hostname: 'public.blob.vercel-storage.com',
      //   port: '',
      //   pathname: '/**',
      // },
      // A more general Vercel Blob pattern (use with caution if too broad)
      {
        protocol: 'https',
        hostname: '*.blob.vercel-storage.com', // Covers typical Vercel Blob URLs
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com', // More specific for public access from Blob
        port: '',
        pathname: '/**',
      }
    ],
  },
  serverActions: {
    bodySizeLimit: '5mb', // Increased limit for file uploads
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent 'fs' module from being bundled on the client
      config.resolve.fallback = {
        ...config.resolve.fallback, // Ensure we don't overwrite other fallbacks
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;

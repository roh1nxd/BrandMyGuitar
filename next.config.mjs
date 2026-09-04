/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@paypal/react-paypal-js', '@react-three/drei'],
  },
  transpilePackages: ['three'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

export default nextConfig;

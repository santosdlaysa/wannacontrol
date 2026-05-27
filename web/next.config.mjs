/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3333/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:3333/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;

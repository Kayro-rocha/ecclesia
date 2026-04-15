import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['72.61.222.154'],
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/sw.js',        destination: '/api/sw' },
        { source: '/icon-192.png', destination: '/api/icon/192' },
        { source: '/icon-512.png', destination: '/api/icon/512' },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
}

export default nextConfig
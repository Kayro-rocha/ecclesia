import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['72.61.222.154'],
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/sw.js',              destination: '/api/sw' },
        { source: '/icon-192.png',       destination: '/api/icon/192' },
        { source: '/icon-512.png',       destination: '/api/icon/512' },
        { source: '/uploads/:path*',     destination: '/api/uploads/:path*' },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
}

export default withSentryConfig(nextConfig, {
  org: 'softnex-ef',
  project: 'javascript-nextjs',
  silent: true,
  widenClientFileUpload: true,
  sourcemaps: { disable: true },
  disableLogger: true,
  automaticVercelMonitors: false,
})

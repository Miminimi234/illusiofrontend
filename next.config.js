/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws'
  },
  // Force rebuild to clear cache
  generateBuildId: async () => {
    return 'build-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
  },
  // Properly handle static assets and prevent Next.js from treating media files as pages
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Ensure static assets are properly served
  assetPrefix: '',
  trailingSlash: false,
  // Configure static file handling
  staticPageGenerationTimeout: 60,
  // Proxy admin requests to Railway server
  async rewrites() {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';
    
    return [
      {
        source: '/admin',
        destination: 'http://localhost:8080/admin-dashboard'
      },
      {
        source: '/admin/:path*',
        destination: 'http://localhost:8080/admin-dashboard/:path*'
      },
      {
        source: '/api/admin/:path*',
        destination: 'http://localhost:8080/api/admin/:path*'
      }
    ]
  },
  // CSP headers - relaxed for admin route
  async headers() {
    return [
      {
        source: '/admin',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
              "script-src-attr 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "connect-src 'self' https: wss:",
              "font-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'"
            ].join('; ')
          }
        ]
      }
    ]
  },
  experimental: {
    esmExternals: 'loose'
  },
  // Optimize bundle splitting for mobile route
  webpack: (config, { isServer }) => {
    // Handle static assets properly
    config.module.rules.push({
      test: /\.(webm|mp4|gif|png|jpe?g|svg)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[name].[hash][ext]'
      }
    });

    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Separate mobile route chunks
          mobile: {
            test: /[\\/]app[\\/]mobile[\\/]/,
            name: 'mobile',
            chunks: 'all',
            priority: 20,
          },
          // Keep desktop chunks separate
          desktop: {
            test: /[\\/]app[\\/](?!mobile)[\\/]/,
            name: 'desktop',
            chunks: 'all',
            priority: 10,
          },
        },
      }
    }
    return config
  },
}

module.exports = nextConfig

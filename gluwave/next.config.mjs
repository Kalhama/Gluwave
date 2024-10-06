/** @type {import('next').NextConfig} */
import('./src/config.mjs')

const nextConfig = {
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      config.externals.push({ 'nodejs-polars': 'commonjs nodejs-polars' })
    }
    return config
  },
}

export default nextConfig

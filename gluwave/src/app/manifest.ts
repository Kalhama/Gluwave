import { MetadataRoute } from 'next'

import { metadata } from './layout'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: metadata.title,
    short_name: metadata.title,
    description: metadata.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#fff', // bg-slate-200
    theme_color: '#e2e8f0',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/apple-icon.png',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}

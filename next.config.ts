import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const mediaBaseURL = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || process.env.MEDIA_BASE_URL
const customMediaPattern = (() => {
  if (!mediaBaseURL) return null

  try {
    const parsed = new URL(mediaBaseURL)
    return {
      protocol: parsed.protocol.replace(':', '') as 'http' | 'https',
      hostname: parsed.hostname,
    }
  } catch {
    return null
  }
})()

const nextConfig: NextConfig = {
  typescript: {
    tsconfigPath: './tsconfig.next.json',
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: 'https', hostname: '*.vercel.app' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      ...(customMediaPattern ? [customMediaPattern] : []),
    ],
  },
}

export default withPayload(nextConfig)

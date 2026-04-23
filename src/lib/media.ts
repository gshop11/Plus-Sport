type MediaLike = Record<string, unknown> & {
  url?: string | null
  filename?: string | null
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const getMediaBaseURL = () => {
  const explicitBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || process.env.MEDIA_BASE_URL
  return explicitBase ? trimTrailingSlash(explicitBase.trim()) : null
}

export const resolveMediaURL = (media?: MediaLike | null): string | null => {
  if (!media || typeof media !== 'object') return null

  const rawURL = typeof media.url === 'string' ? media.url.trim() : ''
  if (rawURL) {
    if (rawURL.startsWith('http://') || rawURL.startsWith('https://') || rawURL.startsWith('/')) {
      return rawURL
    }

    return `/${rawURL.replace(/^\/+/, '')}`
  }

  const filename = typeof media.filename === 'string' ? media.filename.trim() : ''
  if (!filename) return null

  const mediaBaseURL = getMediaBaseURL()
  if (mediaBaseURL) {
    return `${mediaBaseURL}/${filename.replace(/^\/+/, '')}`
  }

  return `/media/${filename}`
}

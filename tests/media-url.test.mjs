import assert from 'node:assert/strict'

const { resolveMediaURL } = await import('../src/lib/media.ts')

const originalPublicBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL
const originalServerBase = process.env.MEDIA_BASE_URL

const resetMediaEnv = () => {
  if (originalPublicBase === undefined) {
    delete process.env.NEXT_PUBLIC_MEDIA_BASE_URL
  } else {
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL = originalPublicBase
  }

  if (originalServerBase === undefined) {
    delete process.env.MEDIA_BASE_URL
  } else {
    process.env.MEDIA_BASE_URL = originalServerBase
  }
}

try {
  delete process.env.NEXT_PUBLIC_MEDIA_BASE_URL
  delete process.env.MEDIA_BASE_URL

  assert.equal(resolveMediaURL(null), null)
  assert.equal(resolveMediaURL(undefined), null)
  assert.equal(resolveMediaURL({}), null)

  assert.equal(
    resolveMediaURL({ url: '/api/media/file/producto.webp', filename: 'producto.webp' }),
    '/api/media/file/producto.webp',
  )

  assert.equal(
    resolveMediaURL({ url: '/api/media/file/producto.webp?v=123', filename: 'producto.webp' }),
    '/api/media/file/producto.webp?v=123',
  )

  assert.equal(
    resolveMediaURL({ url: 'https://example.public.blob.vercel-storage.com/producto.webp' }),
    'https://example.public.blob.vercel-storage.com/producto.webp',
  )

  assert.equal(
    resolveMediaURL({ url: 'https://example.vercel.app/api/media/file/producto.webp' }),
    'https://example.vercel.app/api/media/file/producto.webp',
  )

  assert.equal(resolveMediaURL({ url: '/uploads/producto.webp' }), '/uploads/producto.webp')
  assert.equal(resolveMediaURL({ url: 'uploads/producto.webp' }), '/uploads/producto.webp')

  assert.equal(
    resolveMediaURL({ url: '/api/media/file/joma-p05-joma-touw2528in.webp', filename: 'joma-p05-joma-touw2528in.webp' }),
    '/api/media/file/joma-p05-joma-touw2528in.webp',
  )

  assert.notEqual(
    resolveMediaURL({ url: '/api/media/file/joma-p05-joma-touw2528in.webp', filename: 'joma-p05-joma-touw2528in.webp' }),
    '/media/joma-p05-joma-touw2528in.webp',
  )

  process.env.NEXT_PUBLIC_MEDIA_BASE_URL = 'https://cdn.example.com/media/'
  assert.equal(
    resolveMediaURL({ url: '/api/media/file/producto.webp?v=123', filename: 'producto.webp' }),
    'https://cdn.example.com/media/producto.webp?v=123',
  )

  delete process.env.NEXT_PUBLIC_MEDIA_BASE_URL
  process.env.MEDIA_BASE_URL = 'https://files.example.com/assets'
  assert.equal(resolveMediaURL({ filename: 'producto.webp' }), 'https://files.example.com/assets/producto.webp')

  delete process.env.MEDIA_BASE_URL
  assert.equal(resolveMediaURL({ filename: 'producto.webp' }), '/media/producto.webp')

  console.log('media url tests passed')
} finally {
  resetMediaEnv()
}

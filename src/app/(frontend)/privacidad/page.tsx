import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Politica de privacidad | Plus Sport',
  robots: { index: false },
}

export default function PrivacidadPage() {
  return <LegalPage titulo="Politica de privacidad" field="politicaPrivacidad" />
}

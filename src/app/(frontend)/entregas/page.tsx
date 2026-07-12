import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Politica de entregas | Plus Sport',
  robots: { index: false },
}

export default function EntregasPage() {
  return <LegalPage titulo="Politica de entregas" field="politicaEntregas" />
}

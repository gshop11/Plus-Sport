import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Terminos y condiciones | Plus Sport',
  robots: { index: false },
}

export default function TerminosPage() {
  return <LegalPage titulo="Terminos y condiciones" field="terminosCondiciones" />
}

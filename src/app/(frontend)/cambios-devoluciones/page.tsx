import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Cambios y devoluciones | Plus Sport',
  robots: { index: false },
}

export default function CambiosDevolucionesPage() {
  return <LegalPage titulo="Cambios y devoluciones" field="politicaCambios" />
}

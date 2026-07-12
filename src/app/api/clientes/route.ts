import { NextResponse } from 'next/server'

// Deprecado: la creacion de clientes ocurre dentro de POST /api/checkout/ordenes
// (servidor). Mantener un endpoint publico de creacion arbitraria de clientes
// era un vector de spam y de datos basura en el CRM.
export async function POST() {
  return NextResponse.json(
    { error: 'Endpoint deprecado. El cliente se registra al crear el pedido.' },
    { status: 410 },
  )
}

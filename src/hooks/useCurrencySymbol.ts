'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_CURRENCY_SYMBOL } from '@/lib/money'

let currencySymbolCache: string | null = null
let currencyPromise: Promise<string> | null = null

const fetchCurrencySymbol = async () => {
  if (currencySymbolCache) return currencySymbolCache

  if (!currencyPromise) {
    currencyPromise = fetch('/api/storefront-config', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const symbol = typeof data?.moneda?.simbolo === 'string' && data.moneda.simbolo.trim()
          ? data.moneda.simbolo.trim()
          : DEFAULT_CURRENCY_SYMBOL
        currencySymbolCache = symbol
        return symbol
      })
      .catch(() => DEFAULT_CURRENCY_SYMBOL)
      .finally(() => {
        currencyPromise = null
      })
  }

  return currencyPromise
}

export const useCurrencySymbol = () => {
  const [currencySymbol, setCurrencySymbol] = useState(currencySymbolCache ?? DEFAULT_CURRENCY_SYMBOL)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const symbol = await fetchCurrencySymbol()
      if (!cancelled) setCurrencySymbol(symbol)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  return currencySymbol
}


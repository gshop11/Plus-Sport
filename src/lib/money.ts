export const DEFAULT_CURRENCY_SYMBOL = 'S/'

export const formatMoney = (value: number, symbol: string = DEFAULT_CURRENCY_SYMBOL) => {
  const parsed = Number.isFinite(value) ? value : Number(value || 0)
  const amount = Number.isFinite(parsed) ? parsed : 0
  return `${symbol} ${amount.toFixed(2)}`
}


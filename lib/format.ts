export function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatAge(months: number) {
  return months === 1 ? "1 month old" : `${months} months old`;
}
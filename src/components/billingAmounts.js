export function calculateBillingValues(values, title) {
  const next = [...values];
  const offset = title === '계약정보' || title === '임차인추가' ? 11 : 0;
  const amount = (index) => Number(next[offset + index] || 0);
  next[offset + 2] = Math.round(amount(0) * 0.1) + Math.round(amount(1) * 0.1);
  next[offset + 5] = Math.round(amount(4) * 0.1);
  return {
    values: next,
    vat: next[offset + 2],
    total: Array.from({ length: 6 }, (_, i) => amount(i)).reduce((sum, value) => sum + value, 0),
  };
}

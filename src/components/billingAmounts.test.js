import { calculateBillingValues } from './billingAmounts';
test.each(['수납하기', '청구서생성'])('%s recalculates displayed and saved VAT together', (title) => {
  const input = [1410000, 560000, 188000, 30000, 0, 0, '메모'];
  const result = calculateBillingValues(input, title);
  expect(result.vat).toBe(197000);
  expect(result.values[2]).toBe(result.vat);
  expect(result.total).toBe(2197000);
  expect(input[2]).toBe(188000);
});
test.each(['계약정보', '임차인추가'])('%s uses contract amount fields without modifying identity', (title) => {
  const input = [...Array(11).fill('정보'), 1410000, 560000, 188000, 30000, 10000, 0];
  const result = calculateBillingValues(input, title);
  expect(result.values[13]).toBe(197000);
  expect(result.values[16]).toBe(1000);
  expect(result.total).toBe(2208000);
  expect(result.values[0]).toBe('정보');
});
test('rounds each item VAT consistently with invoice validation', () => {
  expect(calculateBillingValues([15,15,0,0,0,0], '수납하기').vat).toBe(4);
});

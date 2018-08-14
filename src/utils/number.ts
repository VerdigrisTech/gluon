export function toFixed(value: number, precision: number) {
  const pwr = Math.pow(10, precision || 0);
  return `${Math.round(value * pwr) / pwr}`;
};

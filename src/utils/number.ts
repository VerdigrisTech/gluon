export function toFixed(value: number, precision: number = 0) {
  const pwr = Math.pow(10, precision);
  return `${Math.round(value * pwr) / pwr}`;
};

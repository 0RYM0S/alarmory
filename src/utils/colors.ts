// Append a 2-digit hex alpha suffix to a hex color string.
// e.g. alpha('#A8A4FF', '80') → '#A8A4FF80'
export function alpha(hex: string, amount: string): string {
  return `${hex}${amount}`;
}

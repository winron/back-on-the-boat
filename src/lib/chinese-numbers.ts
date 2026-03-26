/**
 * Convert an integer (0–9999) to Chinese numeral characters.
 * e.g. 0 → "零", 3 → "三", 12 → "十二", 105 → "一百零五"
 */
const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

export function toChineseNumber(n: number): string {
  if (n < 0 || n > 9999 || !Number.isInteger(n)) return String(n);
  if (n === 0) return "零";

  let result = "";

  const thousands = Math.floor(n / 1000);
  const hundreds = Math.floor((n % 1000) / 100);
  const tens = Math.floor((n % 100) / 10);
  const ones = n % 10;

  if (thousands > 0) {
    result += digits[thousands] + "千";
    if (hundreds === 0 && (tens > 0 || ones > 0)) result += "零";
  }

  if (hundreds > 0) {
    result += digits[hundreds] + "百";
    if (tens === 0 && ones > 0) result += "零";
  }

  if (tens > 0) {
    // Omit 一 before 十 for numbers 10–19
    if (tens === 1 && thousands === 0 && hundreds === 0) {
      result += "十";
    } else {
      result += digits[tens] + "十";
    }
  }

  if (ones > 0) {
    result += digits[ones];
  }

  return result;
}

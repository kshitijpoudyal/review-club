const stripSeparators = (value: string) => value.replace(/[-.]/g, '').toLowerCase();

/** Case-insensitive order number match that ignores '-' and '.' on both sides. */
export function orderNumberMatches(orderNumber: string | undefined, query: string): boolean {
  if (!orderNumber) return false;
  const needle = stripSeparators(query.trim());
  return needle !== '' && stripSeparators(orderNumber).includes(needle);
}

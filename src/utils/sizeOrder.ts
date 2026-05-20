const CANONICAL_ORDER = ['XS', 'S', 'M', 'L', 'XM', 'XL'];

function rank(name: string): number {
  const idx = CANONICAL_ORDER.indexOf(name.trim().toUpperCase());
  return idx === -1 ? CANONICAL_ORDER.length : idx;
}

export function compareSizeNames(a: string, b: string): number {
  const ra = rank(a);
  const rb = rank(b);
  if (ra !== rb) return ra - rb;
  return a.localeCompare(b, 'es', { sensitivity: 'base' });
}

export function sortBySize<T>(items: T[], getName: (item: T) => string): T[] {
  const copy: T[] = [...items];
  copy.sort((a, b) => compareSizeNames(getName(a), getName(b)));
  return copy;
}

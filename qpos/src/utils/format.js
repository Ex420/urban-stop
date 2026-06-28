export const fmt = (n) => `$${Number(n).toFixed(2)}`;
export const fmtShort = (n) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : fmt(n));

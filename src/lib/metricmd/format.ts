export function fmtINR(n: number) {
  const sign = n < 0 ? "\u2212" : "+";
  return `${sign}${Math.abs(Math.round(n)).toLocaleString("en-IN")} INR`;
}

export function fmtPct(n: number) {
  const sign = n < 0 ? "\u2212" : "+";
  return `${sign}${Math.abs(n).toFixed(1)}%`;
}

export function fmtSigned(n: number, digits = 2) {
  const sign = n < 0 ? "\u2212" : "";
  return `${sign}${Math.abs(n).toFixed(digits)}`;
}

export function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function titleize(s: string) {
  return s.replace(/_/g, " ");
}

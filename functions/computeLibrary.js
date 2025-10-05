// Deterministic math helpers for Toast-style exports.
// Paste content into n8n Function nodes or require() if you run a helper service.

function toNum(x) {
  if (x === null || x === undefined) return 0;
  if (typeof x === 'number') return isFinite(x) ? x : 0;
  const s = String(x).replace(/[,\s]/g, '');
  const n = Number(s);
  return isFinite(n) ? n : 0;
}

function safePctChange(a, b) {
  if (a === 0 && b === 0) return 0;
  if (a === 0 && b !== 0) return null; // narrator handles phrasing
  return (b - a) / a;
}

function pickNetSalesKey(headers) {
  const H = headers.map(h => String(h).toLowerCase());
  const idx = (name) => H.indexOf(name.toLowerCase());
  const candidates = ["net sales","net amount","net sales ($)","netsales","net_amount"];
  for (const c of candidates) {
    const i = idx(c);
    if (i !== -1) return headers[i];
  }
  // Fallback handled by caller (e.g., compute Gross - Discount if present)
  return null;
}

function sumBy(rows, key, whereFn) {
  let s = 0;
  for (const r of rows) if (!whereFn || whereFn(r)) s += toNum(r[key]);
  return s;
}

function groupBy(rows, keys) {
  const map = new Map();
  for (const r of rows) {
    const k = keys.map(k0 => String(r[k0])).join("§");
    if (!map.has(k)) map.set(k, { __key: k, __rows: [] });
    map.get(k).__rows.push(r);
  }
  return map;
}

function groupBySum(rows, keys, measure) {
  const g = groupBy(rows, keys);
  const out = [];
  for (const [k, obj] of g.entries()) {
    const v = sumBy(obj.__rows, measure);
    const rec = { value: v };
    keys.forEach(kk => { rec[kk] = obj.__rows[0][kk]; });
    out.push(rec);
  }
  return out;
}

function topNByMeasure(groupedRows, measure, n=10) {
  return groupedRows
    .map(r => ({...r, _val: toNum(r[measure] ?? r.value)}))
    .sort((a,b) => b._val - a._val)
    .slice(0, n);
}

function unitPrice(row, amountKey, qtyKey) {
  const amt = toNum(row[amountKey]);
  const qty = toNum(row[qtyKey]);
  if (qty === 0) return null;
  return amt / qty;
}

function weekOfMonth(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const offset = Math.floor((d.getDate() + first.getDay() - 1) / 7) + 1;
  return offset; // 1..5
}

// ---- Calculations ----

function calcNetChange(rowsA, rowsB, measureKey) {
  const a = sumBy(rowsA, measureKey);
  const b = sumBy(rowsB, measureKey);
  return { a, b, deltaAbs: b - a, deltaPct: safePctChange(a, b) };
}

function calcTrueProfitChange(rowsA, rowsB, netSalesKey, cogsKey) {
  const a = sumBy(rowsA, netSalesKey) - sumBy(rowsA, cogsKey);
  const b = sumBy(rowsB, netSalesKey) - sumBy(rowsB, cogsKey);
  return { a, b, deltaAbs: b - a, deltaPct: safePctChange(a, b) };
}

function latestHeaders(rows) {
  return rows && rows.length ? Object.keys(rows[0]) : [];
}

module.exports = {
  toNum,
  safePctChange,
  pickNetSalesKey,
  sumBy,
  groupBy,
  groupBySum,
  topNByMeasure,
  unitPrice,
  weekOfMonth,
  calcNetChange,
  calcTrueProfitChange,
  latestHeaders
};

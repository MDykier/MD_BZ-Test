// Score candidate sheets and decide whether to proceed or ask the user for guidance.

function synonym(s) {
  const m = {
    "net sales":"net amount",
    "item":"menu item",
    "payment type":"tender",
    "revenue center":"rev ctr",
    "guests":"covers"
  };
  return m[s] || s;
}

function scoreSheet(sheetMeta, plan) {
  const reqDims = new Set((plan.required_dimensions || []).map(x => x.toLowerCase()));
  const reqMeas = new Set((plan.required_measures || []).map(x => x.toLowerCase()));

  const cols = new Set((sheetMeta.columns || []).map(x => String(x).toLowerCase()));
  const meas = new Set((sheetMeta.measures || []).map(x => String(x).toLowerCase()));

  // Column coverage
  let covered = 0;
  for (const d of reqDims) if (cols.has(d) || cols.has(synonym(d))) covered++;
  const dimCoverage = reqDims.size ? covered / reqDims.size : 1;

  // Measure coverage
  let mcovered = 0;
  for (const m of reqMeas) {
    if (meas.has(m) || meas.has(synonym(m)) || cols.has(m) || cols.has(synonym(m))) mcovered++;
  }
  const measCoverage = reqMeas.size ? mcovered / reqMeas.size : 1;

  const column_coverage = 0.5*dimCoverage + 0.5*measCoverage;

  // Month/Year match
  let month_year_match = 0;
  const need = (plan.need_files_for || []);
  const match = need.find(n => Number(n.month) === Number(sheetMeta.month) && Number(n.year) === Number(sheetMeta.year));
  if (match) month_year_match = 1;
  else if (need.find(n => Number(n.year) === Number(sheetMeta.year))) month_year_match = 0.6;
  else if (need.find(n => Number(n.month) === Number(sheetMeta.month))) month_year_match = 0.4;

  // Row sufficiency
  const rows = Number(sheetMeta.rowCount || sheetMeta.rows || 0);
  const row_sufficiency = rows >= 200 ? 1 : (rows >= 50 ? 0.7 : 0.3);

  // Grain compatibility
  const pref = (plan.preferred_grain || '').toLowerCase();
  const g = String(sheetMeta.grain || '').toLowerCase();
  let grain_compatibility = 0.7; // default convertible by aggregation
  if (!pref || !g) grain_compatibility = 0.7;
  else if (pref === g) grain_compatibility = 1;
  else if ( (g === 'line_item' && ['item','category','payment','revenue_center','dining_option','daily','weekly'].includes(pref)) ||
            (g === 'daily' && ['weekly','category','payment','revenue_center','dining_option'].includes(pref)) ) {
    grain_compatibility = 0.7;
  } else grain_compatibility = 0.2;

  const confidence = 0.4*column_coverage + 0.2*month_year_match + 0.2*row_sufficiency + 0.2*grain_compatibility;
  return { confidence, column_coverage, month_year_match, row_sufficiency, grain_compatibility };
}

function selectSheets(candidates, plan, threshold=0.70, maxPerMonth=2) {
  // Group by month-year and pick top scoring sheets
  const groups = new Map();
  for (const c of candidates) {
    const key = `${c.year}-${c.month}`;
    const sc = scoreSheet(c, plan);
    const row = { meta: c, score: sc };
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const selection = [];
  const gaps = [];
  const needed = plan.need_files_for || [];
  for (const need of needed) {
    const key = `${need.year}-${need.month}`;
    const arr = (groups.get(key) || []).sort((a,b) => b.score.confidence - a.score.confidence);
    const top = arr.filter(x => x.score.confidence >= threshold).slice(0, maxPerMonth);
    if (top.length) {
      selection.push({ need, chosen: top.map(t => t.meta), diagnostics: top.map(t => t.score) });
    } else {
      const suggestions = arr.slice(0, 5).map(t => ({ name: t.meta.name || t.meta.sheetName, link: t.meta.webViewLink, path: t.meta.path, confidence: t.score.confidence }));
      gaps.push({ need, suggestions });
    }
  }
  return { selection, gaps };
}

module.exports = { scoreSheet, selectSheets, synonym };

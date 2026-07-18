// Veridian Markets — real "financials as reported" (Finnhub, via vm-financials Lambda).
//
// vm-financials returns the last few SEC filings as { filings:[ { year, quarter,
// form, endDate, report:{ bs, ic, cf } } ] }, each section an array of
// { concept, label, unit, value } in RAW USD. This module turns that into the
// exact shape the Financials tab already renders/exports:
//
//   { periods:[newest…oldest], income:[row], balance:[row], cashflow:[row] }
//   row = { k:label, v:[per-period values], b:bold?, in:indent?, fmt?:'eps' }
//   values are USD **millions** (÷1e6), except EPS rows which stay raw.
//
// We match line items by us-gaap *concept* (stable across filings & companies),
// not by the company's own label — so the curated rows line up period-to-period.
// Anything we can't map is simply omitted; if nothing maps, the caller keeps the
// mock. US equities only (same gate as quotes). See marketdataapi.md.

const VM_FIN = { url: 'https://wl2bky7qhfeoyzhiuv2bmyw6qq0mvmvj.lambda-url.us-east-1.on.aws/' };
const _vmFinCache = {};
const VM_FIN_TTL = 6 * 60 * 60 * 1000;   // client cache 6h (filings are quarterly)

// ── concept → curated row maps (first matching concept in a filing wins) ─────
// Concepts are stored as e.g. "us-gaap_NetIncomeLoss"; we key on the part after
// the first underscore ("NetIncomeLoss"), so any taxonomy prefix works.
const IC_MAP = [
  { k:'Total revenue',        b:false,      c:['RevenueFromContractWithCustomerExcludingAssessedTax','RevenueFromContractWithCustomerIncludingAssessedTax','Revenues','SalesRevenueNet'] },
  { k:'Cost of revenue',      in:1,         c:['CostOfGoodsAndServicesSold','CostOfRevenue','CostOfGoodsSold'] },
  { k:'Gross profit',         b:true,       c:['GrossProfit'] },
  { k:'Research & development',in:1,        c:['ResearchAndDevelopmentExpense'] },
  { k:'Selling, general & admin',in:1,      c:['SellingGeneralAndAdministrativeExpense','GeneralAndAdministrativeExpense'] },
  { k:'Total operating expenses',in:1,      c:['OperatingExpenses','CostsAndExpenses'] },
  { k:'Operating income',     b:true,       c:['OperatingIncomeLoss'] },
  { k:'Pre-tax income',       b:false,      c:['IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest','IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments'] },
  { k:'Tax provision',        in:1,         c:['IncomeTaxExpenseBenefit'] },
  { k:'Net income',           b:true,       c:['NetIncomeLoss','ProfitLoss'] },
  { k:'EPS basic',            fmt:'eps',    c:['EarningsPerShareBasic'] },
  { k:'EPS diluted',          fmt:'eps',    c:['EarningsPerShareDiluted'] },
];
// Ordered like Yahoo Finance: Assets → Liabilities → Equity, each subtotal with
// its components indented beneath it. b=bold subtotal, in=indent depth.
const BS_MAP = [
  // ── Assets ─────────────────────────────────────────────────────────────────
  { k:'Total assets',                 b:true,        c:['Assets'] },
  { k:'Total current assets',         b:true, in:1,  c:['AssetsCurrent'] },
  { k:'Cash & equivalents',           in:2,          c:['CashAndCashEquivalentsAtCarryingValue'] },
  { k:'Short-term investments',       in:2,          c:['MarketableSecuritiesCurrent','ShortTermInvestments'] },
  { k:'Accounts receivable',          in:2,          c:['AccountsReceivableNetCurrent'] },
  { k:'Inventories',                  in:2,          c:['InventoryNet'] },
  { k:'Other current assets',         in:2,          c:['OtherAssetsCurrent'] },
  { k:'Total non-current assets',     b:true, in:1,  c:['AssetsNoncurrent'] },
  { k:'Property, plant & equipment',  in:2,          c:['PropertyPlantAndEquipmentNet'] },
  { k:'Goodwill',                     in:2,          c:['Goodwill'] },
  { k:'Intangible assets',            in:2,          c:['IntangibleAssetsNetExcludingGoodwill','FiniteLivedIntangibleAssetsNet'] },
  { k:'Long-term investments',        in:2,          c:['MarketableSecuritiesNoncurrent','LongTermInvestments'] },
  { k:'Other non-current assets',     in:2,          c:['OtherAssetsNoncurrent'] },
  // ── Liabilities ────────────────────────────────────────────────────────────
  { k:'Total liabilities',            b:true,        c:['Liabilities'] },
  { k:'Total current liabilities',    b:true, in:1,  c:['LiabilitiesCurrent'] },
  { k:'Accounts payable',             in:2,          c:['AccountsPayableCurrent'] },
  { k:'Current debt',                 in:2,          c:['LongTermDebtCurrent','DebtCurrent','CommercialPaper'] },
  { k:'Deferred revenue',             in:2,          c:['ContractWithCustomerLiabilityCurrent','DeferredRevenueCurrent'] },
  { k:'Other current liabilities',    in:2,          c:['OtherLiabilitiesCurrent'] },
  { k:'Total non-current liabilities',b:true, in:1,  c:['LiabilitiesNoncurrent'] },
  { k:'Long-term debt',               in:2,          c:['LongTermDebtNoncurrent','LongTermDebt'] },
  { k:'Other non-current liabilities',in:2,          c:['OtherLiabilitiesNoncurrent'] },
  // ── Equity ─────────────────────────────────────────────────────────────────
  { k:'Total equity',                 b:true,        c:['StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest','StockholdersEquity'] },
  { k:"Stockholders' equity",         in:1,          c:['StockholdersEquity'] },
  { k:'Common stock & paid-in capital',in:1,         c:['CommonStocksIncludingAdditionalPaidInCapital','AdditionalPaidInCapitalCommonStock','CommonStockValue'] },
  { k:'Retained earnings',            in:1,          c:['RetainedEarningsAccumulatedDeficit'] },
  { k:'Minority interest',            in:1,          c:['MinorityInterest'] },
  // ── Shares ─────────────────────────────────────────────────────────────────
  { k:'Shares issued',                fmt:'shares',  c:['CommonStockSharesIssued'] },
  { k:'Shares outstanding',           fmt:'shares',  c:['CommonStockSharesOutstanding','EntityCommonStockSharesOutstanding'] },
];
const CF_MAP = [
  { k:'Operating cash flow',  b:true,       c:['NetCashProvidedByUsedInOperatingActivities','NetCashProvidedByUsedInOperatingActivitiesContinuingOperations'] },
  { k:'Depreciation & amortization',in:1,   c:['DepreciationDepletionAndAmortization','DepreciationAmortizationAndAccretionNet'] },
  { k:'Capital expenditure',  in:1,         c:['PaymentsToAcquirePropertyPlantAndEquipment','PaymentsToAcquireProductiveAssets'] },
  { k:'Investing activities', in:1,         c:['NetCashProvidedByUsedInInvestingActivities','NetCashProvidedByUsedInInvestingActivitiesContinuingOperations'] },
  { k:'Financing activities', in:1,         c:['NetCashProvidedByUsedInFinancingActivities','NetCashProvidedByUsedInFinancingActivitiesContinuingOperations'] },
  { k:'Dividends paid',       in:1,         c:['PaymentsOfDividendsCommonStock','PaymentsOfDividends'] },
  { k:'Share repurchases',    in:1,         c:['PaymentsForRepurchaseOfCommonStock'] },
];

const _fmKey = (concept) => { const s = String(concept || ''); const i = s.indexOf('_'); return i < 0 ? s : s.slice(i + 1); };

// One filing's report section → { conceptKey: value } (first occurrence wins,
// so segment/duplicate rows below the main line don't clobber the total).
function _indexSection(arr) {
  const m = {};
  (arr || []).forEach((r) => { const k = _fmKey(r.concept); if (m[k] === undefined && r.value != null) m[k] = r.value; });
  return m;
}

// Build one statement's rows from a map + the per-period indexed sections.
function _buildStatement(map, indexed) {
  return map.map((row) => {
    const v = indexed.map((idx) => {
      for (const cand of row.c) { if (idx[cand] !== undefined) return row.fmt === 'eps' ? idx[cand] : Math.round(idx[cand] / 1e6); }
      return null;
    });
    return v.some((x) => x != null) ? { k: row.k, v, b: !!row.b, in: row.in, fmt: row.fmt } : null;
  }).filter(Boolean);
}

// Raw vm-financials payload → { periods, income, balance, cashflow } or null.
function vmBuildStatements(payload) {
  const filings = (payload && payload.filings) || [];
  if (!filings.length) return null;
  const periods = filings.map((f) => f.quarter ? `${f.year} Q${f.quarter}` : `FY${f.year}`);
  const icx = filings.map((f) => _indexSection(f.report && f.report.ic));
  const bsx = filings.map((f) => _indexSection(f.report && f.report.bs));
  const cfx = filings.map((f) => _indexSection(f.report && f.report.cf));
  const income   = _buildStatement(IC_MAP, icx);
  const balance  = _buildStatement(BS_MAP, bsx);
  const cashflow = _buildStatement(CF_MAP, cfx);
  if (!income.length && !balance.length && !cashflow.length) return null;
  return { periods, income, balance, cashflow, asReported: true, filedDate: filings[0] && filings[0].filedDate };
}

// Quarterly view with Q4 filled from the annual 10-K (US companies file 10-Qs
// for Q1–Q3 only; Q4/year-end lives in the 10-K):
//   balance sheet Q4 = the annual year-end snapshot (as filed)
//   income / cash-flow Q4 = annual − (Q1 + Q2 + Q3)  (derived flow)
function vmBuildQuarterly(qPayload, aPayload) {
  const qFilings = (qPayload && qPayload.filings) || [];
  if (!qFilings.length) return null;
  const aFilings = (aPayload && aPayload.filings) || [];

  const byYear = {};   // year → { quarter: { ic, bs, cf } } — for deriving Q4
  const entries = [];  // { label, sort, ic, bs, cf }
  qFilings.forEach((f) => {
    const sec = { ic: _indexSection(f.report && f.report.ic), bs: _indexSection(f.report && f.report.bs), cf: _indexSection(f.report && f.report.cf) };
    entries.push({ label: `${f.year} Q${f.quarter}`, sort: new Date(f.endDate || 0).getTime(), ...sec });
    (byYear[f.year] ||= {})[f.quarter] = sec;
  });
  aFilings.forEach((f) => {
    const ann = { ic: _indexSection(f.report && f.report.ic), bs: _indexSection(f.report && f.report.bs), cf: _indexSection(f.report && f.report.cf) };
    entries.push({
      label: `${f.year} Q4`, sort: new Date(f.endDate || 0).getTime(),
      bs: ann.bs,                                    // year-end snapshot = Q4
      ic: _deriveQ4(ann.ic, byYear[f.year], 'ic'),   // annual − Q1−Q2−Q3
      cf: _deriveQ4(ann.cf, byYear[f.year], 'cf'),
    });
  });

  entries.sort((a, b) => b.sort - a.sort);
  const kept = entries.slice(0, 12);
  const periods  = kept.map((e) => e.label);
  const income   = _buildStatement(IC_MAP, kept.map((e) => e.ic));
  const balance  = _buildStatement(BS_MAP, kept.map((e) => e.bs));
  const cashflow = _buildStatement(CF_MAP, kept.map((e) => e.cf));
  if (!income.length && !balance.length && !cashflow.length) return null;
  return { periods, income, balance, cashflow, asReported: true, filedDate: qFilings[0] && qFilings[0].filedDate };
}

// Q4 flow = annual − (Q1+Q2+Q3) per concept; {} if the three quarters aren't all present.
function _deriveQ4(annual, q, kind) {
  if (!q || !q[1] || !q[2] || !q[3]) return {};
  const out = {};
  for (const c in annual) {
    const q1 = q[1][kind][c], q2 = q[2][kind][c], q3 = q[3][kind][c];
    if (q1 == null || q2 == null || q3 == null) continue;
    out[c] = annual[c] - q1 - q2 - q3;
  }
  return out;
}

// Fetch raw filings for a symbol (client-cached). freq: 'annual' | 'quarterly'.
async function vmFinancials(symbol, freq) {
  const sym = String(symbol || '').toUpperCase();
  const fr  = freq === 'quarterly' ? 'quarterly' : 'annual';
  const key = `${sym}#${fr}`;
  const hit = _vmFinCache[key];
  if (hit && (Date.now() - hit.t) < VM_FIN_TTL) return hit.data;
  try {
    const res  = await fetch(`${VM_FIN.url}?symbol=${encodeURIComponent(sym)}&freq=${fr}`);
    const data = await res.json();
    _vmFinCache[key] = { t: Date.now(), data };
    return data;
  } catch { return null; }
}

// Hook: real financials for a ticker, or {data:null} to fall back to the mock.
function useVMFinancials(ticker, freq) {
  const [state, setState] = React.useState({ data: null, loading: false, live: false });
  React.useEffect(() => {
    if (!ticker || (typeof VM_IS_EQUITY === 'function' && !VM_IS_EQUITY(ticker))) {
      setState({ data: null, loading: false, live: false }); return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    // Quarterly → also pull the annual 10-Ks so we can fill the Q4 columns.
    const built$ = freq === 'quarterly'
      ? Promise.all([vmFinancials(ticker, 'quarterly'), vmFinancials(ticker, 'annual')])
          .then(([q, a]) => (q && q.filings && q.filings.length ? vmBuildQuarterly(q, a) : null))
      : vmFinancials(ticker, 'annual').then((p) => (p ? vmBuildStatements(p) : null));
    built$.then((built) => { if (alive) setState({ data: built, loading: false, live: !!built }); })
          .catch(() => { if (alive) setState({ data: null, loading: false, live: false }); });
    return () => { alive = false; };
  }, [ticker, freq]);
  return state;
}

Object.assign(window, { VM_FIN, vmFinancials, vmBuildStatements, useVMFinancials });

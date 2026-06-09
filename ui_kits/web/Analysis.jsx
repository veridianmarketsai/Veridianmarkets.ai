// Veridian Markets — Analysis modal (chart explorer for company financials).
// ECharts 5 via CDN (window.echarts). Plain JSX + Babel standalone, no build step.
const {
  useState:    useStateA,
  useEffect:   useEffectA,
  useRef:      useRefA,
  useMemo:     useMemoA,
  useCallback: useCallbackA,
} = React;

// ── Chart registry ────────────────────────────────────────────────────────────
const CHART_CATEGORIES = [
  { id:'fundamentals', label:'Fundamental analysis', charts:[
    { id:'revenue',    label:'Revenue & gross profit', icon:'chart-bar',        available:true  },
    { id:'margins',    label:'Margin trends',           icon:'trending-up',      available:true  },
    { id:'eps',        label:'EPS diluted',             icon:'coins',            available:true  },
    { id:'fcf',        label:'Free cash flow',          icon:'droplets',         available:true },
    { id:'balance',    label:'Balance sheet',           icon:'building-bank',    available:true },
    { id:'segments',   label:'Segment revenue',         icon:'chart-pie-2',      available:true },
    { id:'dupont',     label:'DuPont decomposition',    icon:'stack-2',          available:true },
    { id:'capex',      label:'CapEx vs depreciation',   icon:'building-factory', available:true },
    { id:'buybacks',   label:'Share buybacks',          icon:'arrows-exchange',  available:true },
    { id:'dividends',  label:'Dividend history',        icon:'receipt',          available:true },
  ]},
  { id:'price', label:'Price & technical', charts:[
    { id:'candlestick', label:'Candlestick / OHLC',  icon:'chart-candle',      available:true },
    { id:'volume',      label:'Volume profile',       icon:'chart-histogram',   available:true },
    { id:'relative',    label:'Relative performance', icon:'percentage',        available:true },
    { id:'seasonality', label:'Seasonality chart',    icon:'sun',               available:true },
    { id:'ratios',      label:'Ratio chart',          icon:'divide',            available:true },
  ]},
  { id:'valuation', label:'Valuation & M&A', charts:[
    { id:'footballfield', label:'Football field',        icon:'layout-distribute-horizontal', available:true },
    { id:'multiples',     label:'Historical multiples',  icon:'timeline',         available:true },
    { id:'comps',         label:'Comps scatter',         icon:'dots-circle',      available:true },
    { id:'dcf',           label:'DCF sensitivity',       icon:'calculator',       available:true },
    { id:'sotp',          label:'Sum-of-the-parts',      icon:'layers-subtract',  available:true },
    { id:'tornado',       label:'Tornado chart',         icon:'wave-saw-tool',    available:true },
  ]},
  { id:'forecasting', label:'Forecasting & modeling', charts:[
    { id:'forecast',   label:'Actual vs forecast',  icon:'chart-line',          available:true },
    { id:'fan',        label:'Fan / confidence cone',icon:'ripple',             available:true },
    { id:'scenario',   label:'Scenario paths',       icon:'git-branch',          available:true },
    { id:'montecarlo', label:'Monte Carlo',          icon:'chart-dots-3',        available:true },
    { id:'backtest',   label:'Backtest curve',       icon:'refresh-dot',         available:true },
  ]},
  { id:'risk', label:'Risk management', charts:[
    { id:'drawdown',    label:'Drawdown chart',      icon:'trending-down',       available:true },
    { id:'var',         label:'VaR distribution',    icon:'alert-triangle',      available:true },
    { id:'correlation', label:'Correlation matrix',  icon:'grid-pattern',        available:true },
    { id:'stress',      label:'Stress test',         icon:'flame',               available:true },
    { id:'exposure',    label:'Exposure chart',      icon:'eye',                 available:true },
  ]},
  { id:'portfolio', label:'Portfolio management', charts:[
    { id:'allocation',  label:'Allocation treemap',  icon:'layout-grid',         available:true },
    { id:'returns',     label:'Cumulative returns',  icon:'chart-area-line',     available:true },
    { id:'frontier',    label:'Efficient frontier',  icon:'vector-spline',       available:true },
    { id:'attribution', label:'Attribution waterfall',icon:'chart-waterfall',    available:true },
  ]},
  { id:'rates', label:'Fixed income & rates', charts:[
    { id:'yieldcurve', label:'Yield curve',          icon:'chart-arc',           available:true },
    { id:'spreads',    label:'Credit spreads',       icon:'arrows-diff',         available:true },
    { id:'ladder',     label:'Debt maturity ladder', icon:'stairs',              available:true },
  ]},
  { id:'macro', label:'Macro & economic', charts:[
    { id:'timeseries', label:'Economic time series', icon:'clock',               available:true },
    { id:'choropleth', label:'Choropleth map',       icon:'map',                 available:true },
    { id:'dotplot',    label:'Dot plot (Fed rates)', icon:'point',               available:true },
  ]},
  { id:'flow', label:'Flow & relationship', charts:[
    { id:'sankey',  label:'Sankey flow',            icon:'arrows-split-2',       available:true },
    { id:'radar',   label:'Radar chart',            icon:'radar',                available:true },
    { id:'heatmap', label:'Heatmap',                icon:'grid-3x3',             available:true },
    { id:'treemap', label:'Treemap',                icon:'layout-2',             available:true },
    { id:'scatter', label:'Scatter / bubble',       icon:'chart-dots',           available:true },
  ]},
];

const CHART_MAP = {};
CHART_CATEGORIES.forEach(cat => cat.charts.forEach(ch => { CHART_MAP[ch.id] = ch; }));

// ── Mock AI explanations ──────────────────────────────────────────────────────
const MOCK_EXPLANATIONS = {
  revenue: "Apple's revenue trajectory shows resilience through the post-peak correction in FY2023 (-2.8%), recovering to modest growth in FY2024-25 (+2-3%). The gross profit line has held remarkably steady as a share of revenue, implying Apple has successfully defended pricing power even as iPhone units plateaued. The TTM figure of $397B suggests the recovery is continuing, though the growth rate remains well below the pandemic-era surge. Historically, consumer technology franchises at this scale have rarely re-accelerated to double-digit growth without a new product category driving the next S-curve.",
  margins: "Apple's gross margin has expanded from 44.9% in FY2022 to a TTM of 46.8%, a significant structural improvement driven by the mix shift toward higher-margin Services revenue. Operating margins have followed a similar trajectory, rising from 30.8% to 32.2% TTM. Net margins have been slightly compressed by rising interest expense as the company's net cash position has declined. The analogue here is Microsoft in 2012-2015, when cloud mix-shift similarly expanded margins before the broader market recognised the transformation in the multiple.",
  eps: "EPS diluted has compounded at roughly 3-4% annually since FY2022, modest on an absolute basis but notable given that revenue growth has been near-flat. The driver is aggressive share buybacks reducing the denominator — Apple has retired roughly 5-6% of its share count annually. At $6.51 TTM, EPS sits 16% above FY2022's $5.61 on essentially flat net income, a textbook illustration of financial engineering supplementing organic growth. Investors buying today are paying ~47x TTM EPS, a premium that can only be justified by re-accelerating revenue or continued buyback-driven EPS growth.",
};

// ── Supported toggles per chart ───────────────────────────────────────────────
const CHART_TOGGLES = {
  revenue: ['period', 'range'],
  margins: ['period', 'range', 'scale'],
  eps:     ['period', 'range'],
};

// ── ECharts option builders ───────────────────────────────────────────────────
function axisBase() {
  return {
    axisLabel: { fontFamily: VM.mono, fontSize: 10, color: VM.ink3 },
    axisLine:  { lineStyle: { color: VM.borderSoft } },
    axisTick:  { show: false },
  };
}
function splitLineBase() {
  return { splitLine: { lineStyle: { color: VM.borderHair, type: 'dashed' } } };
}
function tooltipBase() {
  return {
    trigger: 'axis',
    backgroundColor: VM.paper,
    borderColor: VM.border,
    borderWidth: 1,
    padding: [8, 12],
    textStyle: { fontFamily: VM.mono, fontSize: 11, color: VM.ink },
    extraCssText: `box-shadow: 0 8px 24px rgba(31,29,26,0.14);`,
  };
}
function legendBase() {
  return {
    bottom: 0,
    itemWidth: 14,
    itemHeight: 8,
    icon: 'roundRect',
    textStyle: { fontFamily: VM.mono, fontSize: 10, color: VM.ink3 },
  };
}
function fmtMil(v) {
  if (v == null) return '—';
  const abs = Math.abs(v);
  const s = abs >= 1000 ? `$${(abs / 1000).toFixed(1)}B` : `$${abs.toFixed(0)}M`;
  return v < 0 ? `(${s})` : s;
}

function buildRevenueOption(data) {
  const perList = [...data.periods].reverse();
  const rev = data.income.find(r => r.k === 'Total revenue');
  const gp  = data.income.find(r => r.k === 'Gross profit');
  const revV = [...rev.v].reverse();
  const gpV  = [...gp.v].reverse();
  return {
    backgroundColor: 'transparent',
    grid: { left: 72, right: 20, top: 24, bottom: 44 },
    xAxis: { type: 'category', data: perList, ...axisBase() },
    yAxis: { type: 'value', ...axisBase(), ...splitLineBase(), axisLine: { show: false },
      axisLabel: { fontFamily: VM.mono, fontSize: 10, color: VM.ink3, formatter: v => v >= 1000 ? `$${v/1000}B` : `$${v}M` } },
    tooltip: { ...tooltipBase(), formatter: params =>
      `<strong style="color:${VM.ink}">${params[0].name}</strong><br/>${params.map(p => `${p.marker}&nbsp;${p.seriesName}: <strong>${fmtMil(p.value)}</strong>`).join('<br/>')}` },
    legend: legendBase(),
    series: [
      { name:'Total revenue',  type:'bar', data: revV, barMaxWidth: 48,
        itemStyle: { color: VM.teal,   borderRadius: [3, 3, 0, 0] } },
      { name:'Gross profit',   type:'bar', data: gpV,  barMaxWidth: 48,
        itemStyle: { color: VM.forest, borderRadius: [3, 3, 0, 0] } },
    ],
  };
}

function buildMarginsOption(data, logScale) {
  const perList = [...data.periods].reverse();
  const revV  = [...data.income.find(r => r.k === 'Total revenue').v].reverse();
  const gpV   = [...data.income.find(r => r.k === 'Gross profit').v].reverse();
  const oiV   = [...data.income.find(r => r.k === 'Operating income').v].reverse();
  const niV   = [...data.income.find(r => r.k === 'Net income').v].reverse();
  const pct   = (arr) => arr.map((v, i) => +(v / revV[i] * 100).toFixed(1));
  return {
    backgroundColor: 'transparent',
    grid: { left: 56, right: 20, top: 24, bottom: 44 },
    xAxis: { type: 'category', data: perList, ...axisBase() },
    yAxis: { type: logScale ? 'log' : 'value', ...axisBase(), ...splitLineBase(), axisLine: { show: false },
      axisLabel: { fontFamily: VM.mono, fontSize: 10, color: VM.ink3, formatter: v => `${v}%` } },
    tooltip: { ...tooltipBase(), formatter: params =>
      `<strong style="color:${VM.ink}">${params[0].name}</strong><br/>${params.map(p => `${p.marker}&nbsp;${p.seriesName}: <strong>${p.value}%</strong>`).join('<br/>')}` },
    legend: legendBase(),
    series: [
      { name:'Gross margin',     type:'line', data: pct(gpV), smooth:true, symbol:'circle', symbolSize:6,
        lineStyle:{ color: VM.teal,   width:2 }, itemStyle:{ color: VM.teal   } },
      { name:'Operating margin', type:'line', data: pct(oiV), smooth:true, symbol:'circle', symbolSize:6,
        lineStyle:{ color: VM.forest, width:2 }, itemStyle:{ color: VM.forest } },
      { name:'Net margin',       type:'line', data: pct(niV), smooth:true, symbol:'circle', symbolSize:6,
        lineStyle:{ color: VM.terra,  width:2 }, itemStyle:{ color: VM.terra  } },
    ],
  };
}

function buildEpsOption(data) {
  const perList = [...data.periods].reverse();
  const epsRow  = data.income.find(r => r.fmt === 'eps');
  const epsV    = [...epsRow.v].reverse();
  return {
    backgroundColor: 'transparent',
    grid: { left: 56, right: 20, top: 24, bottom: 44 },
    xAxis: { type: 'category', data: perList, ...axisBase() },
    yAxis: { type: 'value', ...axisBase(), ...splitLineBase(), axisLine: { show: false },
      axisLabel: { fontFamily: VM.mono, fontSize: 10, color: VM.ink3, formatter: v => `$${v.toFixed(2)}` } },
    tooltip: { ...tooltipBase(), formatter: params =>
      `<strong style="color:${VM.ink}">${params[0].name}</strong><br/>${params[0].marker}&nbsp;EPS diluted: <strong>$${Number(params[0].value).toFixed(2)}</strong>` },
    series: [
      { name:'EPS diluted', type:'bar', barMaxWidth: 52,
        data: epsV.map(v => ({ value: v, itemStyle: { color: v >= 0 ? VM.teal : VM.terra, borderRadius: [3, 3, 0, 0] } })) },
      { name:'Trend', type:'line', data: epsV, smooth:true, symbol:'none',
        lineStyle:{ color: VM.ink3, width:1.5, type:'dashed' }, tooltip:{ show:false } },
    ],
  };
}

function getChartOption(id, data, toggles) {
  if (id === 'revenue') return buildRevenueOption(data);
  if (id === 'margins') return buildMarginsOption(data, toggles.scale === 'log');
  if (id === 'eps')     return buildEpsOption(data);
  return null;
}

// ── ECharts canvas wrapper ────────────────────────────────────────────────────
function EChartsCanvas({ option, height }) {
  const divRef  = useRefA(null);
  const chartRef = useRefA(null);

  useEffectA(() => {
    if (!divRef.current || !window.echarts) return;
    chartRef.current = window.echarts.init(divRef.current);
    if (option) chartRef.current.setOption(option);
    const ro = new ResizeObserver(() => { if (chartRef.current) chartRef.current.resize(); });
    ro.observe(divRef.current);
    return () => { ro.disconnect(); if (chartRef.current) { chartRef.current.dispose(); chartRef.current = null; } };
  }, []);

  useEffectA(() => {
    if (chartRef.current && option) chartRef.current.setOption(option, true);
  }, [option]);

  return <div ref={divRef} style={{ width:'100%', height: height || 340 }} />;
}

// ── Mobile chart strip (horizontal scrollable chip row) ──────────────────────
function MobileChartStrip({ activeChart, onSelect }) {
  const allCharts = CHART_CATEGORIES.flatMap(cat => cat.charts);
  return (
    <div className="vm-noscroll" style={{ overflowX:'auto', flexShrink:0, display:'flex', gap:6,
      padding:'8px 10px', borderBottom:`1px solid ${VM.borderSoft}`, background:VM.paper }}>
      {allCharts.map(ch => {
        const active = ch.id === activeChart;
        return (
          <button key={ch.id} onClick={() => onSelect(ch.id)} style={{
            display:'inline-flex', alignItems:'center', gap:5, flexShrink:0, cursor:'pointer',
            fontFamily:VM.mono, fontSize:10, letterSpacing:'0.02em', whiteSpace:'nowrap',
            padding:'5px 10px', borderRadius:20,
            border:`1px solid ${active ? VM.teal : VM.border}`,
            background: active ? VM.tealTint : 'transparent',
            color: active ? VM.tealInk : VM.ink2 }}>
            <i className={`ti ti-${ch.icon}`} style={{ fontSize:11 }}></i>
            {ch.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function AnalysisSidebar({ activeChart, onSelect, search, onSearch }) {
  const q = (search || '').toLowerCase();
  const filtered = CHART_CATEGORIES.map(cat => ({
    ...cat,
    charts: cat.charts.filter(ch => !q || ch.label.toLowerCase().includes(q) || cat.label.toLowerCase().includes(q)),
  })).filter(cat => cat.charts.length > 0);

  return (
    <div style={{ width: 220, flexShrink: 0, borderRight: `1px solid ${VM.borderSoft}`,
      display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'hidden' }}>
      <div style={{ padding: '12px 12px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: VM.paperDeep,
          border: `1px solid ${VM.border}`, borderRadius: 8, padding: '6px 10px' }}>
          <i className="ti ti-search" style={{ fontSize: 13, color: VM.ink3, flexShrink: 0 }}></i>
          <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Search charts…"
            style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: VM.mono,
              fontSize: 11, color: VM.ink, width: '100%' }} />
        </div>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, padding: '0 6px 16px' }}>
        {filtered.map(cat => (
          <div key={cat.id} style={{ marginBottom: 6 }}>
            <div style={{ fontFamily: VM.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: VM.faint, padding: '8px 8px 4px' }}>{cat.label}</div>
            {cat.charts.map(ch => {
              const active = ch.id === activeChart;
              return (
                <button key={ch.id} onClick={() => ch.available && onSelect(ch.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 8px', borderRadius: 7, border: 'none', textAlign: 'left',
                    background: active ? VM.tealTint : 'transparent',
                    color: active ? VM.tealInk : ch.available ? VM.ink2 : VM.faint,
                    cursor: ch.available ? 'pointer' : 'default',
                    fontFamily: VM.serif, fontSize: 13, fontWeight: active ? 600 : 400 }}>
                  <i className={`ti ti-${ch.icon}`} style={{ fontSize: 13, flexShrink: 0,
                    color: active ? VM.tealInk : ch.available ? VM.ink3 : VM.faint }}></i>
                  <span style={{ flex: 1 }}>{ch.label}</span>
                  {!ch.available && <i className="ti ti-lock" style={{ fontSize: 10, color: VM.faint }}></i>}
                  {active && <i className="ti ti-circle-check-filled" style={{ fontSize: 13, color: VM.upInk }}></i>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Control bar ───────────────────────────────────────────────────────────────
function AnalysisControls({ chartId, toggles, onToggle, onExplain, explaining, hasExplanation }) {
  const supported = CHART_TOGGLES[chartId] || [];
  const btnStyle = (active) => ({
    fontFamily: VM.mono, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 5,
    cursor: 'pointer', border: `1px solid ${active ? VM.forest : VM.border}`,
    background: active ? VM.forest : VM.paper, color: active ? VM.paperWarm : VM.ink3,
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
      padding: '10px 16px', borderBottom: `1px solid ${VM.borderHair}`, background: VM.paper }}>
      {supported.includes('period') && (
        <div style={{ display: 'flex', gap: 3 }}>
          {[['annual','Annual'],['quarterly','Quarterly'],['ttm','TTM']].map(([id,lbl]) => (
            <button key={id} onClick={() => onToggle('period', id)} style={btnStyle(toggles.period === id)}>{lbl}</button>
          ))}
        </div>
      )}
      {supported.includes('period') && supported.length > 1 && <span style={{ width:1, height:16, background:VM.border }}></span>}
      {supported.includes('range') && (
        <div style={{ display: 'flex', gap: 3 }}>
          {[['1y','1Y'],['3y','3Y'],['5y','5Y'],['10y','10Y'],['max','Max']].map(([id,lbl]) => (
            <button key={id} onClick={() => onToggle('range', id)} style={btnStyle(toggles.range === id)}>{lbl}</button>
          ))}
        </div>
      )}
      {supported.includes('scale') && (
        <React.Fragment>
          <span style={{ width:1, height:16, background:VM.border }}></span>
          <div style={{ display: 'flex', gap: 3 }}>
            {[['linear','Linear'],['log','Log']].map(([id,lbl]) => (
              <button key={id} onClick={() => onToggle('scale', id)} style={btnStyle(toggles.scale === id)}>{lbl}</button>
            ))}
          </div>
        </React.Fragment>
      )}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
        <button onClick={onExplain} title="AI interpretation of this chart"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: VM.mono, fontSize: 10, letterSpacing: '0.04em', textTransform: 'uppercase',
            padding: '4px 11px', borderRadius: 5, cursor: 'pointer',
            border: `1px solid ${hasExplanation ? VM.tealInk : VM.border}`,
            background: hasExplanation ? VM.tealTint : VM.paper,
            color: hasExplanation ? VM.tealInk : VM.ink2 }}>
          {explaining
            ? <React.Fragment><span style={{ width:10, height:10, borderRadius:999, border:`2px solid ${VM.tealInk}`, borderTopColor:'transparent', display:'inline-block', animation:'spin 0.7s linear infinite' }}></span>Thinking…</React.Fragment>
            : <React.Fragment><i className="ti ti-sparkles" style={{ fontSize: 12 }}></i>Explain this</React.Fragment>}
        </button>
      </div>
    </div>
  );
}

// ── Explanation panel ─────────────────────────────────────────────────────────
function AnalysisExplain({ text, loading }) {
  const [open, setOpen] = useStateA(true);
  if (!text && !loading) return null;
  return (
    <div style={{ borderTop: `1px solid ${VM.borderHair}`, background: VM.tealTint2 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'10px 16px',
          background:'transparent', border:'none', cursor:'pointer', textAlign:'left' }}>
        <i className="ti ti-sparkles" style={{ fontSize:13, color:VM.tealInk }}></i>
        <span style={{ fontFamily:VM.mono, fontSize:10, letterSpacing:'0.06em', textTransform:'uppercase', color:VM.tealInk, fontWeight:700 }}>Veridian AI interpretation</span>
        <i className={`ti ti-chevron-${open?'up':'down'}`} style={{ fontSize:11, color:VM.ink3, marginLeft:'auto' }}></i>
      </button>
      {open && (
        <div style={{ padding:'0 16px 14px' }}>
          {loading
            ? <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {[80,65,72].map((w,i) => <div key={i} style={{ height:11, width:`${w}%`, background:VM.borderSoft, borderRadius:4 }}></div>)}
              </div>
            : <p style={{ fontFamily:VM.serif, fontSize:13.5, color:VM.ink2, lineHeight:1.7, margin:0 }}>{text}</p>}
        </div>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
function AnalysisModal({ open, onClose, data, c, analysisButtonRef }) {
  const [activeChart, setActiveChart] = useStateA(() => {
    try { return localStorage.getItem('vm_analysis_chart_' + (c && c.ticker)) || 'revenue'; } catch(e) { return 'revenue'; }
  });
  const [search, setSearch]         = useStateA('');
  const [toggles, setToggles]       = useStateA({ period:'annual', range:'5y', scale:'linear' });
  const [explaining, setExplaining] = useStateA(false);
  const [explanation, setExplanation] = useStateA(null);
  const [isMob, setIsMob]           = useStateA(() => window.innerWidth <= 768);
  const dialogRef = useRefA(null);

  useEffectA(() => {
    const onResize = () => setIsMob(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Persist last-used chart per ticker
  useEffectA(() => {
    if (!open) return;
    try { localStorage.setItem('vm_analysis_chart_' + (c && c.ticker), activeChart); } catch(e) {}
  }, [activeChart, open]);

  // Body scroll lock + focus on open
  useEffectA(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (dialogRef.current) dialogRef.current.focus();
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // ESC to close
  useEffectA(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); if (analysisButtonRef && analysisButtonRef.current) analysisButtonRef.current.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Reset explanation when chart changes
  useEffectA(() => { setExplanation(null); }, [activeChart]);

  const onToggle = (key, val) => setToggles(t => ({ ...t, [key]: val }));

  const handleExplain = () => {
    if (explaining) return;
    setExplaining(true);
    setExplanation(null);
    setTimeout(() => {
      setExplaining(false);
      setExplanation(MOCK_EXPLANATIONS[activeChart] || 'No interpretation available for this chart yet.');
    }, 1100);
  };

  const handleSelect = (id) => {
    setActiveChart(id);
    setSearch('');
  };

  const chartOption = useMemoA(() => {
    if (!data) return null;
    return getChartOption(activeChart, data, toggles);
  }, [activeChart, data, toggles]);

  const chartMeta = CHART_MAP[activeChart];

  if (!open) return null;
  const handleClose = () => { onClose(); if (analysisButtonRef && analysisButtonRef.current) analysisButtonRef.current.focus(); };
  return ReactDOM.createPortal(
    <div onClick={handleClose}
      style={{ position:'fixed', inset:0, zIndex:300,
        background: isMob ? VM.paper : 'rgba(20,18,15,0.55)',
        display:'flex', alignItems: isMob ? 'flex-start' : 'center',
        justifyContent:'center', padding: isMob ? 0 : '16px' }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={`Analysis — ${c ? c.ticker : ''}`}
        tabIndex={-1} onClick={e => e.stopPropagation()}
        style={{ background:VM.paper,
          borderRadius: isMob ? 0 : 14,
          width: isMob ? '100%' : 'min(92vw, 1100px)',
          height: isMob ? '100%' : 'min(88vh, 720px)',
          display:'flex', flexDirection:'column',
          boxShadow: isMob ? 'none' : '0 32px 80px rgba(0,0,0,0.36)',
          border: isMob ? 'none' : `1px solid ${VM.borderSoft}`,
          outline:'none', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12,
          padding: isMob ? '12px 14px' : '14px 18px',
          borderBottom:`1px solid ${VM.borderSoft}`, flexShrink:0, background:VM.paper }}>
          <div style={{ width:32, height:32, borderRadius:9, background:VM.tealTint, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-chart-bar" style={{ fontSize:15, color:VM.tealInk }}></i>
          </div>
          <div style={{ minWidth:0, flex:1 }}>
            <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize: isMob ? 15 : 17, color:VM.ink, lineHeight:1.15, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              Analysis{c ? ` — ${c.ticker}` : ''}
            </div>
            {chartMeta && <div style={{ fontFamily:VM.mono, fontSize:10, color:VM.ink3 }}>{chartMeta.label}</div>}
          </div>
          <button onClick={handleClose} aria-label="Close analysis" tabIndex={0}
            style={{ flexShrink:0, width:32, height:32, borderRadius:8, border:`1px solid ${VM.border}`,
              background:'transparent', cursor:'pointer', display:'flex', alignItems:'center',
              justifyContent:'center', color:VM.ink3 }}>
            <i className="ti ti-x" style={{ fontSize:15 }}></i>
          </button>
        </div>

        {/* Body */}
        <div style={{ display:'flex', flexDirection: isMob ? 'column' : 'row', flex:1, minHeight:0 }}>
          {/* Sidebar: left panel on desktop, horizontal chip strip on mobile */}
          {isMob
            ? <MobileChartStrip activeChart={activeChart} onSelect={handleSelect} />
            : <AnalysisSidebar activeChart={activeChart} onSelect={handleSelect} search={search} onSearch={setSearch} />}

          {/* Main canvas area */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, minHeight:0 }}>
            <AnalysisControls chartId={activeChart} toggles={toggles} onToggle={onToggle}
              onExplain={handleExplain} explaining={explaining} hasExplanation={!!explanation} />

            <div style={{ flex:1, overflowY:'auto', minHeight:0 }}>
              {chartOption
                ? <div style={{ padding: isMob ? '12px 12px 4px' : '20px 20px 4px' }}>
                    <EChartsCanvas option={chartOption} height={isMob ? 220 : 300} />
                  </div>
                : <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    height: isMob ? 180 : '100%', gap:12, padding: isMob ? 24 : 40 }}>
                    <div style={{ width:48, height:48, borderRadius:14, background:VM.paperDeep, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <i className="ti ti-lock" style={{ fontSize:20, color:VM.faint }}></i>
                    </div>
                    <div style={{ fontFamily:VM.serif, fontWeight:600, fontSize:15, color:VM.ink }}>Coming soon</div>
                    <div style={{ fontFamily:VM.mono, fontSize:11, color:VM.ink3, textAlign:'center', maxWidth:260 }}>
                      {chartMeta ? `${chartMeta.label} is on the roadmap.` : 'This chart is not yet available.'} Select Revenue, Margins, or EPS to get started.
                    </div>
                  </div>}

              <AnalysisExplain text={explanation} loading={explaining} />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

Object.assign(window, { AnalysisModal });

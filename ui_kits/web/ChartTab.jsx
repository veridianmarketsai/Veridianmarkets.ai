// Veridian Markets — "Chart" tab: real OHLC candles (Finnhub /stock/candle,
// premium plan) next to Financials. Range buttons drive useVMCandles(); falls
// back to the existing OverlayChart mock sparkline when live data isn't
// available (unknown ticker, plan without candle access, network error).

function _fmtAxisLabel(ms, resolution) {
  const d = new Date(ms);
  if (resolution === '5' || resolution === '15' || resolution === '60') {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  if (resolution === 'M') return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: resolution === 'W' ? '2-digit' : undefined });
}

function _candleOption(bars, resolution) {
  const dates = bars.map((b) => _fmtAxisLabel(b.t, resolution));
  const data = bars.map((b) => [b.o, b.c, b.l, b.h]);
  return {
    grid: { left: 48, right: 16, top: 16, bottom: 28 },
    xAxis: {
      type: 'category', data: dates, boundaryGap: true,
      axisLine: { lineStyle: { color: VM.borderSoft } },
      axisLabel: { fontFamily: VM.mono, fontSize: 10, color: VM.ink3 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value', scale: true,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: VM.borderHair } },
      axisLabel: { fontFamily: VM.mono, fontSize: 10, color: VM.ink3, formatter: (v) => `$${v.toFixed(2)}` },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: VM.paper, borderColor: VM.borderSoft, textStyle: { fontFamily: VM.mono, fontSize: 11, color: VM.ink },
      formatter: (params) => {
        const p = params[0];
        const [o, c, l, h] = p.data;
        return `<strong>${p.name}</strong><br/>O ${o.toFixed(2)} · H ${h.toFixed(2)} · L ${l.toFixed(2)} · C ${c.toFixed(2)}`;
      },
    },
    series: [{
      type: 'candlestick', data,
      itemStyle: {
        color: VM.tealTint2, color0: VM.rust,
        borderColor: VM.teal, borderColor0: VM.rustDeep,
      },
    }],
  };
}

// ── Candlestick canvas with draggable horizontal price lines ────────────────
// Lines render as ECharts `graphic` groups (line + price label) laid over the
// candlestick series, positioned each render via convertToPixel(price) so
// they track the axis when the range/zoom changes, and dragged vertically —
// on release, convertFromPixel() writes the new price back via onChange.
function CandleChart({ bars, resolution, hLines, onChange, height }) {
  const divRef = React.useRef(null);
  const chartRef = React.useRef(null);
  const idsRef = React.useRef([]);

  React.useEffect(() => {
    if (!divRef.current || !window.echarts) return;
    chartRef.current = window.echarts.init(divRef.current);
    const ro = new ResizeObserver(() => { if (chartRef.current) chartRef.current.resize(); });
    ro.observe(divRef.current);
    return () => { ro.disconnect(); if (chartRef.current) { chartRef.current.dispose(); chartRef.current = null; } };
  }, []);

  React.useEffect(() => {
    if (chartRef.current) chartRef.current.setOption(_candleOption(bars, resolution), true);
  }, [bars, resolution]);

  React.useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const nextIds = hLines.map((l) => `hline-${l.id}`);
    const removed = idsRef.current.filter((id) => !nextIds.includes(id)).map((id) => ({ id, $action: 'remove' }));
    idsRef.current = nextIds;
    const width = chart.getWidth();
    const elements = hLines.map((l) => {
      const y = chart.convertToPixel({ yAxisIndex: 0 }, l.price);
      return {
        id: `hline-${l.id}`, type: 'group', position: [0, y], draggable: 'vertical', z: 10, cursor: 'ns-resize',
        ondragend: (e) => {
          const p = chart.convertFromPixel({ yAxisIndex: 0 }, e.target.position[1]);
          onChange((cur) => cur.map((x) => (x.id === l.id ? { ...x, price: Math.round(p * 100) / 100 } : x)));
        },
        children: [
          { type: 'line', shape: { x1: 0, y1: 0, x2: width, y2: 0 }, style: { stroke: l.color, lineWidth: 1.5 } },
          { type: 'text', position: [width - 4, -14], style: { text: `$${Number(l.price).toFixed(2)}`, fill: l.color, fontFamily: VM.mono, fontSize: 10, textAlign: 'right' } },
        ],
      };
    });
    chart.setOption({ graphic: [...removed, ...elements] });
  }, [hLines, bars, resolution]);

  return <div ref={divRef} style={{ width: '100%', height: height || 340 }} />;
}

// ── Horizontal price-line tool (TradingView-style): add a line at a price,
// drag it on the chart or type an exact value, recolor, remove one or all.
// Lines are per-session (not persisted).
const _HLINE_PALETTE = [VM.terra, VM.teal, '#9b8bd6', '#c97b7b', '#6bbfbf'];
function HLineTool({ lines, onChange, lastPrice }) {
  const addLine = () => {
    const price = lastPrice != null ? Math.round(lastPrice * 100) / 100 : 100;
    const color = _HLINE_PALETTE[lines.length % _HLINE_PALETTE.length];
    onChange([...lines, { id: Date.now() + Math.random(), price, color }]);
  };
  const update = (id, patch) => onChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const remove = (id) => onChange(lines.filter((l) => l.id !== id));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={addLine} title="Add horizontal price line" style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: VM.mono, fontSize: 10, padding: '3px 9px', borderRadius: 5,
        border: `1px solid ${VM.borderSoft}`, background: 'transparent', color: VM.ink3, cursor: 'pointer' }}>
        <i className="ti ti-plus" style={{ fontSize: 11 }}></i>Line
      </button>
      {lines.map((l) => (
        <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 6px 2px 8px', borderRadius: 999, border: `1px solid ${VM.borderSoft}` }}>
          <input type="color" value={l.color} onChange={(e) => update(l.id, { color: e.target.value })}
            title="Line color" style={{ width: 14, height: 14, border: 'none', padding: 0, background: 'none', cursor: 'pointer' }} />
          <span style={{ fontFamily: VM.mono, fontSize: 10, color: VM.ink3 }}>$</span>
          <input type="number" step="0.01" value={l.price} onChange={(e) => update(l.id, { price: Number(e.target.value) || 0 })}
            style={{ width: 58, border: 'none', background: 'transparent', fontFamily: VM.mono, fontSize: 11, color: VM.ink, padding: 0 }} />
          <span onClick={() => remove(l.id)} title="Remove line" style={{ cursor: 'pointer', color: VM.ink3, fontSize: 13, lineHeight: 1, padding: '0 2px' }}>×</span>
        </div>
      ))}
      {lines.length > 0 && (
        <button onClick={() => onChange([])} title="Remove all lines" style={{
          fontFamily: VM.mono, fontSize: 10, padding: '3px 9px', borderRadius: 5,
          border: `1px solid ${VM.borderSoft}`, background: 'transparent', color: VM.ink3, cursor: 'pointer' }}>
          Clear all
        </button>
      )}
    </div>
  );
}

function DashChart({ c, isMobile }) {
  const [range, setRange] = React.useState('1Y');
  const [hLines, setHLines] = React.useState([]);
  const chart = typeof useVMCandles === 'function' ? useVMCandles(c.ticker, range) : { data: null, loading: false, live: false };
  const r = (typeof VM_RANGES !== 'undefined' && VM_RANGES[range]) || { resolution: 'D' };
  const lastPrice = chart.data && chart.data.length ? chart.data[chart.data.length - 1].c : null;

  return (
    <div style={{ marginTop: 16 }}>
      <div data-tour="vm-chart-tab" style={{ background: VM.paper, border: `1px solid ${VM.borderSoft}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 16, margin: 0 }}>
            {c.ticker} · {range}{' '}
            <span style={{ fontFamily: VM.mono, fontSize: 11, color: VM.ink3 }}>
              {chart.loading ? '· loading…' : chart.live ? '· live' : '· sample data'}
            </span>
          </h3>
          <div style={{ display: 'flex', gap: 4 }}>
            {Object.keys(typeof VM_RANGES !== 'undefined' ? VM_RANGES : { '1D':1,'5D':1,'1M':1,'6M':1,'1Y':1,'5Y':1,'Max':1 }).map((t) => (
              <span key={t} onClick={() => setRange(t)} style={{
                fontFamily: VM.mono, fontSize: 10, padding: '3px 8px', borderRadius: 5, cursor: 'pointer',
                border: `1px solid ${t === range ? VM.teal : VM.borderSoft}`, color: t === range ? VM.teal : VM.ink3,
              }}>{t}</span>
            ))}
          </div>
        </div>

        {chart.data && chart.data.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <HLineTool lines={hLines} onChange={setHLines} lastPrice={lastPrice} />
          </div>
        )}

        {(() => {
          const h = isMobile ? 240 : 340;
          if (chart.loading) return (
            <div style={{ height:h, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ padding:'10px 20px', borderRadius:8, border:`1px solid ${VM.borderSoft}`, background:VM.paperWarm }}>
                <Mono size={11} color={VM.ink3}>Loading market data…</Mono>
              </div>
            </div>
          );
          if (chart.live && chart.data && chart.data.length) return <CandleChart bars={chart.data} resolution={r.resolution} hLines={hLines} onChange={setHLines} height={h} />;
          if (range === '1D') return (
            <div style={{ height:h, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ padding:'10px 20px', borderRadius:8, border:`1px solid ${VM.borderSoft}`, background:VM.paperWarm }}>
                <Mono size={11} color={VM.ink3}>Coming soon</Mono>
              </div>
            </div>
          );
          return (
            <React.Fragment>
              <OverlayChart h={isMobile ? 200 : 300} legend={false} />
              <Mono size={11} color={VM.ink3} style={{ fontStyle: 'italic', marginTop: 4, display: 'block' }}>
                {`Sample chart — live ${c.ticker} candles need a Finnhub plan with /stock/candle access.`}
              </Mono>
            </React.Fragment>
          );
        })()}
      </div>
    </div>
  );
}

Object.assign(window, { DashChart });

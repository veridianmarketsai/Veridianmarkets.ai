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

function DashChart({ c, isMobile }) {
  const [range, setRange] = React.useState('1Y');
  const chart = typeof useVMCandles === 'function' ? useVMCandles(c.ticker, range) : { data: null, loading: false, live: false };
  const r = (typeof VM_RANGES !== 'undefined' && VM_RANGES[range]) || { resolution: 'D' };

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

        {chart.live && chart.data && chart.data.length
          ? <EChartsCanvas option={_candleOption(chart.data, r.resolution)} height={isMobile ? 240 : 340} />
          : (
            <React.Fragment>
              <OverlayChart h={isMobile ? 200 : 300} legend={false} />
              <Mono size={11} color={VM.ink3} style={{ fontStyle: 'italic', marginTop: 4, display: 'block' }}>
                {chart.loading ? 'Loading live candles…' : `Sample chart — live ${c.ticker} candles need a Finnhub plan with /stock/candle access.`}
              </Mono>
            </React.Fragment>
          )}
      </div>
    </div>
  );
}

Object.assign(window, { DashChart });

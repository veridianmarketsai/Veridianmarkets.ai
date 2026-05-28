// V8 — Company dashboard · Overview tab.
// The synthesis page: what this company IS, who runs it (now and historically),
// and quick-jumps into the other tabs. People-history folds in here.

function V8_Overview({ palette }) {
  return (
    <CompanyDashShell palette={palette} activeTab="Overview" height={1700}>
      {/* ABOUT */}
      <div style={{ padding: '22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
          <div>
            <Mono size={11} color={palette.accent} weight={700}>ABOUT THIS COMPANY</Mono>
            <Scribble size={34} weight={700} style={{ display: 'block', marginTop: 6, lineHeight: 1.0 }}>
              Apple Inc. — what they actually do.
            </Scribble>
            <div style={{ fontFamily: 'var(--wf-body)', fontSize: 17, color: WF_INK_SOFT, lineHeight: 1.4, marginTop: 14 }}>
              Apple designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories.
              It also operates one of the world's largest software-services businesses — App Store, iCloud, Apple Music, AppleCare,
              advertising — now ~22% of revenue and growing roughly twice as fast as hardware. Founded April 1976 in Cupertino;
              listed on NASDAQ since December 1980. Roughly half of revenue is the iPhone; the bigger story underneath is the
              margin expansion as the company has slowly stopped being a hardware company.
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              {[
                ['Sector',     'Technology · Consumer electronics'],
                ['Sub-industry', 'Mobile hardware + Services'],
                ['Index',      'S&P 500 · NDX 100 · DJIA'],
                ['Country',    'United States'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <Mono size={9} color={WF_INK_FAINT} weight={700}>{k.toUpperCase()}</Mono>
                  <Scribble size={13} weight={600}>{v}</Scribble>
                </div>
              ))}
            </div>
          </div>

          <SketchBox style={{ padding: 16 }}>
            <Mono size={10} color={WF_INK_FAINT} weight={700} style={{ display: 'block', marginBottom: 6 }}>QUICK FACTS</Mono>
            {[
              ['Founded',      '1 April 1976'],
              ['HQ',           'Cupertino, CA'],
              ['Employees',    '161,000'],
              ['Fiscal year',  'Ends Sep · FY = Oct–Sep'],
              ['Exchange',     'NASDAQ · since Dec 1980'],
              ['Auditor',      'Ernst & Young (since 2009)'],
              ['Lead bank',    'Goldman Sachs · JPM'],
              ['ISIN · CUSIP', '037833 100'],
              ['Next earnings','Jan 28 · FY26 Q1'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 8, padding: '5px 0', borderBottom: `1px dashed ${WF_INK_FAINT}` }}>
                <Mono size={9} color={WF_INK_FAINT} weight={700}>{k.toUpperCase()}</Mono>
                <Scribble size={13}>{v}</Scribble>
              </div>
            ))}
          </SketchBox>
        </div>
      </div>

      {/* AT A GLANCE — key visualizations */}
      <div style={{ padding: '0 22px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
          <Mono size={11} color={palette.accent} weight={700}>AT A GLANCE</Mono>
          <div style={{ flex: 1, borderBottom: `1.2px dashed ${WF_INK_FAINT}`, marginBottom: 5 }}></div>
          <Mono size={10} color={WF_INK_FAINT}>updated · today</Mono>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
          {/* 5Y price chart */}
          <SketchBox style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <Scribble size={17} weight={700}>Price · 5Y</Scribble>
              <Mono size={10} color={WF_INK_SOFT}>+218% · split-adjusted</Mono>
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', gap: 4 }}>
                {['1D','5D','1M','6M','1Y','5Y','Max'].map((t, i) => (
                  <Mono key={t} size={9} weight={i === 5 ? 700 : 500} color={i === 5 ? palette.accent : WF_INK_SOFT}
                        style={{ padding: '2px 5px', border: `1px solid ${i === 5 ? palette.accent : WF_INK_FAINT}`, borderRadius: 6 }}>
                    {t}
                  </Mono>
                ))}
              </div>
            </div>
            <ChartPlaceholder width={616} height={170} accent={palette.accent} label="AAPL · 5Y with dividends, splits, key events" showAxes />
          </SketchBox>

          {/* Revenue mix */}
          <SketchBox style={{ padding: 14 }}>
            <Scribble size={17} weight={700} style={{ display: 'block', marginBottom: 6 }}>Revenue mix</Scribble>
            <Mono size={9} color={WF_INK_FAINT} weight={700} style={{ display: 'block', marginBottom: 4 }}>FY2025 · $397B</Mono>
            {[
              ['iPhone',     52, palette.accent],
              ['Services',   22, palette.accent2],
              ['Wearables',  10, WF_INK],
              ['Mac',         9, WF_INK_SOFT],
              ['iPad',        7, WF_INK_FAINT],
            ].map(([n, pct, color]) => (
              <div key={n} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 32px', gap: 6, padding: '4px 0', alignItems: 'center' }}>
                <Scribble size={12}>{n}</Scribble>
                <div style={{ height: 6, background: WF_PAPER, border: `1px solid ${WF_INK_FAINT}` }}>
                  <div style={{ width: pct + '%', height: '100%', background: color }}></div>
                </div>
                <Mono size={10} weight={700}>{pct}%</Mono>
              </div>
            ))}
            <div style={{ marginTop: 8, paddingTop: 6, borderTop: `1px dashed ${WF_INK_FAINT}` }}>
              <Mono size={9} color={WF_INK_FAINT}>Services grew 12.5% YoY vs hardware 5.4%</Mono>
            </div>
          </SketchBox>

          {/* Headcount + R&D */}
          <SketchBox style={{ padding: 14 }}>
            <Scribble size={17} weight={700} style={{ display: 'block', marginBottom: 6 }}>People & R&amp;D</Scribble>
            {[
              ['Employees',       '161,000',  'up'],
              ['Headcount 5Y \u0394',   '+14.2%',   'up'],
              ['R&D · TTM',       '$32.1B',   'up'],
              ['R&D / revenue',   '8.1%',     'flat'],
              ['Patents granted', '2,341',    'up'],
              ['Patents · 5Y',    '11,580',   'flat'],
            ].map(([k, v, d]) => (
              <div key={k} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 12px', gap: 6, padding: '5px 0', borderBottom: `1px dashed ${WF_INK_FAINT}`, alignItems: 'center' }}>
                <Scribble size={12}>{k}</Scribble>
                <Mono size={11} weight={600}>{v}</Mono>
                <Mono size={11} color={d === 'up' ? '#4a7c59' : d === 'down' ? '#b35a3a' : WF_INK_FAINT}>{d === 'up' ? '↑' : d === 'down' ? '↓' : '·'}</Mono>
              </div>
            ))}
          </SketchBox>
        </div>
      </div>

      {/* PEOPLE · LEADERSHIP — current */}
      <div style={{ padding: '0 22px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
          <Mono size={11} color={palette.accent} weight={700}>PEOPLE · LEADERSHIP TODAY</Mono>
          <div style={{ flex: 1, borderBottom: `1.2px dashed ${WF_INK_FAINT}`, marginBottom: 5 }}></div>
          <Mono size={10} color={WF_INK_FAINT}>tenure shown</Mono>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { role: 'CEO',        name: 'Tim Cook',       since: 'Aug 2011', note: 'Replaced Jobs. Operations specialist; ran supply chain since 1998.' },
            { role: 'CFO',        name: 'Kevan Parekh',   since: 'Jan 2025', note: 'Internal promote; ran corporate finance previously.' },
            { role: 'COO',        name: 'Jeff Williams',  since: 'Dec 2015', note: 'Apple Watch lead. Often-floated CEO successor.' },
            { role: 'Chief HW',   name: 'John Ternus',    since: 'Jan 2021', note: 'iPhone, iPad, Mac engineering. Rising profile.' },
            { role: 'Chief SW',   name: 'Craig Federighi', since: 'Aug 2009', note: 'iOS, macOS. Public face of platform demos.' },
            { role: 'Services',   name: 'Eddy Cue',       since: 'Sep 2011', note: 'App Store, music, content. Long tenure (\'89).' },
            { role: 'Retail',     name: 'Deirdre O\'Brien',since: 'Feb 2019', note: 'Stores + People. ~28 years at Apple.' },
            { role: 'Chair',      name: 'Arthur Levinson',since: 'Nov 2011', note: 'Genentech former CEO. Independent chair.' },
          ].map(p => (
            <SketchBox key={p.name} style={{ padding: 12 }}>
              <Hatched width={56} height={56} style={{ borderRadius: '50%', marginBottom: 8 }} />
              <Mono size={9} color={palette.accent} weight={700}>{p.role.toUpperCase()}</Mono>
              <Scribble size={16} weight={700} style={{ display: 'block', marginTop: 2 }}>{p.name}</Scribble>
              <Mono size={9} color={WF_INK_FAINT} style={{ display: 'block', marginTop: 2 }}>{p.since}</Mono>
              <div style={{ fontFamily: 'var(--wf-body)', fontSize: 12, color: WF_INK_SOFT, lineHeight: 1.3, marginTop: 6 }}>{p.note}</div>
            </SketchBox>
          ))}
        </div>
      </div>

      {/* PEOPLE · FOUNDERS & ALUMNI — historical */}
      <div style={{ padding: '0 22px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
          <Mono size={11} color={palette.accent} weight={700}>PEOPLE · FOUNDERS, ALUMNI &amp; THE LONG ARC</Mono>
          <div style={{ flex: 1, borderBottom: `1.2px dashed ${WF_INK_FAINT}`, marginBottom: 5 }}></div>
          <Mono size={10} color={WF_INK_FAINT}>1976 \u2192 today</Mono>
        </div>

        <SketchBox style={{ padding: 18 }}>
          {/* Horizontal timeline */}
          <div style={{ position: 'relative', height: 230 }}>
            {/* Axis */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: 120, height: 2, background: WF_INK }}></div>
            {[
              { yr: '1976', who: 'Founded', whom: 'Jobs · Wozniak · Wayne', x: 0,  side: 'top'    },
              { yr: '1980', who: 'IPO',     whom: 'NASDAQ listing',         x: 11, side: 'bottom' },
              { yr: '1985', who: 'Jobs out',whom: 'After Macintosh strug.', x: 23, side: 'top'    },
              { yr: '1996', who: 'NeXT acq',whom: 'Jobs returns',           x: 42, side: 'bottom' },
              { yr: '1997', who: 'iCEO',    whom: 'Jobs interim CEO',       x: 45, side: 'top'    },
              { yr: '2001', who: 'iPod',    whom: 'First mass-mkt hit',     x: 56, side: 'bottom' },
              { yr: '2007', who: 'iPhone',  whom: 'Platform born',          x: 67, side: 'top'    },
              { yr: '2011', who: 'Cook era',whom: 'Jobs passes; Cook CEO',  x: 76, side: 'bottom' },
              { yr: '2015', who: 'Watch',   whom: 'Wearables segment',      x: 84, side: 'top'    },
              { yr: '2020', who: 'M1',      whom: 'Silicon transition',     x: 92, side: 'bottom' },
              { yr: '2026', who: 'Today',   whom: '$4.5T \u00b7 services-led',     x: 96, side: 'top'    },
            ].map((e, i) => (
              <div key={i} style={{ position: 'absolute', left: `${e.x}%`, top: 0, height: 230, width: 1 }}>
                <div style={{ position: 'absolute', left: -4, top: 116, width: 10, height: 10, background: palette.accent, border: `1.5px solid ${WF_INK}`, borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', left: -3, top: e.side === 'top' ? 70 : 134, height: 50, width: 1, borderLeft: `1px dashed ${WF_INK_FAINT}` }}></div>
                <div style={{ position: 'absolute', left: -50, top: e.side === 'top' ? 0 : 168, width: 100, textAlign: 'center' }}>
                  <Mono size={9} color={WF_INK_FAINT} weight={700}>{e.yr}</Mono>
                  <Scribble size={13} weight={700} style={{ display: 'block', lineHeight: 1.1 }}>{e.who}</Scribble>
                  <Scribble size={11} color={WF_INK_SOFT} style={{ display: 'block', lineHeight: 1.2 }}>{e.whom}</Scribble>
                </div>
              </div>
            ))}
          </div>

          {/* Notable alumni */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px dashed ${WF_INK_FAINT}` }}>
            <Mono size={9} color={WF_INK_FAINT} weight={700} style={{ display: 'block', marginBottom: 6 }}>NOTABLE ALUMNI \u00b7 WHERE THEY WENT</Mono>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                ['Steve Jobs',     'co-founder \u2192 NeXT \u2192 Pixar \u2192 back \u2192 iconic'],
                ['Steve Wozniak',  'co-founder \u2192 left \'85 \u2192 angel/educator'],
                ['Jony Ive',       'design lead \'92\u2013\'19 \u2192 LoveFrom (OpenAI deal \'24)'],
                ['Jean-Louis Gass\u00e9e', 'product \'81\u2013\'90 \u2192 Be Inc.'],
                ['Tony Fadell',    '"father of iPod" \u2192 Nest \u2192 Google'],
                ['Scott Forstall', 'iOS lead \u2192 out \'12 \u2192 theatre producer'],
              ].map(([n, s]) => (
                <div key={n} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Hatched width={28} height={28} style={{ borderRadius: '50%', flexShrink: 0 }} />
                  <div>
                    <Scribble size={13} weight={700}>{n}</Scribble>
                    <Scribble size={11} color={WF_INK_SOFT} style={{ display: 'block', lineHeight: 1.2 }}>{s}</Scribble>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SketchBox>
      </div>

      {/* RECENT ACTIVITY */}
      <div style={{ padding: '0 22px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
          <Mono size={11} color={palette.accent} weight={700}>RECENT \u00b7 LAST 90 DAYS</Mono>
          <div style={{ flex: 1, borderBottom: `1.2px dashed ${WF_INK_FAINT}`, marginBottom: 5 }}></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14 }}>
          <SketchBox style={{ padding: 14 }}>
            <Mono size={10} color={WF_INK_FAINT} weight={700} style={{ display: 'block', marginBottom: 6 }}>NEWS</Mono>
            {[
              ['EARN',  'FY26 Q1 guide \u2014 services accel., iPhone flat', '2d'],
              ['REG',   'EU DMA · App Store fee structure under review',     '5d'],
              ['SUPPLY','TSM books CoWoS through \'27 \u2014 capacity tight',   '1w'],
              ['CHINA', 'iPhone share recovers vs Huawei after 4-Q slip',    '2w'],
              ['LEGAL', 'Masimo appeal \u2014 Watch import ban discharged',      '3w'],
              ['ANALYST','Morgan Stanley raises PT $315 \u2192 $340',            '5w'],
            ].map(([k, t, w], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 30px', gap: 6, padding: '6px 0', borderBottom: `1px dashed ${WF_INK_FAINT}` }}>
                <Mono size={9} color={palette.accent} weight={700}>{k}</Mono>
                <Scribble size={14}>{t}</Scribble>
                <Mono size={9} color={WF_INK_FAINT} style={{ textAlign: 'right' }}>{w}</Mono>
              </div>
            ))}
          </SketchBox>

          <SketchBox style={{ padding: 14 }}>
            <Mono size={10} color={WF_INK_FAINT} weight={700} style={{ display: 'block', marginBottom: 6 }}>SEC FILINGS</Mono>
            {[
              ['10-Q',  'FY26 Q1',           'Jan 28'],
              ['8-K',   'CFO transition',    'Dec 14'],
              ['DEF 14A','Proxy statement',  'Dec 06'],
              ['10-K',  'FY25 annual',       'Oct 31'],
              ['Form 4','Insider \u00b7 Cook \u2014 sold 200k shares','Oct 04'],
              ['Form 4','Insider \u00b7 Maestri \u2014 retirement vest','Sep 22'],
            ].map(([k, t, d], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 60px', gap: 6, padding: '6px 0', borderBottom: `1px dashed ${WF_INK_FAINT}`, alignItems: 'baseline' }}>
                <Mono size={10} weight={700}>{k}</Mono>
                <Scribble size={13}>{t}</Scribble>
                <Mono size={9} color={WF_INK_FAINT} style={{ textAlign: 'right' }}>{d}</Mono>
              </div>
            ))}
          </SketchBox>
        </div>
      </div>

      {/* EXPLORE — quick jumps to other tabs */}
      <div style={{ padding: '0 22px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
          <Mono size={11} color={palette.accent} weight={700}>EXPLORE FURTHER</Mono>
          <div style={{ flex: 1, borderBottom: `1.2px dashed ${WF_INK_FAINT}`, marginBottom: 5 }}></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { tab: 'Supply chain', stat: '5 suppliers \u00b7 6 customers', sub: 'Map who AAPL buys from + sells to. All public.', color: palette.accent },
            { tab: 'Financials',   stat: '$397B rev \u00b7 26% net margin', sub: 'Income, balance, cash flow, 5Y context.', color: WF_INK },
            { tab: 'Patents',      stat: '2,341 grants this year',     sub: 'IP portfolio, R&D vs grants, litigation.', color: WF_INK },
            { tab: 'History',      stat: '87% match to MSFT \'14',     sub: 'What past patterns say about next 5Y.',     color: palette.accent2 },
          ].map(c => (
            <SketchBox key={c.tab} style={{ padding: 14 }}>
              <Mono size={9} color={c.color} weight={700}>OPEN \u2192</Mono>
              <Scribble size={20} weight={700} style={{ display: 'block', marginTop: 2 }}>{c.tab}</Scribble>
              <Mono size={11} weight={600} style={{ display: 'block', marginTop: 4 }}>{c.stat}</Mono>
              <Scribble size={13} color={WF_INK_SOFT} style={{ display: 'block', marginTop: 6, lineHeight: 1.3 }}>{c.sub}</Scribble>
            </SketchBox>
          ))}
        </div>
      </div>
    </CompanyDashShell>
  );
}

window.V8_Overview = V8_Overview;

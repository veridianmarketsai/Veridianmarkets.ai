// Main app shell — lays out all 5 wireframe variations on the design canvas
// with a Tweaks panel that controls typography (default: Times New Roman),
// accent palette, density, visible variations, and per-variation chrome.

// Tweak defaults — wrapped in the EDITMODE markers so the host can rewrite
// them on disk when the user changes a value (state survives reload).
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "displayFont": "Times New Roman",
  "bodyFont": "Times New Roman",
  "monoStays": true,
  "accent": "teal",
  "density": "regular",
  "showLogoScript": false,
  "showAnnotations": true,
  "visible": {
    "v1": false,
    "v2": false,
    "v3": false,
    "v4": false,
    "v5": true,
    "v6": true,
    "v7": true,
    "v8": true,
    "v9": true,
    "v10": true,
    "v11": true,
    "v12": true
  }
}/*EDITMODE-END*/;

// Font options — each maps to a CSS font-family stack. Picked to give the
// user a real range: serif (TNR / Spectral), sans (Helvetica / Inter),
// handwritten (Caveat / Architects). All Google Fonts already loaded in
// the <head>; system fonts (TNR, Helvetica, Georgia) work without download.
const FONT_OPTIONS = {
  'Times New Roman': '"Times New Roman", Times, serif',
  'Georgia':         'Georgia, "Times New Roman", serif',
  'Spectral':        '"Spectral", "Times New Roman", serif',
  'Helvetica':       'Helvetica, "Helvetica Neue", Arial, sans-serif',
  'Caveat':          '"Caveat", "Comic Sans MS", cursive',
  'Architects':      '"Architects Daughter", "Caveat", cursive',
  'Kalam':           '"Kalam", "Caveat", sans-serif',
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const palette = WF_PALETTES[t.accent] || WF_PALETTES.teal;

  // Push font + density choices to CSS variables on a wrapper that contains
  // both the panel chrome and the canvas — everything inside picks them up.
  const displayStack = FONT_OPTIONS[t.displayFont] || FONT_OPTIONS['Times New Roman'];
  const bodyStack    = FONT_OPTIONS[t.bodyFont]    || FONT_OPTIONS['Times New Roman'];
  // For handwritten display fonts a touch of negative tracking reads better;
  // serifs and sans-serifs want 0. Auto-detected here so the user doesn't
  // have to think about it.
  const handwritten  = ['Caveat', 'Architects', 'Kalam'].includes(t.displayFont);
  const tracking     = handwritten ? '-0.005em' : '0';

  const W = 1280;

  const variations = [
    { id: 'v1', label: 'V1 · News-forward',  desc: 'big story · data is secondary',  h: 980,  Comp: V1_Editorial },
    { id: 'v2', label: 'V2 · Time Machine',  desc: 'the 5-year lens leads',          h: 1280, Comp: V2_TimeMachine },
    { id: 'v3', label: 'V3 · Terminal grid', desc: 'equal panels · dense',           h: 1080, Comp: V3_Terminal },
    { id: 'v4', label: 'V4 · Memoir-first',  desc: 'thesis up top · one story',      h: 1320, Comp: V4_MemoirFirst },
    { id: 'v5', label: 'V5 · Sidebar app',   desc: 'workspace · persistent nav',     h: 980,  Comp: V5_Sidebar },
  ];

  // Page 2 sits in its own section (click-through from V5, not a landing-page
  // alternative). Same vocabulary, same sidebar shell. Each entry is a tab
  // view of the same company dashboard so the user can compare them.
  const pageTwo = [
    { id: 'v11', label: 'Company search',           desc: 'screener · filter → click a row to open',           h: 1280, Comp: V11_CompanySearch },
    { id: 'v12', label: 'Search · eye-pressed preview', desc: 'hover/click the eye on a row → quick preview',   h: 1280, Comp: V12_PreviewOverlay },
    { id: 'v8',  label: 'Dashboard · Overview',     desc: 'about · leadership · history of people',           h: 1700, Comp: V8_Overview    },
    { id: 'v6',  label: 'Dashboard · Supply chain',  desc: 'inputs → principle → customers (all public)',     h: 1380, Comp: V6_CompanyDash  },
    { id: 'v9',  label: 'Dashboard · Financials',    desc: 'income statement · 5Y · analogue overlay',       h: 1820, Comp: V9_Financials  },
    { id: 'v10', label: 'Dashboard · Patents',       desc: 'IP portfolio · supply-chain overlap',             h: 1820, Comp: V10_Patents    },
    { id: 'v7',  label: 'Dashboard · History',       desc: 'analogue analysis · risk/reward forecast',        h: 1640, Comp: V7_History     },
  ];

  const visibleVariations = variations.filter(v => t.visible[v.id] !== false);
  const visiblePageTwo    = pageTwo.filter(v => t.visible[v.id] !== false);

  // Density: pad/gap multiplier. We only act on density in the legend/roadmap
  // artboards and document the intent — wiring it through every line of the
  // existing variations would be churn for little gain at the wireframe stage.
  // (When the user picks a direction we'll honor density for real.)

  // Root inline style sets the CSS vars + hides annotation pins (.wf-pin)
  // via a tiny stylesheet rather than threading a prop through every Pin.
  return (
    <div style={{
      '--wf-display': displayStack,
      '--wf-body':    bodyStack,
      '--wf-serif':   t.displayFont === 'Caveat' || t.displayFont === 'Architects' || t.displayFont === 'Kalam'
                        ? '"Times New Roman", Times, serif'  // keep editorial italics readable when display is handwritten
                        : displayStack,
      '--wf-mono':    t.monoStays ? '"JetBrains Mono", "Menlo", monospace' : displayStack,
      '--wf-display-tracking': tracking,
      width: '100%', height: '100%',
    }}>
      {/* Annotation visibility via stylesheet so we don't have to refactor
          every Pin component to take a prop. */}
      {!t.showAnnotations && (
        <style>{`.wf-pin, [data-wf-pin]{display:none !important}`}</style>
      )}

      <DesignCanvas>
        <DCSection
          id="landing"
          title="Page 1 — Landing"
          subtitle={`V5 is the chosen direction · other variations hidden by default · typeface: ${t.displayFont}`}
        >
          {visibleVariations.map(v => (
            <DCArtboard key={v.id} id={v.id} label={v.label} sublabel={v.desc} width={W} height={v.h}>
              <v.Comp palette={palette} />
            </DCArtboard>
          ))}
        </DCSection>

        <DCSection
          id="company"
          title="Page 2 — Company dashboard"
          subtitle="Click a ticker from V5 → land here. The supply chain is the main attraction."
        >
          {visiblePageTwo.map(v => (
            <DCArtboard key={v.id} id={v.id} label={v.label} sublabel={v.desc} width={W} height={v.h}>
              <v.Comp palette={palette} />
            </DCArtboard>
          ))}
        </DCSection>

        <DCSection
          id="notes"
          title="How to read these"
          subtitle="The variations differ in ONE axis: what's biggest on the page."
        >
          <DCArtboard id="legend" label="Legend & next steps" width={560} height={500}>
            <Legend palette={palette} />
          </DCArtboard>
          <DCArtboard id="roadmap" label="Page roadmap" width={560} height={500}>
            <Roadmap palette={palette} />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Typography" />
        <TweakSelect
          label="Display font"
          value={t.displayFont}
          options={Object.keys(FONT_OPTIONS)}
          onChange={v => setTweak({ displayFont: v, bodyFont: v })}
        />
        <TweakSelect
          label="Body font"
          value={t.bodyFont}
          options={Object.keys(FONT_OPTIONS)}
          onChange={v => setTweak('bodyFont', v)}
        />
        <TweakToggle
          label="Mono for numbers"
          value={t.monoStays}
          onChange={v => setTweak('monoStays', v)}
        />

        <TweakSection label="Color" />
        <TweakRadio
          label="Accent"
          value={t.accent}
          options={[
            { value: 'teal',   label: 'Teal' },
            { value: 'ink',    label: 'Ink' },
            { value: 'forest', label: 'Forest' },
          ]}
          onChange={v => setTweak('accent', v)}
        />

        <TweakSection label="Display" />
        <TweakRadio
          label="Density"
          value={t.density}
          options={['compact', 'regular', 'comfy']}
          onChange={v => setTweak('density', v)}
        />
        <TweakToggle
          label="Wireframe notes"
          value={t.showAnnotations}
          onChange={v => setTweak('showAnnotations', v)}
        />

        <TweakSection label="Show variations" />
        {['v1','v2','v3','v4','v5'].map(id => (
          <TweakToggle
            key={id}
            label={id.toUpperCase() + ' · ' + variations.find(x => x.id === id).label.split('· ')[1]}
            value={t.visible[id] !== false}
            onChange={v => setTweak('visible', { ...t.visible, [id]: v })}
          />
        ))}
        <TweakToggle
          label="Page 2 · Company search"
          value={t.visible.v11 !== false}
          onChange={v => setTweak('visible', { ...t.visible, v11: v })}
        />
        <TweakToggle
          label="Page 2 · Search preview popover"
          value={t.visible.v12 !== false}
          onChange={v => setTweak('visible', { ...t.visible, v12: v })}
        />
        <TweakToggle
          label="Page 2 · Overview tab"
          value={t.visible.v8 !== false}
          onChange={v => setTweak('visible', { ...t.visible, v8: v })}
        />
        <TweakToggle
          label="Page 2 · Supply chain tab"
          value={t.visible.v6 !== false}
          onChange={v => setTweak('visible', { ...t.visible, v6: v })}
        />
        <TweakToggle
          label="Page 2 · Financials tab"
          value={t.visible.v9 !== false}
          onChange={v => setTweak('visible', { ...t.visible, v9: v })}
        />
        <TweakToggle
          label="Page 2 · Patents tab"
          value={t.visible.v10 !== false}
          onChange={v => setTweak('visible', { ...t.visible, v10: v })}
        />
        <TweakToggle
          label="Page 2 · History tab"
          value={t.visible.v7 !== false}
          onChange={v => setTweak('visible', { ...t.visible, v7: v })}
        />
      </TweaksPanel>
    </div>
  );
}

// Mark Pin so the annotations toggle can hide them via stylesheet. Override
// the export from primitives with one that carries the .wf-pin class.
window.Pin = function Pin({ children, color = '#b35a3a', side = 'right', style = {} }) {
  return (
    <div className="wf-pin" style={{
      position: 'absolute',
      display: 'flex', alignItems: 'flex-start', gap: 6,
      fontFamily: 'var(--wf-display)',
      fontStyle: 'italic',
      fontSize: 14,
      color,
      lineHeight: 1.15,
      ...style,
    }}>
      <span style={{ flexShrink: 0, fontSize: 18, lineHeight: 1 }}>{side === 'left' ? '←' : side === 'top' ? '↑' : '→'}</span>
      <span>{children}</span>
    </div>
  );
};

// ── Legend / Roadmap ───────────────────────────────────────────────────────

function Legend({ palette }) {
  return (
    <div style={{ padding: 24, fontFamily: 'var(--wf-body)', background: WF_PAPER, width: '100%', height: '100%', boxSizing: 'border-box' }}>
      <Scribble size={30} weight={700} style={{ display: 'block', marginBottom: 12, lineHeight: 1.05 }}>How to read these</Scribble>
      <div style={{ fontFamily: 'var(--wf-body)', fontSize: 15, color: WF_INK_SOFT, lineHeight: 1.4, marginBottom: 18 }}>
        Wireframes are deliberately rough — focus on <em>what's biggest</em>, not on type or color.
        Anything <Hatched style={{ display: 'inline-block', width: 28, height: 14, verticalAlign: 'middle', borderWidth: 1 }} />{' '}
        hatched is a placeholder for an image or chart. Use the Tweaks panel to swap the font
        across all five layouts at once.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          ['V1 · News-forward',  'The story wins. Market data is a side rail. Closest to Yahoo Finance\'s today-feel.'],
          ['V2 · Time Machine',  'Your unique angle (5-year lens) is the hero. Everything supports the thesis chart.'],
          ['V3 · Terminal grid', 'Bloomberg-style. Every module gets equal weight. For power users, dense.'],
          ['V4 · Memoir-first',  'Editorial. Thesis quote leads, one chart-story below. Quietest, most "narrative".'],
          ['V5 · Sidebar app',   'Workspace. Persistent left nav suggests this is a tool, not a magazine.'],
        ].map(([h, b]) => (
          <div key={h} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 10 }}>
            <Scribble size={15} weight={700} color={palette.accent}>{h}</Scribble>
            <span style={{ fontFamily: 'var(--wf-body)', fontSize: 14, color: WF_INK_SOFT, lineHeight: 1.3 }}>{b}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, paddingTop: 12, borderTop: `1.2px dashed ${WF_INK_FAINT}` }}>
        <Scribble size={17} weight={700} style={{ display: 'block', marginBottom: 6 }}>Next, once you pick a direction:</Scribble>
        <div style={{ fontFamily: 'var(--wf-body)', fontSize: 14, color: WF_INK_SOFT, lineHeight: 1.4 }}>
          → commit to a type system (the Tweaks panel is the playground)<br/>
          → commit to a chart styling once real data is wired in<br/>
          → design Page 2 (screener) and Page 3 (memoir) in the same vocabulary
        </div>
      </div>
    </div>
  );
}

function Roadmap({ palette }) {
  const pages = [
    { num: '01', title: 'Front page',     state: 'wireframed',       notes: 'Five directions on the canvas. Pick one (or mix two).' },
    { num: '02', title: 'Stock screener', state: 'next',             notes: 'Filterable table → click a row to open dashboard.' },
    { num: '03', title: 'Company dash',   state: 'next · later',     notes: 'Balance sheet, cash flow, patents, people history. SPLC-GO-like inputs/outputs.' },
    { num: '04', title: 'Founder memoir', state: 'wireframe later',  notes: 'A real essay page. Teased from every other page.' },
    { num: '05', title: 'How To · Learn', state: 'wireframe later',  notes: 'Beginner on-ramp. Glossary + threaded essays.' },
    { num: '06', title: 'Calendar',       state: 'wireframe later',  notes: 'Econ events + earnings + historical analogue dates.' },
  ];

  return (
    <div style={{ padding: 24, fontFamily: 'var(--wf-body)', background: WF_PAPER, width: '100%', height: '100%', boxSizing: 'border-box' }}>
      <Scribble size={30} weight={700} style={{ display: 'block', marginBottom: 4, lineHeight: 1.05 }}>Page roadmap</Scribble>
      <div style={{ fontFamily: 'var(--wf-body)', fontSize: 14, color: WF_INK_SOFT, marginBottom: 14 }}>
        From your brief — what we'd wireframe next once the front-page direction lands.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {pages.map((p, i) => (
          <div key={p.num} style={{ display: 'grid', gridTemplateColumns: '30px 1fr 110px', gap: 10, padding: '10px 0', borderBottom: `1px dashed ${WF_INK_FAINT}`, alignItems: 'baseline' }}>
            <Mono size={11} color={WF_INK_FAINT} weight={700}>{p.num}</Mono>
            <div>
              <Scribble size={18} weight={700}>{p.title}</Scribble>
              <div style={{ fontFamily: 'var(--wf-body)', fontSize: 13, color: WF_INK_SOFT, lineHeight: 1.3, marginTop: 2 }}>{p.notes}</div>
            </div>
            <Mono size={9} weight={700} color={i === 0 ? palette.accent : WF_INK_FAINT} style={{ textAlign: 'right' }}>
              {p.state.toUpperCase()}
            </Mono>
          </div>
        ))}
      </div>
    </div>
  );
}

// Mark all `<Pin>` instances so the annotations toggle can hide them with a
// single stylesheet rule.
window.Pin = function Pin({ children, color = '#b35a3a', side = 'right', style = {} }) {
  return (
    <div className="wf-pin" style={{
      position: 'absolute',
      display: 'flex', alignItems: 'flex-start', gap: 6,
      fontFamily: 'var(--wf-display)',
      fontStyle: 'italic',
      fontSize: 14,
      color,
      lineHeight: 1.15,
      ...style,
    }}>
      <span style={{ flexShrink: 0, fontSize: 18, lineHeight: 1 }}>{side === 'left' ? '←' : side === 'top' ? '↑' : '→'}</span>
      <span>{children}</span>
    </div>
  );
};

// Boot — guard against double-init when Babel re-runs the script
const rootEl = document.getElementById('root');
if (!rootEl._wfRoot) {
  rootEl._wfRoot = ReactDOM.createRoot(rootEl);
}
rootEl._wfRoot.render(<App />);

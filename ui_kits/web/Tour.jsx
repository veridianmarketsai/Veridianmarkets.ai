// Veridian Markets — Interactive product tour engine.
// Triggered via window.__vmStartTour('tourId') from Learn.jsx or anywhere.
// Navigates to each page, spotlights DOM elements, and walks the user step by step.
const { useState: useStateTour, useEffect: useEffectTour, useRef: useRefTour, useCallback: useCallbackTour } = React;

// ── Tour data ─────────────────────────────────────────────────────────────────
const TOURS = {
  front: {
    title: 'The Home Page',
    steps: [
      {
        route: 'front',
        sel: '[data-tour="vm-nav-rail"]',
        title: 'Navigation sidebar',
        body: 'The left rail is your command center. Every section of Veridian is one click away — Search, News, Calendar, your Portfolio, and more. On mobile, tap the menu button to open it.',
      },
      {
        route: 'front',
        sel: '[data-tour="vm-market-strip"]',
        title: 'Live market strip',
        body: 'A scrolling ticker band showing key indices and stocks with live prices and changes. Drag it left or right to browse. It auto-scrolls when you let go.',
      },
      {
        route: 'front',
        sel: '[data-tour="vm-story-tiles"]',
        title: 'Editorial story tiles',
        body: 'Each tile is a Veridian story — a market event explained through its historical parallel. Browse the tiles to see what\'s moving today, and what happened last time.',
      },
      {
        route: 'front',
        sel: '[data-tour="vm-market-recap"]',
        title: 'Market recap',
        body: 'A daily briefing on what moved the markets today. Tap to expand it and read the full recap, including sector moves and macro context.',
      },
      {
        route: 'front',
        sel: '[data-tour="vm-company-list"]',
        title: 'Company list',
        body: 'Browse 4,900+ public companies. Click any row to preview it, then tap the dashboard icon to open the full company page — financials, supply chain, patents, and history all in one place.',
      },
    ],
  },

  screener: {
    title: 'The Search Page',
    steps: [
      {
        route: 'screener',
        sel: '[data-tour="vm-screener-search"]',
        title: 'Search bar',
        body: 'Type a ticker (e.g. AAPL), a company name (e.g. Apple), or a keyword. Results filter live as you type. You can also search by sector, era, or historical event.',
      },
      {
        route: 'screener',
        sel: '[data-tour="vm-screener-filters"]',
        title: 'Smart filters',
        body: 'Narrow results by sector, market cap, region, EPS growth, P/E ratio, or historical analogue match score. Stack multiple filters together — all active filters show as removable pills.',
      },
      {
        route: 'screener',
        sel: '[data-tour="vm-screener-results"]',
        title: 'Results list',
        body: 'Every matched company with ticker, price, and % change. Click the eye icon to preview, the network icon to see its supply chain, or "Dashboard" to open the full company view.',
      },
    ],
  },

  supply: {
    title: 'The Dependency Map',
    steps: [
      {
        route: 'supply',
        sel: '[data-tour="vm-supply-filters"]',
        title: 'Map filters',
        body: 'Toggle between All nodes, Companies only, or External factors like commodities, logistics, and macro forces. Filters update the map instantly without reloading.',
      },
      {
        route: 'supply',
        sel: '[data-tour="vm-supply-canvas"]',
        title: 'The dependency map',
        body: 'The principle company sits in the centre. Suppliers and inputs are on the left; customers and channels are on the right. Hover any node for detail — click it to make that company the new principle and trace the chain further.',
      },
    ],
  },

  dashboard: {
    title: 'The Company Dashboard',
    steps: [
      {
        route: 'dashboard',
        sel: '[data-tour="vm-company-head"]',
        title: 'Company header',
        body: 'Ticker, full name, live price, and % change — all at a glance. The breadcrumb trail above tracks your drill path through linked companies. Click any crumb to jump back.',
      },
      {
        route: 'dashboard',
        sel: '[data-tour="vm-company-tabs"]',
        title: 'Six views in one dashboard',
        body: 'Overview, Supply chain, Financials, Patents, History, and News. Each tab gives you a complete angle on the company. Drag the tab strip to scroll on smaller screens.',
      },
      {
        route: 'dashboard',
        click: { tabText: 'Financials' },
        sel: '[data-tour="vm-financials-toolbar"]',
        title: 'Financials toolbar',
        body: 'Switch between Income Statement, Balance Sheet, and Cash Flow. Toggle the %Δ and $Δ columns to see period-over-period changes. Switch between Annual and Quarterly periods.',
      },
      {
        route: 'dashboard',
        click: { tabText: 'Financials' },
        sel: '[data-tour="vm-analysis-btn"]',
        title: 'Chart analysis',
        body: 'Opens an interactive chart library with 30+ visualisations — revenue trends, margin evolution, cash flow waterfalls, and more. Click any metric to chart it across time.',
      },
    ],
  },

  news: {
    title: 'The News Feed',
    steps: [
      {
        route: 'news',
        sel: null,
        title: 'The News Feed',
        body: 'A curated feed of market-moving stories. Every article is tagged by ticker and sector so you can filter to what matters to you. Click any story to read it in full.',
      },
    ],
  },

  calendar: {
    title: 'The Earnings Calendar',
    steps: [
      {
        route: 'calendar',
        sel: null,
        title: 'The Earnings Calendar',
        body: 'Upcoming earnings announcements, dividend ex-dates, and macro events — laid out week by week. Click any event to see the historical context for that company around past earnings dates.',
      },
    ],
  },

  memoir: {
    title: 'The Memoir',
    steps: [
      {
        route: 'memoir',
        sel: null,
        title: 'The Veridian Memoir',
        body: 'A long-form, editorial read about markets, history, and decision-making under uncertainty. Updated with new chapters regularly. Best read slowly — like a good book.',
      },
    ],
  },

  myportfolio: {
    title: 'My Account',
    steps: [
      {
        route: 'myportfolio',
        sel: null,
        title: 'My Account',
        body: 'Connect a broker to import your portfolio. Veridian matches every holding to its closest historical parallel and shows you what happened next — so you can make more informed decisions today.',
      },
    ],
  },

  mybusiness: {
    title: 'My Business Dashboard',
    steps: [
      {
        route: 'mybusiness',
        sel: null,
        title: 'My Business Dashboard',
        body: 'A private workspace for founders and operators. Track your own company\'s KPIs, benchmark against public comps, and see how your business metrics compare to historical market cycles.',
      },
    ],
  },

  settings: {
    title: 'Settings & Your Account',
    steps: [
      {
        route: 'settings',
        sel: '[data-tour="vm-settings-nav"]',
        title: 'Settings',
        body: 'All your account settings in one place. Personal details, password and security, connected brokers, notification preferences, appearance (light / dark theme), privacy controls, and more.',
      },
    ],
  },

  learn: {
    title: 'The Learn Hub',
    steps: [
      {
        route: 'learn',
        sel: '[data-tour="vm-learn-filter"]',
        title: 'Course filter',
        body: 'Filter the course library by category — Getting Started, Charts & Data, Fundamentals, and more. Use the search bar to find a specific topic quickly.',
      },
      {
        route: 'learn',
        sel: '[data-tour="vm-learn-cards"]',
        title: 'Course cards',
        body: 'Each card is a mini-course. Click Start to begin. Courses marked with a compass icon launch an interactive product tour that opens the relevant page and guides you through every feature live.',
      },
    ],
  },
};

// ── Spotlight overlay ─────────────────────────────────────────────────────────
function TourSpotlight({ rect }) {
  if (!rect) return null;
  const pad = 8;
  const x = rect.left - pad, y = rect.top - pad;
  const w = rect.width + pad * 2, h = rect.height + pad * 2;
  const rx = 10;
  return ReactDOM.createPortal(
    <>
      <svg style={{ position:'fixed', inset:0, width:'100%', height:'100%', zIndex:9998, pointerEvents:'none' }}
        xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="vm-tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect x={x} y={y} width={w} height={h} rx={rx} fill="black" />
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(20,18,14,0.76)" mask="url(#vm-tour-mask)" />
      </svg>
      <div style={{
        position:'fixed', left:x, top:y, width:w, height:h,
        border:`2px solid ${VM.teal}`, borderRadius:rx, zIndex:9999, pointerEvents:'none',
        boxShadow:`0 0 0 4px rgba(77,160,126,0.22), 0 8px 40px rgba(0,0,0,0.38)`,
      }} />
    </>,
    document.body
  );
}

// dark backdrop shown when there's no spotlight (sel: null steps)
function TourBackdrop() {
  return ReactDOM.createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:9997, background:'rgba(20,18,14,0.62)', pointerEvents:'none' }} />,
    document.body
  );
}

// ── Tooltip card ─────────────────────────────────────────────────────────────
function TourTooltip({ step, stepIdx, total, onPrev, onNext, onClose, rect }) {
  const W = 316;
  const GAP = 16;
  const vw = window.innerWidth, vh = window.innerHeight;

  let top, left;
  if (!rect) {
    top = vh / 2 - 120;
    left = vw / 2 - W / 2;
  } else {
    const pad = 8;
    const elBottom = rect.top + rect.height + pad;
    const elTop    = rect.top - pad;
    // prefer below; fall back above
    if (elBottom + 230 < vh) {
      top = elBottom + GAP;
    } else {
      top = elTop - 230 - GAP;
    }
    left = rect.left + rect.width / 2 - W / 2;
    left = Math.max(12, Math.min(vw - W - 12, left));
    top  = Math.max(12, Math.min(vh - 260, top));
  }

  const isFirst = stepIdx === 0;
  const isLast  = stepIdx === total - 1;

  return ReactDOM.createPortal(
    <div style={{
      position:'fixed', top, left, width:W, zIndex:10000,
      background:VM.paper, border:`1px solid ${VM.border}`, borderRadius:14,
      boxShadow:'0 20px 60px rgba(0,0,0,0.36)', padding:'18px 20px 16px',
    }}>
      {/* progress bar */}
      <div style={{ height:3, borderRadius:999, background:VM.paperDeep, marginBottom:14, overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:999, background:VM.teal,
          width:`${((stepIdx + 1) / total) * 100}%`, transition:'width 0.3s ease' }} />
      </div>
      {/* step counter + close */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <span style={{ fontFamily:VM.mono, fontSize:9.5, letterSpacing:'0.08em', textTransform:'uppercase', color:VM.ink3 }}>
          Step {stepIdx + 1} of {total}
        </span>
        <button onClick={onClose} title="Exit tour" style={{
          width:24, height:24, borderRadius:999, border:'none', background:'transparent',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:VM.ink3, padding:0,
        }}>
          <i className="ti ti-x" style={{ fontSize:14 }}></i>
        </button>
      </div>
      {/* title */}
      <h3 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:18, margin:'0 0 7px', color:VM.ink, lineHeight:1.15 }}>
        {step.title}
      </h3>
      {/* body */}
      <p style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink2, margin:'0 0 16px', lineHeight:1.6 }}>
        {step.body}
      </p>
      {/* nav */}
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
        {!isFirst && (
          <button onClick={onPrev} style={{
            fontFamily:VM.serif, fontSize:13, padding:'6px 14px', borderRadius:7,
            border:`1px solid ${VM.border}`, background:'transparent', color:VM.ink2, cursor:'pointer',
          }}>
            ← Back
          </button>
        )}
        <button onClick={onNext} style={{
          fontFamily:VM.serif, fontSize:13, padding:'6px 18px', borderRadius:7,
          border:'none', background:VM.forest, color:VM.paperWarm, cursor:'pointer', fontWeight:600,
        }}>
          {isLast ? 'Finish ✓' : 'Next →'}
        </button>
      </div>
    </div>,
    document.body
  );
}

// ── TourEngine ────────────────────────────────────────────────────────────────
function TourEngine({ tourId, onDone }) {
  const tour = tourId ? TOURS[tourId] : null;
  const [stepIdx, setStepIdx]     = useStateTour(0);
  const [targetRect, setTargetRect] = useStateTour(null);
  const mountedRef = useRefTour(true);

  useEffectTour(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const resolveStep = useCallbackTour(async (idx) => {
    if (!tour) return;
    const step = tour.steps[idx];
    if (!step) return;
    setTargetRect(null);

    // navigate to the correct page
    if (window.__vmGoForTour) {
      if (step.route === 'dashboard') {
        const co = window.VM_COMPANIES && window.VM_COMPANIES[0];
        window.__vmGoForTour('dashboard', co);
      } else {
        window.__vmGoForTour(step.route);
      }
    }

    // let the page render
    await new Promise(r => setTimeout(r, 750));
    if (!mountedRef.current) return;

    // click a dashboard tab if required
    if (step.click && step.click.tabText) {
      const tabs = document.querySelectorAll('[data-tour="vm-company-tabs"] span');
      for (const el of tabs) {
        if (el.textContent.trim() === step.click.tabText) { el.click(); break; }
      }
      await new Promise(r => setTimeout(r, 500));
      if (!mountedRef.current) return;
    }

    // locate and highlight the element
    if (step.sel) {
      const el = document.querySelector(step.sel);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await new Promise(r => setTimeout(r, 380));
        if (!mountedRef.current) return;
        const r = el.getBoundingClientRect();
        setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        return;
      }
    }
    // no selector or element not found — centered tooltip, no spotlight
    setTargetRect(null);
  }, [tour]);

  useEffectTour(() => {
    if (tour) resolveStep(stepIdx);
  }, [stepIdx, tourId]);

  if (!tour) return null;
  const step = tour.steps[stepIdx];
  const handleNext = () => {
    if (stepIdx < tour.steps.length - 1) setStepIdx(i => i + 1);
    else onDone();
  };

  return (
    <>
      {targetRect ? <TourSpotlight rect={targetRect} /> : <TourBackdrop />}
      <TourTooltip
        step={step}
        stepIdx={stepIdx}
        total={tour.steps.length}
        onPrev={() => stepIdx > 0 && setStepIdx(i => i - 1)}
        onNext={handleNext}
        onClose={onDone}
        rect={targetRect}
      />
    </>
  );
}

Object.assign(window, { TourEngine, TOURS });

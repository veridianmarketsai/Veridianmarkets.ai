// Veridian Markets — mock dataset.
// Fictional/illustrative numbers; not market data.
//
// ARCHITECTURE:
//   VM_INDEX      — global market strip (not per-company)
//   VM_COMPANIES  — company list used by Screener, FrontPage, etc.
//   VM_COMPANY_DATA — all per-company detail, keyed by ticker
//   resolveCompany(ticker) — THE DATA SEAM.
//     Today: returns mock from VM_COMPANY_DATA.
//     Later: replace the body with fetch('/api/company/${ticker}').
//     All tabs call this; none read VM_COMPANY_DATA directly.

const VM_INDEX = [
  { sym:'S&P 500', val:'5,247.10', chg:'+0.42%', dir:'up'   },
  { sym:'NASDAQ',  val:'16,542',   chg:'+0.71%', dir:'up'   },
  { sym:'DOW',     val:'38,991',   chg:'-0.18%', dir:'down' },
  { sym:'GOLD',    val:'2,341',    chg:'+0.88%', dir:'up'   },
  { sym:'OIL',     val:'$78.14',   chg:'+1.40%', dir:'up'   },
  { sym:'BTC',     val:'69,420',   chg:'-2.31%', dir:'down' },
  { sym:'EUR/USD', val:'1.0842',   chg:'-0.09%', dir:'down' },
  { sym:'10Y UST', val:'4.21%',    chg:'-0.03',  dir:'down' },
];

const VM_COMPANIES = [
  { ticker:'AAPL', name:'Apple Inc.',         sector:'Tech · Consumer',       cap:'$4.54T', price:'308.82', chg:'+1.26%', dir:'up',
    sub:'Consumer electronics', analogue:'MSFT', analogueYear:'2014', match:87,
    inputs:[{t:'TSM',d:'chips'},{t:'2317.TW',d:'assembly'},{t:'LPL',d:'OLED'},{t:'SONY',d:'sensors'},{t:'QCOM',d:'modems'}],
    external:[{t:'MAERSK.B',d:'shipping'},{t:'XOM',d:'energy'},{t:'MP',d:'rare-earth'},{t:'ALB',d:'battery'}],
    customers:[{t:'TMUS',d:'carrier'},{t:'VZ',d:'carrier'},{t:'BBY',d:'retail'},{t:'COST',d:'retail'},{t:'AMZN',d:'retail+cloud'}],
    competitors:[{t:'005930.KS',d:'Samsung'},{t:'1810.HK',d:'Xiaomi'},{t:'GOOGL',d:'Alphabet'},{t:'MSFT',d:'Microsoft'}] },
  { ticker:'NVDA', name:'NVIDIA Corp.',       sector:'Tech · Semiconductors', cap:'$2.32T', price:'945.10', chg:'+3.40%', dir:'up',   sub:'Accelerated computing', analogue:'CSCO', analogueYear:'1999', match:64 },
  { ticker:'MSFT', name:'Microsoft Corp.',    sector:'Tech · Software',       cap:'$3.17T', price:'427.15', chg:'+0.84%', dir:'up',   sub:'Cloud + software',      analogue:'IBM',  analogueYear:'2004', match:71 },
  { ticker:'GOOGL',name:'Alphabet Inc.',      sector:'Tech · Advertising',    cap:'$2.13T', price:'172.04', chg:'-0.42%', dir:'down', sub:'Search + ads',           analogue:'AAPL', analogueYear:'2013', match:59 },
  { ticker:'AMZN', name:'Amazon.com Inc.',    sector:'Retail · Cloud',        cap:'$1.93T', price:'185.30', chg:'+0.91%', dir:'up',   sub:'Marketplace + AWS',      analogue:'WMT',  analogueYear:'2001', match:55 },
  { ticker:'META', name:'Meta Platforms',     sector:'Tech · Social',         cap:'$1.27T', price:'498.22', chg:'+1.87%', dir:'up',   sub:'Social + ads',           analogue:'GOOGL',analogueYear:'2015', match:62 },
  { ticker:'TSLA', name:'Tesla, Inc.',        sector:'Auto · EVs',            cap:'$580B',  price:'182.04', chg:'-2.14%', dir:'down', sub:'EVs + energy',           analogue:'AMZN', analogueYear:'2014', match:48 },
  { ticker:'BRK.B',name:'Berkshire Hathaway', sector:'Conglomerate',          cap:'$903B',  price:'418.92', chg:'+0.31%', dir:'up',   sub:'Insurance + holdings',   analogue:'GE',   analogueYear:'1998', match:51 },
  { ticker:'AVGO', name:'Broadcom Inc.',      sector:'Tech · Semiconductors', cap:'$623B',  price:'1342.0', chg:'+2.10%', dir:'up',   sub:'Semis + software',       analogue:'TXN',  analogueYear:'2010', match:57 },
  { ticker:'JPM',  name:'JPMorgan Chase',     sector:'Finance · Banking',     cap:'$615B',  price:'215.40', chg:'+0.18%', dir:'up',   sub:'Universal bank',         analogue:'WFC',  analogueYear:'2006', match:44 },
  { ticker:'V',    name:'Visa Inc.',          sector:'Finance · Payments',    cap:'$560B',  price:'275.18', chg:'+0.55%', dir:'up',   sub:'Payment rails',          analogue:'MA',   analogueYear:'2012', match:66 },

  // Indices / commodities / forex — added for testing the search list (not equities).
  { ticker:'SPX',    name:'S&P 500 Index',     sector:'Index · US large-cap',  cap:'—', price:'5,247.10', chg:'+0.42%', dir:'up',   sub:'US 500 large-caps',   analogue:'1995', analogueYear:'1995', match:61 },
  { ticker:'GOLD',   name:'Gold · spot',       sector:'Commodity · Metals',    cap:'—', price:'2,341',    chg:'+0.88%', dir:'up',   sub:'Safe-haven metal',    analogue:'1979', analogueYear:'1979', match:58 },
  { ticker:'WTI',    name:'Crude Oil · WTI',   sector:'Commodity · Energy',    cap:'—', price:'78.14',    chg:'+1.40%', dir:'up',   sub:'US benchmark crude',  analogue:'1973', analogueYear:'1973', match:53 },
  { ticker:'EURUSD', name:'Euro / US Dollar',  sector:'Forex · Majors',        cap:'—', price:'1.0842',   chg:'-0.09%', dir:'down', sub:'EUR/USD spot',        analogue:'2002', analogueYear:'2002', match:47 },
  { ticker:'GBPUSD', name:'Pound / US Dollar', sector:'Forex · Majors',        cap:'—', price:'1.2710',   chg:'-0.12%', dir:'down', sub:'GBP/USD spot',        analogue:'1992', analogueYear:'1992', match:45 },
  { ticker:'USDJPY', name:'US Dollar / Yen',   sector:'Forex · Majors',        cap:'—', price:'156.30',   chg:'+0.21%', dir:'up',   sub:'USD/JPY spot',        analogue:'1998', analogueYear:'1998', match:49 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Per-company detail. Add a new key when a new company is wired up.
// Shape must stay consistent across tickers — tabs depend on it.
// ─────────────────────────────────────────────────────────────────────────────
const VM_COMPANY_DATA = {
  AAPL: {
    overview: {
      description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories. It also operates one of the world\'s largest software-services businesses — App Store, iCloud, Apple Music, advertising — now ~22% of revenue and growing roughly twice as fast as hardware.',
      sector:      'Technology · Consumer electronics',
      subIndustry: 'Mobile hardware + Services',
      index:       'S&P 500 · NDX 100 · DJIA',
      country:     'United States',
    },
    quick: [
      ['Founded',       '1 April 1976'],
      ['HQ',            'Cupertino, CA'],
      ['Employees',     '161,000'],
      ['Fiscal year',   'Ends Sep · FY = Oct–Sep'],
      ['Exchange',      'NASDAQ · since Dec 1980'],
      ['Auditor',       'Ernst & Young'],
      ['Lead bank',     'Goldman Sachs · JPM'],
      ['Next earnings', 'Jan 28 · FY26 Q1'],
    ],
    revenueMix: [
      { k:'iPhone',    v:52, c:'#1D4E3A' },
      { k:'Services',  v:22, c:'#C46A3B' },
      { k:'Wearables', v:10, c:'#8A857D' },
      { k:'Mac',       v:9,  c:'#2D5E5A' },
      { k:'iPad',      v:7,  c:'#B6AFA2' },
    ],
    revenueMixMeta: 'FY2025 · $397B',
    leaders: [
      { role:'CEO',      name:'Tim Cook',      since:'Aug 2011', note:'Replaced Jobs. Operations specialist; ran supply chain since 1998.' },
      { role:'CFO',      name:'Kevan Parekh',  since:'Jan 2025', note:'Internal promote; ran corporate finance previously.' },
      { role:'COO',      name:'Jeff Williams', since:'Dec 2015', note:'Apple Watch lead. Often-floated CEO successor.' },
      { role:'CHIEF HW', name:'John Ternus',   since:'Jan 2021', note:'iPhone, iPad, Mac engineering. Rising profile.' },
    ],
    financials: {
      periods: ['TTM', 'FY2025', 'FY2024', 'FY2023', 'FY2022'],
      income: [
        { k:'Total revenue',         v:[397000,391000,383285,394328,365817], b:false       },
        { k:'Cost of revenue',       v:[211000,207000,201471,212981,201471], b:false, in:1 },
        { k:'Gross profit',          v:[186000,184000,181814,181347,164346], b:true        },
        { k:'Operating expense',     v:[58000, 57000, 56054, 54847, 51345],  b:false, in:1 },
        { k:'Operating income',      v:[128000,127000,125760,126500,112901], b:true        },
        { k:'Interest expense, net', v:[-4800, -4600, -3765, -2931, -2692],  b:false, in:1 },
        { k:'Pre-tax income',        v:[124000,123000,121862,116918,111884], b:false       },
        { k:'Tax provision',         v:[29000, 28900, 29584, 29749, 25371],  b:false, in:1 },
        { k:'Net income',            v:[95000, 94000, 93736, 96995, 90000],  b:true        },
        { k:'EPS diluted',           v:[6.51,  6.42,  6.08,  6.11,  5.61],  b:false, fmt:'eps' },
        { k:'EBITDA',                v:[139000,138000,134661,130071,123000], b:false       },
      ],
      balance: [
        { k:'Cash & equivalents',    v:[67000, 65000, 29965, 29965, 23646],  b:false       },
        { k:'Short-term investments',v:[21000, 19000, 35228, 31590, 24658],  b:false, in:1 },
        { k:'Total current assets',  v:[152000,149000,152987,143566,135405], b:true        },
        { k:'Total assets',          v:[353000,352000,364980,352583,352755], b:true        },
        { k:'Long-term debt',        v:[98000, 97000, 85750, 98959,109106],  b:false, in:1 },
        { k:'Total liabilities',     v:[290000,288000,308030,290437,302083], b:true        },
        { k:'Shareholders equity',   v:[62000, 63000, 56950, 62146, 50672],  b:true        },
      ],
      cashflow: [
        { k:'Operating cash flow',   v:[118000,116000,118254,114301, 99803], b:true        },
        { k:'Capital expenditure',   v:[-11000,-11000,-9447,-10959,-10708],  b:false, in:1 },
        { k:'Free cash flow',        v:[107000,105000,108807,103342, 89095], b:true        },
        { k:'Investing activities',  v:[-18000,-17000,-3236,-19891,-22354],  b:false, in:1 },
        { k:'Financing activities',  v:[-99000,-98000,-112,-95984,-77560],   b:false, in:1 },
        { k:'Net change in cash',    v:[1000,  1000,  1000, -1571,-10952],   b:false       },
      ],
    },
    patents: {
      stats: [
        ['Active patents', '2,334'],
        ['Filed FY2025',   '820 ∂'],
        ['Granted FY2025', '512'],
        ['In litigation',  '14'],
      ],
      cats: [
        { k:'Semiconductor design', pct:22, n:515, c:'#1D4E3A' },
        { k:'Display · optical',    pct:16, n:374, c:'#C46A3B' },
        { k:'Wireless · RF',        pct:13, n:305, c:'#1F1D1A' },
        { k:'AI · on-device ML',    pct:12, n:281, c:'#2D5E5A' },
        { k:'Battery · power',      pct:10, n:234, c:'#B35A3A' },
        { k:'Health · sensors',     pct:9,  n:211, c:'#8A857D' },
        { k:'Camera · imaging',     pct:8,  n:187, c:'#185FA5' },
        { k:'Audio · spatial',      pct:5,  n:117, c:'#B6AFA2' },
      ],
      filings: [
        { y:'FY20', n:2380 }, { y:'FY21', n:2614 }, { y:'FY22', n:2190 },
        { y:'FY23', n:2340 }, { y:'FY24', n:2512 }, { y:'FY25', n:820, partial:true },
      ],
      notable: [
        { id:'US11,956,321', filed:'Nov 2023', granted:'Mar 2025', title:'On-device neural processing with dynamic power allocation',                          area:'AI · on-device ML'  },
        { id:'US11,874,019', filed:'Aug 2023', granted:'Jan 2025', title:'Variable refresh rate OLED with ambient-adaptive tone mapping',                     area:'Display · optical'  },
        { id:'US11,801,247', filed:'Feb 2023', granted:'Oct 2024', title:'Millimetre-wave phased-array antenna integration in thin-form chassis',             area:'Wireless · RF'      },
        { id:'US11,734,502', filed:'Dec 2022', granted:'Aug 2024', title:'Electrochemical cell health monitoring via impedance spectroscopy',                  area:'Battery · power'    },
        { id:'US11,692,188', filed:'Sep 2022', granted:'May 2024', title:'Photoplethysmography waveform decomposition for atrial fibrillation detection',     area:'Health · sensors'   },
      ],
    },
    history: {
      timeline: [
        { y:'1976', e:'Founded in Cupertino. Wozniak builds the Apple I circuit board.' },
        { y:'1984', e:'Macintosh launch. First mass-market GUI computer. Ridley Scott Super Bowl ad.' },
        { y:'1997', e:'Jobs returns after NeXT acquisition. Company weeks from bankruptcy.' },
        { y:'2001', e:'iPod + iTunes. First hardware + services model prototype.' },
        { y:'2007', e:'iPhone launch. Redefined the phone; created a platform. Everything after follows from this.' },
        { y:'2011', e:'Jobs dies. Cook becomes CEO. Services strategy accelerates; margin discipline tightens.' },
        { y:'2015', e:'Apple Watch. Health + wearables platform. Now ~$40B annual revenue segment.' },
        { y:'2020', e:'Apple Silicon (M1). Broke Intel dependency. Gross margins begin structural move higher.' },
        { y:'2022', e:'Services crosses $80B/yr. App Store + subscriptions becoming the earnings engine.' },
        { y:'2024', e:'Apple Intelligence. On-device AI. Privacy as product differentiation.' },
      ],
      closestAnalogue: { ticker:'MSFT', year:'2014', match:87, what:'Services pivot · margin expansion · capital-light shift' },
      patternMatch: [
        { k:'Services revenue mix',    v:94, note:"22% AAPL vs 23% MSFT '14" },
        { k:'Gross margin trajectory', v:91, note:'+340bp / 5Y'               },
        { k:'Cash return policy',      v:88, note:'buybacks + div'            },
        { k:'P/E vs growth gap',       v:82, note:'priced for low single-digit'},
        { k:'Capex / revenue',         v:79, note:'~2% · capital-light'       },
      ],
      patternDiff: [
        { k:'Supplier concentration', note:"AAPL: 1 country, TSMC. MSFT '14: diversified."  },
        { k:'Regulatory backdrop',    note:'AAPL: EU DMA + DOJ. MSFT had cleared its decree.'},
        { k:'AI capex cycle',         note:'AAPL is a buyer, not a seller, of compute.'       },
        { k:'China exposure',         note:'AAPL ~17% rev, ~95% assembly. MSFT was ~3%.'     },
      ],
      analogues: [
        { ticker:'MSFT', year:'2014', match:87, what:'Services pivot · capital-light shift · margin expansion', ret:'+612%', dir:'up',   outcome:'CLOSEST' },
        { ticker:'JNJ',  year:'2010', match:72, what:'Capital return · brand moat · slow growth · premium P/E', ret:'+92%',  dir:'up',   outcome:'ECHO'    },
        { ticker:'IBM',  year:'1992', match:69, what:'Services + hardware mix · ~20% margin · cyclical clients', ret:'+158%', dir:'up',   outcome:'ECHO'    },
        { ticker:'INTC', year:'2002', match:61, what:'Dominant platform · supplier concentration · new entrants',ret:'+12%',  dir:'up',   outcome:'MIXED'   },
        { ticker:'XOM',  year:'2008', match:58, what:'Cash cow · capex moderation · commodity exposure',         ret:'+22%',  dir:'up',   outcome:'MIXED'   },
        { ticker:'GE',   year:'2000', match:47, what:'Conglomerate premium · regulatory headwinds',              ret:'-28%',  dir:'down', outcome:'WARNING' },
        { ticker:'CSCO', year:'2000', match:42, what:'Platform crowding · forward multiples · single product',   ret:'-35%',  dir:'down', outcome:'WARNING' },
        { ticker:'NOK',  year:'2007', match:38, what:'Hardware concentration · platform shift risk',             ret:'-78%',  dir:'down', outcome:'WARNING' },
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// THE DATA SEAM.
// Today returns mock. Replace this body with a real fetch when the backend lands.
// Every component calls resolveCompany(ticker) — none read VM_COMPANY_DATA directly.
// ─────────────────────────────────────────────────────────────────────────────
function resolveCompany(ticker) {
  return VM_COMPANY_DATA[ticker] || VM_COMPANY_DATA['AAPL'];
}

Object.assign(window, { VM_INDEX, VM_COMPANIES, VM_COMPANY_DATA, resolveCompany });

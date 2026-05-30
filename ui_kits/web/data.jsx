// Veridian Markets — mock dataset for the UI kit.
// Fictional/illustrative numbers; not market data.

const VM_INDEX = [
  { sym: 'S&P 500', val: '5,247.10', chg: '+0.42%', dir: 'up' },
  { sym: 'NASDAQ',  val: '16,542',   chg: '+0.71%', dir: 'up' },
  { sym: 'DOW',     val: '38,991',   chg: '-0.18%', dir: 'down' },
  { sym: 'GOLD',    val: '2,341',    chg: '+0.88%', dir: 'up' },
  { sym: 'OIL',     val: '$78.14',   chg: '+1.40%', dir: 'up' },
  { sym: 'BTC',     val: '69,420',   chg: '-2.31%', dir: 'down' },
  { sym: 'EUR/USD', val: '1.0842',   chg: '-0.09%', dir: 'down' },
  { sym: '10Y UST', val: '4.21%',    chg: '-0.03',  dir: 'down' },
];

const VM_COMPANIES = [
  { ticker:'AAPL', name:'Apple Inc.',        sector:'Tech · Consumer',  cap:'$4.54T', price:'308.82', chg:'+1.26%', dir:'up',
    sub:'Consumer electronics', analogue:'MSFT', analogueYear:'2014', match:87,
    inputs:[ {t:'TSM',d:'chips'}, {t:'2317.TW',d:'assembly'}, {t:'LPL',d:'OLED'}, {t:'SONY',d:'sensors'}, {t:'QCOM',d:'modems'} ],
    external:[ {t:'MAERSK.B',d:'shipping'}, {t:'XOM',d:'energy'}, {t:'MP',d:'rare-earth'}, {t:'ALB',d:'battery'} ],
    customers:[ {t:'TMUS',d:'carrier'}, {t:'VZ',d:'carrier'}, {t:'BBY',d:'retail'}, {t:'COST',d:'retail'}, {t:'AMZN',d:'retail+cloud'} ],
    competitors:[ {t:'005930.KS',d:'Samsung'}, {t:'1810.HK',d:'Xiaomi'}, {t:'GOOGL',d:'Alphabet'}, {t:'MSFT',d:'Microsoft'} ] },
  { ticker:'NVDA', name:'NVIDIA Corp.',      sector:'Tech · Semiconductors', cap:'$2.32T', price:'945.10', chg:'+3.40%', dir:'up', sub:'Accelerated computing', analogue:'CSCO', analogueYear:'1999', match:64 },
  { ticker:'MSFT', name:'Microsoft Corp.',   sector:'Tech · Software',   cap:'$3.17T', price:'427.15', chg:'+0.84%', dir:'up', sub:'Cloud + software', analogue:'IBM', analogueYear:'2004', match:71 },
  { ticker:'GOOGL',name:'Alphabet Inc.',     sector:'Tech · Advertising',cap:'$2.13T', price:'172.04', chg:'-0.42%', dir:'down', sub:'Search + ads', analogue:'AAPL', analogueYear:'2013', match:59 },
  { ticker:'AMZN', name:'Amazon.com Inc.',   sector:'Retail · Cloud',    cap:'$1.93T', price:'185.30', chg:'+0.91%', dir:'up', sub:'Marketplace + AWS', analogue:'WMT', analogueYear:'2001', match:55 },
  { ticker:'META', name:'Meta Platforms',    sector:'Tech · Social',     cap:'$1.27T', price:'498.22', chg:'+1.87%', dir:'up', sub:'Social + ads', analogue:'GOOGL', analogueYear:'2015', match:62 },
  { ticker:'TSLA', name:'Tesla, Inc.',       sector:'Auto · EVs',        cap:'$580B',  price:'182.04', chg:'-2.14%', dir:'down', sub:'EVs + energy', analogue:'AMZN', analogueYear:'2014', match:48 },
  { ticker:'BRK.B',name:'Berkshire Hathaway',sector:'Conglomerate',      cap:'$903B',  price:'418.92', chg:'+0.31%', dir:'up', sub:'Insurance + holdings', analogue:'GE', analogueYear:'1998', match:51 },
  { ticker:'AVGO', name:'Broadcom Inc.',     sector:'Tech · Semiconductors', cap:'$623B', price:'1342.0', chg:'+2.10%', dir:'up', sub:'Semis + software', analogue:'TXN', analogueYear:'2010', match:57 },
  { ticker:'JPM',  name:'JPMorgan Chase',    sector:'Finance · Banking', cap:'$615B',  price:'215.40', chg:'+0.18%', dir:'up', sub:'Universal bank', analogue:'WFC', analogueYear:'2006', match:44 },
  { ticker:'V',    name:'Visa Inc.',         sector:'Finance · Payments',cap:'$560B',  price:'275.18', chg:'+0.55%', dir:'up', sub:'Payment rails', analogue:'MA', analogueYear:'2012', match:66 },
];

// History / analogue engine (for AAPL)
const VM_ANALOGUES = [
  { n:'01', ticker:'MSFT', year:'2014', match:87, what:'Services pivot · capital-light shift · margin expansion', ret:'+612%', dir:'up',   outcome:'CLOSEST' },
  { n:'02', ticker:'JNJ',  year:'2010', match:72, what:'Capital return · brand moat · slow growth · premium P/E', ret:'+92%',  dir:'up',   outcome:'ECHO' },
  { n:'03', ticker:'IBM',  year:'1992', match:69, what:'Services + hardware mix · ~20% margin · cyclical clients', ret:'+158%', dir:'up',   outcome:'ECHO' },
  { n:'04', ticker:'INTC', year:'2002', match:61, what:'Dominant platform · supplier concentration · new entrants', ret:'+12%', dir:'up',   outcome:'MIXED' },
  { n:'05', ticker:'XOM',  year:'2008', match:58, what:'Cash cow · capex moderation · commodity exposure', ret:'+22%',  dir:'up',   outcome:'MIXED' },
  { n:'06', ticker:'GE',   year:'2000', match:47, what:'Conglomerate premium · regulatory headwinds', ret:'-28%',  dir:'down', outcome:'WARNING' },
  { n:'07', ticker:'CSCO', year:'2000', match:42, what:'Platform crowding · forward multiples · single product', ret:'-35%', dir:'down', outcome:'WARNING' },
  { n:'08', ticker:'NOK',  year:'2007', match:38, what:'Hardware concentration · platform shift risk', ret:'-78%',  dir:'down', outcome:'WARNING' },
];

const VM_PATTERN_MATCH = [
  { k:'Services revenue mix', v:94, note:'22% AAPL vs 23% MSFT \u201914' },
  { k:'Gross margin trajectory', v:91, note:'+340bp / 5Y' },
  { k:'Cash return policy', v:88, note:'buybacks + div' },
  { k:'P/E vs growth gap', v:82, note:'priced for low single-digit' },
  { k:'Capex / revenue', v:79, note:'~2% · capital-light' },
];
const VM_PATTERN_DIFF = [
  { k:'Supplier concentration', note:'AAPL: 1 country, TSMC. MSFT \u201914: diversified.' },
  { k:'Regulatory backdrop', note:'AAPL: EU DMA + DOJ. MSFT had cleared its decree.' },
  { k:'AI capex cycle', note:'AAPL is a buyer, not a seller, of compute.' },
  { k:'China exposure', note:'AAPL ~17% rev, ~95% assembly. MSFT was ~3%.' },
];

const VM_REVENUE_MIX = [
  { k:'iPhone', v:52, c:'#1D4E3A' }, { k:'Services', v:22, c:'#C46A3B' },
  { k:'Wearables', v:10, c:'#8A857D' }, { k:'Mac', v:9, c:'#2D5E5A' }, { k:'iPad', v:7, c:'#B6AFA2' },
];
const VM_LEADERS = [
  { role:'CEO', name:'Tim Cook', since:'Aug 2011', note:'Replaced Jobs. Operations specialist; ran supply chain since 1998.' },
  { role:'CFO', name:'Kevan Parekh', since:'Jan 2025', note:'Internal promote; ran corporate finance previously.' },
  { role:'COO', name:'Jeff Williams', since:'Dec 2015', note:'Apple Watch lead. Often-floated CEO successor.' },
  { role:'CHIEF HW', name:'John Ternus', since:'Jan 2021', note:'iPhone, iPad, Mac engineering. Rising profile.' },
];
const VM_PATENT_CATS = [
  { k:'Semiconductor design', pct:22, n:515, c:'#1D4E3A' }, { k:'Display · optical', pct:16, n:374, c:'#C46A3B' },
  { k:'Wireless · RF', pct:13, n:305, c:'#1F1D1A' }, { k:'AI · on-device ML', pct:12, n:281, c:'#2D5E5A' },
  { k:'Battery · power', pct:10, n:234, c:'#B35A3A' }, { k:'Health · sensors', pct:9, n:211, c:'#8A857D' },
  { k:'Camera · imaging', pct:8, n:187, c:'#185FA5' }, { k:'Audio · spatial', pct:5, n:117, c:'#B6AFA2' },
];

Object.assign(window, { VM_INDEX, VM_COMPANIES, VM_ANALOGUES, VM_PATTERN_MATCH, VM_PATTERN_DIFF, VM_REVENUE_MIX, VM_LEADERS, VM_PATENT_CATS });

// Veridian Markets — Learn page.
const { useState: useStateLearn } = React;

const LEARN_CATS = [
  { id:'all',       label:'All' },
  { id:'using-vm',  label:'Using Veridian',     icon:'compass'        },
  { id:'markets',   label:'Markets 101',         icon:'school'         },
  { id:'finance',   label:'Finance',             icon:'businessplan'   },
  { id:'investing', label:'Investing',           icon:'chart-candle'   },
  { id:'business',  label:'Business management', icon:'briefcase'      },
  { id:'economics', label:'Economics',           icon:'world'          },
  { id:'trading',   label:'Trading',             icon:'arrows-exchange'},
  { id:'personal',  label:'Personal finance',    icon:'pig-money'      },
  { id:'supply',    label:'Supply chains',       icon:'affiliate'      },
  { id:'risk',      label:'Risk & strategy',     icon:'shield-half'    },
  { id:'data',      label:'Data & charts',       icon:'chart-dots'     },
];
function catTint(cat) {
  const map = {
    'using-vm': { bg:'rgba(29,78,58,0.10)',   fg:VM.forest,  icon:'compass'         },
    markets:    { bg:VM.tealTint,             fg:VM.teal,    icon:'school'          },
    finance:    { bg:'rgba(45,94,90,0.10)',   fg:VM.teal,    icon:'businessplan'    },
    investing:  { bg:'rgba(196,106,59,0.12)', fg:VM.terra,   icon:'chart-candle'    },
    business:   { bg:'rgba(29,78,58,0.09)',   fg:VM.forest,  icon:'briefcase'       },
    economics:  { bg:'rgba(45,94,90,0.08)',   fg:VM.teal,    icon:'world'           },
    trading:    { bg:'rgba(179,90,58,0.12)',  fg:VM.rust,    icon:'arrows-exchange' },
    personal:   { bg:'rgba(29,158,117,0.12)',fg:VM.upInk,   icon:'pig-money'       },
    supply:     { bg:'rgba(15,110,86,0.10)',  fg:VM.tealInk, icon:'affiliate'       },
    risk:       { bg:'rgba(163,45,45,0.09)',  fg:VM.downInk, icon:'shield-half'     },
    data:       { bg:'rgba(45,94,90,0.10)',   fg:VM.teal,    icon:'chart-dots'      },
  };
  return map[cat] || { bg:VM.paperDeep, fg:VM.ink2, icon:'book' };
}
const catLabel = id => LEARN_CATS.find(x => x.id === id)?.label || '';
const LEARN_LEVELS  = ['Beginner','Intermediate','Advanced'];
const LEARN_FORMATS = ['Course','Path','Guide','Interactive'];
const TAG_TONE = {
  'Start here':   { bg:VM.forest,               fg:VM.paperWarm, bd:VM.forest                  },
  'App tutorial': { bg:'rgba(29,78,58,0.10)',   fg:VM.forest,   bd:'rgba(29,78,58,0.30)'       },
  'Most read':    { bg:VM.tealTint,             fg:VM.tealInk,  bd:VM.tealTint2                },
  'Popular':      { bg:VM.tealTint,             fg:VM.tealInk,  bd:VM.tealTint2                },
  'New':          { bg:'rgba(196,106,59,0.12)', fg:VM.rustDeep, bd:'rgba(196,106,59,0.30)'     },
  'Advanced':     { bg:VM.paperDeep,            fg:VM.ink2,     bd:VM.border                   },
};
const PAGE_SIZE = 8;

const LEARN_COURSES = [
  { id:1,  title:'The Anatomy of a Market',           cat:'markets',   provider:'Veridian Academy', level:'Beginner',     format:'Course',      length:'6 lessons',   tag:'Start here',
    lessons:[{n:1,title:'What is a market?',dur:'8 min'},{n:2,title:'Buyers, sellers and the spread',dur:'7 min'},{n:3,title:'Price discovery and information',dur:'9 min'},{n:4,title:'Market types: equities, bonds, commodities',dur:'10 min'},{n:5,title:'How indices are built',dur:'8 min'},{n:6,title:'Reading a market day',dur:'6 min'}] },

  { id:2,  title:'Veridian in 10 Minutes',            cat:'using-vm',  provider:'Veridian Markets', level:'Beginner',     format:'Interactive', length:'10 min',      tag:'App tutorial', route:'front',    tourId:'front',
    description:'A guided walkthrough of Veridian Markets. In ten minutes you\'ll read the live market strip, find a company, trace its supply chain, and save a watchlist.',
    highlights:['Navigate the market strip and front page','Search for and open a company profile','Read a supply chain dependency map','Build a portfolio watchlist'],
    tour:[
      { icon:'layout-navbar', title:'The global header',
        body:'The dark green bar pinned to the top of every page is your constant anchor. The Veridian Markets logo on the left is always a home button — click it from anywhere to return to the front page. On mobile the hamburger icon (☰) opens the full navigation menu.',
        tryIt:'Click the Veridian Markets logo in the top-left corner to confirm it takes you home.' },
      { icon:'chart-line', title:'The market strip',
        body:'Just below the header, a scrolling strip shows live index prices — S&P 500, Nasdaq 100, FTSE 100, and more. Each chip shows the index name, its current level, a mini sparkline of recent direction, and the day\'s change in green (up) or terracotta (down). Drag the strip left or right to scroll manually.',
        tryIt:'Try dragging the market strip sideways to reveal more indices.' },
      { icon:'layout-sidebar', title:'The navigation rail',
        body:'On desktop, the left sidebar is your map of Veridian. It groups pages into: You (account and settings), Explore (home, screener, news, calendar, supply chain), and utilities (learn, memoir). The active page is highlighted. On mobile the same links appear behind the hamburger menu.',
        tryIt:'Click each section in the left nav to get a feel for what\'s available.' },
      { icon:'home', title:'The front page',
        body:'The front page shows a curated feed of companies matched to the current moment by Veridian\'s analogue engine. Each card shows a company whose situation today structurally resembles a documented historical period — giving you not just what is happening, but context for what often follows.',
        tryIt:'Scroll the front page to see the full feed of analogue-matched company cards.' },
      { icon:'building-store', title:'Company cards',
        body:'Each company card shows the ticker, company name, current price, and day\'s change. Below that is the analogue tag — a brief label of the historical period this company\'s situation resembles. A small sparkline shows recent price trend. Click any card to open the full company dashboard.',
        tryIt:'Click any company card on the front page to open its full profile.' },
      { icon:'search', title:'Finding any company',
        body:'To look up a specific company, click Search in the navigation rail. The screener accepts company names and ticker symbols and lets you apply filters. From any result you can jump straight to the full company dashboard with financials, supply chain, patents, and history.',
        tryIt:'Click "Search" in the left nav and type a company name or ticker.' },
    ] },

  { id:3,  title:"Reading a Company's Financials", cat:'finance',   provider:'Veridian Academy', level:'Intermediate', format:'Course',      length:'8 lessons',   tag:'Most read',
    lessons:[{n:1,title:'The income statement',dur:'10 min'},{n:2,title:'The balance sheet',dur:'10 min'},{n:3,title:'Cash flow statement',dur:'9 min'},{n:4,title:'Key ratios: P/E, EV/EBITDA',dur:'11 min'},{n:5,title:'Gross margin and what it reveals',dur:'8 min'},{n:6,title:'Spotting red flags',dur:'9 min'},{n:7,title:'Comparing across peers',dur:'10 min'},{n:8,title:"Practice: reading AAPL's 10-K",dur:'12 min'}] },

  { id:4,  title:'Building Your First Portfolio',     cat:'investing', provider:'Veridian Academy', level:'Beginner',     format:'Path',        length:'5 modules',   tag:'Popular',
    lessons:[{n:1,title:'Defining your investment goal',dur:'6 min'},{n:2,title:'Risk tolerance and time horizon',dur:'8 min'},{n:3,title:'Picking your first holdings',dur:'10 min'},{n:4,title:'Diversification in practice',dur:'8 min'},{n:5,title:'When to review and rebalance',dur:'7 min'}] },

  { id:5,  title:'How Supply Chains Move Prices',     cat:'supply',    provider:'Veridian Academy', level:'Intermediate', format:'Course',      length:'7 lessons',   tag:'New',
    lessons:[{n:1,title:'What is a supply chain?',dur:'7 min'},{n:2,title:'Tier-1 vs Tier-2 suppliers',dur:'8 min'},{n:3,title:'Concentration risk',dur:'9 min'},{n:4,title:'Geopolitical dependencies',dur:'10 min'},{n:5,title:'How disruptions propagate',dur:'8 min'},{n:6,title:'Reading a dependency map',dur:'9 min'},{n:7,title:'Supply chains and equity prices',dur:'10 min'}] },

  { id:6,  title:"Mapping a Company's Network",  cat:'using-vm',  provider:'Veridian Markets', level:'Intermediate', format:'Interactive', length:'12 min',      tag:'App tutorial', route:'supply',   tourId:'supply',
    description:'An interactive guide to the Supply Chain Network tool. Navigate the dependency map, drill from principle to supplier, and understand what relationship types mean for risk.',
    highlights:['Read the supply chain canvas','Drill down from principle to tier-2 supplier','Interpret inputs vs customers columns','Understand concentration and geopolitical risk'],
    tour:[
      { icon:'affiliate', title:'What is the Dependency Map?',
        body:'The Dependency Map visualises a company\'s full supply chain as an interactive network. It answers two questions at once: where does this company\'s inputs come from, and who buys from it? Understanding this network helps you spot concentration risk and geopolitical exposure before they hit the share price.' },
      { icon:'layout-columns', title:'The three-column layout',
        body:'The map is divided into three columns. Left: Inputs — the suppliers and materials this company depends on. Centre: the company itself (the "principle"). Right: Customers — who they sell to. Reading left-to-right traces the full flow of value through the business from raw material to end buyer.',
        tryIt:'Open the Dependency Map and identify the principle company node in the centre column.' },
      { icon:'circles-relation', title:'Tier 1 and Tier 2 suppliers',
        body:'Tier-1 suppliers sell directly to the company. Tier-2 suppliers sell to the Tier-1 suppliers — they never touch the principle company but a failure cascades upwards. Click any node to make it the new centre and see its own sub-network. This is how you trace a disruption back to its source.',
        tryIt:'Click a supplier node in the Inputs column to see its own supply chain.' },
      { icon:'alert-triangle', title:'Concentration and geopolitical risk',
        body:'Some nodes carry risk badges. A concentration badge means a high percentage of this input comes from a single source — dangerous if that source fails. A geopolitical badge flags exposure to countries with trade friction or instability. These are early-warning signals worth monitoring.' },
      { icon:'hand-finger', title:'Navigating the map',
        body:'Type any ticker in the search field at the top to switch the principle company. Hover over any node to see a tooltip with details. Drag the canvas to pan. Use the ticker search to compare the supply networks of competitors side-by-side — e.g. AAPL vs QCOM in semiconductors.',
        tryIt:'Type "AAPL" in the ticker search at the top of the map.' },
    ] },

  { id:7,  title:'Cash Flow for Managers',            cat:'business',  provider:'Bretton House',    level:'Intermediate', format:'Guide',       length:'30 min read', tag:null,
    description:'A practical guide to reading and using cash flow statements — written for managers who need to understand financial health without an accounting background.',
    highlights:['Operating vs investing vs financing flows','Free cash flow and why it matters','Cash conversion cycle','Cash flow as a quality signal'] },

  { id:8,  title:'Reading Charts Without Fooling Yourself', cat:'data', provider:'The Ledger',     level:'Beginner',     format:'Guide',       length:'20 min read', tag:'Most read',
    description:'A clear-eyed guide to charts and technical analysis: what they can and cannot tell you, the patterns worth knowing, and the cognitive traps that burn most readers.',
    highlights:['Support, resistance and what they actually mean','Volume as confirmation','The five patterns worth knowing','How to avoid over-fitting your read'] },

  { id:9,  title:'The Screener, End to End',          cat:'using-vm',  provider:'Veridian Markets', level:'Intermediate', format:'Interactive', length:'15 min',      tag:'App tutorial', route:'screener',  tourId:'screener',
    description:'A complete walkthrough of the company screener. Covers search, filters, the inline preview panel, and navigating from screener to full company dashboard.',
    highlights:['Filter by sector, market cap, and fundamentals','Read the inline company preview tabs','Understand the analogue match score','Move from screener to dashboard to supply chain'],
    tour:[
      { icon:'search', title:'The search bar',
        body:'The screener search bar accepts company names and ticker symbols. As you type it matches against thousands of companies in real time — no need to press Enter. This is your starting point whenever you want to find a company you\'re not already tracking.',
        tryIt:'Type "Microsoft" or "MSFT" and watch results appear instantly.' },
      { icon:'filter', title:'Applying filters',
        body:'Filter chips below the search bar narrow results by sector (Technology, Healthcare, Energy…), market cap tier, and fundamental metrics like revenue growth or margin direction. Filters combine — you can ask for large-cap technology companies with expanding margins in one step.',
        tryIt:'Click the Technology sector chip and watch the results list update.' },
      { icon:'list', title:'Reading the results',
        body:'Each result row shows: ticker, company name, sector, market cap, and a brief tagline. On the right, a subtle analogue match indicator shows whether Veridian has found a strong historical parallel for this company. Click any row to open the preview panel on the right.',
        tryIt:'Click any company row to open its preview panel.' },
      { icon:'layout-columns', title:'The preview panel',
        body:'The right-hand panel gives you a snapshot without leaving the screener. Three tabs: Overview (key metrics and a brief description), Supply Chain (a mini dependency map), and History (the analogue match and its historical context). This is usually enough to decide whether to go deeper.',
        tryIt:'Click through the Overview, Supply Chain, and History tabs in the preview panel.' },
      { icon:'trophy', title:'The analogue match score',
        body:'Veridian\'s engine compares each company\'s current revenue growth, margin trajectory, and competitive position against every historical analogue in its database. The score (0–100) reflects how closely the current situation resembles a documented period. A high score means a strong, well-evidenced parallel.' },
      { icon:'arrow-right', title:'Going to the full dashboard',
        body:'From the preview panel, click the company name or "Open full profile" to navigate to the complete dashboard. There you\'ll find the full financial tables, detailed supply chain map, patent analysis, history timeline, and news feed — all in one place.',
        tryIt:'Click "Open full profile" in the preview panel to open a company\'s full dashboard.' },
    ] },

  { id:10, title:'Macro for Investors',               cat:'economics', provider:'Bretton House',    level:'Intermediate', format:'Course',      length:'9 lessons',   tag:null,
    lessons:[{n:1,title:'GDP: what it tells you',dur:'8 min'},{n:2,title:'Inflation and the CPI',dur:'9 min'},{n:3,title:'Central banks and rates',dur:'10 min'},{n:4,title:'The yield curve',dur:'9 min'},{n:5,title:'Currency markets',dur:'8 min'},{n:6,title:'Commodity cycles',dur:'9 min'},{n:7,title:'Credit spreads',dur:'8 min'},{n:8,title:'Leading vs lagging indicators',dur:'9 min'},{n:9,title:'Putting it all together',dur:'10 min'}] },

  { id:11, title:'Risk, Position Sizing & Drawdowns', cat:'risk',      provider:'Veridian Academy', level:'Advanced',     format:'Course',      length:'6 lessons',   tag:'Advanced',
    lessons:[{n:1,title:'What is risk, really?',dur:'8 min'},{n:2,title:'Volatility vs drawdown',dur:'9 min'},{n:3,title:'Kelly criterion and sizing',dur:'11 min'},{n:4,title:'Concentration and correlation',dur:'9 min'},{n:5,title:'Tail risk and black swans',dur:'10 min'},{n:6,title:'Building a risk framework',dur:'9 min'}] },

  { id:12, title:'Personal Finance Foundations',      cat:'personal',  provider:'Veridian Academy', level:'Beginner',     format:'Path',        length:'5 modules',   tag:null,
    lessons:[{n:1,title:'Budgeting and net worth',dur:'7 min'},{n:2,title:'Emergency funds and insurance',dur:'8 min'},{n:3,title:'Debt: good and bad',dur:'8 min'},{n:4,title:'Pensions and ISAs',dur:'9 min'},{n:5,title:'Tax efficiency',dur:'8 min'}] },

  { id:13, title:'How Interest Rates Work',           cat:'economics', provider:'Veridian Academy', level:'Beginner',     format:'Course',      length:'4 lessons',   tag:null,
    lessons:[{n:1,title:'The price of money',dur:'8 min'},{n:2,title:'Central bank policy',dur:'9 min'},{n:3,title:'Rates and asset prices',dur:'10 min'},{n:4,title:'Where rates go next',dur:'7 min'}] },

  { id:14, title:'Valuation: From Multiples to DCF',  cat:'investing', provider:'The Ledger',       level:'Advanced',     format:'Course',      length:'10 lessons',  tag:'Advanced',
    lessons:[{n:1,title:'Why valuation matters',dur:'7 min'},{n:2,title:'P/E and EV/EBITDA in practice',dur:'9 min'},{n:3,title:'Price-to-book and asset plays',dur:'8 min'},{n:4,title:'Revenue multiples for growth',dur:'9 min'},{n:5,title:'Discounted cash flow: theory',dur:'11 min'},{n:6,title:'Building a DCF model',dur:'13 min'},{n:7,title:'Sensitivity analysis',dur:'10 min'},{n:8,title:'Comparable company analysis',dur:'11 min'},{n:9,title:'Sum-of-the-parts',dur:'9 min'},{n:10,title:'Sanity-checking your output',dur:'8 min'}] },

  { id:15, title:'Trading Psychology',                cat:'trading',   provider:'Veridian Academy', level:'Intermediate', format:'Guide',       length:'25 min read', tag:null,
    description:'The mental game of markets: overconfidence, loss aversion, FOMO, and the systems that protect you from yourself.',
    highlights:['Why smart people make bad trades','The five biases that hurt performance most','Building a pre-trade checklist','Journalling and reviewing your process'] },

  { id:16, title:'Bonds & Yield, Demystified',        cat:'finance',   provider:'Bretton House',    level:'Intermediate', format:'Course',      length:'7 lessons',   tag:null,
    lessons:[{n:1,title:'What is a bond?',dur:'7 min'},{n:2,title:'Yield and duration',dur:'9 min'},{n:3,title:'Credit ratings',dur:'8 min'},{n:4,title:'Government vs corporate bonds',dur:'9 min'},{n:5,title:'High-yield and distressed debt',dur:'10 min'},{n:6,title:'Bonds in a portfolio',dur:'8 min'},{n:7,title:'Reading bond markets',dur:'9 min'}] },

  { id:17, title:'From Idea to Business Plan',        cat:'business',  provider:'Veridian Academy', level:'Beginner',     format:'Path',        length:'6 modules',   tag:'New',
    lessons:[{n:1,title:'Idea validation',dur:'8 min'},{n:2,title:'Market sizing: TAM, SAM, SOM',dur:'10 min'},{n:3,title:'Business model design',dur:'9 min'},{n:4,title:'Financial projections',dur:'11 min'},{n:5,title:'The pitch deck',dur:'8 min'},{n:6,title:'Feedback and iteration',dur:'7 min'}] },

  { id:18, title:'Building Watchlists That Work',     cat:'using-vm',  provider:'Veridian Markets', level:'Beginner',     format:'Interactive', length:'8 min',       tag:'App tutorial', route:'myportfolio',  tourId:'myportfolio',
    description:'How to build and maintain a watchlist in Veridian. Covers connecting a broker account, customising the dashboard layout, and reading the analogue alerts.',
    highlights:['Connect a broker account','Add and remove companies from your watchlist','Customise the dashboard layout','Read and act on analogue alert signals'],
    tour:[
      { icon:'user', title:'Your account overview',
        body:'My Account is your personal home on Veridian — watchlist, portfolio holdings, and analogue alerts all in one view. Everything is stored locally on your device for now; full cloud sync comes with the backend launch. Sign in to access it from any browser session.' },
      { icon:'bookmarks', title:'Your watchlist',
        body:'The watchlist is a curated list of companies you\'re monitoring. Unlike a portfolio, watchlist entries don\'t require a position or a price — they\'re just companies you want to follow. Add any company from its dashboard page using the bookmark icon in the company header.',
        tryIt:'Navigate to any company dashboard and look for the bookmark / watchlist button in the header.' },
      { icon:'briefcase', title:'Portfolio holdings',
        body:'If you\'ve connected a broker, your real holdings appear here with current values, unrealised gain/loss, and position size as a percentage of your total portfolio. Without a broker connection, you can enter holdings manually. The view helps you spot concentration and coverage gaps.',
        tryIt:'Look for the "Add holding" or broker connection option in My Account.' },
      { icon:'plug', title:'Connecting a broker',
        body:'Veridian can import your actual portfolio positions from a connected brokerage account. Click "Connect a broker" to see supported integrations. Once connected, holdings sync automatically. This is in early access — more broker integrations are being added in each release.',
        tryIt:'Tap "Connect a broker" and explore which integrations are available.' },
      { icon:'bell', title:'Analogue alerts',
        body:'When Veridian\'s engine finds a strong historical match for a company on your watchlist, it logs an analogue alert. The alert shows which period the current situation resembles and what happened to companies in that position over the following 12–24 months. These are informational context — not buy or sell signals.',
        tryIt:'Check the analogue alerts section and tap an alert to read the full historical parallel.' },
    ] },

  { id:19, title:'The News Feed', cat:'using-vm', provider:'Veridian Markets', level:'Beginner', format:'Interactive', length:'5 min', tag:'App tutorial', route:'news', tourId:'news',
    description:'A walkthrough of the Veridian news feed — how to read, filter, and act on market news in context.',
    highlights:['Read article cards and understand source signals','Filter news by company ticker or sector','Open full articles without leaving Veridian','Jump from a news event directly to the company dashboard'],
    tour:[
      { icon:'news', title:'The news feed',
        body:'The News page aggregates financial and market news across hundreds of sources, sorted by recency and relevance. Unlike a generic news app, Veridian tags each article with the companies it mentions — so you can filter to any ticker or sector in one click.' },
      { icon:'article', title:'Reading an article card',
        body:'Each card shows the headline, the source publication, the time since publication, and a one-sentence summary. A ticker chip at the bottom identifies the primary company the article covers. Cards with a bold border have been flagged as potentially market-moving based on their content.',
        tryIt:'Find an article card — note the source, publication time, and ticker chip at the bottom.' },
      { icon:'filter', title:'Filtering by company or topic',
        body:'The filter bar at the top of the news page narrows results by company ticker or sector. Type "AAPL" to see only Apple news. Select a sector chip to filter to Energy, Technology, Healthcare, or any other. Filters combine — you can ask for Technology news mentioning TSMC.',
        tryIt:'Type a ticker like "AAPL" into the filter bar to see only articles for that company.' },
      { icon:'external-link', title:'Opening full articles',
        body:'Click any article card to open it in an inline reader within Veridian. The reader shows the full article text, publication source and date, and related company chips at the bottom. Close the reader to return exactly where you were — no page navigation lost.',
        tryIt:'Click an article to open the full reader, then press the X to close and return.' },
      { icon:'building-store', title:'News to company in one click',
        body:'At the bottom of every article, chips show all the companies mentioned. Click any chip to jump straight to that company\'s full dashboard — financials, supply chain, history — giving you the context to understand what the news actually means for the business.',
        tryIt:'Open an article and click one of the company chips to navigate to its dashboard.' },
    ] },

  { id:20, title:'The Earnings Calendar', cat:'using-vm', provider:'Veridian Markets', level:'Beginner', format:'Interactive', length:'6 min', tag:'App tutorial', route:'calendar', tourId:'calendar',
    description:'How to use the Veridian calendar to track earnings releases, dividend dates, and key economic events.',
    highlights:['Find upcoming earnings and when they are expected','Understand ex-dividend vs payment dates','Track high-impact economic releases','Navigate forward and backward through time'],
    tour:[
      { icon:'calendar', title:'What the calendar tracks',
        body:'The Veridian calendar is your forward view of the market. It shows three types of events: earnings releases (quarterly and annual results), dividend events (ex-dividend and payment dates), and economic releases (central bank decisions, CPI, employment data). All in one place, by date.' },
      { icon:'report-money', title:'Earnings entries',
        body:'Each earnings entry shows the company ticker, name, expected reporting date, and — where available — analyst consensus estimates for revenue and EPS. "Before Open" means the report lands before trading starts that day. "After Close" means it arrives after 4 PM, so the price reaction plays out the next morning.',
        tryIt:'Find an upcoming earnings entry and check whether it\'s Before Open or After Close.' },
      { icon:'coin', title:'Dividend dates',
        body:'For dividend-paying companies, two dates matter: the ex-dividend date (you must own shares before this day to qualify for the payment) and the payment date (when the cash lands in your account). Miss the ex-div date by a single day and you receive nothing for that period.',
        tryIt:'Find a dividend event and identify its ex-dividend date and payment date.' },
      { icon:'world', title:'Economic releases',
        body:'Major data releases — CPI inflation, non-farm payrolls, Fed rate decisions, GDP — appear flagged by their historical market impact. High-impact releases are the ones that most often move equity and bond markets significantly. Watch for them when you have open positions or are planning entries.',
        tryIt:'Scroll through the calendar and find a high-impact economic release.' },
      { icon:'arrows-left-right', title:'Navigating time',
        body:'Use the arrow buttons at the top to move forward or backward by week or month. The "Today" button snaps back to the current date. Looking ahead is particularly useful — you can plan around earnings seasons, spot dividend payment clusters, and prepare for economic data weeks in advance.',
        tryIt:'Use the forward arrow to skip ahead two weeks and see what events are coming up.' },
    ] },

  { id:21, title:'Using the Learn Hub', cat:'using-vm', provider:'Veridian Markets', level:'Beginner', format:'Interactive', length:'5 min', tag:'App tutorial', route:'learn', tourId:'learn',
    description:'A guide to the Veridian Learn hub — courses, guides, interactive tutorials, and how to navigate them all.',
    highlights:['Filter by category, level, and format','Know the difference between Courses, Guides, and Interactives','Open and navigate a lesson','Find app tutorials for every section of Veridian'],
    tour:[
      { icon:'school', title:'What is the Learn hub?',
        body:'Learn is Veridian\'s built-in education centre. It hosts short courses, practical guides, and interactive app tutorials across finance, markets, economics, and investing. Everything is written to be readable in a single sitting — no registration required, no paywalls, no ads.' },
      { icon:'apps', title:'Category filter chips',
        body:'The coloured chips below the search bar filter by subject: Markets 101, Finance, Investing, Supply Chains, Economics, Trading, Personal Finance, and more. "Using Veridian" shows only App tutorials — interactive walkthroughs of specific features of the platform itself, exactly like this one.',
        tryIt:'Click the "Using Veridian" chip to see all available app tutorials.' },
      { icon:'adjustments', title:'Level and format filters',
        body:'Two filter rows let you narrow by difficulty (Beginner, Intermediate, Advanced) and format. Courses have structured lessons with a full lesson viewer. Guides are long-form reads. Paths are multi-module learning journeys. Interactive tutorials walk you through the app step-by-step.',
        tryIt:'Select "Beginner" from the Level filter to see entry-level content only.' },
      { icon:'cards', title:'Reading a course card',
        body:'Each card shows the category (colour-coded top strip), the provider name, the title, format, difficulty, and estimated time. A tag in the corner — "Start here", "Most read", "New" — helps prioritise. Click any card to open its full detail overlay with description and lessons.',
        tryIt:'Click any course card to open its detail overlay and read the full description.' },
      { icon:'book-open', title:'The lesson viewer',
        body:'Structured courses open in a full-screen lesson viewer. A progress bar at the top shows completion. Each lesson has a title, a reading time, several short sections, and a Key Takeaways box. Navigate with Next / Back or jump to any lesson from the course overview list.',
        tryIt:'Open the course "The Anatomy of a Market" and start Lesson 1.' },
      { icon:'compass', title:'App tutorials — this format',
        body:'The "App tutorial" entries in Using Veridian are interactive walkthroughs — step-by-step guided tours like this one. Each covers a different section of the platform: screener, supply chain, news feed, calendar, settings, company dashboard, and more. Work through them to get confident with every part of Veridian.',
        tryIt:'Filter by "Using Veridian" and pick a tutorial for a page you haven\'t explored yet.' },
    ] },

  { id:22, title:'Reading the Memoir', cat:'using-vm', provider:'Veridian Markets', level:'Beginner', format:'Interactive', length:'7 min', tag:'App tutorial', route:'memoir', tourId:'memoir',
    description:'An introduction to the Memoir section — Veridian\'s history-led approach and how to use the timeline and analogue engine.',
    highlights:['Understand the "history-led" philosophy','Navigate a company\'s event timeline','Read and interpret an analogue match','Use historical parallels as base rates, not forecasts'],
    tour:[
      { icon:'history', title:'What is the Memoir?',
        body:'The Memoir is Veridian\'s signature feature. It presents company history as a readable narrative — events, decisions, and turning points told in sequence, not just tables of numbers. The name reflects the idea that every company has a story, and understanding that story is the foundation of serious analysis.' },
      { icon:'timeline', title:'The event timeline',
        body:'The timeline shows key moments in a company\'s history arranged chronologically — product launches, acquisitions, management changes, financial milestones, regulatory events. Scroll left and right to move through time. Click any event to expand its context and read what happened and why it mattered.',
        tryIt:'Open the Memoir section, find a company, and click an event on its timeline to expand it.' },
      { icon:'circles-relation', title:'Analogues — what they are',
        body:'An analogue is a historical period from a different company that looks structurally similar to where your company is today. Veridian\'s engine matches on revenue growth trajectories, margin patterns, competitive position, and market context. A strong analogue is a base rate — "this is what tended to happen next in situations like this."' },
      { icon:'chart-line', title:'Using analogues wisely',
        body:'The most powerful use of an analogue is stress-testing your assumptions. If you believe a company is about to re-accelerate growth, and the analogue shows that companies in this position historically plateaued for 3 years before recovering, that\'s useful context. It doesn\'t tell you what will happen — it tells you what you\'re betting against.',
        tryIt:'Read the analogue section for a company and note the historical period it has matched.' },
      { icon:'book', title:'The extended memoir narrative',
        body:'For featured companies, Veridian provides a long-form memoir — a readable account of the company\'s full history, written like a well-researched business case study: the founding story, early pivots, key decisions, failures, and recoveries. This is the context that makes the numbers meaningful.',
        tryIt:'Click "Read full memoir" on any featured company to open the extended narrative.' },
    ] },

  { id:23, title:'My Business Dashboard', cat:'using-vm', provider:'Veridian Markets', level:'Beginner', format:'Interactive', length:'6 min', tag:'App tutorial', route:'mybusiness', tourId:'mybusiness',
    description:'A tour of the My Business section — tracking and benchmarking your own company alongside public market data.',
    highlights:['Set up your business profile','Understand the financial overview panels','Benchmark your metrics against public peers','Switch between Personal and Business account modes'],
    tour:[
      { icon:'briefcase', title:'What is My Business?',
        body:'My Business is a separate account mode for business owners and managers. It lets you track your company\'s own financial metrics alongside public company data — benchmarking your revenue growth, margins, and cash position against peers of similar size, sector, and stage.' },
      { icon:'user-circle', title:'Your business profile',
        body:'At the top of My Business is your company profile: name, sector, business stage (early / growth / mature), and a short description. This context is used to surface relevant peer companies for benchmarking. Update it as your business evolves — the peers recalculate automatically.',
        tryIt:'Open My Business and check that your business profile details are filled in and accurate.' },
      { icon:'chart-bar', title:'The financial overview',
        body:'The financial overview shows your key metrics: revenue, gross margin, operating expenses, and cash position. Enter figures manually each month or quarter. Over time the trend charts build up, giving you a visual history of how your business has grown — a quick reality check before any pitch or board meeting.',
        tryIt:'Find the financial overview section and see what metrics are tracked.' },
      { icon:'arrows-diff', title:'Benchmarking against public peers',
        body:'Veridian automatically finds listed companies in a similar sector at a comparable revenue stage. The benchmark panel shows where your growth rate and margins sit relative to this peer group. Being above or below the median is context — but the most valuable signal is always your own trajectory over time.',
        tryIt:'Look at the benchmark section to see which public companies Veridian has matched to your profile.' },
      { icon:'arrows-exchange', title:'Personal ↔ Business switcher',
        body:'The toggle at the top of the navigation rail switches between Personal and Business modes. Personal shows your investment portfolio and watchlist. Business shows your company dashboard. Data in each mode is kept separate. Switching is instant — you can move between the two as many times as you like.',
        tryIt:'Find the Personal / Business toggle at the top of the left navigation bar and try switching modes.' },
    ] },

  { id:24, title:'Settings & Your Account', cat:'using-vm', provider:'Veridian Markets', level:'Beginner', format:'Interactive', length:'8 min', tag:'App tutorial', route:'settings', tourId:'settings',
    description:'A complete walkthrough of every Settings section — profile, security, appearance, notifications, and privacy.',
    highlights:['Update your profile name and email','Set up two-factor authentication (2FA)','Switch between light and dark theme','Manage notification preferences and privacy controls'],
    tour:[
      { icon:'settings', title:'Finding Settings',
        body:'Settings is accessible from the bottom of the navigation rail when you\'re signed in — look for the gear icon. Click any section in the left-hand menu to jump directly: Profile, Security, Appearance, Notifications, Privacy & data, Help centre, Terms & policies, and About Veridian.',
        tryIt:'Open Settings from the bottom of the left navigation rail.' },
      { icon:'user', title:'Profile settings',
        body:'The Profile section lets you update your display name and email address. Your display name appears in the time-of-day greeting in the navigation rail ("Good morning, Carlos."). Changes to your email will require re-verification once backend auth is active.',
        tryIt:'Open the Profile section and check what your current display name is set to.' },
      { icon:'shield-lock', title:'Security — two-factor authentication',
        body:'The Security section lets you set up 2FA — a second check beyond your password every time you sign in. Choose between an authenticator app (Google Authenticator, Authy, 1Password) or SMS to your phone. Enabling 2FA is strongly recommended for any account linked to financial data.',
        tryIt:'Open Security in Settings and explore the 2FA options available.' },
      { icon:'palette', title:'Appearance — light and dark theme',
        body:'The Appearance section has one toggle: light or dark theme. Dark mode uses deep brown-black backgrounds with warm cream text — easier on the eyes at night and in low-light. Light mode uses the classic warm off-white. Your preference saves instantly and applies across the entire app.',
        tryIt:'Go to Appearance and toggle the theme — notice the whole app switches immediately.' },
      { icon:'bell', title:'Notification preferences',
        body:'The Notifications section controls what Veridian tells you about. Toggle categories on or off: analogue alerts (when a strong match is found for a watchlist company), earnings reminders (24h before a tracked company reports), and weekly digest (a summary of your watchlist and market highlights).',
        tryIt:'Open Notifications and check which alert types are currently active.' },
      { icon:'lock', title:'Privacy & data',
        body:'Privacy settings control who can find your profile, whether your online status is visible, and whether you\'re searchable by email. You can also download a full export of your data or permanently delete your account. Your data belongs to you — these controls are always available.',
        tryIt:'Open Privacy & data and review your current visibility and searchability settings.' },
    ] },

  { id:25, title:'The Company Dashboard', cat:'using-vm', provider:'Veridian Markets', level:'Intermediate', format:'Interactive', length:'10 min', tag:'App tutorial', route:'screener', tourId:'dashboard',
    description:'A complete walkthrough of every tab on the company dashboard — Overview, Financials, Supply Chain, Patents, History, and News.',
    highlights:['Read the company header and key metrics','Use the Financials tab and Analysis charts','Explore the supply chain map','Read patents, history timeline, and company news'],
    tour:[
      { icon:'building-store', title:'Opening a company dashboard',
        body:'Every company on Veridian has a full dashboard. Get there by clicking a card on the front page, selecting a screener result, or typing a ticker in Search. The URL updates to /company/TICKER — you can bookmark or share any company page. Dashboard tabs: Overview, Supply Chain, Financials, Patents, History, News.',
        tryIt:'Search for "AAPL" in the screener and click through to the Apple dashboard.' },
      { icon:'id-badge', title:'The company header',
        body:'At the top: logo, ticker, full company name, current share price, day\'s change, and a one-line business description. Below it, the tab row gives access to every section of the dashboard. The breadcrumb trail at the top shows how you got here — click any step to navigate back.',
        tryIt:'Look at the company header and identify the ticker, price, and day\'s change.' },
      { icon:'layout-dashboard', title:'Overview tab',
        body:'The Overview tab is your 30-second summary: key financial metrics (revenue, market cap, P/E ratio, margins), a brief business description, the top analogue match with its historical context, and the most recent news headline. This is always the first tab to check when you open a new company.',
        tryIt:'Click the Overview tab and find the company\'s current P/E ratio and market cap.' },
      { icon:'table', title:'Financials tab — the statements',
        body:'Three financial statements switchable by the tabs at the top: Income Statement, Balance Sheet, Cash Flow. Toggle Annual or Quarterly. Turn on %Δ to add a percentage-change column between periods, or $Δ for the absolute dollar change. Drag the table sideways to scroll on narrow screens.',
        tryIt:'Go to Financials, switch to Quarterly view, and turn on the %Δ toggle.' },
      { icon:'chart-bar', title:'Financials — the Analysis charts',
        body:'The teal Analysis button in the Financials toolbar opens the chart explorer. Revenue & gross profit bars, Margin trend lines, and EPS charts are live. The sidebar lists 50+ chart types on the roadmap. Use "Explain this" on any active chart to get an AI interpretation of what the data shows.',
        tryIt:'Click the Analysis button, open the Margin Trends chart, then click "Explain this".' },
      { icon:'affiliate', title:'Supply Chain tab',
        body:'The Supply Chain tab shows the dependency map pre-loaded for this company as the principle node. Inputs on the left, the company in the centre, customers on the right. Watch for concentration risk badges (single-source dependency) and geopolitical flags on supplier nodes.',
        tryIt:'Click the Supply Chain tab and identify the company\'s top 3 input suppliers.' },
      { icon:'certificate', title:'Patents tab',
        body:'The Patents tab shows patent filing activity as a bar chart by year — a proxy for R&D intensity and innovation direction. Click any bar to see the patents filed that year, their technology categories, and brief descriptions. Accelerating filings often precede new product cycles.',
        tryIt:'Click the Patents tab and find which year had the highest number of filings.' },
      { icon:'history', title:'History and News tabs',
        body:'History shows the full company event timeline — key moments in Memoir format: founding, pivots, milestones, crises, and recoveries. News shows only articles about this company, filtered automatically from the global feed. Together these tabs give you the qualitative context that financial numbers alone can\'t provide.',
        tryIt:'Open the History tab and find the company\'s founding date or a major turning point in its story.' },
    ] },

];

// ── Course store ──────────────────────────────────────────────────────────
// Catalogue = the built-in courses above + any the admin adds (saved to
// localStorage so they persist and show up here on the Learn page). Temporary
// stand-in for a real courses table. Admin-added courses have no lesson content,
// so the viewer falls back to its no-lessons layout (it already guards for that).
const VM_COURSES_KEY = 'vm_admin_courses';
function vmLoadAddedCourses() {
  try { return JSON.parse(localStorage.getItem(VM_COURSES_KEY)) || []; } catch { return []; }
}
function vmGetCourses() { return LEARN_COURSES.concat(vmLoadAddedCourses()); }
function vmAddCourse(c) {
  const list = vmLoadAddedCourses();
  const next = { ...c, id: 'u' + Date.now(), added: true };
  list.push(next);
  try { localStorage.setItem(VM_COURSES_KEY, JSON.stringify(list)); } catch {}
  return next;
}
function vmDeleteCourse(id) {
  const list = vmLoadAddedCourses().filter(c => c.id !== id);
  try { localStorage.setItem(VM_COURSES_KEY, JSON.stringify(list)); } catch {}
}

// Per-course progress ("furthest lesson reached", same % the lesson viewer's
// top bar already shows) — persisted so Settings → Learning can show a real
// "pick up where you left off" instead of a hardcoded course/percentage.
// Local-only (no backend); keyed by course id, one entry per course.
const VM_LEARN_PROGRESS_KEY = 'vm_learn_progress';
function vmGetLearnProgress() {
  try { return JSON.parse(localStorage.getItem(VM_LEARN_PROGRESS_KEY)) || {}; } catch { return {}; }
}
function vmSaveLearnProgress(course, lesson) {
  if (!course.lessons || !course.lessons.length) return;
  const idx = course.lessons.findIndex(l => l.n === lesson.n);
  if (idx < 0) return;
  try {
    const all = vmGetLearnProgress();
    all[course.id] = { title: course.title, pct: Math.round(((idx + 1) / course.lessons.length) * 100), ts: Date.now() };
    localStorage.setItem(VM_LEARN_PROGRESS_KEY, JSON.stringify(all));
  } catch {}
}
// The single course to show on Settings → Learning: whichever was touched most recently.
function vmLatestLearnProgress() {
  const entries = Object.values(vmGetLearnProgress());
  if (!entries.length) return null;
  return entries.reduce((a, b) => (b.ts > a.ts ? b : a));
}

// ── Main page ─────────────────────────────────────────────────────────────────
function Learn({ go, isMobile }) {
  const [cat, setCat]       = useStateLearn('all');
  const [level, setLevel]   = useStateLearn('all');
  const [format, setFormat] = useStateLearn('all');
  const [query, setQuery]   = useStateLearn('');
  const [shown, setShown]   = useStateLearn(PAGE_SIZE);
  const [openCourse, setOpenCourse]   = useStateLearn(null);
  const [startLesson, setStartLesson] = useStateLearn(null); // { course, lesson } — for interactive/guide only
  const [lessonView,  setLessonView]  = useStateLearn(null); // { course, lesson } — full lesson viewer

  const q = query.trim().toLowerCase();
  const filtered = vmGetCourses().filter(c => {
    if (cat !== 'all' && c.cat !== cat) return false;
    if (level !== 'all' && c.level !== level) return false;
    if (format !== 'all' && c.format !== format) return false;
    if (q) {
      const hay = (c.title+' '+c.provider+' '+catLabel(c.cat)).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const visible = filtered.slice(0, shown);
  const more    = filtered.length - visible.length;
  const reset   = fn => { fn(); setShown(PAGE_SIZE); };
  const anyFilter = cat!=='all' || level!=='all' || format!=='all' || q;

  return (
    <div style={{ padding: isMobile?'14px 16px 80px':'26px 32px 60px', maxWidth:1180, margin:'0 auto' }}>
      <Kicker>LEARN · VM</Kicker>
      <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:isMobile?27:32, lineHeight:1.07, margin:'10px 0 0' }}>Learn.</h1>
      <p style={{ fontFamily:VM.serif, fontSize:isMobile?15:17, color:VM.ink2, maxWidth:640, margin:'10px 0 0', lineHeight:1.45 }}>
        Short courses and guides on finance, markets and running a business — plus everything you need to get the most out of Veridian.
      </p>

      <StartHere go={go} isMobile={isMobile} onOpen={()=>setOpenCourse(LEARN_COURSES.find(c=>c.id===2))} />

      <div style={{ display:'flex', alignItems:'center', gap:9, background:VM.paper, border:`1px solid ${VM.border}`, borderRadius:10, padding:'10px 14px', marginTop:26 }}>
        <i className="ti ti-search" style={{ fontSize:15, color:VM.ink3 }}></i>
        <input value={query} onChange={e=>reset(()=>setQuery(e.target.value))} placeholder="Search courses, guides and tutorials…"
          style={{ flex:1, border:'none', outline:'none', background:'transparent', fontFamily:VM.serif, fontSize:15, color:VM.ink }} />
        {query && <i onClick={()=>reset(()=>setQuery(''))} className="ti ti-x" style={{ fontSize:14, color:VM.ink3, cursor:'pointer' }}></i>}
      </div>

      <div data-tour="vm-learn-filter" style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:16 }}>
        {LEARN_CATS.map(c=>(
          <Pill key={c.id} active={cat===c.id} onClick={()=>reset(()=>setCat(c.id))}>
            {c.icon && <i className={'ti ti-'+c.icon} style={{ fontSize:13 }}></i>}{c.label}
          </Pill>
        ))}
      </div>

      <div style={{ display:'flex', gap:isMobile?14:28, flexWrap:'wrap', marginTop:14, alignItems:'center' }}>
        <FilterGroup label="Level"  value={level}  onPick={v=>reset(()=>setLevel(v))}  options={LEARN_LEVELS} />
        <FilterGroup label="Format" value={format} onPick={v=>reset(()=>setFormat(v))} options={LEARN_FORMATS} />
      </div>

      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', margin:'30px 0 14px', gap:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:12 }}>
          <h2 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:isMobile?21:24, margin:0 }}>
            {anyFilter ? 'Results' : 'Most popular'}
          </h2>
          <Mono size={11} color={VM.ink3}>{filtered.length} {filtered.length===1?'item':'items'}</Mono>
        </div>
        {anyFilter && (
          <span onClick={()=>{ setCat('all');setLevel('all');setFormat('all');setQuery('');setShown(PAGE_SIZE); }}
            style={{ fontFamily:VM.serif, fontSize:13, color:VM.teal, cursor:'pointer' }}>Clear filters ✕</span>
        )}
      </div>

      {visible.length===0 ? (
        <div style={{ background:VM.paper, border:`1px dashed ${VM.border}`, borderRadius:12, padding:'40px 20px', textAlign:'center' }}>
          <i className="ti ti-mood-search" style={{ fontSize:26, color:VM.ink3 }}></i>
          <div style={{ fontFamily:VM.serif, fontSize:16, color:VM.ink2, marginTop:10 }}>Nothing matches those filters yet.</div>
        </div>
      ) : (
        <div data-tour="vm-learn-cards" style={{ display:'grid', gridTemplateColumns:`repeat(auto-fill, minmax(${isMobile?'100%':'250px'},1fr))`, gap:isMobile?14:18 }}>
          {visible.map(c=><CourseCard key={c.id} c={c} onOpen={()=>setOpenCourse(c)} />)}
        </div>
      )}

      {more > 0 && (
        <div style={{ marginTop:26, display:'flex', justifyContent:'center' }}>
          <Btn onClick={()=>setShown(s=>s+PAGE_SIZE)}>
            <i className="ti ti-chevron-down" style={{ fontSize:15 }}></i>
            Show {Math.min(more,PAGE_SIZE)} more
          </Btn>
        </div>
      )}

      {/* Full-screen course overlay */}
      {openCourse && (
        <CourseOverlay
          c={openCourse}
          go={go}
          isMobile={isMobile}
          onClose={()=>setOpenCourse(null)}
          onStart={lesson=>{
            if (lesson) { setLessonView({ course:openCourse, lesson }); return; }
            if (openCourse.tourId && window.__vmStartTour) {
              setOpenCourse(null);                                              // close overlay
              window.__vmStartTour(openCourse.tourId);                         // launch real tour
              return;
            }
            setStartLesson({ course:openCourse, lesson:null });                // interactive/guide CTA → modal
          }}
        />
      )}

      {/* Lesson viewer — full page, opens over the course overlay */}
      {lessonView && (
        <LessonViewer
          course={lessonView.course}
          lesson={lessonView.lesson}
          onClose={()=>setLessonView(null)}
          onNav={lesson=>setLessonView({ course:lessonView.course, lesson })}
          isMobile={isMobile}
        />
      )}

      {/* Start modal — interactive/guide only */}
      {startLesson && (
        <StartModal
          course={startLesson.course}
          lesson={startLesson.lesson}
          go={go}
          onClose={()=>setStartLesson(null)}
        />
      )}
    </div>
  );
}

// ── Full-screen course overlay ────────────────────────────────────────────────
function CourseOverlay({ c, isMobile, onClose, onStart }) {
  const t         = catTint(c.cat);
  const tone      = c.tag ? TAG_TONE[c.tag] : null;
  const hasLessons = c.lessons && c.lessons.length > 0;

  React.useEffect(()=>{
    const h = e => { if(e.key==='Escape') onClose(); };
    window.addEventListener('keydown', h);
    return ()=>window.removeEventListener('keydown', h);
  },[]);

  return ReactDOM.createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(31,29,26,0.58)', padding: isMobile ? 12 : 24 }} onClick={onClose}>

      {/* modal card */}
      <div onClick={e=>e.stopPropagation()} style={{ background:VM.paperWarm, borderRadius:16,
        border:`1px solid ${VM.borderSoft}`, width:'100%', maxWidth:580, maxHeight:'88vh',
        overflowY:'auto', boxShadow:'0 32px 72px rgba(31,29,26,0.28)', display:'flex', flexDirection:'column' }}>

        {/* card header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 20px', borderBottom:`1px solid ${VM.borderHair}`,
          position:'sticky', top:0, background:VM.paperWarm, zIndex:1, flexShrink:0 }}>
          <Mono size={10} weight={700} color={VM.ink3} style={{ letterSpacing:'0.08em', textTransform:'uppercase' }}>
            {catLabel(c.cat)}
          </Mono>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:999, border:`1px solid ${VM.border}`,
            background:VM.paper, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            color:VM.ink2, padding:0 }}>
            <i className="ti ti-x" style={{ fontSize:15 }}></i>
          </button>
        </div>

        {/* scrollable body */}
        <div style={{ padding: isMobile?'20px 18px 28px':'24px 24px 32px' }}>

        {/* hero */}
        <div style={{ height:120, background:t.bg, borderRadius:12, display:'flex', alignItems:'center',
          justifyContent:'center', position:'relative', marginBottom:20, border:`1px solid ${VM.borderSoft}` }}>
          <i className={'ti ti-'+t.icon} style={{ fontSize:60, color:t.fg, opacity:0.85 }}></i>
          <span style={{ position:'absolute', left:18, bottom:14 }}>
            <Mono size={10} color={t.fg} weight={700} style={{ letterSpacing:'0.08em', textTransform:'uppercase', opacity:0.9 }}>{catLabel(c.cat)}</Mono>
          </span>
          {tone && (
            <span style={{ position:'absolute', right:16, top:14, fontFamily:VM.mono, fontSize:9.5, fontWeight:600,
              padding:'3px 10px', borderRadius:999, background:tone.bg, color:tone.fg, border:`1px solid ${tone.bd}` }}>{c.tag}</span>
          )}
        </div>

        {/* provider */}
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
          <span style={{ width:18, height:18, borderRadius:4, background:VM.forest, color:VM.paperWarm,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className="ti ti-leaf" style={{ fontSize:11 }}></i>
          </span>
          <Mono size={11} color={VM.ink3}>{c.provider}</Mono>
        </div>

        {/* title + meta */}
        <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:isMobile?24:32, margin:'0 0 10px', lineHeight:1.1 }}>{c.title}</h1>
        <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', marginBottom:24 }}>
          <Mono size={10} color={VM.ink3} style={{ textTransform:'uppercase', letterSpacing:'0.06em' }}>{c.format}</Mono>
          <span style={{ width:3, height:3, borderRadius:999, background:VM.faint }}></span>
          <Mono size={10} color={VM.ink3}><i className="ti ti-stairs" style={{ fontSize:12, marginRight:4 }}></i>{c.level}</Mono>
          <span style={{ width:3, height:3, borderRadius:999, background:VM.faint }}></span>
          <Mono size={10} color={VM.ink3}><i className="ti ti-clock" style={{ fontSize:12, marginRight:4 }}></i>{c.length}</Mono>
        </div>

        {/* description */}
        {c.description && (
          <p style={{ fontFamily:VM.serif, fontSize:16, color:VM.ink2, lineHeight:1.65, margin:'0 0 24px' }}>{c.description}</p>
        )}

        {/* highlights */}
        {c.highlights && (
          <div style={{ background:VM.tealTint, border:`1px solid ${VM.tealTint2}`, borderRadius:12, padding:'16px 18px', marginBottom:28 }}>
            <Mono size={10} color={VM.teal} weight={700} style={{ display:'block', marginBottom:10, letterSpacing:'0.07em', textTransform:'uppercase' }}>What you'll cover</Mono>
            {c.highlights.map((h,i)=>(
              <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'4px 0' }}>
                <i className="ti ti-check" style={{ fontSize:13, color:VM.tealInk, marginTop:2, flexShrink:0 }}></i>
                <span style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink2 }}>{h}</span>
              </div>
            ))}
          </div>
        )}

        {/* video placeholder for Interactive */}
        {c.format==='Interactive' && (
          <div onClick={()=>onStart(null)} style={{ background:VM.paperDeep, border:`1px solid ${VM.borderSoft}`,
            borderRadius:14, height:240, display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', gap:12, marginBottom:28, cursor:'pointer' }}>
            <div style={{ width:60, height:60, borderRadius:999, background:VM.forest, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <i className="ti ti-player-play-filled" style={{ fontSize:24, color:VM.paperWarm, marginLeft:3 }}></i>
            </div>
            <Mono size={11} color={VM.ink3}>{c.length} · click to begin</Mono>
          </div>
        )}

        {/* guide preview */}
        {c.format==='Guide' && (
          <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:'20px 24px', marginBottom:28 }}>
            <Mono size={10} color={VM.ink3} weight={700} style={{ display:'block', marginBottom:10, letterSpacing:'0.06em', textTransform:'uppercase' }}>Preview</Mono>
            <p style={{ fontFamily:VM.serif, fontSize:15, color:VM.ink2, lineHeight:1.65, margin:0 }}>
              Written to be read in one sitting — no prior knowledge beyond the level listed above.
            </p>
          </div>
        )}

        {/* CTA for non-lesson formats */}
        {!hasLessons && (
          <Btn solid onClick={()=>onStart(null)} style={{ fontSize:15, padding:'11px 24px' }}>
            {c.format==='Interactive' ? 'Begin interactive' : 'Start reading'}
            <i className="ti ti-arrow-right" style={{ fontSize:16 }}></i>
          </Btn>
        )}

        {/* lesson list */}
        {hasLessons && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
              <h2 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:20, margin:0 }}>Lessons</h2>
              <Mono size={10} color={VM.ink3}>{c.lessons.length} lessons</Mono>
            </div>
            <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, overflow:'hidden', marginBottom:20 }}>
              {c.lessons.map((l,i)=>(
                <LessonRow key={l.n} lesson={l} first={i===0} last={i===c.lessons.length-1} onStart={()=>onStart(l)} />
              ))}
            </div>
            <Btn solid onClick={()=>onStart(c.lessons[0])} style={{ fontSize:15, padding:'11px 24px' }}>
              Start from lesson 1 <i className="ti ti-arrow-right" style={{ fontSize:16 }}></i>
            </Btn>
          </div>
        )}
        </div>{/* end scrollable body */}
      </div>{/* end card */}
    </div>,/* end backdrop */
    document.body
  );
}

function LessonRow({ lesson, first, last, onStart }) {
  const [hover, setHover] = useStateLearn(false);
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onClick={onStart}
      style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 18px', cursor:'pointer',
        background: hover ? VM.tealTint : 'transparent',
        borderBottom: last ? 'none' : `1px solid ${VM.borderHair}`,
        transition:'background .12s' }}>
      <div style={{ width:28, height:28, borderRadius:999, background: first ? VM.forest : VM.paperDeep,
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        border:`1px solid ${first ? VM.forest : VM.border}` }}>
        <Mono size={11} weight={700} color={first ? VM.paperWarm : VM.ink3}>{lesson.n}</Mono>
      </div>
      <span style={{ flex:1, fontFamily:VM.serif, fontSize:15, color:VM.ink, fontWeight: first ? 500 : 400 }}>{lesson.title}</span>
      <Mono size={10} color={VM.ink3} style={{ whiteSpace:'nowrap' }}>{lesson.dur}</Mono>
      <i className="ti ti-player-play" style={{ fontSize:14, color: hover ? VM.teal : VM.faint, transition:'color .12s' }}></i>
    </div>
  );
}

// ── Tour viewer (step-by-step interactive walkthrough) ────────────────────────
function TourViewer({ course, onClose, go }) {
  const [step, setStep] = useStateLearn(0);
  const steps = course.tour || [];
  const curr  = steps[step];
  if (!curr) return null;
  const isFirst = step === 0;
  const isLast  = step === steps.length - 1;
  const pct     = Math.round(((step + 1) / steps.length) * 100);
  const t       = catTint(course.cat);

  React.useEffect(() => {
    const h = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && !isLast) setStep(s => s + 1);
      if (e.key === 'ArrowLeft'  && !isFirst) setStep(s => s - 1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isFirst, isLast]);

  function handleDone() {
    onClose();
    if (course.route && go) go(course.route);
  }

  return ReactDOM.createPortal(
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:500,
      background:'rgba(20,18,15,0.62)', display:'flex', alignItems:'center',
      justifyContent:'center', padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:VM.paperWarm,
        borderRadius:18, border:`1px solid ${VM.borderSoft}`, width:'100%', maxWidth:480,
        boxShadow:'0 32px 72px rgba(31,29,26,0.28)', display:'flex', flexDirection:'column',
        overflow:'hidden' }}>

        {/* green progress bar */}
        <div style={{ height:3, background:VM.paperDeep, flexShrink:0 }}>
          <div style={{ height:'100%', width:`${pct}%`, background:VM.teal, transition:'width .3s ease' }}></div>
        </div>

        {/* header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'13px 18px 11px', borderBottom:`1px solid ${VM.borderHair}` }}>
          <Mono size={10} color={VM.ink3}>Step {step + 1} of {steps.length} · {course.title}</Mono>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:999,
            border:`1px solid ${VM.border}`, background:VM.paper, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', color:VM.ink2, padding:0 }}>
            <i className="ti ti-x" style={{ fontSize:14 }}></i>
          </button>
        </div>

        {/* body */}
        <div style={{ padding:'24px 24px 16px' }}>
          <div style={{ width:48, height:48, borderRadius:14, background:t.bg, display:'flex',
            alignItems:'center', justifyContent:'center', marginBottom:18 }}>
            <i className={`ti ti-${curr.icon || t.icon}`} style={{ fontSize:24, color:t.fg }}></i>
          </div>
          <h2 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:22, margin:'0 0 12px',
            lineHeight:1.2, color:VM.ink }}>{curr.title}</h2>
          <p style={{ fontFamily:VM.serif, fontSize:15, color:VM.ink2, lineHeight:1.68, margin:0 }}>{curr.body}</p>
          {curr.tryIt && (
            <div style={{ marginTop:18, background:VM.tealTint, border:`1px solid ${VM.tealTint2}`,
              borderRadius:10, padding:'11px 14px', display:'flex', gap:10, alignItems:'flex-start' }}>
              <i className="ti ti-hand-finger" style={{ fontSize:15, color:VM.tealInk, flexShrink:0, marginTop:1 }}></i>
              <span style={{ fontFamily:VM.mono, fontSize:11, color:VM.tealInk, lineHeight:1.6 }}>{curr.tryIt}</span>
            </div>
          )}
        </div>

        {/* step dots */}
        <div style={{ display:'flex', justifyContent:'center', gap:5, padding:'4px 0' }}>
          {steps.map((_,i) => (
            <div key={i} onClick={() => setStep(i)} style={{ cursor:'pointer', transition:'all .2s ease',
              width: i === step ? 18 : 6, height:6, borderRadius:3,
              background: i === step ? VM.teal : (i < step ? VM.tealTint2 : VM.border) }}></div>
          ))}
        </div>

        {/* footer nav */}
        <div style={{ display:'flex', gap:10, padding:'12px 24px 20px', justifyContent:'space-between', alignItems:'center' }}>
          {!isFirst
            ? <Btn onClick={() => setStep(s => s - 1)} style={{ fontSize:13, padding:'9px 16px' }}>
                <i className="ti ti-arrow-left" style={{ fontSize:13 }}></i> Back
              </Btn>
            : <span></span>}
          {isLast
            ? <Btn solid onClick={handleDone} style={{ fontSize:13, padding:'9px 20px' }}>
                {course.route ? 'Try it yourself' : 'Done'}
                <i className={`ti ti-${course.route ? 'arrow-right' : 'check'}`} style={{ fontSize:13 }}></i>
              </Btn>
            : <Btn solid onClick={() => setStep(s => s + 1)} style={{ fontSize:13, padding:'9px 20px' }}>
                Next <i className="ti ti-arrow-right" style={{ fontSize:13 }}></i>
              </Btn>}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Start modal ───────────────────────────────────────────────────────────────
function StartModal({ course, lesson, go, onClose }) {
  // Courses with slide-deck tour steps → TourViewer fallback
  if (!lesson && course.tour && course.tour.length > 0) {
    return <TourViewer course={course} onClose={onClose} go={go} />;
  }
  const t    = catTint(course.cat);
  const isAppTutorial = course.route && !lesson;
  const title = lesson ? lesson.title : course.title;
  const sub   = lesson ? `Lesson ${lesson.n} · ${lesson.dur}` : `${course.format} · ${course.length}`;

  function handleBegin() {
    onClose();
    if (isAppTutorial) go(course.route);
  }

  return ReactDOM.createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:400, display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(31,29,26,0.55)', padding:20 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:VM.paperWarm, border:`1px solid ${VM.borderSoft}`,
        borderRadius:16, padding:'28px 28px 24px', maxWidth:400, width:'100%',
        boxShadow:'0 24px 60px rgba(31,29,26,0.22)' }}>
        <div style={{ width:48, height:48, borderRadius:12, background:t.bg, display:'flex', alignItems:'center',
          justifyContent:'center', marginBottom:16 }}>
          <i className={'ti ti-'+t.icon} style={{ fontSize:24, color:t.fg }}></i>
        </div>
        <Mono size={9.5} color={VM.terra} weight={700} style={{ letterSpacing:'0.08em', textTransform:'uppercase', display:'block', marginBottom:6 }}>
          {catLabel(course.cat)}
        </Mono>
        <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:18, lineHeight:1.2, marginBottom:5 }}>{title}</div>
        <Mono size={11} color={VM.ink3} style={{ display:'block', marginBottom:18 }}>{sub}</Mono>
        <p style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink2, lineHeight:1.6, margin:'0 0 22px' }}>
          {isAppTutorial
            ? 'This opens the relevant section of Veridian Markets so you can follow along interactively.'
            : 'Content for this '+(lesson?'lesson':course.format.toLowerCase())+' is coming in the next phase. You\'ll read, watch, and track progress here.'}
        </p>
        <div style={{ display:'flex', gap:10 }}>
          <Btn solid onClick={handleBegin} style={{ flex:1, justifyContent:'center', fontSize:14, padding:'9px 16px' }}>
            {isAppTutorial ? 'Open in Veridian' : 'Got it'}
            <i className={'ti ti-'+(isAppTutorial?'arrow-right':'check')} style={{ fontSize:15 }}></i>
          </Btn>
          <Btn onClick={onClose} style={{ fontSize:14, padding:'9px 16px' }}>Not yet</Btn>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function FilterGroup({ label, value, onPick, options }) {
  const pick = v => onPick(value===v ? 'all' : v);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
      <Label>{label}</Label>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {options.map(o=>(
          <button key={o} onClick={()=>pick(o)} style={{ fontFamily:VM.mono, fontSize:10.5, padding:'4px 11px',
            borderRadius:999, cursor:'pointer', whiteSpace:'nowrap', transition:'all .12s',
            border:`1px solid ${value===o?VM.forest:VM.border}`,
            background:value===o?VM.forest:VM.paper, color:value===o?VM.paperWarm:VM.ink2 }}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function CourseCard({ c, onOpen }) {
  const [hover, setHover] = useStateLearn(false);
  const t    = catTint(c.cat);
  const tone = c.tag ? TAG_TONE[c.tag] : null;
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onClick={onOpen}
      style={{ background:VM.paper, border:`1px solid ${hover?VM.border:VM.borderSoft}`, borderRadius:12,
        overflow:'hidden', cursor:'pointer', display:'flex', flexDirection:'column',
        transform:hover?'translateY(-3px)':'none',
        boxShadow:hover?'0 10px 22px rgba(31,29,26,0.10)':'none',
        transition:'transform .16s ease, box-shadow .16s ease, border-color .16s ease' }}>
      <div style={{ height:118, background:t.bg, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
        <i className={'ti ti-'+t.icon} style={{ fontSize:40, color:t.fg, opacity:0.92 }}></i>
        <span style={{ position:'absolute', left:12, bottom:10 }}>
          <Mono size={9} color={t.fg} weight={700} style={{ letterSpacing:'0.08em', textTransform:'uppercase', opacity:0.85 }}>
            {catLabel(c.cat)}
          </Mono>
        </span>
        {c.lessons && <span style={{ position:'absolute', right:10, top:10 }}><Mono size={9} color={t.fg} style={{ opacity:0.65 }}>{c.lessons.length} lessons</Mono></span>}
      </div>
      <div style={{ padding:'13px 14px 15px', display:'flex', flexDirection:'column', flex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ width:16, height:16, borderRadius:4, background:VM.forest, color:VM.paperWarm,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-leaf" style={{ fontSize:10 }}></i>
          </span>
          <Mono size={10.5} color={VM.ink3}>{c.provider}</Mono>
        </div>
        <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:16, lineHeight:1.22, margin:'8px 0 0', color:VM.ink }}>{c.title}</div>
        <Mono size={10} color={VM.ink3} style={{ marginTop:6, letterSpacing:'0.04em', textTransform:'uppercase' }}>{c.format}</Mono>
        {tone && (
          <span style={{ alignSelf:'flex-start', marginTop:10, fontFamily:VM.mono, fontSize:9.5, fontWeight:600,
            padding:'3px 9px', borderRadius:999, background:tone.bg, color:tone.fg, border:`1px solid ${tone.bd}`, letterSpacing:'0.04em' }}>{c.tag}</span>
        )}
        <div style={{ marginTop:'auto', display:'flex', alignItems:'center', gap:8, paddingTop:12, color:VM.ink3 }}>
          <i className="ti ti-stairs" style={{ fontSize:13 }}></i>
          <Mono size={10} color={VM.ink3}>{c.level}</Mono>
          <span style={{ width:3, height:3, borderRadius:999, background:VM.faint }}></span>
          <i className="ti ti-clock" style={{ fontSize:13 }}></i>
          <Mono size={10} color={VM.ink3}>{c.length}</Mono>
        </div>
      </div>
    </div>
  );
}

function StartHere({ isMobile, onOpen }) {
  const [hover, setHover] = useStateLearn(false);
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onClick={onOpen}
      style={{ marginTop:24, display:'flex', flexDirection:isMobile?'column':'row', alignItems:isMobile?'flex-start':'center',
        gap:isMobile?14:20, padding:isMobile?'18px':'20px 24px', cursor:'pointer',
        background:`linear-gradient(100deg, ${VM.tealTint} 0%, ${VM.paper} 70%)`,
        border:`1px solid ${hover?VM.tealTint2:VM.borderSoft}`, borderRadius:14, transition:'border-color .16s ease' }}>
      <span style={{ width:48, height:48, borderRadius:12, background:VM.forest, color:VM.paperWarm,
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <i className="ti ti-compass" style={{ fontSize:24 }}></i>
      </span>
      <div style={{ flex:1 }}>
        <Kicker>NEW HERE? · GUIDED PATH</Kicker>
        <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:isMobile?18:20, margin:'4px 0 0' }}>Get started with Veridian in 10 minutes.</div>
        <div style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink2, marginTop:3 }}>Five short steps: read the markets, find a company, map its supply chain, build a watchlist.</div>
      </div>
      <Btn solid style={{ flexShrink:0 }}>Start the path <i className="ti ti-arrow-right" style={{ fontSize:15 }}></i></Btn>
    </div>
  );
}

// ── Lesson content ────────────────────────────────────────────────────────────
// Keyed as courseId_lessonN. Courses beyond the first use a generic template.
const LESSON_BODY = {
  '1_1': { sections:[
    { h:'A market is a meeting point.',
      p:'At its simplest, a market is any arrangement — physical or digital — that lets buyers and sellers exchange things of value. The London Stock Exchange, a farmer\'s market, and a Craigslist listing are all markets. What matters is that there is a price, and that price moves when conditions change.' },
    { h:'Supply and demand set the price.',
      p:'When more people want to buy something than sell it, the price rises. When sellers outnumber buyers, it falls. This push and pull happens continuously, across every trade, on every exchange, every millisecond. No one controls it — the price is just the most recent agreement between a willing buyer and a willing seller.' },
    { h:'Why this matters for investors.',
      p:'Understanding that price is simply the latest transaction — not a valuation, not a verdict on quality — is foundational. A stock trading at $300 is not "worth $300" in any deep sense. It means that the last buyer and seller agreed on $300. Tomorrow it might be $290. The job of an investor is to form a view on whether that price is right.' },
  ], key:['Markets are just meeting points for buyers and sellers','Price = the most recent agreed exchange','No market-maker, regulator or algorithm controls the price — it emerges from transactions'] },

  '1_2': { sections:[
    { h:'Every transaction has two sides.',
      p:'For every buyer there is a seller. This seems obvious until you try to actually trade: who is on the other side of your order? In liquid markets, professional market-makers stand ready to buy and sell at all times. They profit from the difference between what they\'ll pay (the bid) and what they\'ll sell for (the ask).' },
    { h:'The bid-ask spread is a tax on impatience.',
      p:'If a stock\'s bid is $99.95 and its ask is $100.05, the spread is $0.10. Every time you trade, you pay half the spread to enter and half to exit. For long-term investors it\'s negligible. For high-frequency traders, it is the whole game. Tight spreads mean a liquid, healthy market. Wide spreads signal illiquidity or uncertainty.' },
    { h:'Why spreads widen in volatile markets.',
      p:'Market-makers take risk. When uncertainty is high — earnings releases, central bank decisions, geopolitical shocks — they widen spreads to compensate for the risk that prices move sharply before they can offload inventory. This is why executing large trades during volatile periods is expensive.' },
  ], key:['Bid = what the market will buy from you · Ask = what it will sell to you','Spread = the market-maker\'s compensation for providing liquidity','Spreads widen when uncertainty rises'] },

  '1_3': { sections:[
    { h:'Prices aggregate information.',
      p:'Every participant in a market holds private information — about their own finances, their read on the economy, their view of a company. When they buy or sell, they act on that information, and the price moves. In this way, market prices aggregate the collective knowledge of millions of participants into a single number.' },
    { h:'The efficient market hypothesis.',
      p:'Academic theory holds that prices already reflect all available public information, so no one can consistently beat the market using public data. In practice, markets are mostly efficient but occasionally very wrong — particularly around new information, structural change, or when participants are acting on emotion rather than analysis.' },
    { h:'What this means for Veridian.',
      p:'Veridian\'s historical analogue engine starts from this insight. If prices reflect information, then finding periods when a company\'s information structure looked similar to today is a form of reading price history forwards. Not a forecast — a base rate. The past doesn\'t repeat, but it often rhymes.' },
  ], key:['Prices move as participants act on information','Markets are mostly efficient — occasionally wrong','History analogues work because information structures recur'] },

  '1_4': { sections:[
    { h:'Equities: ownership.',
      p:'A share of stock is a fractional ownership stake in a company. Shareholders own a slice of the business, including its future earnings. They benefit when profits grow and the business compounds value over time. They bear the risk that profits disappoint, or the business fails.' },
    { h:'Bonds: loans with a promise.',
      p:'A bond is a loan to a government or company. The issuer promises to pay interest (the coupon) at regular intervals and return the principal at maturity. Bondholders rank above shareholders in a liquidation — they get paid first. This makes bonds less risky but also less rewarding over the long run.' },
    { h:'Commodities, currencies, and more.',
      p:'Commodity markets (oil, gold, copper, wheat) price physical goods. Currency markets (forex) price the exchange rate between national currencies — $1.08 per euro, for example. Each market has its own drivers, participants, and risks. Understanding which type of market you\'re in is the first step to understanding its behaviour.' },
  ], key:['Equities = ownership · upside and downside unlimited','Bonds = loans · priority in liquidation · lower risk','Each market type has its own drivers and risk profile'] },

  '1_5': { sections:[
    { h:'An index is a portfolio in miniature.',
      p:'The S&P 500 is not a market — it is a list of 500 large US companies, weighted by market capitalisation, combined into a single number. When we say "the market is up 1%", we usually mean this index moved. It is a useful shorthand, not a complete picture.' },
    { h:'Market-cap weighting has consequences.',
      p:'Because each company\'s weight equals its share of total market value, the biggest companies dominate. In the S&P 500, the top 10 stocks often represent 25–30% of the index. A single good day for Apple, Microsoft or NVIDIA moves the whole number. Equal-weighted indices exist but are less commonly cited.' },
    { h:'Why indices matter for investors.',
      p:'Index funds track these benchmarks passively and cheaply. Most active managers fail to beat their index over the long run, after fees. Understanding how an index is constructed — what it includes, excludes, and overweights — helps you understand what you\'re actually buying when you buy an index fund.' },
  ], key:['An index is a weighted composite — not the market itself','Market-cap weighting means large companies dominate','Most active managers underperform their benchmark index after fees'] },

  '1_6': { sections:[
    { h:'Pre-market and after-hours.',
      p:'US equity markets officially open at 9:30 AM and close at 4:00 PM Eastern Time. But trading continues in pre-market (4–9:30 AM) and after-hours (4–8 PM) sessions, with lower liquidity and wider spreads. Earnings reports often land after close, moving prices dramatically before the next open.' },
    { h:'Reading the day\'s action.',
      p:'A useful daily habit: glance at which sectors led and lagged, whether volume was above or below average, and what the yield curve did. Sector leadership reveals where money is rotating. Volume confirms conviction — a 2% gain on half normal volume is weaker than the same gain on double volume.' },
    { h:'The market is not the economy.',
      p:'Markets price future earnings, not current conditions. This is why stocks often rise in recessions (when recovery is priced in) and fall in booms (when central banks tighten). The disconnect between "bad news" and rising markets, or "good news" and falling markets, is one of the most consistently confusing things about investing.' },
  ], key:['After-hours moves are real but can be misleading — check volume','Sector rotation and volume tell you more than the index level','Markets price future earnings — they often lead the economy by 6–12 months'] },
};

function getLessonContent(courseId, lesson) {
  const key = `${courseId}_${lesson.n}`;
  if (LESSON_BODY[key]) return LESSON_BODY[key];
  // Generic scaffold for all other lessons
  return {
    sections:[
      { h:`${lesson.title}.`,
        p:`This lesson covers the foundations of ${lesson.title.toLowerCase()}. The core concepts, the vocabulary you need, and the mental models that experienced practitioners use. Written to be read in ${lesson.dur} without prior knowledge beyond what came before in this course.` },
      { h:'Concepts in context.',
        p:'The best way to learn this material is to connect it to things you already understand. As you read, ask: where have I seen this before? Where does this show up in the news, in a company\'s results, or in my own experience? Abstract ideas stick when they have a real-world anchor.' },
      { h:'What comes next.',
        p:`In the following lesson, we\'ll build directly on what\'s covered here. Take a moment to note one thing from this lesson that surprised you, or one thing you\'d like to explore further. That question is the thread that makes the course feel like a conversation rather than a lecture.` },
    ],
    key:[`Core concept: ${lesson.title}`, 'Connect the idea to a real-world example you know', 'Carry one question into the next lesson']
  };
}

// ── Lesson viewer ─────────────────────────────────────────────────────────────
function LessonViewer({ course, lesson, onClose, onNav, isMobile }) {
  const lessons = course.lessons || [];
  const idx     = lessons.findIndex(l => l.n === lesson.n);
  const prev    = idx > 0 ? lessons[idx - 1] : null;
  const next    = idx < lessons.length - 1 ? lessons[idx + 1] : null;
  const pct     = Math.round(((idx + 1) / lessons.length) * 100);
  const content = getLessonContent(course.id, lesson);
  const t       = catTint(course.cat);

  React.useEffect(()=>{
    const h = e => { if(e.key==='Escape') onClose(); };
    window.addEventListener('keydown', h);
    return ()=>window.removeEventListener('keydown', h);
  },[]);
  React.useEffect(()=>{ vmSaveLearnProgress(course, lesson); }, [course.id, lesson.n]);

  return ReactDOM.createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:500, background:VM.paperWarm,
      display:'flex', flexDirection:'column', overflowY:'auto' }}>

      {/* progress bar */}
      <div style={{ height:3, background:VM.paperDeep, flexShrink:0 }}>
        <div style={{ height:'100%', width:`${pct}%`, background:VM.teal, transition:'width .3s ease' }}></div>
      </div>

      {/* top bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'12px 24px', borderBottom:`1px solid ${VM.borderHair}`, flexShrink:0,
        position:'sticky', top:3, background:VM.paperWarm, zIndex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={onClose} style={{ display:'flex', alignItems:'center', gap:6,
            border:'none', background:'none', cursor:'pointer', color:VM.teal, fontFamily:VM.serif, fontSize:13, padding:0 }}>
            <i className="ti ti-arrow-left" style={{ fontSize:14 }}></i> {course.title}
          </button>
          <span style={{ color:VM.faint }}>·</span>
          <Mono size={10} color={VM.ink3}>{idx+1} of {lessons.length}</Mono>
        </div>
        <button onClick={onClose} style={{ width:30, height:30, borderRadius:999,
          border:`1px solid ${VM.border}`, background:VM.paper, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', color:VM.ink2, padding:0 }}>
          <i className="ti ti-x" style={{ fontSize:14 }}></i>
        </button>
      </div>

      {/* content */}
      <div style={{ maxWidth:660, width:'100%', margin:'0 auto',
        padding: isMobile?'28px 18px 64px':'44px 24px 80px', flex:1 }}>

        {/* lesson header */}
        <Mono size={10} color={t.fg} weight={700} style={{ letterSpacing:'0.08em', textTransform:'uppercase', display:'block', marginBottom:8 }}>
          {catLabel(course.cat)} · Lesson {lesson.n}
        </Mono>
        <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:isMobile?26:34, margin:'0 0 6px', lineHeight:1.1 }}>
          {lesson.title}
        </h1>
        <Mono size={11} color={VM.ink3} style={{ display:'block', marginBottom:36 }}>
          <i className="ti ti-clock" style={{ fontSize:12, marginRight:5 }}></i>{lesson.dur}
        </Mono>

        {/* body sections */}
        {content.sections.map((s,i)=>(
          <div key={i} style={{ marginBottom:30 }}>
            <h2 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:20, margin:'0 0 10px', color:VM.ink }}>{s.h}</h2>
            <p style={{ fontFamily:VM.serif, fontSize:16, lineHeight:1.7, color:VM.ink2, margin:0 }}>{s.p}</p>
          </div>
        ))}

        {/* key takeaways */}
        {content.key && (
          <div style={{ background:VM.tealTint, border:`1px solid ${VM.tealTint2}`, borderRadius:12,
            padding:'16px 20px', margin:'36px 0 44px' }}>
            <Mono size={10} color={VM.teal} weight={700} style={{ display:'block', marginBottom:10, letterSpacing:'0.08em', textTransform:'uppercase' }}>
              Key takeaways
            </Mono>
            {content.key.map((k,i)=>(
              <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'4px 0' }}>
                <i className="ti ti-point-filled" style={{ fontSize:10, color:VM.teal, marginTop:6, flexShrink:0 }}></i>
                <span style={{ fontFamily:VM.serif, fontSize:15, color:VM.ink2, lineHeight:1.55 }}>{k}</span>
              </div>
            ))}
          </div>
        )}

        {/* nav */}
        <div style={{ display:'flex', justifyContent:'space-between', gap:12, paddingTop:8,
          borderTop:`1px solid ${VM.borderSoft}` }}>
          {prev
            ? <Btn onClick={()=>onNav(prev)} style={{ fontSize:13, padding:'9px 16px' }}>
                <i className="ti ti-arrow-left" style={{ fontSize:14 }}></i> {prev.title}
              </Btn>
            : <span></span>}
          {next
            ? <Btn solid onClick={()=>onNav(next)} style={{ fontSize:13, padding:'9px 18px' }}>
                Next: {next.title} <i className="ti ti-arrow-right" style={{ fontSize:14 }}></i>
              </Btn>
            : <Btn solid onClick={onClose} style={{ fontSize:13, padding:'9px 18px' }}>
                Complete course <i className="ti ti-check" style={{ fontSize:14 }}></i>
              </Btn>}
        </div>
      </div>
    </div>,
    document.body
  );
}

Object.assign(window, { Learn });

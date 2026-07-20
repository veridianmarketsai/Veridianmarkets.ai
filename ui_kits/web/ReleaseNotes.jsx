// Veridian Markets — Release notes / "what we've shipped" page.
// Public (no sign-in required, like landing/signin) — a plain-language list of
// shipped features for users, not an engineering changelog. Content is
// curated by hand from CLAUDEMemory.md's change log; add a new entry at the
// top of RELEASE_NOTES whenever something real ships.
const RELEASE_NOTES = [
  { date: '2026-07-20', tag: 'Admin', title: 'Admin account actions',
    body: 'Support staff can now suspend, reactivate, or change the plan on an account directly from the admin panel — with extra confirmation steps for anything irreversible.' },
  { date: '2026-07-18', tag: 'Security', title: 'Real sign-in history & sign out everywhere',
    body: 'Settings → Security now shows your genuine recent sign-ins by device, and a "sign out of all sessions" option that really logs every device out.' },
  { date: '2026-07-18', tag: 'For you', title: 'Personalized news & recommendations',
    body: 'Sign in and your favourites and recently-viewed companies now shape the News page and Home feed, plus a new "Recommended for you" section.' },
  { date: '2026-07-18', tag: 'Security', title: 'Optional two-factor authentication',
    body: 'You can now turn on authenticator-app 2FA from Settings if you want the extra layer of security — entirely opt-in.' },
  { date: '2026-07-18', tag: 'Account', title: 'Profile photos & editable details',
    body: 'Upload a real profile photo (synced across your devices), and change your name, email, or password with real confirmation flows.' },
  { date: '2026-07-18', tag: 'Account', title: 'Sign-in required throughout the app',
    body: 'Every page now sits behind sign-in, so your data and settings are consistently protected wherever you land.' },
  { date: '2026-07-18', tag: 'Data', title: 'Balance sheet & quarterly fixes',
    body: 'Balance sheets now follow standard ordering (assets, liabilities, equity), quarterly financials include a real Q4, and you can switch figures between relative and thousands.' },
  { date: '2026-07-18', tag: 'Account', title: 'Your activity, saved for you',
    body: 'Settings → Your activity now shows your real recent searches and viewed companies, and Saved shows your real favourites.' },
  { date: '2026-07-18', tag: 'Billing', title: 'Real subscriptions',
    body: 'Upgrading to Plus or Pro now runs through a real, secure checkout — with a self-serve billing portal to manage or cancel any time.' },
  { date: '2026-07-17', tag: 'Data', title: 'More calendar events',
    body: 'The Calendar page now includes IPOs, FDA decisions, and market holidays alongside earnings and economic data.' },
  { date: '2026-07-17', tag: 'Data', title: 'Live company data across the board',
    body: 'Quotes, company profiles, news, financials, patents, and the earnings calendar now all pull from real, live market data.' },
  { date: '2026-07-14', tag: 'Data', title: 'Financials as reported',
    body: 'Company financials are now sourced directly from real regulatory filings, not illustrative placeholders.' },
  { date: '2026-06-30', tag: 'Data', title: 'Live market quotes',
    body: 'Home, Search, and every company page now show real, live prices instead of mock numbers.' },
  { date: '2026-06-30', tag: 'Account', title: 'Real accounts',
    body: 'Sign-in moved to a real, secure account system — no more placeholder logins.' },
  { date: '2026-06-09', tag: 'Business', title: 'My Business dependency map',
    body: 'Companies can now build their own supplier/customer dependency map, with drag-and-drop nodes, an editor panel, and CSV import.' },
  { date: '2026-06-09', tag: 'Learn', title: 'Interactive tutorials',
    body: 'Guided, step-by-step walkthroughs were added across the app and the admin panel.' },
];

function ReleaseNotes({ go, isMobile }) {
  const tagTone = (tag) => ({
    Admin:'rgba(163,45,45,0.10)', Security:'rgba(196,106,59,0.12)', 'For you':VM.tealTint,
    Account:'rgba(29,78,58,0.10)', Data:VM.tealTint, Billing:'rgba(196,106,59,0.12)',
    Business:'rgba(29,78,58,0.09)', Learn:VM.paperDeep,
  }[tag] || VM.paperDeep);
  const tagFg = (tag) => ({
    Admin:VM.downInk, Security:VM.terra, 'For you':VM.tealInk, Account:VM.forest,
    Data:VM.tealInk, Billing:VM.terra, Business:VM.forest, Learn:VM.ink2,
  }[tag] || VM.ink2);

  return (
    <div style={{ padding: isMobile ? '20px 16px 88px' : '44px 32px 80px', maxWidth: 760, margin: '0 auto' }}>
      <Kicker>Updates</Kicker>
      <h1 style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: isMobile ? 32 : 42, lineHeight: 1.05, margin: '8px 0 8px' }}>
        What we've shipped.
      </h1>
      <p style={{ fontFamily: VM.serif, fontSize: 15, color: VM.ink3, margin: '0 0 32px', maxWidth: 520, lineHeight: 1.55 }}>
        A running list of real features as they go live — newest first. No marketing spin, just what changed.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {RELEASE_NOTES.map((n, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '20px 0', borderTop: i === 0 ? 'none' : `1px solid ${VM.borderHair}` }}>
            <div style={{ flexShrink: 0, width: isMobile ? 74 : 96 }}>
              <Mono size={11} color={VM.ink3}>{n.date}</Mono>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: VM.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: tagFg(n.tag), background: tagTone(n.tag), borderRadius: 5, padding: '2px 8px' }}>{n.tag}</span>
                <span style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 17, color: VM.ink }}>{n.title}</span>
              </div>
              <p style={{ fontFamily: VM.serif, fontSize: 14.5, color: VM.ink2, margin: 0, lineHeight: 1.55 }}>{n.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

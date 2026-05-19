const NAV_ITEMS = [
  { key: 'dashboard', title: 'Dashboard', short: 'Home', icon: '🏠', component: DashboardScreen, subtitle: 'Today’s farm overview' },
  { key: 'animals', title: 'Animals', short: 'Animals', icon: '🐄', component: AnimalsScreen, subtitle: 'Inventory and health status' },
  { key: 'feed', title: 'Feed', short: 'Feed', icon: '🌾', component: FeedScreen, subtitle: 'Ingredients and stock' },
  { key: 'breeding', title: 'Breeding', short: 'Breed', icon: '🍼', component: BreedingScreen, subtitle: 'Pregnancy and delivery records' },
  { key: 'meds', title: 'Meds & Finance', short: 'Finance', icon: '💵', component: MedsFinanceScreen, subtitle: 'Medications, income and expenses' },
  { key: 'reports', title: 'Reports', short: 'Reports', icon: '📊', component: ReportsScreen, subtitle: 'Farm summaries' },
  { key: 'admin', title: 'Admin', short: 'Admin', icon: '🛡️', component: AdminScreen, subtitle: 'User access' },
  { key: 'settings', title: 'Settings', short: 'Settings', icon: '⚙️', component: SettingsScreen, subtitle: 'Profile and security' }
];

function App() {
  const [user, setUser] = useState(CarlesAPI.getCurrentUser());
  const [page, setPage] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener('auth-expired', handleExpired);
    return () => window.removeEventListener('auth-expired', handleExpired);
  }, []);

  if (!user) return <LoginScreen onLogin={() => setUser(CarlesAPI.getCurrentUser())} />;

  const nav = NAV_ITEMS.filter(item => item.key !== 'admin' || user.role === 'Admin');
  const current = nav.find(item => item.key === page) || nav[0];
  const Screen = current.component;
  const bottomNav = nav.filter(item => ['dashboard', 'animals', 'feed', 'meds', 'reports'].includes(item.key));

  function go(key) {
    setPage(key);
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><LogoLockup dark /></div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {nav.map(item => <NavButton key={item.key} item={item} active={page === item.key} onClick={() => go(item.key)} />)}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card-mini"><strong>{user.fullName}</strong><span>{user.role} • {user.username}</span></div>
          <Button variant="secondary" onClick={CarlesAPI.logout}>Sign out</Button>
        </div>
      </aside>

      <main className="content-area">
        <header className="topbar">
          <MobileLogo />
          <div className="topbar-title">
            <h1>{current.title}</h1>
            <p>{current.subtitle}</p>
          </div>
          <div className="topbar-actions">
            <button className="menu-button" onClick={() => setDrawerOpen(true)} aria-label="Open menu">☰</button>
          </div>
        </header>

        <Screen setPage={go} />
      </main>

      <nav className="bottom-nav" aria-label="Quick mobile navigation">
        {bottomNav.map(item => (
          <button key={item.key} className={page === item.key ? 'active' : ''} onClick={() => go(item.key)}>
            <span className="nav-glyph">{item.icon}</span>
            <span>{item.short}</span>
          </button>
        ))}
      </nav>

      {drawerOpen && <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />}
      <section className={'mobile-drawer ' + (drawerOpen ? 'open' : '')} aria-hidden={!drawerOpen}>
        <div className="drawer-head">
          <LogoLockup />
          <button className="menu-button" onClick={() => setDrawerOpen(false)} aria-label="Close menu">×</button>
        </div>
        <nav className="drawer-nav" aria-label="Mobile menu">
          {nav.map(item => <NavButton key={item.key} item={item} active={page === item.key} onClick={() => go(item.key)} />)}
        </nav>
        <div className="drawer-foot">
          <div className="user-card-mini"><strong>{user.fullName}</strong><span>{user.role} • {user.username}</span></div>
          <Button variant="secondary" onClick={CarlesAPI.logout}>Sign out</Button>
        </div>
      </section>
    </div>
  );
}

function NavButton({ item, active, onClick }) {
  return (
    <button className={'nav-item ' + (active ? 'active' : '')} onClick={onClick}>
      <span className="nav-icon">{item.icon}</span>
      <span>{item.title}</span>
    </button>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

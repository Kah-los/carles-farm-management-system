function LogoLockup({ dark = false, compact = false }) {
  return (
    <div className={'logo-lockup ' + (dark ? 'dark' : '')}>
      <img className="mark" src="/assets/logo-mark.svg" alt="Carles Meatland & Farms logo mark" />
      {!compact && <img className="word" src="/assets/logo-wordmark.svg" alt="Carles Meatland & Farms" />}
    </div>
  );
}

function FullLogo({ compact = false }) {
  return <img className={'logo-full ' + (compact ? 'compact' : '')} src="/assets/logo-full.svg" alt="Carles Meatland & Farms" />;
}

function MobileLogo() {
  return (
    <div className="mobile-logo">
      <img src="/assets/logo-mark.svg" alt="Carles Meatland & Farms" />
      <div>
        <b>CARLES</b>
        <small>Meatland & Farms</small>
      </div>
    </div>
  );
}

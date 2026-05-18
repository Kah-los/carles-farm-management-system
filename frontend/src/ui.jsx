const { useState, useEffect, useMemo } = React;

function cleanPayload(input) {
  return Object.fromEntries(
    Object.entries(input || {}).filter(([, value]) => value !== '' && value !== null && value !== undefined)
  );
}

function formatCurrency(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(number);
}

function formatDate(value) {
  if (!value) return '—';
  return String(value).slice(0, 10);
}

function ageFromDate(value) {
  if (!value) return 'Age unavailable';
  const birth = new Date(value);
  if (Number.isNaN(birth.getTime())) return 'Age unavailable';
  const months = Math.max(0, (new Date().getFullYear() - birth.getFullYear()) * 12 + (new Date().getMonth() - birth.getMonth()));
  if (months < 24) return `${months} month${months === 1 ? '' : 's'}`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'}`;
}

function speciesIcon(species) {
  return { Cow: '🐄', Pig: '🐖', Goat: '🐐', Sheep: '🐑', Chicken: '🐔' }[species] || '🐾';
}

function statusClass(status) {
  return String(status || '').toLowerCase().replace(/\s+/g, '-');
}

function Card({ children, className = '', ...props }) {
  return <section className={'card ' + className} {...props}>{children}</section>;
}

function Button({ children, variant = '', className = '', ...props }) {
  return <button className={['btn', variant, className].filter(Boolean).join(' ')} {...props}>{children}</button>;
}

function Field({ label, children, className = '' }) {
  return <label className={'field ' + className}><span>{label}</span>{children}</label>;
}

function TextInput({ className = '', ...props }) {
  return <input className={'input ' + className} {...props} />;
}

function SelectInput({ children, className = '', ...props }) {
  return <select className={'input ' + className} {...props}>{children}</select>;
}

function TextareaInput({ className = '', ...props }) {
  return <textarea className={'input ' + className} {...props} />;
}

function ErrorBox({ message }) {
  return message ? <div className="error" role="alert">{message}</div> : null;
}

function SuccessBox({ message }) {
  return message ? <div className="success" role="status">{message}</div> : null;
}

function InfoNote({ children }) {
  return <div className="info-note">{children}</div>;
}

function Loading({ text = 'Loading records...' }) {
  return <div className="loading"><span>{text}</span></div>;
}

function Empty({ text = 'No records found.' }) {
  return <div className="empty">{text}</div>;
}

function StatCard({ label, value, icon = '•', trend = '' }) {
  return (
    <Card className="stat-card">
      <div className="stat-icon" aria-hidden="true">{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {trend && <div className="stat-trend">{trend}</div>}
      </div>
    </Card>
  );
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header">
      <div className="page-title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function SpeciesBadge({ species }) {
  const color = window.SPECIES_META?.[species]?.accent || '#14B8A6';
  return <span className="badge" style={{ background: `${color}22`, color }}>{speciesIcon(species)} {species || 'Unknown'}</span>;
}

function StatusPill({ status }) {
  return <span className={'pill ' + statusClass(status)}>{status || 'Unknown'}</span>;
}

function KpiItem({ label, value }) {
  return <div className="kpi-item"><span>{label}</span><strong>{value}</strong></div>;
}

function useAsync(loader, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function run() {
    setLoading(true);
    setError('');
    try {
      setData(await loader());
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { run(); }, deps);
  return { data, loading, error, reload: run, setData };
}

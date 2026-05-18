function SettingsScreen() {
  const user = CarlesAPI.getCurrentUser();
  const [form, setForm] = useState({ currentPin: '', newPin: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function changePin(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await CarlesAPI.changePin(cleanPayload(form));
      setMessage('PIN changed successfully.');
      setForm({ currentPin: '', newPin: '' });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <PageHeader title="Settings" subtitle="Review your profile and update security settings." />

      <div className="grid two">
        <Card>
          <h2>Profile</h2>
          <div className="animal-head">
            <div className="animal-avatar">👤</div>
            <div>
              <h3>{user?.fullName || 'User'}</h3>
              <p className="muted">{user?.username} • {user?.role}</p>
            </div>
          </div>
          <div className="kpi-list" style={{ marginTop: 16 }}>
            <KpiItem label="Email" value={user?.email || '—'} />
            <KpiItem label="Phone" value={user?.phone || '—'} />
            <KpiItem label="Access level" value={user?.role || '—'} />
          </div>
        </Card>

        <Card>
          <h2>Change PIN</h2>
          <ErrorBox message={error} />
          <SuccessBox message={message} />
          <form className="form-grid" onSubmit={changePin}>
            <Field label="Current PIN"><TextInput type="password" inputMode="numeric" value={form.currentPin} onChange={e => setForm({ ...form, currentPin: e.target.value })} required /></Field>
            <Field label="New PIN"><TextInput type="password" inputMode="numeric" value={form.newPin} onChange={e => setForm({ ...form, newPin: e.target.value })} required /></Field>
            <div className="span-2"><Button>Update PIN</Button></div>
          </form>
          <InfoNote>Use a PIN with at least 4 digits. Avoid sharing your login details with other staff.</InfoNote>
        </Card>
      </div>

      <Card>
        <h2>Brand assets included</h2>
        <p className="muted">The package includes a clean SVG logo, wordmark, favicon, mobile app icons and a soft farm illustration used on the sign-in page.</p>
        <div className="feature-strip" style={{ color: 'var(--primary)' }}>
          <span style={{ background: '#EEF5F2' }}>Logo: /assets/logo-full.svg</span>
          <span style={{ background: '#EEF5F2' }}>Wordmark: /assets/logo-wordmark.svg</span>
          <span style={{ background: '#EEF5F2' }}>Favicon: /assets/favicon.svg</span>
        </div>
      </Card>
    </div>
  );
}

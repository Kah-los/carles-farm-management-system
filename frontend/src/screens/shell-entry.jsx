function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await window.CarlesAPI.login(username.trim(), pin.trim());
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-shell">
        <section className="login-brand-panel">
          <div className="brand-logo-plate"><FullLogo compact /></div>
          <h1>Modern farm management, beautifully organized.</h1>
          <p>Track animals, feed, medication, breeding, finances and reports from one professional dashboard that works on phones, tablets and desktops.</p>
          <div className="feature-strip" aria-label="System features">
            <span>🐄 Multi-species</span>
            <span>🩺 Health tracking</span>
            <span>📈 Smart reports</span>
            <span>🌱 Sustainable farming</span>
          </div>
        </section>

        <section className="login-form-panel">
          <div className="login-card-inner">
            <FullLogo compact />
            <h2>Welcome back</h2>
            <p className="subtitle">Sign in securely to continue to your farm dashboard.</p>
            <ErrorBox message={error} />
            <form onSubmit={submit}>
              <Field label="Username">
                <TextInput
                  value={username}
                  onChange={event => setUsername(event.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                  required
                />
              </Field>
              <Field label="PIN">
                <TextInput
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={event => setPin(event.target.value)}
                  placeholder="Enter PIN"
                  autoComplete="current-password"
                  required
                />
              </Field>
              <Button className="full" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button>
              <div className="demo-credential">
                <span>Default test login:</span>
                <code>admin</code>
                <code>1234</code>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

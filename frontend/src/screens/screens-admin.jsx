function AdminScreen() {
  const currentUser = CarlesAPI.getCurrentUser();
  if (currentUser?.role !== 'Admin') return <ErrorBox message="Admin access required." />;

  const { data, loading, error, reload } = useAsync(() => CarlesAPI.getUsers(), []);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ username: '', pin: '1234', full_name: '', role: 'Worker', email: '', phone: '' });
  const users = data || [];

  async function addUser(event) {
    event.preventDefault();
    setMessage('');
    await CarlesAPI.createUser(cleanPayload(form));
    setForm({ username: '', pin: '1234', full_name: '', role: 'Worker', email: '', phone: '' });
    setMessage('User created.');
    reload();
  }

  async function unlockUser(user) {
    await CarlesAPI.updateUser(user.id, { is_locked: false, failed_attempts: 0 });
    setMessage('User unlocked.');
    reload();
  }

  return (
    <div className="page">
      <PageHeader title="Admin" subtitle="Create users, review access levels and unlock accounts when needed." />
      <ErrorBox message={error} />
      <SuccessBox message={message} />

      <div className="stats-grid">
        <StatCard label="Users" value={users.length} icon="👥" />
        <StatCard label="Admins" value={users.filter(user => user.role === 'Admin').length} icon="🛡️" />
        <StatCard label="Locked" value={users.filter(user => user.is_locked).length} icon="🔒" />
        <StatCard label="Workers" value={users.filter(user => user.role === 'Worker').length} icon="🧑🏾‍🌾" />
      </div>

      <Card>
        <h2>Add user</h2>
        <form className="form-grid" onSubmit={addUser}>
          <Field label="Username"><TextInput value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required /></Field>
          <Field label="Full name"><TextInput value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required /></Field>
          <Field label="PIN"><TextInput value={form.pin} onChange={e => setForm({ ...form, pin: e.target.value })} required /></Field>
          <Field label="Role"><SelectInput value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option>Admin</option><option>Manager</option><option>Worker</option><option>Veterinarian</option></SelectInput></Field>
          <Field label="Email"><TextInput type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Phone"><TextInput value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
          <div className="span-2"><Button>Create user</Button></div>
        </form>
      </Card>

      <Card className="table-card">
        <h2>Users</h2>
        {loading ? <Loading text="Loading users..." /> : users.length ? (
          <table className="table">
            <thead><tr><th>Username</th><th>Name</th><th>Role</th><th>Status</th><th>Last login</th><th>Action</th></tr></thead>
            <tbody>{users.map(user => (
              <tr key={user.id}>
                <td><b>{user.username}</b></td>
                <td>{user.full_name}</td>
                <td>{user.role}</td>
                <td>{user.is_locked ? <StatusPill status="Failed" /> : <StatusPill status="Healthy" />}</td>
                <td>{formatDate(user.last_login)}</td>
                <td>{user.is_locked ? <Button variant="secondary" onClick={() => unlockUser(user)}>Unlock</Button> : <span className="muted">—</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        ) : <Empty text="No users found." />}
      </Card>
    </div>
  );
}

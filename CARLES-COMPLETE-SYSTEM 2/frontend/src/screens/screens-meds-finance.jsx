function MedsFinanceScreen() {
  const [tab, setTab] = useState('finance');
  return (
    <div className="page">
      <PageHeader title="Medications & Finance" subtitle="Record medication inventory and keep daily income and expenses organized." />
      <div className="tabs">
        <Button variant={tab === 'finance' ? '' : 'secondary'} onClick={() => setTab('finance')}>Finance</Button>
        <Button variant={tab === 'meds' ? '' : 'secondary'} onClick={() => setTab('meds')}>Medications</Button>
      </div>
      {tab === 'finance' ? <FinancePanel /> : <MedicationsPanel />}
    </div>
  );
}

function FinancePanel() {
  const { data, loading, error, reload } = useAsync(() => CarlesAPI.getTransactions(), []);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ transaction_date: new Date().toISOString().slice(0, 10), type: 'Income', category: 'Sales', amount: '', description: '' });
  const transactions = data || [];
  const income = transactions.filter(item => item.type === 'Income').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expense = transactions.filter(item => item.type === 'Expense').reduce((sum, item) => sum + Number(item.amount || 0), 0);

  async function add(event) {
    event.preventDefault();
    setMessage('');
    await CarlesAPI.createTransaction(cleanPayload(form));
    setForm({ ...form, amount: '', description: '' });
    setMessage('Transaction added.');
    reload();
  }

  return (
    <div className="page">
      <div className="stats-grid">
        <StatCard label="Income" value={formatCurrency(income)} icon="💵" />
        <StatCard label="Expenses" value={formatCurrency(expense)} icon="🧾" />
        <StatCard label="Net" value={formatCurrency(income - expense)} icon="📈" />
        <StatCard label="Transactions" value={transactions.length} icon="📋" />
      </div>

      <Card>
        <h2>Add transaction</h2>
        <SuccessBox message={message} />
        <form className="form-grid" onSubmit={add}>
          <Field label="Date"><TextInput type="date" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })} required /></Field>
          <Field label="Type"><SelectInput value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option>Income</option><option>Expense</option></SelectInput></Field>
          <Field label="Category"><TextInput value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Sales, Feed, Veterinary" required /></Field>
          <Field label="Amount"><TextInput type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></Field>
          <Field label="Description" className="span-2"><TextareaInput value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional transaction details" /></Field>
          <div className="span-2"><Button>Add transaction</Button></div>
        </form>
      </Card>

      <Card className="table-card">
        <h2>Transactions</h2>
        {loading ? <Loading text="Loading transactions..." /> : error ? <ErrorBox message={error} /> : transactions.length ? (
          <table className="table">
            <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead>
            <tbody>{transactions.map(item => <tr key={item.id}><td>{formatDate(item.transaction_date)}</td><td><StatusPill status={item.type} /></td><td>{item.category}</td><td>{item.description || '—'}</td><td><b>{formatCurrency(item.amount)}</b></td></tr>)}</tbody>
          </table>
        ) : <Empty text="No transactions recorded." />}
      </Card>
    </div>
  );
}

function MedicationsPanel() {
  const { data, loading, error, reload } = useAsync(() => CarlesAPI.getMedications(), []);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', type: '', manufacturer: '', withdrawal_period_days: '', cost_per_unit: '', stock_quantity: '', notes: '' });
  const medications = data || [];
  const lowStock = medications.filter(item => Number(item.stock_quantity || 0) <= 5).length;

  async function add(event) {
    event.preventDefault();
    setMessage('');
    await CarlesAPI.createMedication(cleanPayload(form));
    setForm({ name: '', type: '', manufacturer: '', withdrawal_period_days: '', cost_per_unit: '', stock_quantity: '', notes: '' });
    setMessage('Medication added.');
    reload();
  }

  return (
    <div className="page">
      <div className="stats-grid">
        <StatCard label="Medication types" value={medications.length} icon="💊" />
        <StatCard label="Low stock" value={lowStock} icon="⚠️" />
        <StatCard label="Total units" value={medications.reduce((sum, item) => sum + Number(item.stock_quantity || 0), 0)} icon="📦" />
        <StatCard label="With withdrawal" value={medications.filter(item => item.withdrawal_period_days).length} icon="⏱️" />
      </div>

      <Card>
        <h2>Add medication</h2>
        <SuccessBox message={message} />
        <form className="form-grid" onSubmit={add}>
          <Field label="Medication name"><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Type"><TextInput value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} placeholder="Vaccine, antibiotic..." /></Field>
          <Field label="Manufacturer"><TextInput value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} /></Field>
          <Field label="Withdrawal days"><TextInput type="number" value={form.withdrawal_period_days} onChange={e => setForm({ ...form, withdrawal_period_days: e.target.value })} /></Field>
          <Field label="Cost per unit"><TextInput type="number" step="0.01" value={form.cost_per_unit} onChange={e => setForm({ ...form, cost_per_unit: e.target.value })} /></Field>
          <Field label="Stock quantity"><TextInput type="number" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} /></Field>
          <Field label="Notes" className="span-2"><TextareaInput value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
          <div className="span-2"><Button>Add medication</Button></div>
        </form>
      </Card>

      <div className="cards-grid">
        {loading ? <Loading text="Loading medications..." /> : error ? <ErrorBox message={error} /> : medications.length ? medications.map(item => (
          <Card key={item.id}>
            <h3>{item.name}</h3>
            <p className="muted">{item.type || 'Type not recorded'} • {item.manufacturer || 'No manufacturer'}</p>
            <div className="kpi-list" style={{ marginTop: 12 }}>
              <KpiItem label="Stock" value={item.stock_quantity ?? '—'} />
              <KpiItem label="Withdrawal" value={item.withdrawal_period_days ? `${item.withdrawal_period_days} days` : '—'} />
              <KpiItem label="Cost" value={item.cost_per_unit ? formatCurrency(item.cost_per_unit) : '—'} />
            </div>
          </Card>
        )) : <Empty text="No medications recorded." />}
      </div>
    </div>
  );
}

function DashboardScreen({ setPage }) {
  const { data, loading, error } = useAsync(async () => {
    const [animals, transactions, breeding] = await Promise.all([
      CarlesAPI.getAnimals(),
      CarlesAPI.getTransactions({ limit: 8 }),
      CarlesAPI.getBreedingRecords()
    ]);
    return { animals, transactions, breeding };
  }, []);

  if (loading) return <Loading text="Preparing dashboard..." />;
  if (error) return <ErrorBox message={error} />;

  const animals = data.animals || [];
  const transactions = data.transactions || [];
  const breeding = data.breeding || [];
  const total = animals.length;
  const healthAlerts = animals.filter(animal => ['Sick', 'Quarantine'].includes(animal.status)).length;
  const recentIncome = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const recentExpense = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const activeBreeding = breeding.filter(item => ['Pending', 'Pregnant'].includes(item.status)).length;
  const species = window.SPECIES.map(name => ({ label: name, value: animals.filter(animal => animal.species === name).length }));
  const upcoming = breeding
    .filter(record => record.expected_delivery && !record.actual_delivery)
    .sort((a, b) => String(a.expected_delivery).localeCompare(String(b.expected_delivery)))
    .slice(0, 5);

  return (
    <div className="page">
      <Card className="hero-card">
        <div className="hero-content">
          <div className="hero-eyebrow">Carles Meatland & Farms</div>
          <h2>Raised right. Grown together. Delivered better.</h2>
          <p>A clean command center for daily farm operations, health oversight, breeding schedules and financial tracking.</p>
          <div className="hero-actions">
            <Button onClick={() => setPage('animals')}>Add or view animals</Button>
            <Button variant="secondary" onClick={() => setPage('meds')}>Record finance</Button>
          </div>
        </div>
      </Card>

      <div className="stats-grid">
        <StatCard label="Total animals" value={total} icon="🐾" />
        <StatCard label="Health alerts" value={healthAlerts} icon="🩺" trend={healthAlerts ? 'Needs attention' : 'All clear'} />
        <StatCard label="Recent income" value={formatCurrency(recentIncome)} icon="💵" />
        <StatCard label="Recent expenses" value={formatCurrency(recentExpense)} icon="🧾" />
      </div>

      <div className="grid two">
        <Card>
          <h2>Animals by species</h2>
          <BarList items={species} />
        </Card>

        <Card>
          <h2>Farm pulse</h2>
          <div className="kpi-list">
            <KpiItem label="Active breeding records" value={activeBreeding} />
            <KpiItem label="Healthy animals" value={animals.filter(a => a.status === 'Healthy').length} />
            <KpiItem label="Recent transactions" value={transactions.length} />
            <KpiItem label="Pens in use" value={new Set(animals.map(a => a.pen).filter(Boolean)).size} />
          </div>
        </Card>
      </div>

      <div className="grid two">
        <Card>
          <h2>Recent transactions</h2>
          {transactions.length ? transactions.slice(0, 5).map(item => (
            <div className="kpi-item" key={item.id}>
              <span><b>{item.type}</b> • {item.category}<br /><small className="muted">{formatDate(item.transaction_date)}</small></span>
              <strong>{formatCurrency(item.amount)}</strong>
            </div>
          )) : <Empty text="No transactions yet." />}
        </Card>

        <Card>
          <h2>Upcoming deliveries</h2>
          {upcoming.length ? upcoming.map(record => (
            <div className="kpi-item" key={record.id}>
              <span><b>{record.animal_tag || 'Animal'}</b> • {record.species || 'Species'}<br /><small className="muted">Sire: {record.sire || '—'}</small></span>
              <strong className="nowrap">{formatDate(record.expected_delivery)}</strong>
            </div>
          )) : <Empty text="No upcoming deliveries recorded." />}
        </Card>
      </div>
    </div>
  );
}

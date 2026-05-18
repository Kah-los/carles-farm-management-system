function ReportsScreen() {
  const { data, loading, error } = useAsync(async () => ({
    animals: await CarlesAPI.report('animals'),
    finance: await CarlesAPI.report('finance'),
    health: await CarlesAPI.report('health'),
    feed: await CarlesAPI.report('feed')
  }), []);

  if (loading) return <Loading text="Building reports..." />;
  if (error) return <ErrorBox message={error} />;

  const animalRows = data.animals || [];
  const financeRows = data.finance || [];
  const healthRows = data.health || [];
  const feedRows = data.feed || [];
  const speciesTotals = window.SPECIES.map(species => ({
    label: species,
    value: animalRows.filter(row => row.species === species).reduce((sum, row) => sum + Number(row.count || 0), 0)
  }));

  return (
    <div className="page">
      <PageHeader title="Reports" subtitle="Quick summaries for inventory, health, feed and finances." />
      <div className="stats-grid">
        <StatCard label="Inventory rows" value={animalRows.length} icon="🐾" />
        <StatCard label="Health alerts" value={healthRows.length} icon="🩺" />
        <StatCard label="Finance categories" value={financeRows.length} icon="💵" />
        <StatCard label="Feed entries" value={feedRows.length} icon="🌾" />
      </div>

      <div className="grid two">
        <Card>
          <h2>Animal inventory</h2>
          <BarList items={speciesTotals} />
        </Card>
        <Card>
          <h2>Financial summary</h2>
          {financeRows.length ? financeRows.map((row, index) => (
            <div className="kpi-item" key={index}>
              <span><b>{row.type}</b> • {row.category}<br /><small className="muted">{row.count} transaction(s)</small></span>
              <strong>{formatCurrency(row.total)}</strong>
            </div>
          )) : <Empty text="No financial report data." />}
        </Card>
      </div>

      <div className="grid two">
        <Card>
          <h2>Health alerts</h2>
          {healthRows.length ? healthRows.map(animal => (
            <div className="kpi-item" key={animal.id}>
              <span><b>{animal.tag}</b> • {animal.name || animal.species}<br /><small className="muted">{animal.pen || 'No pen recorded'}</small></span>
              <StatusPill status={animal.status} />
            </div>
          )) : <Empty text="No sick or quarantined animals." />}
        </Card>
        <Card>
          <h2>Recent feed consumption</h2>
          {feedRows.length ? feedRows.slice(0, 8).map((row, index) => (
            <div className="kpi-item" key={index}>
              <span><b>{row.species || 'Unknown'}</b><br /><small className="muted">{formatDate(row.feed_date)}</small></span>
              <strong>{Number(row.total_kg || 0).toLocaleString()} kg</strong>
            </div>
          )) : <Empty text="No feed consumption data yet." />}
        </Card>
      </div>
    </div>
  );
}

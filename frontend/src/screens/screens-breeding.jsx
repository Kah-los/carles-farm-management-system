function BreedingScreen() {
  const { data, loading, error, reload } = useAsync(async () => ({
    records: await CarlesAPI.getBreedingRecords(),
    animals: await CarlesAPI.getAnimals()
  }), []);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ animal_id: '', breeding_date: new Date().toISOString().slice(0, 10), sire: '', expected_delivery: '', status: 'Pending', notes: '' });

  const animals = data?.animals || [];
  const records = data?.records || [];

  function updateAnimal(id) {
    const animal = animals.find(item => String(item.id) === String(id));
    const date = form.breeding_date ? new Date(form.breeding_date) : null;
    let expected = form.expected_delivery;
    if (animal && date && !Number.isNaN(date.getTime())) {
      const gestation = SPECIES_META[animal.species]?.gestation;
      if (gestation) {
        date.setDate(date.getDate() + gestation);
        expected = date.toISOString().slice(0, 10);
      }
    }
    setForm({ ...form, animal_id: id, expected_delivery: expected });
  }

  async function addRecord(event) {
    event.preventDefault();
    setMessage('');
    await CarlesAPI.createBreedingRecord(cleanPayload(form));
    setForm({ animal_id: '', breeding_date: new Date().toISOString().slice(0, 10), sire: '', expected_delivery: '', status: 'Pending', notes: '' });
    setMessage('Breeding record added.');
    reload();
  }

  if (loading) return <Loading text="Loading breeding records..." />;

  const active = records.filter(item => ['Pending', 'Pregnant'].includes(item.status)).length;
  const delivered = records.filter(item => item.status === 'Delivered').length;
  const upcoming = records.filter(item => item.expected_delivery && !item.actual_delivery).length;

  return (
    <div className="page">
      <PageHeader title="Breeding" subtitle="Track breeding dates, sires, expected delivery dates and pregnancy outcomes." />
      <ErrorBox message={error} />
      <SuccessBox message={message} />

      <div className="stats-grid">
        <StatCard label="Active records" value={active} icon="🍼" />
        <StatCard label="Upcoming deliveries" value={upcoming} icon="📅" />
        <StatCard label="Delivered" value={delivered} icon="✅" />
        <StatCard label="Total records" value={records.length} icon="📋" />
      </div>

      <Card>
        <h2>Add breeding record</h2>
        <form className="form-grid" onSubmit={addRecord}>
          <Field label="Animal"><SelectInput value={form.animal_id} onChange={e => updateAnimal(e.target.value)} required>
            <option value="">Select animal</option>
            {animals.map(animal => <option key={animal.id} value={animal.id}>{animal.tag} — {animal.name || animal.species}</option>)}
          </SelectInput></Field>
          <Field label="Breeding date"><TextInput type="date" value={form.breeding_date} onChange={e => setForm({ ...form, breeding_date: e.target.value })} required /></Field>
          <Field label="Sire"><TextInput value={form.sire} onChange={e => setForm({ ...form, sire: e.target.value })} placeholder="Sire name/tag" /></Field>
          <Field label="Expected delivery"><TextInput type="date" value={form.expected_delivery} onChange={e => setForm({ ...form, expected_delivery: e.target.value })} /></Field>
          <Field label="Status"><SelectInput value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>Pending</option><option>Pregnant</option><option>Delivered</option><option>Failed</option></SelectInput></Field>
          <Field label="Notes" className="span-2"><TextareaInput value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" /></Field>
          <div className="span-2"><Button>Add record</Button></div>
        </form>
      </Card>

      <div className="cards-grid">
        {records.length ? records.map(record => (
          <Card className="record-card" key={record.id}>
            <div className="animal-head">
              <div className="animal-avatar">{speciesIcon(record.species)}</div>
              <div>
                <h3>{record.animal_tag || 'Animal'} {record.animal_name ? `— ${record.animal_name}` : ''}</h3>
                <p className="muted">Breeding date: {formatDate(record.breeding_date)}</p>
              </div>
            </div>
            <div className="action-row"><StatusPill status={record.status} />{record.species && <SpeciesBadge species={record.species} />}</div>
            <div className="kpi-list">
              <KpiItem label="Expected delivery" value={formatDate(record.expected_delivery)} />
              <KpiItem label="Actual delivery" value={formatDate(record.actual_delivery)} />
              <KpiItem label="Offspring" value={record.offspring_count || '—'} />
              <KpiItem label="Sire" value={record.sire || '—'} />
            </div>
          </Card>
        )) : <Empty text="No breeding records yet." />}
      </div>
    </div>
  );
}

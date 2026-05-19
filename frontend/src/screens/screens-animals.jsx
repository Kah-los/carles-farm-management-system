function AnimalsScreen() {
  const [filters, setFilters] = useState({ species: '', status: '', search: '' });
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    tag: '', name: '', species: 'Cow', breed: '', sex: 'Female', date_of_birth: '', weight: '', pen: '', status: 'Healthy', notes: ''
  });
  const apiFilters = { species: filters.species, status: filters.status };
  const { data, loading, error, reload } = useAsync(() => CarlesAPI.getAnimals(apiFilters), [filters.species, filters.status]);
  const animals = data || [];

  const visibleAnimals = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    if (!term) return animals;
    return animals.filter(animal => [animal.tag, animal.name, animal.breed, animal.pen, animal.species]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(term)));
  }, [animals, filters.search]);

  async function addAnimal(event) {
    event.preventDefault();
    setMessage('');
    await CarlesAPI.createAnimal(cleanPayload(form));
    setForm({ tag: '', name: '', species: 'Cow', breed: '', sex: 'Female', date_of_birth: '', weight: '', pen: '', status: 'Healthy', notes: '' });
    setMessage('Animal added successfully.');
    reload();
  }

  async function deleteAnimal(id) {
    if (!confirm('Delete this animal? This cannot be undone.')) return;
    await CarlesAPI.deleteAnimal(id);
    setMessage('Animal deleted.');
    reload();
  }

  return (
    <div className="page">
      <PageHeader
        title="Animals"
        subtitle="Manage animal identity, species, health status, pen location and weight from a mobile-friendly view."
      />

      <Card>
        <h2>Add new animal</h2>
        <SuccessBox message={message} />
        <form className="form-grid" onSubmit={addAnimal}>
          <Field label="Tag number"><TextInput value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} placeholder="CM003" required /></Field>
          <Field label="Name"><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Optional" /></Field>
          <Field label="Species"><SelectInput value={form.species} onChange={e => setForm({ ...form, species: e.target.value })}>{SPECIES.map(item => <option key={item}>{item}</option>)}</SelectInput></Field>
          <Field label="Breed"><TextInput value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} placeholder="Holstein" /></Field>
          <Field label="Sex"><SelectInput value={form.sex} onChange={e => setForm({ ...form, sex: e.target.value })}><option>Female</option><option>Male</option></SelectInput></Field>
          <Field label="Date of birth"><TextInput type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} /></Field>
          <Field label="Weight kg"><TextInput type="number" step="0.01" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="0.00" /></Field>
          <Field label="Pen"><TextInput value={form.pen} onChange={e => setForm({ ...form, pen: e.target.value })} placeholder="A1" /></Field>
          <Field label="Status"><SelectInput value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>Healthy</option><option>Sick</option><option>Quarantine</option><option>Sold</option><option>Deceased</option></SelectInput></Field>
          <Field label="Notes" className="span-2"><TextareaInput value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" /></Field>
          <div className="span-2"><Button>Add animal</Button></div>
        </form>
      </Card>

      <Card className="flat">
        <div className="toolbar">
          <TextInput placeholder="Search by tag, name, breed or pen" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
          <SelectInput value={filters.species} onChange={e => setFilters({ ...filters, species: e.target.value })}>
            <option value="">All species</option>
            {SPECIES.map(item => <option key={item}>{item}</option>)}
          </SelectInput>
          <SelectInput value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All statuses</option>
            <option>Healthy</option><option>Sick</option><option>Quarantine</option><option>Sold</option><option>Deceased</option>
          </SelectInput>
          <Button variant="secondary" onClick={reload}>Refresh</Button>
        </div>
        {loading ? <Loading text="Loading animals..." /> : error ? <ErrorBox message={error} /> : (
          visibleAnimals.length ? <div className="cards-grid">
            {visibleAnimals.map(animal => {
              const color = SPECIES_META[animal.species]?.accent || '#14B8A6';
              return (
                <Card className="animal-card" key={animal.id} style={{ '--species': color }}>
                  <div className="animal-head">
                    <div className="animal-avatar">{speciesIcon(animal.species)}</div>
                    <div style={{ minWidth: 0 }}>
                      <h3>{animal.name || 'Unnamed animal'}</h3>
                      <p className="muted"><b>{animal.tag}</b> • {animal.breed || 'Breed not recorded'}</p>
                    </div>
                  </div>
                  <div className="action-row">
                    <SpeciesBadge species={animal.species} />
                    <StatusPill status={animal.status} />
                  </div>
                  <div className="animal-meta">
                    <span>Age<br /><b>{ageFromDate(animal.date_of_birth)}</b></span>
                    <span>Weight<br /><b>{animal.weight ? `${animal.weight} kg` : '—'}</b></span>
                    <span>Pen<br /><b>{animal.pen || '—'}</b></span>
                    <span>Sex<br /><b>{animal.sex || '—'}</b></span>
                  </div>
                  <div className="action-row">
                    <Button variant="danger" onClick={() => deleteAnimal(animal.id)}>Delete</Button>
                  </div>
                </Card>
              );
            })}
          </div> : <Empty text="No animals match your filters." />
        )}
      </Card>
    </div>
  );
}

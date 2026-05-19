function FeedScreen() {
  const { data, loading, error, reload } = useAsync(async () => ({
    ingredients: await CarlesAPI.getIngredients(),
    formulas: await CarlesAPI.getFormulas(),
    logs: await CarlesAPI.getFeedingLogs()
  }), []);
  const [message, setMessage] = useState('');
  const [ingredient, setIngredient] = useState({ name: '', category: 'Grain', cost_per_kg: '', stock_kg: '', protein_percent: '', energy_kcal: '' });

  async function addIngredient(event) {
    event.preventDefault();
    setMessage('');
    await CarlesAPI.createIngredient(cleanPayload(ingredient));
    setIngredient({ name: '', category: 'Grain', cost_per_kg: '', stock_kg: '', protein_percent: '', energy_kcal: '' });
    setMessage('Feed ingredient added.');
    reload();
  }

  if (loading) return <Loading text="Loading feed records..." />;

  const ingredients = data?.ingredients || [];
  const formulas = data?.formulas || [];
  const totalStock = ingredients.reduce((sum, item) => sum + Number(item.stock_kg || 0), 0);
  const lowStock = ingredients.filter(item => Number(item.stock_kg || 0) < 100).length;

  return (
    <div className="page">
      <PageHeader title="Feed" subtitle="Monitor feed ingredients, stock levels, formula costs and feeding records." />
      <ErrorBox message={error} />
      <SuccessBox message={message} />

      <div className="stats-grid">
        <StatCard label="Ingredients" value={ingredients.length} icon="🌾" />
        <StatCard label="Total stock" value={`${Math.round(totalStock).toLocaleString()} kg`} icon="⚖️" />
        <StatCard label="Low stock items" value={lowStock} icon="⚠️" />
        <StatCard label="Feed formulas" value={formulas.length} icon="📋" />
      </div>

      <Card>
        <h2>Add feed ingredient</h2>
        <form className="form-grid" onSubmit={addIngredient}>
          <Field label="Ingredient name"><TextInput value={ingredient.name} onChange={e => setIngredient({ ...ingredient, name: e.target.value })} placeholder="Corn" required /></Field>
          <Field label="Category"><TextInput value={ingredient.category} onChange={e => setIngredient({ ...ingredient, category: e.target.value })} placeholder="Grain" /></Field>
          <Field label="Cost per kg"><TextInput type="number" step="0.01" value={ingredient.cost_per_kg} onChange={e => setIngredient({ ...ingredient, cost_per_kg: e.target.value })} /></Field>
          <Field label="Stock kg"><TextInput type="number" step="0.01" value={ingredient.stock_kg} onChange={e => setIngredient({ ...ingredient, stock_kg: e.target.value })} /></Field>
          <Field label="Protein %"><TextInput type="number" step="0.01" value={ingredient.protein_percent} onChange={e => setIngredient({ ...ingredient, protein_percent: e.target.value })} /></Field>
          <Field label="Energy kcal"><TextInput type="number" step="0.01" value={ingredient.energy_kcal} onChange={e => setIngredient({ ...ingredient, energy_kcal: e.target.value })} /></Field>
          <div className="span-2"><Button>Add ingredient</Button></div>
        </form>
      </Card>

      <div className="grid two">
        <Card>
          <h2>Ingredient stock</h2>
          {ingredients.length ? <BarList items={ingredients.slice(0, 10).map(item => ({ label: item.name, value: Number(item.stock_kg || 0), displayValue: `${Number(item.stock_kg || 0).toLocaleString()} kg` }))} /> : <Empty text="No ingredients recorded." />}
        </Card>
        <Card>
          <h2>Feed formulas</h2>
          {formulas.length ? formulas.map(formula => (
            <div className="kpi-item" key={formula.id}>
              <span><b>{formula.name}</b><br /><small className="muted">{formula.description || 'No description'}</small></span>
              <SpeciesBadge species={formula.target_species || 'All'} />
            </div>
          )) : <Empty text="No formulas recorded yet." />}
        </Card>
      </div>
    </div>
  );
}

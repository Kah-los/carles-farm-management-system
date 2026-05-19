// Feed Screen - Rebuilt with Preloaded Ingredients & Unit Selector
const { useState, useEffect } = React;
const { Card, Button, Input, Select, Textarea, Modal, LoadingSpinner, ErrorState, EmptyState, Tabs, ConfirmDialog } = window.UI;

function FeedScreen({ user, showToast }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ingredients');
  const [ingredients, setIngredients] = useState([]);
  const [formulas, setFormulas] = useState([]);
  const [logs, setLogs] = useState([]);
  const [animals, setAnimals] = useState([]);
  
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [showEditIngredientModal, setShowEditIngredientModal] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteType, setDeleteType] = useState('');
  
  const [ingredientForm, setIngredientForm] = useState({
    name: '', 
    category: '', 
    cost_per_kg: '', 
    stock_kg: '', 
    protein_percent: '', 
    energy_kcal: ''
  });
  
  const [logForm, setLogForm] = useState({
    animal_id: '', 
    formula_id: '', 
    feed_date: new Date().toISOString().split('T')[0], 
    quantity_kg: '',
    quantity_unit: 'kg',
    notes: ''
  });

  // **PRELOAD ingredients on mount**
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ingredientsData, formulasData, logsData, animalsData] = await Promise.all([
        window.CarlesAPI.getIngredients(), // This fetches the 16 preloaded ingredients!
        window.CarlesAPI.getFormulas(),
        window.CarlesAPI.getFeedingLogs(),
        window.CarlesAPI.getAnimals()
      ]);
      
      setIngredients(ingredientsData); // These are the 16 ingredients from database
      setFormulas(formulasData);
      setLogs(logsData);
      setAnimals(animalsData);
      
      if (ingredientsData.length > 0) {
        showToast(`✅ Loaded ${ingredientsData.length} feed ingredients from database`);
      }
    } catch (err) {
      showToast(`❌ Error loading feed data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetIngredientForm = () => {
    setIngredientForm({ 
      name: '', 
      category: '', 
      cost_per_kg: '', 
      stock_kg: '', 
      protein_percent: '', 
      energy_kcal: '' 
    });
  };

  const handleAddIngredient = async (e) => {
    e.preventDefault();
    try {
      await window.CarlesAPI.createIngredient(ingredientForm);
      showToast('✅ Ingredient added!');
      setShowIngredientModal(false);
      resetIngredientForm();
      loadData();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  const handleEditIngredient = (ingredient) => {
    setSelectedItem(ingredient);
    setIngredientForm({
      name: ingredient.name || '',
      category: ingredient.category || '',
      cost_per_kg: ingredient.cost_per_kg || '',
      stock_kg: ingredient.stock_kg || '',
      protein_percent: ingredient.protein_percent || '',
      energy_kcal: ingredient.energy_kcal || ''
    });
    setShowEditIngredientModal(true);
  };

  const handleUpdateIngredient = async (e) => {
    e.preventDefault();
    try {
      await window.CarlesAPI.updateIngredient(selectedItem.id, ingredientForm);
      showToast('✅ Ingredient updated!');
      setShowEditIngredientModal(false);
      loadData();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  const handleDeleteIngredient = async () => {
    try {
      await window.CarlesAPI.deleteIngredient(selectedItem.id);
      showToast('✅ Ingredient deleted!');
      setShowDeleteDialog(false);
      loadData();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  const handleDeleteFormula = async () => {
    try {
      await window.CarlesAPI.deleteFormula(selectedItem.id);
      showToast('✅ Formula deleted!');
      setShowDeleteDialog(false);
      loadData();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  const handleRecordFeeding = async (e) => {
    e.preventDefault();
    try {
      // Convert quantity to kg if unit is g
      let quantityInKg = parseFloat(logForm.quantity_kg);
      if (logForm.quantity_unit === 'g') {
        quantityInKg = quantityInKg / 1000;
      }
      
      const dataToSubmit = {
        ...logForm,
        quantity_kg: quantityInKg
      };
      delete dataToSubmit.quantity_unit;
      
      await window.CarlesAPI.recordFeeding(dataToSubmit);
      showToast('✅ Feeding recorded!');
      setShowLogModal(false);
      setLogForm({ 
        animal_id: '', 
        formula_id: '', 
        feed_date: new Date().toISOString().split('T')[0], 
        quantity_kg: '',
        quantity_unit: 'kg',
        notes: '' 
      });
      loadData();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  const confirmDelete = (item, type) => {
    setSelectedItem(item);
    setDeleteType(type);
    setShowDeleteDialog(true);
  };

  if (loading) return <LoadingSpinner text="Loading feed data..." />;

  // Calculate stats
  const totalStock = ingredients.reduce((sum, ing) => sum + (parseFloat(ing.stock_kg) || 0), 0);
  const lowStockItems = ingredients.filter(ing => parseFloat(ing.stock_kg) < 50).length;

  return (
    <div className="feed-screen">
      {/* Header */}
      <div className="screen-header">
        <div>
          <h1>Feed & Formulas</h1>
          <p>{ingredients.length} ingredients in stock • {formulas.length} active formulas • {lowStockItems} need restock</p>
        </div>
        <div className="header-actions">
          {activeTab === 'ingredients' && (
            <Button variant="primary" icon="+" onClick={() => { resetIngredientForm(); setShowIngredientModal(true); }}>
              New Ingredient
            </Button>
          )}
          {activeTab === 'logs' && (
            <Button variant="primary" icon="+" onClick={() => setShowLogModal(true)}>
              Record Feeding
            </Button>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--spacing-xl)' }}>
        <Card className="stat-mini-card">
          <div className="stat-mini-icon">🌾</div>
          <div className="stat-mini-value">{ingredients.length}</div>
          <div className="stat-mini-label">Ingredients</div>
        </Card>
        
        <Card className="stat-mini-card">
          <div className="stat-mini-icon">⚖️</div>
          <div className="stat-mini-value">{totalStock.toFixed(0)} kg</div>
          <div className="stat-mini-label">Total Stock</div>
        </Card>
        
        <Card className={`stat-mini-card ${lowStockItems > 0 ? 'warning' : ''}`}>
          <div className="stat-mini-icon">⚠️</div>
          <div className="stat-mini-value">{lowStockItems}</div>
          <div className="stat-mini-label">Low Stock Items</div>
        </Card>
        
        <Card className="stat-mini-card">
          <div className="stat-mini-icon">📋</div>
          <div className="stat-mini-value">{formulas.length}</div>
          <div className="stat-mini-label">Feed Formulas</div>
        </Card>
      </div>

      <Tabs
        tabs={[
          { id: 'ingredients', label: 'Ingredients', icon: '🌾', count: ingredients.length },
          { id: 'formulas', label: 'Formulas', icon: '📋', count: formulas.length },
          { id: 'logs', label: 'Feeding Log', icon: '✓', count: logs.length }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* INGREDIENTS TAB */}
      {activeTab === 'ingredients' && (
        ingredients.length === 0 ? (
          <EmptyState
            icon="🌾"
            title="No ingredients loaded"
            description="The 16 feed ingredients should be preloaded. Check backend database."
            action={<Button onClick={loadData}>Reload Data</Button>}
          />
        ) : (
          <div className="ingredients-grid">
            {ingredients.map(ing => {
              const stockLevel = parseFloat(ing.stock_kg) || 0;
              const isLowStock = stockLevel < 50;
              
              return (
                <Card key={ing.id} className={`ingredient-card ${isLowStock ? 'low-stock' : ''}`}>
                  <div className="ingredient-header">
                    <h3>{ing.name}</h3>
                    {ing.category && <span className="ingredient-category">{ing.category}</span>}
                    {isLowStock && <span className="low-stock-badge">Low Stock</span>}
                  </div>
                  
                  <div className="ingredient-stock">
                    <div className="stock-bar">
                      <div 
                        className="stock-bar-fill" 
                        style={{ 
                          width: `${Math.min((stockLevel / 100) * 100, 100)}%`,
                          backgroundColor: isLowStock ? 'var(--color-coral)' : 'var(--color-teal-light)'
                        }}
                      />
                    </div>
                    <div className="stock-amount">
                      <strong>{stockLevel.toFixed(1)} kg</strong> in stock
                    </div>
                  </div>
                  
                  <div className="ingredient-details">
                    {ing.cost_per_kg && <div><strong>Cost:</strong> ${parseFloat(ing.cost_per_kg).toFixed(2)}/kg</div>}
                    {ing.protein_percent && <div><strong>Protein:</strong> {ing.protein_percent}%</div>}
                    {ing.energy_kcal && <div><strong>Energy:</strong> {ing.energy_kcal} kcal</div>}
                  </div>
                  
                  <div className="card-footer">
                    <Button variant="ghost" size="small" icon="✏️" onClick={() => handleEditIngredient(ing)}>
                      Edit
                    </Button>
                    <Button variant="danger-ghost" size="small" icon="🗑️" onClick={() => confirmDelete(ing, 'ingredient')}>
                      Delete
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* FORMULAS TAB */}
      {activeTab === 'formulas' && (
        formulas.length === 0 ? (
          <EmptyState 
            icon="📋" 
            title="No formulas" 
            description="Create feed formulas using your ingredients" 
          />
        ) : (
          <div className="formulas-grid">
            {formulas.map(formula => {
              const totalWeight = (formula.items || []).reduce((sum, item) => sum + parseFloat(item.quantity_kg || 0), 0);
              
              return (
                <Card key={formula.id} className="formula-card">
                  <div className="formula-header">
                    <div>
                      <h3>{formula.name}</h3>
                      {formula.target_species && (
                        <span className="formula-species">{formula.target_species}</span>
                      )}
                    </div>
                    <div className="formula-weight">{totalWeight.toFixed(0)} kg/batch</div>
                  </div>
                  
                  {formula.description && (
                    <p className="formula-description">{formula.description}</p>
                  )}
                  
                  <div className="formula-ingredients">
                    <strong>Ingredients:</strong>
                    {formula.items && formula.items.length > 0 ? (
                      <ul>
                        {formula.items.map((item, idx) => (
                          <li key={idx}>
                            <span className="ingredient-name">{item.ingredient_name}</span>
                            <span className="ingredient-quantity">{item.quantity_kg} kg</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="empty-ingredients">No ingredients added</p>
                    )}
                  </div>
                  
                  <div className="card-footer">
                    <Button variant="ghost" size="small" icon="✏️">
                      Edit
                    </Button>
                    <Button variant="danger-ghost" size="small" icon="🗑️" onClick={() => confirmDelete(formula, 'formula')}>
                      Delete
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* FEEDING LOGS TAB */}
      {activeTab === 'logs' && (
        logs.length === 0 ? (
          <EmptyState
            icon="✓"
            title="No feeding logs"
            description="Start recording feeding activities"
            action={<Button onClick={() => setShowLogModal(true)}>Record First Feeding</Button>}
          />
        ) : (
          <div className="logs-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Animal</th>
                  <th>Formula</th>
                  <th>Quantity</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>{new Date(log.feed_date).toLocaleDateString()}</td>
                    <td><strong>{log.animal_tag}</strong></td>
                    <td>{log.formula_name || 'Direct feed'}</td>
                    <td>{parseFloat(log.quantity_kg).toFixed(2)} kg</td>
                    <td>{log.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Add Ingredient Modal */}
      <Modal isOpen={showIngredientModal} onClose={() => setShowIngredientModal(false)} title="Add Feed Ingredient">
        <form onSubmit={handleAddIngredient}>
          <Input
            label="Ingredient Name"
            value={ingredientForm.name}
            onChange={(val) => setIngredientForm({...ingredientForm, name: val})}
            required
            placeholder="e.g., Corn, Soybean Meal"
          />
          <Input
            label="Category"
            value={ingredientForm.category}
            onChange={(val) => setIngredientForm({...ingredientForm, category: val})}
            placeholder="e.g., Grain, Protein"
          />
          <Input
            label="Cost per kg"
            type="number"
            step="0.01"
            value={ingredientForm.cost_per_kg}
            onChange={(val) => setIngredientForm({...ingredientForm, cost_per_kg: val})}
            placeholder="0.00"
          />
          <Input
            label="Stock (kg)"
            type="number"
            step="0.1"
            value={ingredientForm.stock_kg}
            onChange={(val) => setIngredientForm({...ingredientForm, stock_kg: val})}
            placeholder="0.0"
          />
          <Input
            label="Protein %"
            type="number"
            step="0.1"
            value={ingredientForm.protein_percent}
            onChange={(val) => setIngredientForm({...ingredientForm, protein_percent: val})}
            placeholder="0.0"
          />
          <Input
            label="Energy (kcal)"
            type="number"
            value={ingredientForm.energy_kcal}
            onChange={(val) => setIngredientForm({...ingredientForm, energy_kcal: val})}
            placeholder="0"
          />
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setShowIngredientModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Add Ingredient</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Ingredient Modal */}
      <Modal isOpen={showEditIngredientModal} onClose={() => setShowEditIngredientModal(false)} title="Edit Ingredient">
        <form onSubmit={handleUpdateIngredient}>
          <Input
            label="Ingredient Name"
            value={ingredientForm.name}
            onChange={(val) => setIngredientForm({...ingredientForm, name: val})}
            required
          />
          <Input
            label="Category"
            value={ingredientForm.category}
            onChange={(val) => setIngredientForm({...ingredientForm, category: val})}
          />
          <Input
            label="Cost per kg"
            type="number"
            step="0.01"
            value={ingredientForm.cost_per_kg}
            onChange={(val) => setIngredientForm({...ingredientForm, cost_per_kg: val})}
          />
          <Input
            label="Stock (kg)"
            type="number"
            step="0.1"
            value={ingredientForm.stock_kg}
            onChange={(val) => setIngredientForm({...ingredientForm, stock_kg: val})}
          />
          <Input
            label="Protein %"
            type="number"
            step="0.1"
            value={ingredientForm.protein_percent}
            onChange={(val) => setIngredientForm({...ingredientForm, protein_percent: val})}
          />
          <Input
            label="Energy (kcal)"
            type="number"
            value={ingredientForm.energy_kcal}
            onChange={(val) => setIngredientForm({...ingredientForm, energy_kcal: val})}
          />
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setShowEditIngredientModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Record Feeding Modal */}
      <Modal isOpen={showLogModal} onClose={() => setShowLogModal(false)} title="Record Feeding">
        <form onSubmit={handleRecordFeeding}>
          <Select
            label="Animal"
            value={logForm.animal_id}
            onChange={(val) => setLogForm({...logForm, animal_id: val})}
            options={animals.map(a => ({ value: a.id, label: `${a.name || a.tag} (${a.species})` }))}
            required
            placeholder="Select animal"
          />
          
          <Select
            label="Formula (optional)"
            value={logForm.formula_id}
            onChange={(val) => setLogForm({...logForm, formula_id: val})}
            options={formulas.map(f => ({ value: f.id, label: f.name }))}
            placeholder="Select formula or leave blank"
          />
          
          <Input
            label="Feed Date"
            type="date"
            value={logForm.feed_date}
            onChange={(val) => setLogForm({...logForm, feed_date: val})}
            required
          />
          
          <div className="form-group">
            <label className="form-label">Quantity <span className="required">*</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-sm)' }}>
              <Input
                type="number"
                step="0.1"
                value={logForm.quantity_kg}
                onChange={(val) => setLogForm({...logForm, quantity_kg: val})}
                required
                placeholder="0.0"
              />
              <Select
                value={logForm.quantity_unit}
                onChange={(val) => setLogForm({...logForm, quantity_unit: val})}
                options={['kg', 'g']}
              />
            </div>
          </div>
          
          <Textarea
            label="Notes"
            value={logForm.notes}
            onChange={(val) => setLogForm({...logForm, notes: val})}
            placeholder="Additional notes..."
          />
          
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setShowLogModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Record Feeding</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={deleteType === 'ingredient' ? handleDeleteIngredient : handleDeleteFormula}
        title={`Delete ${deleteType === 'ingredient' ? 'Ingredient' : 'Formula'}`}
        message={`Are you sure you want to delete this ${deleteType}?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

window.FeedScreen = FeedScreen;

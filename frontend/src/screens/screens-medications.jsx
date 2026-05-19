// Medications Screen - Rebuilt with Stats & Inventory Design
const { useState, useEffect } = React;
const { StatCard, Card, Button, Input, Select, Textarea, Modal, LoadingSpinner, EmptyState, Tabs, ConfirmDialog } = window.UI;

function MedicationsScreen({ user, showToast }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory');
  const [medications, setMedications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [animals, setAnimals] = useState([]);
  
  const [showMedModal, setShowMedModal] = useState(false);
  const [showEditMedModal, setShowEditMedModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [medForm, setMedForm] = useState({
    name: '', 
    type: 'Antibiotic', 
    manufacturer: '', 
    withdrawal_period_days: '', 
    cost_per_unit: '', 
    stock_quantity: '', 
    notes: ''
  });
  
  const [logForm, setLogForm] = useState({
    animal_id: '', 
    medication_id: '', 
    treatment_date: new Date().toISOString().split('T')[0], 
    dosage_given: '', 
    dosage_unit: 'ml', 
    reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [medsData, logsData, animalsData] = await Promise.all([
        window.CarlesAPI.getMedications(),
        window.CarlesAPI.getMedicationLogs(),
        window.CarlesAPI.getAnimals()
      ]);
      setMedications(medsData);
      setLogs(logsData);
      setAnimals(animalsData);
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetMedForm = () => {
    setMedForm({
      name: '', 
      type: 'Antibiotic', 
      manufacturer: '', 
      withdrawal_period_days: '', 
      cost_per_unit: '', 
      stock_quantity: '', 
      notes: ''
    });
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    try {
      await window.CarlesAPI.createMedication(medForm);
      showToast('✅ Medication added!');
      setShowMedModal(false);
      resetMedForm();
      loadData();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  const handleEditMedication = (med) => {
    setSelectedItem(med);
    setMedForm({
      name: med.name || '',
      type: med.type || 'Antibiotic',
      manufacturer: med.manufacturer || '',
      withdrawal_period_days: med.withdrawal_period_days || '',
      cost_per_unit: med.cost_per_unit || '',
      stock_quantity: med.stock_quantity || '',
      notes: med.notes || ''
    });
    setShowEditMedModal(true);
  };

  const handleUpdateMedication = async (e) => {
    e.preventDefault();
    try {
      await window.CarlesAPI.updateMedication(selectedItem.id, medForm);
      showToast('✅ Medication updated!');
      setShowEditMedModal(false);
      loadData();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  const handleRecordTreatment = async (e) => {
    e.preventDefault();
    try {
      await window.CarlesAPI.recordMedication(logForm);
      showToast('✅ Treatment recorded!');
      setShowLogModal(false);
      setLogForm({ 
        animal_id: '', 
        medication_id: '', 
        treatment_date: new Date().toISOString().split('T')[0], 
        dosage_given: '', 
        dosage_unit: 'ml', 
        reason: '' 
      });
      loadData();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  const handleDeleteMedication = async () => {
    try {
      await window.CarlesAPI.deleteMedication(selectedItem.id);
      showToast('✅ Medication deleted!');
      setShowDeleteDialog(false);
      loadData();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  if (loading) return <LoadingSpinner text="Loading medications..." />;

  // Calculate stats
  const totalStock = medications.reduce((sum, med) => sum + (parseInt(med.stock_quantity) || 0), 0);
  const lowStockItems = medications.filter(med => parseInt(med.stock_quantity) < 10).length;
  const vaccines = medications.filter(med => med.type === 'Vaccine').length;
  const antibiotics = medications.filter(med => med.type === 'Antibiotic').length;

  return (
    <div className="medications-screen">
      {/* Header */}
      <div className="screen-header">
        <div>
          <h1>Medications</h1>
          <p>{medications.length} medications • {lowStockItems} need restock</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" icon="📥">Export</Button>
          {activeTab === 'inventory' && (
            <Button variant="primary" icon="+" onClick={() => { resetMedForm(); setShowMedModal(true); }}>
              New Medication
            </Button>
          )}
          {activeTab === 'logs' && (
            <Button variant="primary" icon="+" onClick={() => setShowLogModal(true)}>
              Record Treatment
            </Button>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard
          icon="📦"
          title="Total Stock Units"
          value={totalStock}
          subtitle={`${medications.length} medications`}
          color="teal"
        />
        
        <StatCard
          icon="⚠️"
          title="Low Stock Items"
          value={lowStockItems}
          subtitle={lowStockItems > 0 ? 'Need restock' : 'All stocked'}
          color={lowStockItems > 0 ? 'coral' : 'teal'}
        />
        
        <StatCard
          icon="💉"
          title="Vaccines on Hand"
          value={vaccines}
          subtitle={`${medications.filter(m => m.type === 'Vaccine' && parseInt(m.stock_quantity) > 0).length} in stock`}
          color="purple"
        />
        
        <StatCard
          icon="💊"
          title="Antibiotics"
          value={antibiotics}
          subtitle={`${medications.filter(m => m.type === 'Antibiotic' && parseInt(m.stock_quantity) > 0).length} available`}
          color="green"
        />
      </div>

      <Tabs
        tabs={[
          { id: 'inventory', label: 'Inventory', icon: '💊', count: medications.length },
          { id: 'logs', label: 'Treatment Log', icon: '✓', count: logs.length },
          { id: 'reminders', label: 'SMS Reminders', icon: '🔔' }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* INVENTORY TAB */}
      {activeTab === 'inventory' && (
        medications.length === 0 ? (
          <EmptyState 
            icon="💊" 
            title="No medications" 
            description="Add medications to inventory" 
            action={<Button onClick={() => { resetMedForm(); setShowMedModal(true); }}>Add First Medication</Button>} 
          />
        ) : (
          <div className="medications-grid">
            {medications.map(med => {
              const stockQty = parseInt(med.stock_quantity) || 0;
              const isLowStock = stockQty < 10;
              const stockPercent = Math.min((stockQty / 50) * 100, 100);
              
              return (
                <Card key={med.id} className={`medication-card ${isLowStock ? 'low-stock' : ''}`}>
                  <div className="medication-header">
                    <div>
                      <h3>{med.name}</h3>
                      {med.type && (
                        <span className={`medication-type type-${med.type.toLowerCase()}`}>
                          {med.type}
                        </span>
                      )}
                    </div>
                    {isLowStock && <span className="low-stock-badge">⚠️ Low Stock</span>}
                  </div>
                  
                  <div className="medication-stock">
                    <div className="stock-label">
                      <span>Stock</span>
                      <strong>{stockQty} {med.type === 'Vaccine' ? 'vial' : 'unit'}{stockQty !== 1 ? 's' : ''}</strong>
                    </div>
                    <div className="stock-bar">
                      <div 
                        className="stock-bar-fill" 
                        style={{ 
                          width: `${stockPercent}%`,
                          backgroundColor: isLowStock ? 'var(--color-coral)' : 'var(--color-teal-light)'
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="medication-details">
                    {med.manufacturer && <div><strong>Manufacturer:</strong> {med.manufacturer}</div>}
                    {med.withdrawal_period_days && (
                      <div className="withdrawal-warning">
                        <strong>Withdrawal:</strong> {med.withdrawal_period_days} days
                      </div>
                    )}
                    {med.cost_per_unit && <div><strong>Cost:</strong> ${parseFloat(med.cost_per_unit).toFixed(2)}/unit</div>}
                  </div>
                  
                  {med.notes && <p className="medication-notes">{med.notes}</p>}
                  
                  <div className="card-footer">
                    <Button variant="ghost" size="small" icon="✏️" onClick={() => handleEditMedication(med)}>
                      Edit
                    </Button>
                    <Button variant="danger-ghost" size="small" icon="🗑️" onClick={() => { setSelectedItem(med); setShowDeleteDialog(true); }}>
                      Delete
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* TREATMENT LOG TAB */}
      {activeTab === 'logs' && (
        logs.length === 0 ? (
          <EmptyState 
            icon="✓" 
            title="No treatment logs" 
            description="Record treatments when administered" 
            action={<Button onClick={() => setShowLogModal(true)}>Record First Treatment</Button>} 
          />
        ) : (
          <div className="logs-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Animal</th>
                  <th>Medication</th>
                  <th>Dosage</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>{new Date(log.treatment_date).toLocaleDateString()}</td>
                    <td><strong>{log.animal_tag}</strong></td>
                    <td>{log.medication_name}</td>
                    <td>{log.dosage_given ? `${log.dosage_given} ${log.dosage_unit}` : '—'}</td>
                    <td>{log.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* SMS REMINDERS TAB */}
      {activeTab === 'reminders' && (
        <EmptyState
          icon="🔔"
          title="SMS Reminders (Coming Soon)"
          description="Set up automated reminders for treatments and withdrawals"
        />
      )}

      {/* Add Medication Modal */}
      <Modal isOpen={showMedModal} onClose={() => setShowMedModal(false)} title="Add Medication">
        <form onSubmit={handleAddMedication}>
          <Input
            label="Medication Name"
            value={medForm.name}
            onChange={(val) => setMedForm({...medForm, name: val})}
            required
            placeholder="e.g., Oxytetracycline 20%"
          />
          <Select
            label="Type"
            value={medForm.type}
            onChange={(val) => setMedForm({...medForm, type: val})}
            options={window.MEDICATION_TYPES}
            required
          />
          <Input
            label="Manufacturer"
            value={medForm.manufacturer}
            onChange={(val) => setMedForm({...medForm, manufacturer: val})}
            placeholder="Manufacturer name"
          />
          <Input
            label="Withdrawal Period (days)"
            type="number"
            value={medForm.withdrawal_period_days}
            onChange={(val) => setMedForm({...medForm, withdrawal_period_days: val})}
            placeholder="0"
          />
          <Input
            label="Cost per Unit"
            type="number"
            step="0.01"
            value={medForm.cost_per_unit}
            onChange={(val) => setMedForm({...medForm, cost_per_unit: val})}
            placeholder="0.00"
          />
          <Input
            label="Stock Quantity"
            type="number"
            value={medForm.stock_quantity}
            onChange={(val) => setMedForm({...medForm, stock_quantity: val})}
            placeholder="0"
            required
          />
          <Textarea
            label="Notes"
            value={medForm.notes}
            onChange={(val) => setMedForm({...medForm, notes: val})}
            placeholder="Dosage instructions, storage requirements..."
          />
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setShowMedModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Add Medication</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Medication Modal */}
      <Modal isOpen={showEditMedModal} onClose={() => setShowEditMedModal(false)} title="Edit Medication">
        <form onSubmit={handleUpdateMedication}>
          <Input
            label="Medication Name"
            value={medForm.name}
            onChange={(val) => setMedForm({...medForm, name: val})}
            required
          />
          <Select
            label="Type"
            value={medForm.type}
            onChange={(val) => setMedForm({...medForm, type: val})}
            options={window.MEDICATION_TYPES}
            required
          />
          <Input
            label="Manufacturer"
            value={medForm.manufacturer}
            onChange={(val) => setMedForm({...medForm, manufacturer: val})}
          />
          <Input
            label="Withdrawal Period (days)"
            type="number"
            value={medForm.withdrawal_period_days}
            onChange={(val) => setMedForm({...medForm, withdrawal_period_days: val})}
          />
          <Input
            label="Cost per Unit"
            type="number"
            step="0.01"
            value={medForm.cost_per_unit}
            onChange={(val) => setMedForm({...medForm, cost_per_unit: val})}
          />
          <Input
            label="Stock Quantity"
            type="number"
            value={medForm.stock_quantity}
            onChange={(val) => setMedForm({...medForm, stock_quantity: val})}
            required
          />
          <Textarea
            label="Notes"
            value={medForm.notes}
            onChange={(val) => setMedForm({...medForm, notes: val})}
          />
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setShowEditMedModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Record Treatment Modal */}
      <Modal isOpen={showLogModal} onClose={() => setShowLogModal(false)} title="Record Treatment">
        <form onSubmit={handleRecordTreatment}>
          <Select
            label="Animal"
            value={logForm.animal_id}
            onChange={(val) => setLogForm({...logForm, animal_id: val})}
            options={animals.map(a => ({ value: a.id, label: `${a.name || a.tag} (${a.species})` }))}
            required
            placeholder="Select animal"
          />
          
          <Select
            label="Medication"
            value={logForm.medication_id}
            onChange={(val) => setLogForm({...logForm, medication_id: val})}
            options={medications.map(m => ({ value: m.id, label: m.name }))}
            required
            placeholder="Select medication"
          />
          
          <Input
            label="Treatment Date"
            type="date"
            value={logForm.treatment_date}
            onChange={(val) => setLogForm({...logForm, treatment_date: val})}
            required
          />
          
          <div className="form-group">
            <label className="form-label">Dosage Given</label>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-sm)' }}>
              <Input
                type="number"
                step="0.1"
                value={logForm.dosage_given}
                onChange={(val) => setLogForm({...logForm, dosage_given: val})}
                placeholder="0.0"
              />
              <Select
                value={logForm.dosage_unit}
                onChange={(val) => setLogForm({...logForm, dosage_unit: val})}
                options={['ml', 'mg', 'g', 'cc', 'IU']}
              />
            </div>
          </div>
          
          <Textarea
            label="Reason for Treatment"
            value={logForm.reason}
            onChange={(val) => setLogForm({...logForm, reason: val})}
            placeholder="Symptoms, diagnosis, or reason for treatment..."
            required
          />
          
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setShowLogModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Record Treatment</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteMedication}
        title="Delete Medication"
        message={`Are you sure you want to delete ${selectedItem?.name}?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

window.MedicationsScreen = MedicationsScreen;

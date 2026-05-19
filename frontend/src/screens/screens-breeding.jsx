// Breeding & Gestation Screen - Complete Rebuild
const { useState, useEffect } = React;
const { StatCard, Card, Button, Input, Select, Textarea, Modal, LoadingSpinner, ErrorState, EmptyState, ConfirmDialog } = window.UI;

function BreedingScreen({ user, showToast }) {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [error, setError] = useState(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // Track selected animal's species for auto-calculation
  const [selectedAnimalSpecies, setSelectedAnimalSpecies] = useState('');
  
  const [formData, setFormData] = useState({
    animal_id: '',
    breeding_date: '',
    sire: '',
    expected_delivery: '',
    actual_delivery: '',
    offspring_count: '',
    status: 'Pending',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  // Auto-calculate expected delivery when breeding date or animal changes
  useEffect(() => {
    if (formData.breeding_date && selectedAnimalSpecies) {
      const calculatedDate = window.calculateDeliveryDate(selectedAnimalSpecies, formData.breeding_date);
      if (calculatedDate && calculatedDate !== formData.expected_delivery) {
        setFormData(prev => ({ ...prev, expected_delivery: calculatedDate }));
      }
    }
  }, [formData.breeding_date, selectedAnimalSpecies]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [breedingData, animalsData] = await Promise.all([
        window.CarlesAPI.getBreedingRecords(),
        window.CarlesAPI.getAnimals()
      ]);
      setRecords(breedingData);
      setAnimals(animalsData.filter(a => a.sex === 'Female'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      animal_id: '',
      breeding_date: '',
      sire: '',
      expected_delivery: '',
      actual_delivery: '',
      offspring_count: '',
      status: 'Pending',
      notes: ''
    });
    setSelectedAnimalSpecies('');
  };

  const handleAnimalChange = (animalId) => {
    const animal = animals.find(a => a.id === parseInt(animalId));
    setFormData(prev => ({ ...prev, animal_id: animalId }));
    setSelectedAnimalSpecies(animal?.species || '');
  };

  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    const animal = animals.find(a => a.id === record.animal_id);
    setSelectedAnimalSpecies(animal?.species || '');
    
    setFormData({
      animal_id: record.animal_id || '',
      breeding_date: record.breeding_date || '',
      sire: record.sire || '',
      expected_delivery: record.expected_delivery || '',
      actual_delivery: record.actual_delivery || '',
      offspring_count: record.offspring_count || '',
      status: record.status || 'Pending',
      notes: record.notes || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = (record) => {
    setSelectedRecord(record);
    setShowDeleteDialog(true);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    try {
      // Auto-set status to Pregnant if breeding date is set
      const dataToSubmit = {
        ...formData,
        status: formData.breeding_date ? 'Pregnant' : formData.status
      };
      
      await window.CarlesAPI.createBreedingRecord(dataToSubmit);
      showToast('✅ Breeding record added!');
      setShowAddModal(false);
      loadData();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      await window.CarlesAPI.updateBreedingRecord(selectedRecord.id, formData);
      showToast('✅ Breeding record updated!');
      setShowEditModal(false);
      loadData();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await window.CarlesAPI.deleteBreedingRecord(selectedRecord.id);
      showToast('✅ Breeding record deleted!');
      setShowDeleteDialog(false);
      loadData();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  if (loading) return <LoadingSpinner text="Loading breeding records..." />;
  if (error) return <ErrorState error={error} onRetry={loadData} />;

  // Calculate stats
  const activeMatings = records.filter(r => r.status === 'Pregnant').length;
  const nearTerm = records.filter(r => r.expected_delivery && window.isNearTerm(r.expected_delivery)).length;
  const recentDeliveries = records.filter(r => {
    if (!r.actual_delivery) return false;
    const deliveryDate = new Date(r.actual_delivery);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return deliveryDate >= thirtyDaysAgo;
  }).length;

  // Sort records: pregnant first, then by expected delivery
  const sortedRecords = [...records].sort((a, b) => {
    if (a.status === 'Pregnant' && b.status !== 'Pregnant') return -1;
    if (a.status !== 'Pregnant' && b.status === 'Pregnant') return 1;
    if (a.expected_delivery && b.expected_delivery) {
      return new Date(a.expected_delivery) - new Date(b.expected_delivery);
    }
    return 0;
  });

  return (
    <div className="breeding-screen">
      {/* Header */}
      <div className="screen-header">
        <div>
          <h1>Breeding & Gestation</h1>
          <p>{activeMatings} active matings • {nearTerm} expected within 7 days</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" icon="📥">Export Schedule</Button>
          <Button variant="primary" icon="+" onClick={handleAdd}>Record Breeding</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard
          icon="🧬"
          title="Active Matings"
          value={activeMatings}
          subtitle={`${records.filter(r => r.status === 'Pending').length} pending`}
          color="purple"
          trend={activeMatings > 0 ? { direction: 'up', text: `+${Math.min(activeMatings, 2)} this week` } : null}
        />
        
        <StatCard
          icon="⚠️"
          title="Near Term"
          value={nearTerm}
          subtitle="Expected ≤ 7 days"
          color={nearTerm > 0 ? 'coral' : 'teal'}
        />
        
        <StatCard
          icon="🐣"
          title="Calf/Piglet Expected"
          value={activeMatings}
          subtitle="Across all species"
          color="gold"
        />
        
        <StatCard
          icon="✅"
          title="Delivered • 30d"
          value={recentDeliveries}
          subtitle={recentDeliveries > 0 ? `+${Math.min(recentDeliveries, 2)} vs prev. month` : 'No recent deliveries'}
          color="green"
          trend={recentDeliveries > 0 ? { direction: 'up', text: '+2 vs prev. month' } : null}
        />
      </div>

      {/* Timeline Section for Pregnant Animals */}
      {activeMatings > 0 && (
        <Card className="timeline-card">
          <div className="card-header">
            <h3>Delivery Timeline • Next 90 Days</h3>
            <span className="timeline-subtitle">Each marker = one expected delivery</span>
          </div>
          <div className="delivery-timeline">
            <div className="timeline-axis">
              <div className="timeline-marker">TODAY</div>
              <div className="timeline-marker">+7d</div>
              <div className="timeline-marker">+14d</div>
              <div className="timeline-marker">+30d</div>
              <div className="timeline-marker">+60d</div>
              <div className="timeline-marker">+90d</div>
            </div>
            <div className="timeline-events">
              {sortedRecords
                .filter(r => r.status === 'Pregnant' && r.expected_delivery)
                .slice(0, 10)
                .map(record => {
                  const daysUntil = window.daysUntilDelivery(record.expected_delivery);
                  const position = Math.min(Math.max((daysUntil / 90) * 100, 0), 100);
                  const speciesMeta = window.SPECIES_META[record.species] || {};
                  
                  return (
                    <div 
                      key={record.id}
                      className={`timeline-event ${window.isNearTerm(record.expected_delivery) ? 'near-term' : ''}`}
                      style={{ left: `${position}%`, backgroundColor: speciesMeta.accent }}
                      title={`${record.animal_name || record.animal_tag} - ${daysUntil} days`}
                    >
                      <div className="event-icon">{record.species === 'Cow' ? '🐄' : record.species === 'Pig' ? '🐷' : record.species === 'Goat' ? '🐐' : record.species === 'Sheep' ? '🐑' : '🐔'}</div>
                      <div className="event-label">{record.animal_name || record.animal_tag}</div>
                      <div className="event-days">{daysUntil}d</div>
                    </div>
                  );
                })}
            </div>
          </div>
        </Card>
      )}

      {/* Breeding Records Grid */}
      {sortedRecords.length === 0 ? (
        <EmptyState
          icon="🧬"
          title="No breeding records"
          description="Start tracking breeding activities"
          action={<Button onClick={handleAdd}>Record First Breeding</Button>}
        />
      ) : (
        <div className="breeding-records-grid">
          {sortedRecords.map(record => {
            const daysUntil = record.expected_delivery ? window.daysUntilDelivery(record.expected_delivery) : null;
            const isNear = record.expected_delivery ? window.isNearTerm(record.expected_delivery) : false;
            const speciesMeta = window.SPECIES_META[record.species] || {};
            
            return (
              <Card key={record.id} className={`breeding-record-card ${isNear ? 'near-term' : ''}`}>
                <div className="breeding-card-header">
                  <div>
                    <h3>{record.animal_name || record.animal_tag}</h3>
                    <span className="breeding-species" style={{ color: speciesMeta.accent }}>
                      {record.species}
                    </span>
                  </div>
                  <span className={`status-badge status-${record.status?.toLowerCase()}`}>
                    {record.status}
                  </span>
                </div>
                
                <div className="breeding-card-body">
                  <div className="breeding-detail">
                    <strong>Breeding Date:</strong>
                    <span>{new Date(record.breeding_date).toLocaleDateString()}</span>
                  </div>
                  
                  {record.sire && (
                    <div className="breeding-detail">
                      <strong>Sire:</strong>
                      <span>{record.sire}</span>
                    </div>
                  )}
                  
                  {record.expected_delivery && (
                    <div className="breeding-detail highlight">
                      <strong>Expected Delivery:</strong>
                      <span>
                        {new Date(record.expected_delivery).toLocaleDateString()}
                        {daysUntil !== null && daysUntil >= 0 && (
                          <span className={`days-badge ${isNear ? 'urgent' : ''}`}>
                            {daysUntil} days
                          </span>
                        )}
                        {daysUntil !== null && daysUntil < 0 && (
                          <span className="days-badge overdue">
                            {Math.abs(daysUntil)} days overdue
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  
                  {record.actual_delivery && (
                    <div className="breeding-detail success">
                      <strong>Delivered:</strong>
                      <span>{new Date(record.actual_delivery).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  {record.offspring_count && (
                    <div className="breeding-detail">
                      <strong>Offspring:</strong>
                      <span>{record.offspring_count}</span>
                    </div>
                  )}
                  
                  {record.notes && (
                    <div className="breeding-notes">{record.notes}</div>
                  )}
                </div>
                
                <div className="card-footer">
                  <Button variant="ghost" size="small" icon="✏️" onClick={() => handleEdit(record)}>
                    Edit
                  </Button>
                  <Button variant="danger-ghost" size="small" icon="🗑️" onClick={() => handleDelete(record)}>
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Record Breeding" size="large">
        <form onSubmit={handleSubmitAdd}>
          <Select
            label="Animal (Female)"
            value={formData.animal_id}
            onChange={handleAnimalChange}
            options={animals.map(a => ({ value: a.id, label: `${a.name || a.tag} (${a.species})` }))}
            required
            placeholder="Select female animal"
          />
          
          <Input
            label="Breeding Date (Crossing Date)"
            type="date"
            value={formData.breeding_date}
            onChange={(val) => setFormData({...formData, breeding_date: val})}
            required
          />
          
          {selectedAnimalSpecies && formData.breeding_date && (
            <div className="calculated-delivery-info">
              <div className="info-badge">
                <span className="info-icon">✨</span>
                <div>
                  <strong>Expected Delivery (Auto-calculated):</strong>
                  <div className="calculated-date">
                    {formData.expected_delivery ? new Date(formData.expected_delivery).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Calculating...'}
                  </div>
                  <div className="gestation-info">
                    {selectedAnimalSpecies} gestation: {window.SPECIES_META[selectedAnimalSpecies]?.gestation} days
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <Input
            label="Sire (Father/Bull)"
            value={formData.sire}
            onChange={(val) => setFormData({...formData, sire: val})}
            placeholder="Name or tag of sire"
          />
          
          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(val) => setFormData({...formData, notes: val})}
            placeholder="Additional breeding notes..."
            rows={3}
          />
          
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Record Breeding</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Breeding Record" size="large">
        <form onSubmit={handleSubmitEdit}>
          <Select
            label="Animal"
            value={formData.animal_id}
            onChange={handleAnimalChange}
            options={animals.map(a => ({ value: a.id, label: `${a.name || a.tag} (${a.species})` }))}
            required
          />
          
          <Input
            label="Breeding Date"
            type="date"
            value={formData.breeding_date}
            onChange={(val) => setFormData({...formData, breeding_date: val})}
            required
          />
          
          {selectedAnimalSpecies && formData.breeding_date && (
            <div className="calculated-delivery-info">
              <div className="info-badge">
                <span className="info-icon">✨</span>
                <div>
                  <strong>Expected Delivery:</strong>
                  <div className="calculated-date">
                    {formData.expected_delivery ? new Date(formData.expected_delivery).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Calculating...'}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <Input
            label="Sire"
            value={formData.sire}
            onChange={(val) => setFormData({...formData, sire: val})}
          />
          
          <Input
            label="Actual Delivery Date"
            type="date"
            value={formData.actual_delivery}
            onChange={(val) => setFormData({...formData, actual_delivery: val})}
          />
          
          <Input
            label="Offspring Count"
            type="number"
            value={formData.offspring_count}
            onChange={(val) => setFormData({...formData, offspring_count: val})}
            min="0"
          />
          
          <Select
            label="Status"
            value={formData.status}
            onChange={(val) => setFormData({...formData, status: val})}
            options={window.BREEDING_STATUSES}
          />
          
          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(val) => setFormData({...formData, notes: val})}
            rows={3}
          />
          
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Breeding Record"
        message={`Are you sure you want to delete the breeding record for ${selectedRecord?.animal_name || selectedRecord?.animal_tag}?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

window.BreedingScreen = BreedingScreen;

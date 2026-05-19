// Animals Screen - Rebuilt with Proper Design & Responsiveness
const { useState, useEffect } = React;
const { Card, Button, Input, Select, Textarea, Modal, LoadingSpinner, ErrorState, EmptyState, SearchBar, ConfirmDialog } = window.UI;

function AnimalsScreen({ user, showToast }) {
  const [loading, setLoading] = useState(true);
  const [animals, setAnimals] = useState([]);
  const [filteredAnimals, setFilteredAnimals] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  
  const [formData, setFormData] = useState({
    tag: '',
    name: '',
    species: '',
    breed: '',
    sex: '',
    date_of_birth: '',
    weight: '',
    pen: '',
    status: 'Healthy',
    notes: ''
  });

  useEffect(() => {
    loadAnimals();
  }, []);

  useEffect(() => {
    filterAnimals();
  }, [animals, searchQuery, speciesFilter, statusFilter]);

  const loadAnimals = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await window.CarlesAPI.getAnimals();
      setAnimals(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterAnimals = () => {
    let filtered = [...animals];

    if (searchQuery) {
      filtered = filtered.filter(a => 
        a.tag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.breed?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (speciesFilter !== 'All') {
      filtered = filtered.filter(a => a.species === speciesFilter);
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    setFilteredAnimals(filtered);
  };

  const resetForm = () => {
    setFormData({
      tag: '',
      name: '',
      species: '',
      breed: '',
      sex: '',
      date_of_birth: '',
      weight: '',
      pen: '',
      status: 'Healthy',
      notes: ''
    });
  };

  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEdit = (animal) => {
    setSelectedAnimal(animal);
    setFormData({
      tag: animal.tag || '',
      name: animal.name || '',
      species: animal.species || '',
      breed: animal.breed || '',
      sex: animal.sex || '',
      date_of_birth: animal.date_of_birth || '',
      weight: animal.weight || '',
      pen: animal.pen || '',
      status: animal.status || 'Healthy',
      notes: animal.notes || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = (animal) => {
    setSelectedAnimal(animal);
    setShowDeleteDialog(true);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    
    try {
      await window.CarlesAPI.createAnimal(formData);
      showToast('✅ Animal added successfully!');
      setShowAddModal(false);
      loadAnimals();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    
    try {
      await window.CarlesAPI.updateAnimal(selectedAnimal.id, formData);
      showToast('✅ Animal updated successfully!');
      setShowEditModal(false);
      loadAnimals();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await window.CarlesAPI.deleteAnimal(selectedAnimal.id);
      showToast('✅ Animal deleted successfully!');
      setShowDeleteDialog(false);
      loadAnimals();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading animals..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadAnimals} />;
  }

  // Calculate stats by species
  const speciesCounts = {};
  window.SPECIES.forEach(species => {
    speciesCounts[species] = animals.filter(a => a.species === species).length;
  });

  return (
    <div className="animals-screen">
      {/* Header */}
      <div className="screen-header">
        <div>
          <h1>Animals</h1>
          <p>{filteredAnimals.length} of {animals.length} animals • {animals.filter(a => a.status === 'Sick' || a.status === 'Quarantine').length} need attention</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" icon="📥">Export</Button>
          <Button variant="primary" icon="+" onClick={handleAdd}>
            Add Animal
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search tag, name, breed..."
        />
        
        <div className="species-tabs">
          <button 
            className={`species-tab ${speciesFilter === 'All' ? 'active' : ''}`}
            onClick={() => setSpeciesFilter('All')}
          >
            All <span className="tab-count">{animals.length}</span>
          </button>
          {window.SPECIES.map(species => {
            const meta = window.SPECIES_META[species];
            return (
              <button 
                key={species}
                className={`species-tab ${speciesFilter === species ? 'active' : ''}`}
                onClick={() => setSpeciesFilter(species)}
                style={speciesFilter === species ? { borderBottomColor: meta.accent } : {}}
              >
                {meta.plural} <span className="tab-count">{speciesCounts[species]}</span>
              </button>
            );
          })}
        </div>
        
        <div className="status-filters">
          <select 
            className="status-filter-select"
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            {window.ANIMAL_STATUSES.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Animals Grid */}
      {filteredAnimals.length === 0 ? (
        <EmptyState
          icon="🐄"
          title="No animals found"
          description={animals.length === 0 ? "Get started by adding your first animal" : "Try adjusting your filters"}
          action={animals.length === 0 && <Button onClick={handleAdd}>Add First Animal</Button>}
        />
      ) : (
        <div className="animals-grid">
          {filteredAnimals.map(animal => {
            const speciesMeta = window.SPECIES_META[animal.species] || {};
            const age = animal.date_of_birth ? Math.floor((new Date() - new Date(animal.date_of_birth)) / (1000 * 60 * 60 * 24 * 30)) : null;
            
            return (
              <Card key={animal.id} className="animal-card">
                <div className="animal-card-header">
                  <div className="animal-icon" style={{ backgroundColor: speciesMeta.accent || '#ccc' }}>
                    {animal.species === 'Cow' ? '🐄' : animal.species === 'Pig' ? '🐷' : animal.species === 'Goat' ? '🐐' : animal.species === 'Sheep' ? '🐑' : '🐔'}
                  </div>
                  <div className="animal-species-badge" style={{ backgroundColor: speciesMeta.accent }}>
                    {animal.species}
                  </div>
                  <div className={`animal-status-badge status-${animal.status?.toLowerCase()}`}>
                    {animal.status}
                  </div>
                </div>
                
                <div className="animal-card-body">
                  <div className="animal-identity">
                    <h3 className="animal-name">{animal.name || 'Unnamed'}</h3>
                    <div className="animal-tag">#{animal.tag}</div>
                  </div>
                  
                  <div className="animal-details-grid">
                    {animal.breed && (
                      <div className="animal-detail">
                        <span className="detail-label">Breed</span>
                        <span className="detail-value">{animal.breed}</span>
                      </div>
                    )}
                    {animal.sex && (
                      <div className="animal-detail">
                        <span className="detail-label">Sex</span>
                        <span className="detail-value">{animal.sex}</span>
                      </div>
                    )}
                    {age !== null && (
                      <div className="animal-detail">
                        <span className="detail-label">Age</span>
                        <span className="detail-value">{age} mo</span>
                      </div>
                    )}
                    {animal.weight && (
                      <div className="animal-detail">
                        <span className="detail-label">Weight</span>
                        <span className="detail-value">{animal.weight} kg</span>
                      </div>
                    )}
                    {animal.pen && (
                      <div className="animal-detail">
                        <span className="detail-label">Pen</span>
                        <span className="detail-value">{animal.pen}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="card-footer">
                  <Button variant="ghost" size="small" icon="✏️" onClick={() => handleEdit(animal)}>
                    Edit
                  </Button>
                  <Button variant="danger-ghost" size="small" icon="🗑️" onClick={() => handleDelete(animal)}>
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Animal"
        size="large"
      >
        <form onSubmit={handleSubmitAdd}>
          <div className="form-grid">
            <Input
              label="Tag Number"
              value={formData.tag}
              onChange={(val) => setFormData({...formData, tag: val})}
              required
              placeholder="e.g., CO-1000"
            />
            
            <Input
              label="Name"
              value={formData.name}
              onChange={(val) => setFormData({...formData, name: val})}
              placeholder="Animal name"
            />
            
            <Select
              label="Species"
              value={formData.species}
              onChange={(val) => setFormData({...formData, species: val})}
              options={window.SPECIES}
              required
              placeholder="Select species"
            />
            
            <Input
              label="Breed"
              value={formData.breed}
              onChange={(val) => setFormData({...formData, breed: val})}
              placeholder="e.g., Holstein, Angus"
            />
            
            <Select
              label="Sex"
              value={formData.sex}
              onChange={(val) => setFormData({...formData, sex: val})}
              options={['Male', 'Female']}
              placeholder="Select sex"
            />
            
            <Input
              label="Date of Birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(val) => setFormData({...formData, date_of_birth: val})}
            />
            
            <Input
              label="Weight (kg)"
              type="number"
              value={formData.weight}
              onChange={(val) => setFormData({...formData, weight: val})}
              placeholder="Weight in kg"
              step="0.1"
            />
            
            <Input
              label="Pen"
              value={formData.pen}
              onChange={(val) => setFormData({...formData, pen: val})}
              placeholder="e.g., A-1, Barn 2"
            />
            
            <Select
              label="Status"
              value={formData.status}
              onChange={(val) => setFormData({...formData, status: val})}
              options={window.ANIMAL_STATUSES}
            />
          </div>
          
          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(val) => setFormData({...formData, notes: val})}
            placeholder="Additional notes..."
          />
          
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Animal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Animal"
        size="large"
      >
        <form onSubmit={handleSubmitEdit}>
          <div className="form-grid">
            <Input
              label="Tag Number"
              value={formData.tag}
              onChange={(val) => setFormData({...formData, tag: val})}
              required
            />
            
            <Input
              label="Name"
              value={formData.name}
              onChange={(val) => setFormData({...formData, name: val})}
            />
            
            <Select
              label="Species"
              value={formData.species}
              onChange={(val) => setFormData({...formData, species: val})}
              options={window.SPECIES}
              required
            />
            
            <Input
              label="Breed"
              value={formData.breed}
              onChange={(val) => setFormData({...formData, breed: val})}
            />
            
            <Select
              label="Sex"
              value={formData.sex}
              onChange={(val) => setFormData({...formData, sex: val})}
              options={['Male', 'Female']}
            />
            
            <Input
              label="Date of Birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(val) => setFormData({...formData, date_of_birth: val})}
            />
            
            <Input
              label="Weight (kg)"
              type="number"
              value={formData.weight}
              onChange={(val) => setFormData({...formData, weight: val})}
              step="0.1"
            />
            
            <Input
              label="Pen"
              value={formData.pen}
              onChange={(val) => setFormData({...formData, pen: val})}
            />
            
            <Select
              label="Status"
              value={formData.status}
              onChange={(val) => setFormData({...formData, status: val})}
              options={window.ANIMAL_STATUSES}
            />
          </div>
          
          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(val) => setFormData({...formData, notes: val})}
          />
          
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Animal"
        message={`Are you sure you want to delete ${selectedAnimal?.name || selectedAnimal?.tag}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

window.AnimalsScreen = AnimalsScreen;

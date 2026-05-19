// Finance Screen - Rebuilt to Match Design
const { useState, useEffect } = React;
const { StatCard, Card, Button, Input, Select, Textarea, Modal, LoadingSpinner, ErrorState, EmptyState, ConfirmDialog } = window.UI;

function FinanceScreen({ user, showToast }) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filterType, setFilterType] = useState('All');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  const [formData, setFormData] = useState({
    type: 'Income',
    category: '',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    description: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [transactionsData, summaryData] = await Promise.all([
        window.CarlesAPI.getTransactions(),
        window.CarlesAPI.getFinanceSummary()
      ]);
      setTransactions(transactionsData);
      setSummary(summaryData);
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'Income',
      category: '',
      amount: '',
      transaction_date: new Date().toISOString().split('T')[0],
      description: '',
      notes: ''
    });
  };

  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEdit = (transaction) => {
    setSelectedTransaction(transaction);
    setFormData({
      type: transaction.type || 'Income',
      category: transaction.category || '',
      amount: transaction.amount || '',
      transaction_date: transaction.transaction_date || '',
      description: transaction.description || '',
      notes: transaction.notes || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDeleteDialog(true);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    try {
      await window.CarlesAPI.createTransaction(formData);
      showToast('✅ Transaction added!');
      setShowAddModal(false);
      loadData();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      await window.CarlesAPI.updateTransaction(selectedTransaction.id, formData);
      showToast('✅ Transaction updated!');
      setShowEditModal(false);
      loadData();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await window.CarlesAPI.deleteTransaction(selectedTransaction.id);
      showToast('✅ Transaction deleted!');
      setShowDeleteDialog(false);
      loadData();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  if (loading) return <LoadingSpinner text="Loading finance data..." />;

  const income = summary?.totalIncome || 0;
  const expenses = summary?.totalExpenses || 0;
  const net = income - expenses;
  const margin = income > 0 ? ((net / income) * 100).toFixed(0) : 0;

  // Filter transactions
  const filteredTransactions = filterType === 'All' 
    ? transactions 
    : transactions.filter(t => t.type === filterType);

  // Calculate category breakdown
  const categoryBreakdown = {};
  transactions.forEach(t => {
    const cat = t.category || 'Uncategorized';
    if (!categoryBreakdown[cat]) {
      categoryBreakdown[cat] = { income: 0, expense: 0, total: 0 };
    }
    const amount = parseFloat(t.amount);
    if (t.type === 'Income') {
      categoryBreakdown[cat].income += amount;
      categoryBreakdown[cat].total += amount;
    } else {
      categoryBreakdown[cat].expense += amount;
      categoryBreakdown[cat].total += amount;
    }
  });

  const topCategories = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 6);

  return (
    <div className="finance-screen">
      {/* Header */}
      <div className="screen-header">
        <div>
          <h1>Finance</h1>
          <p>Ledger, cash flow, and category breakdown</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" icon="📥">Export</Button>
          <Button variant="primary" icon="+" onClick={handleAdd}>
            New Transaction
          </Button>
        </div>
      </div>

      {/* Big Stat Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <StatCard
          icon="↑"
          title="Income • MTD"
          value={`$${income.toLocaleString()}`}
          subtitle={`${transactions.filter(t => t.type === 'Income').length} transactions`}
          color="green"
        />
        
        <StatCard
          icon="↓"
          title="Expenses • MTD"
          value={`$${expenses.toLocaleString()}`}
          subtitle={`${transactions.filter(t => t.type === 'Expense').length} transactions`}
          color="coral"
        />
        
        <StatCard
          icon="💰"
          title="Net"
          value={`$${net.toLocaleString()}`}
          subtitle={`${margin}% margin`}
          color={net >= 0 ? 'teal' : 'coral'}
        />
      </div>

      {/* Cash Flow & Categories Row */}
      <div className="finance-row">
        {/* Cash Flow Trend */}
        <Card className="finance-chart-card">
          <div className="card-header">
            <h3>Cash Flow Trend</h3>
            <span className="chart-subtitle">Net daily over the last month</span>
          </div>
          <div className="cash-flow-chart">
            <div className="chart-placeholder">
              <div className="chart-lines">
                <div className="chart-line income-line"></div>
                <div className="chart-line expense-line"></div>
              </div>
              <div className="chart-legend">
                <span className="legend-item income">Income</span>
                <span className="legend-item expense">Expenses</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Top Categories */}
        <Card className="finance-categories-card">
          <div className="card-header">
            <h3>Top Categories</h3>
            <span className="chart-subtitle">This month</span>
          </div>
          <div className="categories-list">
            {topCategories.length > 0 ? (
              topCategories.map(([category, data]) => {
                const isIncome = data.income > data.expense;
                const amount = isIncome ? data.income : data.expense;
                const maxAmount = Math.max(...topCategories.map(c => Math.max(c[1].income, c[1].expense)));
                const barWidth = (amount / maxAmount) * 100;
                
                return (
                  <div key={category} className="category-item">
                    <div className="category-header">
                      <span className="category-name">{category}</span>
                      <span className={`category-amount ${isIncome ? 'income' : 'expense'}`}>
                        ${amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="category-bar">
                      <div 
                        className="category-bar-fill" 
                        style={{ 
                          width: `${barWidth}%`,
                          backgroundColor: isIncome ? 'var(--color-teal-light)' : 'var(--color-coral)'
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-categories">No transactions yet</div>
            )}
          </div>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="transactions-table-card">
        <div className="card-header">
          <h3>Transactions</h3>
          <div className="transaction-filters">
            <button 
              className={`filter-btn ${filterType === 'All' ? 'active' : ''}`}
              onClick={() => setFilterType('All')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${filterType === 'Income' ? 'active' : ''}`}
              onClick={() => setFilterType('Income')}
            >
              Income
            </button>
            <button 
              className={`filter-btn ${filterType === 'Expense' ? 'active' : ''}`}
              onClick={() => setFilterType('Expense')}
            >
              Expense
            </button>
          </div>
        </div>
        
        {filteredTransactions.length === 0 ? (
          <EmptyState 
            icon="💰" 
            title="No transactions" 
            description="Start tracking income and expenses" 
            action={<Button onClick={handleAdd}>Add First Transaction</Button>} 
          />
        ) : (
          <div className="transactions-list">
            {filteredTransactions.map(t => (
              <div key={t.id} className="transaction-row">
                <div className={`transaction-type-icon ${t.type.toLowerCase()}`}>
                  {t.type === 'Income' ? '↑' : '↓'}
                </div>
                <div className="transaction-info">
                  <div className="transaction-description">
                    {t.description || t.category}
                  </div>
                  <div className="transaction-meta">
                    {new Date(t.transaction_date).toLocaleDateString()} • {t.category}
                  </div>
                </div>
                <div className={`transaction-amount ${t.type.toLowerCase()}`}>
                  {t.type === 'Income' ? '+' : '-'}${parseFloat(t.amount).toLocaleString()}
                </div>
                <div className="transaction-actions">
                  <Button variant="ghost" size="small" icon="✏️" onClick={() => handleEdit(t)}>
                    Edit
                  </Button>
                  <Button variant="danger-ghost" size="small" icon="🗑️" onClick={() => handleDelete(t)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Transaction">
        <form onSubmit={handleSubmitAdd}>
          <Select 
            label="Type" 
            value={formData.type} 
            onChange={(val) => setFormData({...formData, type: val})} 
            options={window.TRANSACTION_TYPES} 
            required 
          />
          <Input 
            label="Category" 
            value={formData.category} 
            onChange={(val) => setFormData({...formData, category: val})} 
            placeholder="e.g., Livestock Sale, Feed Purchase" 
            required 
          />
          <Input 
            label="Amount" 
            type="number" 
            step="0.01" 
            value={formData.amount} 
            onChange={(val) => setFormData({...formData, amount: val})} 
            placeholder="0.00" 
            required 
          />
          <Input 
            label="Date" 
            type="date" 
            value={formData.transaction_date} 
            onChange={(val) => setFormData({...formData, transaction_date: val})} 
            required 
          />
          <Input 
            label="Description" 
            value={formData.description} 
            onChange={(val) => setFormData({...formData, description: val})} 
            placeholder="Transaction description" 
          />
          <Textarea 
            label="Notes" 
            value={formData.notes} 
            onChange={(val) => setFormData({...formData, notes: val})} 
            placeholder="Additional notes..." 
          />
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Add Transaction</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Transaction">
        <form onSubmit={handleSubmitEdit}>
          <Select 
            label="Type" 
            value={formData.type} 
            onChange={(val) => setFormData({...formData, type: val})} 
            options={window.TRANSACTION_TYPES} 
            required 
          />
          <Input 
            label="Category" 
            value={formData.category} 
            onChange={(val) => setFormData({...formData, category: val})} 
            required 
          />
          <Input 
            label="Amount" 
            type="number" 
            step="0.01" 
            value={formData.amount} 
            onChange={(val) => setFormData({...formData, amount: val})} 
            required 
          />
          <Input 
            label="Date" 
            type="date" 
            value={formData.transaction_date} 
            onChange={(val) => setFormData({...formData, transaction_date: val})} 
            required 
          />
          <Input 
            label="Description" 
            value={formData.description} 
            onChange={(val) => setFormData({...formData, description: val})} 
          />
          <Textarea 
            label="Notes" 
            value={formData.notes} 
            onChange={(val) => setFormData({...formData, notes: val})} 
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
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

window.FinanceScreen = FinanceScreen;

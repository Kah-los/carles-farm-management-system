DROP TABLE IF EXISTS financial_transactions, weight_records, breeding_records, medication_logs, medication_dosages, medications, feeding_logs, formula_items, feed_formulas, feed_ingredients, animals, users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Manager', 'Worker', 'Veterinarian')),
  email VARCHAR(100),
  phone VARCHAR(20),
  is_locked BOOLEAN DEFAULT false,
  failed_attempts INTEGER DEFAULT 0,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE animals (
  id SERIAL PRIMARY KEY,
  tag VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(50),
  species VARCHAR(20) NOT NULL CHECK (species IN ('Cow', 'Pig', 'Goat', 'Sheep', 'Chicken')),
  breed VARCHAR(50),
  sex VARCHAR(10) CHECK (sex IN ('Male', 'Female')),
  date_of_birth DATE,
  acquisition_date DATE DEFAULT CURRENT_DATE,
  weight DECIMAL(10, 2),
  pen VARCHAR(20),
  status VARCHAR(20) DEFAULT 'Healthy' CHECK (status IN ('Healthy', 'Sick', 'Quarantine', 'Sold', 'Deceased')),
  source VARCHAR(50),
  parent_id INTEGER REFERENCES animals(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE feed_ingredients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50),
  cost_per_kg DECIMAL(10, 2),
  stock_kg DECIMAL(10, 2) DEFAULT 0,
  protein_percent DECIMAL(5, 2),
  energy_kcal DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE feed_formulas (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  target_species VARCHAR(20),
  description TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE formula_items (
  id SERIAL PRIMARY KEY,
  formula_id INTEGER REFERENCES feed_formulas(id) ON DELETE CASCADE,
  ingredient_id INTEGER REFERENCES feed_ingredients(id),
  quantity_kg DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE feeding_logs (
  id SERIAL PRIMARY KEY,
  animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
  formula_id INTEGER REFERENCES feed_formulas(id),
  feed_date DATE NOT NULL,
  quantity_kg DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  recorded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE medications (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(50),
  manufacturer VARCHAR(100),
  withdrawal_period_days INTEGER,
  cost_per_unit DECIMAL(10, 2),
  stock_quantity INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE medication_dosages (
  id SERIAL PRIMARY KEY,
  medication_id INTEGER REFERENCES medications(id) ON DELETE CASCADE,
  species VARCHAR(20),
  dosage_amount DECIMAL(10, 2),
  dosage_unit VARCHAR(20),
  frequency VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE medication_logs (
  id SERIAL PRIMARY KEY,
  animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
  medication_id INTEGER REFERENCES medications(id),
  dosage_id INTEGER REFERENCES medication_dosages(id),
  treatment_date DATE NOT NULL,
  dosage_given DECIMAL(10, 2),
  dosage_unit VARCHAR(20),
  reason TEXT,
  administered_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE breeding_records (
  id SERIAL PRIMARY KEY,
  animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
  breeding_date DATE NOT NULL,
  sire VARCHAR(50),
  expected_delivery DATE,
  actual_delivery DATE,
  offspring_count INTEGER,
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Pregnant', 'Delivered', 'Failed')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE weight_records (
  id SERIAL PRIMARY KEY,
  animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
  weight_date DATE NOT NULL,
  weight DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  recorded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE financial_transactions (
  id SERIAL PRIMARY KEY,
  transaction_date DATE NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('Income', 'Expense')),
  category VARCHAR(50) NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  recorded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_animals_species ON animals(species);
CREATE INDEX idx_animals_status ON animals(status);
CREATE INDEX idx_breeding_animal ON breeding_records(animal_id);
CREATE INDEX idx_finance_date ON financial_transactions(transaction_date);
CREATE INDEX idx_weight_animal ON weight_records(animal_id);

INSERT INTO users (username, pin_hash, full_name, role, email) VALUES
('admin', '$2b$10$rKJ3YqWxQxH1YqGvF4jO4.K7LHvW8SxmYYqvBxRQGvY0xVQZVQZVQ', 'Administrator', 'Admin', 'admin@carles.farm');

INSERT INTO feed_ingredients (name, category, cost_per_kg, stock_kg, protein_percent, energy_kcal) VALUES
('Corn', 'Grain', 0.25, 1000, 8.5, 3650),('Soybean Meal', 'Protein', 0.45, 500, 44.0, 3400),('Wheat Bran', 'Fiber', 0.20, 300, 15.0, 2000),('Barley', 'Grain', 0.22, 800, 11.5, 3500),('Oats', 'Grain', 0.28, 600, 13.0, 3900),('Sunflower Meal', 'Protein', 0.35, 250, 28.0, 2300),('Fish Meal', 'Protein', 1.20, 100, 65.0, 3200),('Molasses', 'Energy', 0.15, 400, 3.0, 3000),('Limestone', 'Mineral', 0.10, 500, 0, 0),('Salt', 'Mineral', 0.12, 200, 0, 0),('Vitamin Premix', 'Vitamin', 2.50, 50, 0, 0),('Mineral Premix', 'Mineral', 1.80, 50, 0, 0),('Rice Bran', 'Fiber', 0.18, 400, 13.0, 3100),('Cottonseed Meal', 'Protein', 0.40, 200, 41.0, 2200),('Dried Distillers Grains', 'Protein', 0.30, 300, 27.0, 3500),('Alfalfa Hay', 'Forage', 0.35, 1500, 17.0, 2500);

INSERT INTO animals (tag, name, species, breed, sex, date_of_birth, weight, pen, status, notes) VALUES
('CM001', 'Bessie', 'Cow', 'Holstein', 'Female', '2021-03-15', 450, 'A1', 'Healthy', 'Good milk producer'),('CM002', 'Daisy', 'Cow', 'Jersey', 'Female', '2022-05-20', 380, 'A2', 'Healthy', 'Recently calved'),('PG001', 'Wilbur', 'Pig', 'Yorkshire', 'Male', '2023-01-10', 120, 'B1', 'Healthy', 'Growing well'),('GT001', 'Billy', 'Goat', 'Boer', 'Male', '2022-08-15', 65, 'C1', 'Healthy', 'Good temperament'),('SH001', 'Dolly', 'Sheep', 'Merino', 'Female', '2021-11-20', 55, 'D1', 'Healthy', 'Excellent wool');

INSERT INTO financial_transactions (transaction_date, type, category, description, amount) VALUES
('2026-05-15', 'Income', 'Sales', 'Milk sales - weekly', 5000),('2026-05-14', 'Expense', 'Feed', 'Feed purchase - monthly supply', 2000),('2026-05-10', 'Income', 'Sales', 'Wool sales', 1500),('2026-05-08', 'Expense', 'Veterinary', 'Vaccination program', 800);

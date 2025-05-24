-- Enable the pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ROLES Table
CREATE TABLE roles (
  role_id SERIAL PRIMARY KEY,
  role_name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- USERS Table (UUID, with soft delete)
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  firebase_uid VARCHAR(255) NOT NULL UNIQUE,
  role_id INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ DEFAULT NULL, -- ✅ Keep deleted_at here
  CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE RESTRICT
);

-- PROFILES Table (UUID, NO deleted_at)
CREATE TABLE profiles (
  profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  avatar_url TEXT DEFAULT NULL,
  business_type VARCHAR(50), -- 'LLC', 'S_CORP', 'SOLE_PROP'
  agency_type VARCHAR(50), -- 'DIGITAL', 'CREATIVE', 'MARKETING', 'DEV'
  tax_year_start DATE DEFAULT '2025-01-01',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT unique_user_profile UNIQUE (user_id)
);

-- Default seed data for roles
INSERT INTO roles (role_name) VALUES ('admin');
INSERT INTO roles (role_name) VALUES ('user');

-- Indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- AUDIT LOGS Table
CREATE TABLE audit_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID, -- NULL allowed for system
  target_user_id UUID,
  action TEXT NOT NULL,
  table_name VARCHAR(255),
  record_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_actor FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT fk_target FOREIGN KEY (target_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- PAYMENTS Table
CREATE TABLE payments (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_status VARCHAR(50), -- E.g., 'active', 'past_due', 'canceled'
  subscription_plan VARCHAR(255), -- E.g., 'basic', 'premium'
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT unique_subscription UNIQUE (stripe_subscription_id)
);

-- Audit log indexes
CREATE INDEX idx_audit_actor_user_id ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_target_user_id ON audit_logs(target_user_id);
CREATE INDEX idx_audit_table_record ON audit_logs(table_name, record_id);

-- BANK ACCOUNTS Table
CREATE TABLE bank_accounts (
  account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plaid_account_id VARCHAR(255) UNIQUE,
  plaid_access_token TEXT, -- Encrypted
  account_name VARCHAR(255),
  account_type VARCHAR(50), -- 'CHECKING', 'SAVINGS', 'CREDIT'
  last_four VARCHAR(4),
  last_sync TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  is_initial_sync_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- CATEGORIES Table (includes new categories we discussed)
CREATE TABLE categories (
  category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'INCOME', 'EXPENSE'
  tax_impact_percentage DECIMAL(5,2), -- e.g., 30.00 for 30%
  is_deductible BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- TRANSACTIONS Table
CREATE TABLE transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bank_account_id UUID NOT NULL,
  plaid_transaction_id VARCHAR(255) UNIQUE,
  amount DECIMAL(12,2) NOT NULL,
  transaction_date DATE NOT NULL,
  description TEXT,
  merchant_name VARCHAR(255),
  category_id UUID,
  is_reviewed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_bank_account FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(account_id) ON DELETE CASCADE,
  CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
);

-- CATEGORY RULES Table (for auto-categorization)
CREATE TABLE category_rules (
  rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_pattern VARCHAR(255) NOT NULL,
  category_id UUID NOT NULL,
  confidence_threshold DECIMAL(3,2) DEFAULT 0.80,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- Seed default categories (including new categories)
INSERT INTO categories (name, type, tax_impact_percentage, is_deductible) VALUES
('Client Revenue', 'INCOME', 30.00, false),
('Product Sales', 'INCOME', 30.00, false),
('Software Subscriptions', 'EXPENSE', NULL, true),
('Contractor Payments', 'EXPENSE', NULL, true),
('Office Supplies', 'EXPENSE', NULL, true),
('Marketing & Advertising', 'EXPENSE', NULL, true),
('Travel & Meals', 'EXPENSE', NULL, true),
('Professional Services', 'EXPENSE', NULL, true),
('Equipment', 'EXPENSE', NULL, true),
('Other Income', 'INCOME', 30.00, false),
('Other Expense', 'EXPENSE', NULL, true),
('Refunds', 'INCOME', NULL, false),  -- Added category for refunds
('Wire Payments', 'EXPENSE', NULL, true),  -- Added category for wire payments
('Check Payments', 'EXPENSE', NULL, true),  -- Added category for check payments
('Credit Card Payments', 'EXPENSE', NULL, true);  -- Added category for credit card payments


-- Critical indexes
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date);
CREATE INDEX idx_transactions_reviewed ON transactions(user_id, is_reviewed);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_bank_accounts_user ON bank_accounts(user_id);
CREATE INDEX idx_category_rules_category ON category_rules(category_id);

-- Update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
CREATE TRIGGER update_bank_accounts_updated_at
BEFORE UPDATE ON bank_accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed additional category rules for common merchants and expenses
INSERT INTO category_rules (keyword_pattern, category_id, confidence_threshold)
VALUES
  -- Travel & Meals
  ('uber', (SELECT category_id FROM categories WHERE name = 'Travel & Meals'), 0.85),
  ('lyft', (SELECT category_id FROM categories WHERE name = 'Travel & Meals'), 0.85),
  ('mcdonalds', (SELECT category_id FROM categories WHERE name = 'Travel & Meals'), 0.85),
  ('starbucks', (SELECT category_id FROM categories WHERE name = 'Travel & Meals'), 0.85),
  ('doordash', (SELECT category_id FROM categories WHERE name = 'Travel & Meals'), 0.85),
  ('grubhub', (SELECT category_id FROM categories WHERE name = 'Travel & Meals'), 0.85),
  ('chipotle', (SELECT category_id FROM categories WHERE name = 'Travel & Meals'), 0.85),
  ('panera', (SELECT category_id FROM categories WHERE name = 'Travel & Meals'), 0.85),

  -- Office Supplies
  ('amazon', (SELECT category_id FROM categories WHERE name = 'Office Supplies'), 0.85),
  ('staples', (SELECT category_id FROM categories WHERE name = 'Office Supplies'), 0.85),
  ('office depot', (SELECT category_id FROM categories WHERE name = 'Office Supplies'), 0.85),
  ('walmart', (SELECT category_id FROM categories WHERE name = 'Office Supplies'), 0.80),
  ('costco', (SELECT category_id FROM categories WHERE name = 'Office Supplies'), 0.80),

  -- Software Subscriptions
  ('notion', (SELECT category_id FROM categories WHERE name = 'Software Subscriptions'), 0.85),
  ('figma', (SELECT category_id FROM categories WHERE name = 'Software Subscriptions'), 0.85),
  ('canva', (SELECT category_id FROM categories WHERE name = 'Software Subscriptions'), 0.85),
  ('github', (SELECT category_id FROM categories WHERE name = 'Software Subscriptions'), 0.85),
  ('heroku', (SELECT category_id FROM categories WHERE name = 'Software Subscriptions'), 0.85),
  ('vercel', (SELECT category_id FROM categories WHERE name = 'Software Subscriptions'), 0.85),

  -- Marketing & Advertising
  ('meta ads', (SELECT category_id FROM categories WHERE name = 'Marketing & Advertising'), 0.90),
  ('facebook ads', (SELECT category_id FROM categories WHERE name = 'Marketing & Advertising'), 0.90),
  ('instagram ads', (SELECT category_id FROM categories WHERE name = 'Marketing & Advertising'), 0.90),
  ('google ads', (SELECT category_id FROM categories WHERE name = 'Marketing & Advertising'), 0.90),
  ('linkedin ads', (SELECT category_id FROM categories WHERE name = 'Marketing & Advertising'), 0.90),

  -- Equipment
  ('best buy', (SELECT category_id FROM categories WHERE name = 'Equipment'), 0.85),
  ('apple store', (SELECT category_id FROM categories WHERE name = 'Equipment'), 0.85),
  ('dell', (SELECT category_id FROM categories WHERE name = 'Equipment'), 0.85),
  ('b&h', (SELECT category_id FROM categories WHERE name = 'Equipment'), 0.85),

  -- Contractor Payments
  ('upwork', (SELECT category_id FROM categories WHERE name = 'Contractor Payments'), 0.90),
  ('fiverr', (SELECT category_id FROM categories WHERE name = 'Contractor Payments'), 0.90),
  ('freelancer', (SELECT category_id FROM categories WHERE name = 'Contractor Payments'), 0.90),

  -- Professional Services
  ('legalzoom', (SELECT category_id FROM categories WHERE name = 'Professional Services'), 0.90),
  ('quickbooks', (SELECT category_id FROM categories WHERE name = 'Professional Services'), 0.85),
  ('turbo tax', (SELECT category_id FROM categories WHERE name = 'Professional Services'), 0.85),
  ('bookkeeping', (SELECT category_id FROM categories WHERE name = 'Professional Services'), 0.85),

  -- Refunds / Income
  ('refund', (SELECT category_id FROM categories WHERE name = 'Refunds'), 0.90),
  ('rebate', (SELECT category_id FROM categories WHERE name = 'Refunds'), 0.85),
  ('cashback', (SELECT category_id FROM categories WHERE name = 'Refunds'), 0.85),

  -- Other Expense
  ('sparkfun', (SELECT category_id FROM categories WHERE name = 'Other Expense'), 0.80),
  ('makerplace', (SELECT category_id FROM categories WHERE name = 'Other Expense'), 0.80);


ALTER TABLE transactions
ADD COLUMN is_deductible BOOLEAN,
ADD COLUMN deductibility_reason TEXT;

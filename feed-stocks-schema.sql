-- Table pour la gestion des stocks de provende finie
-- À exécuter dans l'éditeur SQL de Supabase

-- Table des stocks de provende finie (aliments prêts à distribuer)
CREATE TABLE IF NOT EXISTS feed_stocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  feed_type TEXT NOT NULL,
  total_weight DECIMAL(10,2) NOT NULL,
  bags_count INTEGER NOT NULL,
  weight_per_bag DECIMAL(8,2) NOT NULL,
  current_stock DECIMAL(10,2) NOT NULL, -- Stock restant
  supplier TEXT NOT NULL,
  delivery_date DATE NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  batch_number TEXT,
  expiry_date DATE,
  storage_location TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_feed_stocks_feed_type ON feed_stocks(feed_type);
CREATE INDEX IF NOT EXISTS idx_feed_stocks_delivery_date ON feed_stocks(delivery_date);
CREATE INDEX IF NOT EXISTS idx_feed_stocks_current_stock ON feed_stocks(current_stock);
CREATE INDEX IF NOT EXISTS idx_feed_stocks_expiry_date ON feed_stocks(expiry_date);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feed_stocks_updated_at BEFORE UPDATE ON feed_stocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) pour feed_stocks
ALTER TABLE feed_stocks ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture à tous les utilisateurs authentifiés
CREATE POLICY "Allow read access for authenticated users" ON feed_stocks
    FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour permettre l'insertion aux utilisateurs authentifiés
CREATE POLICY "Allow insert for authenticated users" ON feed_stocks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Politique pour permettre la mise à jour aux utilisateurs authentifiés
CREATE POLICY "Allow update for authenticated users" ON feed_stocks
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Politique pour permettre la suppression aux utilisateurs authentifiés
CREATE POLICY "Allow delete for authenticated users" ON feed_stocks
    FOR DELETE USING (auth.role() = 'authenticated');

-- Vérification finale
SELECT
  table_name,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = 'feed_stocks') as column_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'feed_stocks';
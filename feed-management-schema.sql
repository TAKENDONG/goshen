-- Tables pour la gestion de la provenderie
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Table des matières premières
CREATE TABLE IF NOT EXISTS raw_materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- Ex: 'cereales', 'proteines', 'vitamines', 'mineraux'
  unit TEXT NOT NULL, -- Ex: 'kg', 'tonnes', 'sacs'
  current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  supplier TEXT,
  minimum_stock DECIMAL(10,2) DEFAULT 0, -- Seuil d'alerte stock faible
  maximum_stock DECIMAL(10,2) DEFAULT 0, -- Capacité maximale de stockage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des entrées de stock (achats, ajustements, transferts)
CREATE TABLE IF NOT EXISTS feed_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  material_id UUID REFERENCES raw_materials(id) ON DELETE CASCADE NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'purchase' CHECK (entry_type IN ('purchase', 'adjustment', 'transfer')),
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  supplier TEXT NOT NULL,
  delivery_date DATE NOT NULL,
  batch_number TEXT, -- Numéro de lot pour traçabilité
  expiry_date DATE, -- Date d'expiration si applicable
  notes TEXT, -- Remarques, conditions de livraison, etc.
  recorded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table des sorties de stock (consommation pour production, ventes, pertes)
CREATE TABLE IF NOT EXISTS feed_exits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  material_id UUID REFERENCES raw_materials(id) ON DELETE CASCADE NOT NULL,
  exit_type TEXT NOT NULL DEFAULT 'consumption' CHECK (exit_type IN ('consumption', 'sale', 'loss', 'adjustment')),
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0, -- Coût unitaire au moment de la sortie
  total_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  reference_id UUID, -- ID de la production ou vente liée
  reference_type TEXT, -- 'feed_production', 'feed_sale', etc.
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Modifier la table feed_productions existante pour lier aux matières premières
ALTER TABLE feed_productions
ADD COLUMN IF NOT EXISTS raw_materials_cost DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS production_batch TEXT;

-- 5. Table de liaison entre productions et matières premières utilisées
CREATE TABLE IF NOT EXISTS feed_production_materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  production_id UUID REFERENCES feed_productions(id) ON DELETE CASCADE NOT NULL,
  material_id UUID REFERENCES raw_materials(id) ON DELETE CASCADE NOT NULL,
  quantity_used DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity_used * unit_cost) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_feed_entries_material_date ON feed_entries(material_id, delivery_date);
CREATE INDEX IF NOT EXISTS idx_feed_exits_material_date ON feed_exits(material_id, created_at);
CREATE INDEX IF NOT EXISTS idx_raw_materials_category ON raw_materials(category);

-- 7. Insérer des matières premières par défaut
INSERT INTO raw_materials (name, category, unit, current_stock, unit_price, minimum_stock)
SELECT * FROM (VALUES
  ('Maïs grain', 'cereales', 'kg', 2500, 450, 500),
  ('Tourteau de soja', 'proteines', 'kg', 800, 680, 200),
  ('Son de blé', 'cereales', 'kg', 1200, 320, 300),
  ('Prémix ponte', 'vitamines', 'kg', 45, 2500, 20),
  ('Carbonate de calcium', 'mineraux', 'kg', 500, 180, 100),
  ('Farine de poisson', 'proteines', 'kg', 200, 1200, 50),
  ('Huile de palme', 'lipides', 'L', 150, 800, 50),
  ('Sel', 'mineraux', 'kg', 100, 200, 25)
) AS v(name, category, unit, current_stock, unit_price, minimum_stock)
WHERE NOT EXISTS (SELECT 1 FROM raw_materials WHERE name = v.name);

-- 8. Créer une fonction pour calculer le statut du stock
CREATE OR REPLACE FUNCTION get_stock_status(current_stock DECIMAL, minimum_stock DECIMAL, maximum_stock DECIMAL)
RETURNS TEXT AS $$
BEGIN
  IF current_stock <= minimum_stock THEN
    IF current_stock <= minimum_stock * 0.5 THEN
      RETURN 'critical';
    ELSE
      RETURN 'low';
    END IF;
  ELSIF maximum_stock > 0 AND current_stock >= maximum_stock * 0.9 THEN
    RETURN 'high';
  ELSE
    RETURN 'good';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 9. Créer une vue pour les stocks avec statut
CREATE OR REPLACE VIEW raw_materials_with_status AS
SELECT
  rm.*,
  get_stock_status(rm.current_stock, rm.minimum_stock, rm.maximum_stock) as stock_status,
  (rm.current_stock * rm.unit_price) as stock_value
FROM raw_materials rm;

-- 10. Vérification finale
SELECT
  table_name,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('raw_materials', 'feed_entries', 'feed_exits', 'feed_production_materials')
ORDER BY table_name;
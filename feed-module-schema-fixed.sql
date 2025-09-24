-- Schema complet pour le module Provenderie - Version corrigée
-- À exécuter dans l'éditeur SQL de Supabase

-- D'abord, supprimer les tables existantes si elles posent problème (optionnel)
-- DROP TABLE IF EXISTS feed_sales CASCADE;
-- DROP TABLE IF EXISTS machine_revenues CASCADE;
-- DROP TABLE IF EXISTS mill_revenues CASCADE;
-- DROP TABLE IF EXISTS feed_entries CASCADE;
-- DROP TABLE IF EXISTS raw_materials CASCADE;

-- 1. Table des matières premières (raw_materials)
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des entrées de stock (feed_entries)
CREATE TABLE IF NOT EXISTS feed_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  material_id UUID REFERENCES raw_materials(id) ON DELETE CASCADE,
  material_name TEXT NOT NULL, -- Pour éviter les jointures
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

-- 3. Table des recettes du moulin (mill_revenues)
CREATE TABLE IF NOT EXISTS mill_revenues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table des recettes de la machine à provende (machine_revenues)
CREATE TABLE IF NOT EXISTS machine_revenues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  quantity DECIMAL(10,2) NOT NULL, -- en kg
  amount DECIMAL(12,2) NOT NULL,
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table des ventes d'aliment (feed_sales)
CREATE TABLE IF NOT EXISTS feed_sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_name TEXT NOT NULL,
  feed_type TEXT NOT NULL,
  quantity_kg DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(12,2) GENERATED ALWAYS AS (quantity_kg * unit_price) STORED,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'transfer', 'check', 'credit')),
  delivery_date DATE NOT NULL,
  delivery_address TEXT,
  notes TEXT,
  date DATE NOT NULL, -- Pour compatibilité avec le formulaire
  recorded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Fonction pour updated_at (à créer avant les triggers)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Trigger pour updated_at sur raw_materials
DROP TRIGGER IF EXISTS update_raw_materials_updated_at ON raw_materials;
CREATE TRIGGER update_raw_materials_updated_at
BEFORE UPDATE ON raw_materials
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Création des indexes après confirmation que les tables existent
DO $$
BEGIN
    -- Vérifier si les colonnes existent avant de créer les indexes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feed_entries' AND column_name = 'delivery_date') THEN
        CREATE INDEX IF NOT EXISTS idx_feed_entries_date ON feed_entries(delivery_date);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feed_entries' AND column_name = 'material_id') THEN
        CREATE INDEX IF NOT EXISTS idx_feed_entries_material ON feed_entries(material_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'raw_materials' AND column_name = 'category') THEN
        CREATE INDEX IF NOT EXISTS idx_raw_materials_category ON raw_materials(category);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mill_revenues' AND column_name = 'date') THEN
        CREATE INDEX IF NOT EXISTS idx_mill_revenues_date ON mill_revenues(date);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'machine_revenues' AND column_name = 'date') THEN
        CREATE INDEX IF NOT EXISTS idx_machine_revenues_date ON machine_revenues(date);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feed_sales' AND column_name = 'date') THEN
        CREATE INDEX IF NOT EXISTS idx_feed_sales_date ON feed_sales(date);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feed_sales' AND column_name = 'delivery_date') THEN
        CREATE INDEX IF NOT EXISTS idx_feed_sales_delivery_date ON feed_sales(delivery_date);
    END IF;
END $$;

-- 9. RLS (Row Level Security) pour toutes les tables
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mill_revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_sales ENABLE ROW LEVEL SECURITY;

-- 10. Politiques RLS pour permettre l'accès aux utilisateurs authentifiés
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON raw_materials;
CREATE POLICY "Allow all operations for authenticated users" ON raw_materials
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON feed_entries;
CREATE POLICY "Allow all operations for authenticated users" ON feed_entries
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON mill_revenues;
CREATE POLICY "Allow all operations for authenticated users" ON mill_revenues
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON machine_revenues;
CREATE POLICY "Allow all operations for authenticated users" ON machine_revenues
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON feed_sales;
CREATE POLICY "Allow all operations for authenticated users" ON feed_sales
    FOR ALL USING (auth.role() = 'authenticated');

-- 11. Vérification finale
SELECT
  table_name,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('raw_materials', 'feed_entries', 'mill_revenues', 'machine_revenues', 'feed_sales')
ORDER BY table_name;
-- PWA Goshen - Schema de base de données Supabase (Version corrigée)
-- Cette version corrige le problème de récursion infinie dans les politiques RLS

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CRÉATION DES TABLES
-- =============================================

-- Table des profils utilisateurs (doit être créée en premier)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee', 'feed_manager', 'accountant', 'cooperative_member')),
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des fermes
CREATE TABLE IF NOT EXISTS farms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  total_capacity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des troupeaux
CREATE TABLE IF NOT EXISTS flocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  current_count INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de production d'œufs
CREATE TABLE IF NOT EXISTS egg_productions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flock_id UUID REFERENCES flocks(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  eggs_produced INTEGER NOT NULL DEFAULT 0,
  recorded_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de mortalité
CREATE TABLE IF NOT EXISTS mortalities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flock_id UUID REFERENCES flocks(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  deaths INTEGER NOT NULL DEFAULT 0,
  cause TEXT,
  recorded_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de consommation d'aliments
CREATE TABLE IF NOT EXISTS feed_consumptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flock_id UUID REFERENCES flocks(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  quantity_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
  feed_type TEXT NOT NULL,
  recorded_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des vaccinations
CREATE TABLE IF NOT EXISTS vaccinations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flock_id UUID REFERENCES flocks(id) ON DELETE CASCADE NOT NULL,
  vaccine_name TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  administered_by UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des ventes d'œufs
CREATE TABLE IF NOT EXISTS egg_sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  trays_count INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  client_name TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  recorded_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  recorded_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des matières premières
CREATE TABLE IF NOT EXISTS raw_materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  supplier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de production d'aliments
CREATE TABLE IF NOT EXISTS feed_productions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  feed_type TEXT NOT NULL,
  quantity_produced DECIMAL(10,2) NOT NULL DEFAULT 0,
  raw_materials_used JSONB NOT NULL DEFAULT '{}',
  production_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  recorded_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des ventes d'aliments
CREATE TABLE IF NOT EXISTS feed_sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  client_name TEXT NOT NULL,
  feed_type TEXT NOT NULL,
  quantity_sold DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  recorded_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- FONCTIONS ET TRIGGERS
-- =============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour la table profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'employee')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Trigger pour créer automatiquement un profil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ACTIVATION RLS
-- =============================================

-- Activer RLS pour toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE flocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE egg_productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mortalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_consumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE egg_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_sales ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLITIQUES RLS
-- =============================================

-- Supprimer toutes les politiques existantes pour éviter les conflits
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT schemaname, tablename, policyname 
               FROM pg_policies 
               WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Politiques pour la table profiles (simples et sans récursion)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Politiques pour les autres tables (lecture libre, modification par l'auteur)
-- Farms
CREATE POLICY "Everyone can view farms" ON farms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can modify farms" ON farms FOR ALL USING (auth.role() = 'authenticated');

-- Flocks  
CREATE POLICY "Everyone can view flocks" ON flocks FOR SELECT USING (true);
CREATE POLICY "Authenticated users can modify flocks" ON flocks FOR ALL USING (auth.role() = 'authenticated');

-- Egg productions
CREATE POLICY "Everyone can view egg productions" ON egg_productions FOR SELECT USING (true);
CREATE POLICY "Users can insert egg productions" ON egg_productions FOR INSERT WITH CHECK (auth.uid() = recorded_by);
CREATE POLICY "Users can update own egg productions" ON egg_productions FOR UPDATE USING (auth.uid() = recorded_by);

-- Mortalities
CREATE POLICY "Everyone can view mortalities" ON mortalities FOR SELECT USING (true);
CREATE POLICY "Users can insert mortalities" ON mortalities FOR INSERT WITH CHECK (auth.uid() = recorded_by);
CREATE POLICY "Users can update own mortalities" ON mortalities FOR UPDATE USING (auth.uid() = recorded_by);

-- Feed consumptions
CREATE POLICY "Everyone can view feed consumptions" ON feed_consumptions FOR SELECT USING (true);
CREATE POLICY "Users can insert feed consumptions" ON feed_consumptions FOR INSERT WITH CHECK (auth.uid() = recorded_by);
CREATE POLICY "Users can update own feed consumptions" ON feed_consumptions FOR UPDATE USING (auth.uid() = recorded_by);

-- Vaccinations
CREATE POLICY "Everyone can view vaccinations" ON vaccinations FOR SELECT USING (true);
CREATE POLICY "Users can insert vaccinations" ON vaccinations FOR INSERT WITH CHECK (auth.uid() = administered_by OR administered_by IS NULL);
CREATE POLICY "Users can update own vaccinations" ON vaccinations FOR UPDATE USING (auth.uid() = administered_by OR administered_by IS NULL);

-- Egg sales
CREATE POLICY "Everyone can view egg sales" ON egg_sales FOR SELECT USING (true);
CREATE POLICY "Users can insert egg sales" ON egg_sales FOR INSERT WITH CHECK (auth.uid() = recorded_by);
CREATE POLICY "Users can update own egg sales" ON egg_sales FOR UPDATE USING (auth.uid() = recorded_by);

-- Transactions
CREATE POLICY "Everyone can view transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Users can insert transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = recorded_by);
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = recorded_by);

-- Raw materials
CREATE POLICY "Everyone can view raw materials" ON raw_materials FOR SELECT USING (true);
CREATE POLICY "Authenticated users can modify raw materials" ON raw_materials FOR ALL USING (auth.role() = 'authenticated');

-- Feed productions
CREATE POLICY "Everyone can view feed productions" ON feed_productions FOR SELECT USING (true);
CREATE POLICY "Users can insert feed productions" ON feed_productions FOR INSERT WITH CHECK (auth.uid() = recorded_by);
CREATE POLICY "Users can update own feed productions" ON feed_productions FOR UPDATE USING (auth.uid() = recorded_by);

-- Feed sales
CREATE POLICY "Everyone can view feed sales" ON feed_sales FOR SELECT USING (true);
CREATE POLICY "Users can insert feed sales" ON feed_sales FOR INSERT WITH CHECK (auth.uid() = recorded_by);
CREATE POLICY "Users can update own feed sales" ON feed_sales FOR UPDATE USING (auth.uid() = recorded_by);

-- =============================================
-- INDEX POUR PERFORMANCES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_flocks_farm_id ON flocks(farm_id);
CREATE INDEX IF NOT EXISTS idx_egg_productions_flock_id ON egg_productions(flock_id);
CREATE INDEX IF NOT EXISTS idx_egg_productions_date ON egg_productions(date);
CREATE INDEX IF NOT EXISTS idx_mortalities_flock_id ON mortalities(flock_id);
CREATE INDEX IF NOT EXISTS idx_feed_consumptions_flock_id ON feed_consumptions(flock_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_flock_id ON vaccinations(flock_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_egg_sales_date ON egg_sales(date);
CREATE INDEX IF NOT EXISTS idx_feed_sales_date ON feed_sales(date);

-- =============================================
-- DONNÉES INITIALES
-- =============================================

-- Fermes initiales
INSERT INTO farms (name, total_capacity)
SELECT 'Ferme Principal', 10000
WHERE NOT EXISTS (SELECT 1 FROM farms WHERE name = 'Ferme Principal');

INSERT INTO farms (name, total_capacity)
SELECT 'Site Nord', 5000
WHERE NOT EXISTS (SELECT 1 FROM farms WHERE name = 'Site Nord');
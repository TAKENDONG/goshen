-- PWA Goshen - Schema de base de données Supabase
-- Système de gestion de ferme avicole avec production d'aliments

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs (étend auth.users de Supabase)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee', 'feed_manager', 'accountant', 'cooperative_member')),
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des fermes
CREATE TABLE farms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  total_capacity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des troupeaux
CREATE TABLE flocks (
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
CREATE TABLE egg_productions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flock_id UUID REFERENCES flocks(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  eggs_produced INTEGER NOT NULL DEFAULT 0,
  recorded_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de mortalité
CREATE TABLE mortalities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flock_id UUID REFERENCES flocks(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  deaths INTEGER NOT NULL DEFAULT 0,
  cause TEXT,
  recorded_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de consommation d'aliments
CREATE TABLE feed_consumptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flock_id UUID REFERENCES flocks(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  quantity_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
  feed_type TEXT NOT NULL,
  recorded_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des vaccinations
CREATE TABLE vaccinations (
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
CREATE TABLE egg_sales (
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
CREATE TABLE transactions (
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
CREATE TABLE raw_materials (
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
CREATE TABLE feed_productions (
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
CREATE TABLE feed_sales (
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

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour la table profiles
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
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
  );
  RETURN new;
END;
$$;

-- Trigger pour créer automatiquement un profil
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Politiques RLS (Row Level Security)
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

-- Politique pour les profils - les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Politique pour les admins - accès complet
CREATE POLICY "Admins have full access" ON profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Politiques génériques pour toutes les autres tables
-- Les utilisateurs connectés peuvent lire et créer
-- Les admins peuvent tout faire
DO $$
DECLARE
    table_name text;
    table_names text[] := ARRAY[
        'farms', 'flocks', 'egg_productions', 'mortalities',
        'feed_consumptions', 'vaccinations', 'egg_sales',
        'transactions', 'raw_materials', 'feed_productions', 'feed_sales'
    ];
BEGIN
    FOREACH table_name IN ARRAY table_names LOOP
        -- Lecture pour tous les utilisateurs connectés
        EXECUTE format('
            CREATE POLICY "Authenticated users can read %I" ON %I
            FOR SELECT USING (auth.role() = ''authenticated'')
        ', table_name, table_name);

        -- Création pour tous les utilisateurs connectés
        EXECUTE format('
            CREATE POLICY "Authenticated users can create %I" ON %I
            FOR INSERT WITH CHECK (auth.role() = ''authenticated'')
        ', table_name, table_name);

        -- Mise à jour et suppression pour les admins seulement
        EXECUTE format('
            CREATE POLICY "Admins can update %I" ON %I
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role = ''admin''
                )
            )
        ', table_name, table_name);

        EXECUTE format('
            CREATE POLICY "Admins can delete %I" ON %I
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role = ''admin''
                )
            )
        ', table_name, table_name);
    END LOOP;
END $$;

-- Index pour améliorer les performances
CREATE INDEX idx_flocks_farm_id ON flocks(farm_id);
CREATE INDEX idx_egg_productions_flock_id ON egg_productions(flock_id);
CREATE INDEX idx_egg_productions_date ON egg_productions(date);
CREATE INDEX idx_mortalities_flock_id ON mortalities(flock_id);
CREATE INDEX idx_feed_consumptions_flock_id ON feed_consumptions(flock_id);
CREATE INDEX idx_vaccinations_flock_id ON vaccinations(flock_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_egg_sales_date ON egg_sales(date);
CREATE INDEX idx_feed_sales_date ON feed_sales(date);

-- Données initiales
INSERT INTO farms (name, total_capacity) VALUES
('Ferme Principal', 10000),
('Site Nord', 5000);

-- Commentaires pour la documentation
COMMENT ON TABLE profiles IS 'Profils utilisateurs étendant auth.users';
COMMENT ON TABLE farms IS 'Fermes avicoles';
COMMENT ON TABLE flocks IS 'Troupeaux de volailles';
COMMENT ON TABLE egg_productions IS 'Production quotidienne d''œufs';
COMMENT ON TABLE mortalities IS 'Mortalité des volailles';
COMMENT ON TABLE feed_consumptions IS 'Consommation d''aliments par troupeau';
COMMENT ON TABLE vaccinations IS 'Programme de vaccination';
COMMENT ON TABLE egg_sales IS 'Ventes d''œufs';
COMMENT ON TABLE transactions IS 'Transactions financières';
COMMENT ON TABLE raw_materials IS 'Matières premières pour fabrication d''aliments';
COMMENT ON TABLE feed_productions IS 'Production d''aliments';
COMMENT ON TABLE feed_sales IS 'Ventes d''aliments produits';
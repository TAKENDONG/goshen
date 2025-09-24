-- Script pour vérifier et créer les tables nécessaires dans Supabase
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier quelles tables existent déjà
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('farms', 'flocks', 'egg_productions', 'mortalities', 'feed_consumptions', 'vaccinations');

-- 2. Créer la table des fermes si elle n'existe pas
CREATE TABLE IF NOT EXISTS farms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  total_capacity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Créer la table des bandes/troupeaux si elle n'existe pas
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

-- 4. Créer la table de production d'œufs (version mise à jour)
CREATE TABLE IF NOT EXISTS egg_productions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flock_id UUID REFERENCES flocks(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  trays_count INTEGER NOT NULL DEFAULT 0,
  individual_eggs INTEGER NOT NULL DEFAULT 0,
  broken_eggs INTEGER NOT NULL DEFAULT 0,
  eggs_produced INTEGER GENERATED ALWAYS AS ((trays_count * 30) + individual_eggs - broken_eggs) STORED,
  recorded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Créer la table de mortalité si elle n'existe pas
CREATE TABLE IF NOT EXISTS mortalities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flock_id UUID REFERENCES flocks(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  deaths INTEGER NOT NULL DEFAULT 0,
  cause TEXT,
  recorded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Créer la table de consommation d'aliment si elle n'existe pas
CREATE TABLE IF NOT EXISTS feed_consumptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flock_id UUID REFERENCES flocks(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  quantity_kg DECIMAL(10,2) NOT NULL,
  feed_type TEXT NOT NULL,
  recorded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Créer la table des vaccinations si elle n'existe pas
CREATE TABLE IF NOT EXISTS vaccinations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flock_id UUID REFERENCES flocks(id) ON DELETE CASCADE NOT NULL,
  vaccine_name TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  cost DECIMAL(10,2),
  administered_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Insérer une ferme par défaut si aucune n'existe
INSERT INTO farms (name, total_capacity)
SELECT 'Ferme Principale', 5000
WHERE NOT EXISTS (SELECT 1 FROM farms);

-- 9. Vérification finale - lister toutes les tables créées
SELECT table_name,
       (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('farms', 'flocks', 'egg_productions', 'mortalities', 'feed_consumptions', 'vaccinations')
ORDER BY table_name;
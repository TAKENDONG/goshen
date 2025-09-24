-- Migration pour le système de comptage d'œufs par alvéoles
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter les nouvelles colonnes à la table egg_productions
ALTER TABLE egg_productions
ADD COLUMN IF NOT EXISTS trays_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS individual_eggs INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS broken_eggs INTEGER NOT NULL DEFAULT 0;

-- 2. Modifier la colonne eggs_produced pour qu'elle soit calculée automatiquement
-- Note: PostgreSQL ne permet pas de modifier directement une colonne pour la rendre GENERATED
-- Il faut donc créer une nouvelle colonne calculée et migrer les données

-- Étape 2a: Renommer l'ancienne colonne
ALTER TABLE egg_productions RENAME COLUMN eggs_produced TO eggs_produced_old;

-- Étape 2b: Créer la nouvelle colonne calculée
ALTER TABLE egg_productions
ADD COLUMN eggs_produced INTEGER GENERATED ALWAYS AS ((trays_count * 30) + individual_eggs - broken_eggs) STORED;

-- 3. Migrer les données existantes (si il y en a)
-- Pour les données existantes, on assume qu'elles étaient saisies en œufs individuels
UPDATE egg_productions
SET individual_eggs = eggs_produced_old
WHERE eggs_produced_old IS NOT NULL;

-- 4. Supprimer l'ancienne colonne (optionnel, vous pouvez la garder pour backup)
-- ALTER TABLE egg_productions DROP COLUMN eggs_produced_old;

-- 5. Ajouter des commentaires pour documentation
COMMENT ON COLUMN egg_productions.trays_count IS 'Nombre d''alvéoles (plateaux de 30 œufs)';
COMMENT ON COLUMN egg_productions.individual_eggs IS 'Œufs individuels supplémentaires';
COMMENT ON COLUMN egg_productions.broken_eggs IS 'Nombre d''œufs cassés à déduire';
COMMENT ON COLUMN egg_productions.eggs_produced IS 'Total calculé: (trays_count * 30) + individual_eggs - broken_eggs';

-- Vérification des données après migration
SELECT
  id,
  trays_count,
  individual_eggs,
  broken_eggs,
  eggs_produced,
  eggs_produced_old
FROM egg_productions
LIMIT 5;
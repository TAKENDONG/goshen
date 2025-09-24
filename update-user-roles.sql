-- Mise à jour des rôles utilisateur pour le système RBAC
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. D'abord, mettons à jour la table profiles si elle existe déjà
-- Modifier le type de données pour role si nécessaire
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Ajouter la nouvelle contrainte avec les nouveaux rôles
ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('superadmin', 'farm_manager', 'feed_manager', 'accountant', 'employee'));

-- 2. Mettre à jour les rôles existants (adaptez selon vos besoins)
-- Remplacer 'admin' par 'superadmin'
UPDATE profiles
SET role = 'superadmin'
WHERE role = 'admin';

-- Remplacer 'employee' par 'employee' (pas de changement)
UPDATE profiles
SET role = 'employee'
WHERE role = 'employee';

-- Remplacer 'feed_manager' par 'feed_manager' (pas de changement si déjà existant)
UPDATE profiles
SET role = 'feed_manager'
WHERE role = 'feed_manager';

-- 3. Créer des utilisateurs de test pour chaque rôle (optionnel)
-- Note: Ces utilisateurs devront être créés via l'interface Supabase Auth ou via l'application

-- 4. Créer une fonction pour obtenir le rôle de l'utilisateur courant
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role
    FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Mise à jour des politiques RLS si nécessaire pour certaines tables sensibles
-- Par exemple, seuls les superadmin peuvent accéder à la table des utilisateurs
DROP POLICY IF EXISTS "Only superadmin can manage users" ON profiles;
CREATE POLICY "Only superadmin can manage users" ON profiles
  FOR ALL USING (
    get_user_role() = 'superadmin' OR
    auth.uid() = id  -- Utilisateurs peuvent voir/modifier leur propre profil
  );

-- 6. Vérification - Afficher tous les profils avec leurs rôles
SELECT
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
ORDER BY role, full_name;
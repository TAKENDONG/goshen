# 🔐 Guide du Système de Contrôle d'Accès Basé sur les Rôles (RBAC)

## 📋 Rôles Disponibles

| Rôle | Description | Pages Accessibles |
|------|-------------|-------------------|
| **Super Administrateur** (`superadmin`) | Accès complet à toutes les fonctionnalités | Toutes |
| **Gérant de Ferme** (`farm_manager`) | Gestion de l'exploitation avicole | Accueil, Ferme, Ventes, Rapports |
| **Gérant Provenderie** (`feed_manager`) | Gestion de la provenderie | Accueil, Provenderie, Rapports |
| **Comptable** (`accountant`) | Suivi financier et commercial | Accueil, Ventes, Rapports |
| **Employé** (`employee`) | Accès basique aux opérations | Accueil, Ferme |

## 🚀 Configuration des Rôles

### 1. Mise à jour de la base de données
Exécuter le script SQL pour mettre à jour les contraintes :
```sql
-- Fichier: update-user-roles.sql
-- À exécuter dans l'éditeur SQL Supabase
```

### 2. Assignation des rôles utilisateur
```sql
-- Exemple : Assigner un rôle superadmin
UPDATE profiles
SET role = 'superadmin'
WHERE email = 'admin@goshen.com';

-- Exemple : Assigner un rôle gérant ferme
UPDATE profiles
SET role = 'farm_manager'
WHERE email = 'ferme@goshen.com';
```

## 🎯 Fonctionnalités du Système

### ✅ **Redirection Automatique**
- Chaque rôle a une page par défaut
- `superadmin` → Accueil
- `farm_manager` → Ferme
- `feed_manager` → Provenderie
- `accountant` → Ventes
- `employee` → Accueil

### ✅ **Navigation Filtrée**
- Seules les pages autorisées apparaissent dans le menu
- Protection contre les accès directs non autorisés
- Messages d'erreur pour tentatives d'accès interdites

### ✅ **Interface Personnalisée**
- Dashboard adapté selon le rôle
- Messages de bienvenue spécifiques
- Icônes représentatives du rôle

## 🛠️ Architecture Technique

### Fichiers Principaux
```
src/
├── utils/rolePermissions.ts     # Définition des permissions
├── hooks/useRoleAccess.ts       # Hook pour les permissions
├── components/Layout.tsx        # Navigation avec contrôle d'accès
├── App.tsx                     # Logique de routage sécurisé
└── types/index.ts              # Types TypeScript
```

### Utilisation dans les composants
```typescript
import { useRoleAccess } from '../hooks/useRoleAccess';

const MyComponent = () => {
  const { canAccess, userRole } = useRoleAccess();

  if (!canAccess('feed')) {
    return <div>Accès non autorisé</div>;
  }

  return <div>Contenu autorisé</div>;
};
```

## 🔒 Sécurité

### Row Level Security (RLS)
- Politiques Supabase basées sur les rôles
- Fonction `get_user_role()` pour obtenir le rôle courant
- Protection au niveau base de données

### Protection Frontend
- Vérification des permissions à chaque navigation
- Masquage des éléments d'interface non autorisés
- Redirection automatique en cas d'accès non autorisé

## 📖 Exemples d'Usage

### Utilisateur `farm_manager`
1. Se connecte → Redirigé vers la page Ferme
2. Voit dans le menu : Accueil, Ferme, Ventes, Rapports
3. Ne peut pas accéder à : Provenderie, Utilisateurs

### Utilisateur `feed_manager`
1. Se connecte → Redirigé vers la page Provenderie
2. Voit dans le menu : Accueil, Provenderie, Rapports
3. Peut gérer : Stock, Entrées, Production, Recettes moulin/machine

### Utilisateur `superadmin`
1. Se connecte → Accueil avec vue complète
2. Voit toutes les pages dans le menu
3. Peut gérer les utilisateurs et accéder à tout

## 🚀 Déploiement

1. **Exécuter les scripts SQL** dans Supabase
2. **Assigner les rôles** aux utilisateurs existants
3. **Tester chaque rôle** pour vérifier les permissions
4. **Former les utilisateurs** sur leurs nouvelles interfaces

## 🐛 Dépannage

### Problème : Utilisateur bloqué
**Solution** : Vérifier le rôle dans la table `profiles`

### Problème : Page non accessible
**Solution** : Contrôler les permissions dans `rolePermissions.ts`

### Problème : Erreur de navigation
**Solution** : Vérifier que la page est dans `allowedPages` du rôle
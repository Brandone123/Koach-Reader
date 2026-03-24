# Guide Leaderboard - Configuration et Tables Supabase

## 0. Classement sans serveur Node (recommandé)

L’écran **Leaderboard** charge les données **directement depuis Supabase** (comme la liste des livres). Tu n’as **pas** besoin que le backend Express tourne pour voir le classement, tant que :

- `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` sont corrects dans `client/.env`
- Les policies RLS autorisent la **lecture** sur `public.users`, `public.user_badges`, `public.user_books` (voir `supabase-leaderboard-tables.sql`)

Si le classement reste vide ou une erreur s’affiche, exécute les policies du fichier SQL dans Supabase.

---

## 1. Network request failed : corriger l’URL API

L’erreur **Network request failed** signifie que l’app ne peut pas joindre le backend. Le serveur écoute sur le **port 8002**, mais l’app utilise `localhost:5000`.

### 1.1 Modifier `client/.env`

Ajoute cette ligne (ou mets à jour) :

```env
# Pour émulateur Android
EXPO_PUBLIC_API_URL=http://10.0.2.2:8002

# Pour appareil physique : remplace par l’IP de ton PC sur le réseau (ex: 192.168.1.42)
# EXPO_PUBLIC_API_URL=http://192.168.1.42:8002

# Pour simulateur iOS : localhost fonctionne
# EXPO_PUBLIC_API_URL=http://localhost:8002
```

### 1.2 Vérifier que le backend tourne

```bash
cd Koach-Reader
npm run build
node dist/server/index.js
```

Ou, selon ta config :

```bash
npm start
```

Le serveur doit afficher quelque chose comme : `Server is running on http://localhost:8002`.

### 1.3 Redémarrer Expo après modification du `.env`

```bash
npx expo start --clear
```

---

## 2. Tables Supabase pour le leaderboard

Les APIs leaderboard s’appuient sur ces tables existantes. Si elles n’existent pas, exécute le script ci‑dessous dans Supabase.

### 2.1 Tables utilisées

| Table         | Usage Leaderboard Général | Usage Leaderboard Par livre |
|---------------|---------------------------|-----------------------------|
| `users`       | koach_points, books_completed, username, avatar_url | — |
| `user_badges` | Nombre de badges par utilisateur | — |
| `user_books`  | — | user_id, book_id, current_page, is_completed |

### 2.2 Créer les tables dans Supabase

1. Ouvre le **Supabase Dashboard** : https://supabase.com/dashboard  
2. Choisis ton projet  
3. Va dans **SQL Editor**  
4. Clique sur **New query**  
5. Copie-colle le contenu du fichier `supabase-leaderboard-tables.sql` (voir section suivante)  
6. Exécute la requête (Run)

---

## 3. Comment la page leaderboard est “dynamique”

### 3.1 Onglet « Général »

- Source : table `users` (koach_points, books_completed) + `user_badges`
- Mise à jour : dès qu’un utilisateur gagne des points, termine un livre ou reçoit un badge
- Aucune action manuelle : les données viennent de la base

### 3.2 Onglet « Par livre »

- Source : table `user_books`
- Pour qu’un livre apparaisse dans le classement :
  1. L’utilisateur doit avoir une entrée dans `user_books` pour ce livre  
  2. Ou une session de lecture enregistrée

La table `user_books` doit être remplie quand :
- Un utilisateur démarre la lecture d’un livre (via l’app)
- Une session est enregistrée

Si personne ne lit le livre 21, le classement pour ce livre sera vide.

---

## 4. Variables d’environnement

### Client (`client/.env`)

```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx
EXPO_PUBLIC_API_URL=http://10.0.2.2:8002
```

### Serveur (`.env` à la racine)

```
PORT=8002
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
DATABASE_URL=postgresql://...
```

---

## 5. Vérifications rapides

1. **Test de l’API** :  
   Ouvre dans un navigateur (sur ton PC) :  
   `http://localhost:8002/health`  
   Tu dois voir : `{"status":"ok",...}`

2. **Test depuis l’émulateur** :  
   `http://10.0.2.2:8002/health`

3. **Tables Supabase** :  
   Dans le SQL Editor, exécute :
   ```sql
   SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users');
   SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_books');
   ```
   Les deux doivent retourner `true`.

---

## 6. Données de démo (seed)

Si le classement est vide ou tu veux des stats variées :

1. Ouvre **SQL Editor** dans Supabase  
2. Exécute le fichier **`supabase-seed-leaderboard.sql`** à la racine du repo  

Le script met à jour `koach_points` / `books_completed` pour tous les utilisateurs, ajoute des badges, et crée des lignes `user_books` (8 users × 5 livres max, sans doublons).

**Prérequis** : au moins un livre dans `public.books` et des lignes dans `public.users` (souvent créées par le trigger à l’inscription).

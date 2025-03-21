# Koach Books - Application de lecture gamifiée

Koach Books est une application mobile qui transforme la lecture en une expérience d'apprentissage engageante et personnalisée grâce à la gamification. Inspirée par des applications comme Duolingo, Koach encourage les utilisateurs à maintenir des habitudes de lecture régulières tout en suivant leurs progrès et en gagnant des récompenses.

## Fonctionnalités principales

- **Bibliothèque personnalisée**: Ajoutez et organisez vos livres.
- **Plans de lecture**: Créez des programmes de lecture adaptés à votre emploi du temps.
- **Gamification**: Gagnez des badges et des points Koach pour chaque session de lecture.
- **Suivi des progrès**: Visualisez vos statistiques de lecture avec des graphiques détaillés.
- **Fonctionnalités sociales**: Participez à des défis, suivez vos amis et comparez vos progrès.

## Prérequis

- Node.js (v18 ou supérieur)
- Expo CLI (`npm install -g expo-cli`)
- Expo Go sur [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) ou [iOS](https://apps.apple.com/app/expo-go/id982107779)
- PostgreSQL (pour le développement local)

## Exécuter l'application sur votre appareil mobile

### 1. Cloner et configurer le projet

```bash
# Cloner le dépôt
git clone https://github.com/votre-username/koach-books.git
cd koach-books

# Installer les dépendances
npm install
```

### 2. Configuration de la base de données

Créez un fichier `.env` à la racine du projet et ajoutez les informations de connexion à votre base de données PostgreSQL:

```env
DATABASE_URL=postgres://username:password@localhost:5432/koach_books
```

### 3. Démarrer le serveur backend

```bash
cd server
npm run dev
```

Le serveur backend sera accessible à l'adresse `http://localhost:5000`.

### 4. Démarrer l'application Expo

Dans un autre terminal:

```bash
cd client
npx expo start
```

### 5. Se connecter depuis votre appareil mobile

Une fois que l'application Expo est en cours d'exécution, vous verrez un QR code dans le terminal. Pour vous connecter:

- **Sur Android**: Ouvrez l'application Expo Go et scannez le QR code
- **Sur iOS**: Scannez le QR code avec l'appareil photo de votre iPhone, puis appuyez sur la notification qui apparaît

## Mode développement sans serveur

L'application peut fonctionner en mode "mock" lorsque le serveur n'est pas disponible. Pour cela, modifiez le fichier `client/src/utils/api.ts` et définissez `USE_MOCK_API = true`.

## Structure du projet

- `client/` - Application frontend (React Native + Expo)
- `server/` - API backend (Node.js + TypeScript)
- `shared/` - Types et schémas partagés entre le client et le serveur

## Technologies utilisées

- **Frontend**: React Native, Expo, TypeScript, Redux
- **Backend**: Node.js, TypeScript, PostgreSQL
- **ORM**: Drizzle ORM
- **UI**: React Native Paper, React Native Vector Icons

## Contribuer au projet

1. Créez une branche pour votre fonctionnalité
2. Effectuez vos modifications
3. Soumettez une pull request

## Licence

MIT
# 🎯 Révise tes Tables de Multiplication

Application interactive et ludique pour réviser les tables de multiplication, avec reconnaissance vocale en français !

## 🌐 Démo en ligne

🚀 **[Essayer l'application](https://chtitux.github.io/revise-tables/)**

## ✨ Fonctionnalités

- 🔢 **Questions aléatoires** : Multiplications entre 1 et 10
- 🎤 **Reconnaissance vocale** : Réponds avec ta voix en français !
- 🎨 **Design coloré et ludique** : Interface adaptée aux enfants
- 🎉 **Animations sympas** : Emojis animés pour chaque bonne réponse
- 📊 **Compteur de score** : Suis ta progression sur 10 questions
- 🏆 **Célébration spéciale** : Animation festive quand tu atteins 10/10 !
- 🔄 **Conversion intelligente** : Reconnaît les nombres en français ("vingt-cinq" → 25)

## 🎮 Comment jouer

1. **Lis la multiplication** affichée (ex: 7 × 8 = ?)
2. **Réponds de 3 façons** :
   - Tape le nombre au clavier
   - Clique sur 🎤 et dis le nombre à voix haute
   - Tape le nombre en lettres (ex: "cinquante-six")
3. **Valide ta réponse** en cliquant sur "Vérifier ✓"
4. **Bonne réponse** 🎉 : Un emoji rigolo s'anime et tu passes à la question suivante
5. **Mauvaise réponse** ❌ : Le formulaire se réinitialise, réessaie !
6. **Atteins 10/10** 🏆 : Une super animation de célébration t'attend !

## 🛠️ Technologies utilisées

- **React** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Vite** - Build tool ultra-rapide
- **TailwindCSS** - Framework CSS utilitaire
- **Web Speech API** - Reconnaissance vocale native du navigateur
- **GitHub Actions** - Déploiement automatique sur GitHub Pages

## 🚀 Installation locale

```bash
# Cloner le projet
git clone https://github.com/chtitux/revise-tables.git
cd revise-tables

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Build pour production
npm run build
```

## 📝 Scripts disponibles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Compile l'application pour production
- `npm run preview` - Prévisualise le build de production
- `npm run lint` - Vérifie la qualité du code

## 🎯 Fonctionnalités détaillées

### Reconnaissance vocale
L'application utilise l'API Web Speech Recognition pour convertir la voix en texte. Compatible avec les navigateurs modernes (Chrome, Edge, Safari).

### Conversion français → nombre
Parser intelligent qui reconnaît :
- Les nombres écrits avec ou sans tirets : "vingt cinq", "vingt-cinq"
- Les variations régionales : "septante", "huitante", "nonante"
- Les nombres composés : "quatre-vingt-dix-sept"
- Les nombres directs : "42", "100"

### Système de validation
- ✅ **Bonne réponse** : Emoji aléatoire + animation bounce + nouvelle question
- ❌ **Mauvaise réponse** : Emoji croix + animation shake + réinitialisation (1.5s)
- ⚠️ **Entrée invalide** : Message d'erreur + réinitialisation (3s)

### Célébration 10/10
Quand le joueur atteint 10 bonnes réponses :
- Pluie d'emojis festifs animés
- Message de félicitations
- Redémarrage automatique après 5 secondes

## 🎨 Design et UX

- Police ludique et grande pour faciliter la lecture
- Couleurs vives et dégradés attractifs
- Boutons larges et accessibles
- Feedback visuel immédiat
- Responsive design (mobile, tablette, desktop)

## 📦 Déploiement

L'application est déployée automatiquement sur GitHub Pages via GitHub Actions à chaque push sur la branche `main` ou `master`.

## 📄 Licence

MIT

## 👨‍💻 Prompt de création

Cette application a été créée avec le prompt suivant :

> crée une application avec React vite Typescript tailwindcss.
> l'application est déployée avec GitHub actions sur GitHub pages avec un relative path de ./ parce qu'il sera sur un sous répertoire de GitHub pages.
> l'application permet de réviser les tables de multiplication.
> l'application affiche une multiplication (entre 1 et 10 pour chaque côté).
> l'utilisateur doit entrer le résultat. il est aussi possible d'appuyer sur un bouton pour lancer le text to speech.
> les mots détectés sont affichés puis transformer en nombre dans le input.
> si aucun nombre n'est détecté, un message "Ceci n'est pas un nombre" est affiché et le formulaire est remis à zéro
> l'application vérifie si le nombre correspond au résultat attendu. tout est fait en français.
> quand le résultat est bon, un emoji rigolo s'affiche et s'anime puis une autre multiplication est affichée.
> si le résultat n'est pas correct, un emoji ❌ s'affiche, puis le formulaire est remis à zéro.
> un compteur de bonnes réponses est toujours affiché.
> quand 10 bonnes réponses sont données, une animation avec beaucoup d'emojis rigolos est affichée, puis le jeu repart de zéro.
> Un fichier readme décrit le projet et ajoute un lien vers le GitHub pages. ajoute le prompt actuel dans une partie dédiée.

---

Fait avec ❤️ pour apprendre les tables en s'amusant !

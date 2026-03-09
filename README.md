---

# 🪙 CryptoDash : L'Expertise de Conversion en Temps Réel

**CryptoDash** est une application web de conversion de devises ultra-performante conçue avec **Next.js 14**. Bien plus qu'un simple convertisseur, elle combine une esthétique de dashboard "Premium Widget" avec une logique mathématique de taux croisés (Cross-rates) via l'API CoinGecko.

## ✨ Fonctionnalités Clés

* **⚡ Conversion Universelle :** Support de plus de 150 monnaies (Fiat & Crypto) avec calcul de taux croisés automatiques.
* **📊 Graphique Interactif :** Courbe de performance épurée avec affichage des dates et prix précis au survol (Tooltip dynamique).
* **🧠 Logique de Debouncing :** Optimisation des appels API (600ms) pour économiser la bande passante et éviter les limites de débit (Rate Limiting).
* **🔄 Inversion Instantanée :** Bouton de swap fluide pour inverser les devises source et cible.
* **📱 Design "Aesthetic" :** Interface inspirée des dashboards financiers modernes (Coins arrondis, Glassmorphism, Dark Mode natif).
* **📈 Analyse de Tendance :** Indicateur visuel (Vert/Rouge) basé sur la pente de la courbe de performance.

## 🛠️ Stack Technique

* **Framework :** [Next.js 14](https://nextjs.org/) (App Router)
* **Graphiques :** [ApexCharts](https://apexcharts.com/) (Rendu dynamique côté client)
* **Styles :** [Tailwind CSS](https://tailwindcss.com/)
* **Icons :** [Lucide React](https://lucide.dev/)
* **API :** [CoinGecko API v3](https://www.coingecko.com/en/api)

## 🏗️ Architecture & Expertise

Pour ce projet, j'ai implémenté plusieurs concepts avancés de développement Fullstack :

1. **Gestion du SSR (Server-Side Rendering) :** Utilisation d'imports dynamiques pour les bibliothèques dépendantes de l'objet `window` (ApexCharts).
2. **Calcul de Taux Croisés :** Comme l'API ne fournit pas l'historique de toutes les paires fiduciaires (ex: EUR/THB), le moteur calcule le ratio en temps réel en utilisant le Bitcoin comme pivot mathématique.
3. **Optimisation des Performances :** Utilisation de `useMemo` pour les calculs de conversion afin d'éviter les re-rendus inutiles et de `useCallback` pour les fonctions de mise à jour.
4. **Debouncing :** Implémentation d'un timer sur le `useEffect` pour ne déclencher les appels historiques qu'après une pause dans la saisie de l'utilisateur.

## 🚀 Installation & Utilisation
1. Clonez le dépôt : `git clone https://github.com/votre-nom/crypto-dash.git`
2. Installez les dépendances : `npm install`
3. Lancez le serveur de développement : `npm run dev`
4. Ouvrez [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) dans votre navigateur.

---

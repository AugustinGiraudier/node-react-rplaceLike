<p align="center">
<img alt="DataHub" src="https://play-lh.googleusercontent.com/KbH8-m6-mNI8UOiFnzlnggxcaSUoH-zO94uzjsYdlU6eqgLnjs3nPIuCy0OWftVNffs" height="160px" />
</p>
<h1 align="center"> 🎨 RPlaceLike </h1>

---

## 📝 Introduction

C'est un projet mono-repo pour le projet PixelBoard MBDS 2025. Il contient les packages suivants:
- `client`: le frontend du projet
- `api`: le backend du projet

## 📍 Installation

Pour démarrer le projet, vous devez exécuter les commandes suivantes dans le répertoire racine du projet (dans deux terminaux séparés) :

*installer les dépendances 💻*
```sh
yarn install
```

*Lancer la base de données Mongo 🥭*
```sh
docker compose up -d
```

*Lancer l'API backend 🔌*
```sh
yarn start:api
```

*Lancer le client React 🎨*
```sh
yarn start:client
```

rendez vous sur le lien de développement : http://localhost:5173/

## 🚀 Déploiement

**Lien de l'application déployée** : [RPlaceLike](https://moustik.dev/)

## 🌟 Bonus ajoutés

**Fonctionnalités supplémentaires réalisées dans le projet** :
- 🔄 **WebSockets** pour visualiser en temps réel le dessin
- 🌡 **Heatmap** des zones les plus utilisées backend
- 📷 **Replay** des pixelBoards
- ☁️ **Déploiement** de l'application sur un serveur en ligne
- 😎 **Export** un pixelboard SVG ou PNG

## ✍️ Auteurs & contributions


👤 **BOUSSIK Khalil** | GitHub: [@GearzYs](https://github.com/GearzYs)

* Modèle de données (Statistiques utilisateurs)
* Authentification Jwt
* Page Profile
* Page PixelBoard (tooltips des pixels)

👤 **ESCOBAR Quentin** | GitHub: [@Moustik06](https://github.com/Moustik06) | LinkedIn: [@Quentin_ESCOBAR](https://fr.linkedin.com/in/quentin-escobar-78a544302)

* Modèle de données (Boards - Chunks - Regions)
* Websockets
* Hébergement & déploiement de la production
* Page Admin pannel
* Page PixelBoard (zoom - drag)
* Images de preview des boards

👤 **GIRAUDIER Augustin** | GitHub: [@GIRAUDIERAugustin](https://github.com/AugustinGiraudier) | LinkedIn: [@Augustin_GIRAUDIER](https://fr.linkedin.com/in/augustin-giraudier)

* Modèle de données (Boards - Heatmap - replay)
* Middlewares de sécurisation des routes
* Page Heatmap
* Page Replay

👤 **VALLEIX Benjamin** | GitHub: [@B3njaminV](https://github.com/B3njaminV) | LinkedIn: [@Benjamin VALLEIX](https://www.linkedin.com/in/benjamin-valleix-27115719a)

* Modèle de données (Statistiques utilisateurs)
* Composants de navigation
* Page Home
* Page Admin pannel
* Page Profile
* Page Register/Login
* Page PixelBoard (Export Png/Svg) 

👤 **WAUQUIER Guillaume** | GitHub: [@Guille-wo](https://github.com/Guille-wo)

* Modèle de données (tooltips des pixel)
* Composants de navigation
* Page PixelBoard (canvas & couleurs)
* Themes clair et dark

## 🛠  Languages et Outils

<p> 
    <a href="https://docs.microsoft.com/en-us/dotnet/csharp/" target="_blank"> 
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png" alt="csharp" width="60" height="60"/> 
    </a>
    <a href="https://fr.reactjs.org/" target="_blank"> 
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Node.js_logo.svg/1280px-Node.js_logo.svg.png" alt="react" width="100" height="60"/>
    </a>
    <a href="https://nodejs.org/en/" target="_blank"> 
        <img src="https://cdn.iconscout.com/icon/free/png-256/free-mongodb-5-1175140.png?f=webp&w=256" alt="nodejs" width="60" height="60"/>
    </a>
</p>

## 📝 License

📜 **Copyright © 2025**


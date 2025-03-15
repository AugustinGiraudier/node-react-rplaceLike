<p align="center">
<img alt="DataHub" src="https://images.seeklogo.com/logo-png/43/2/reddit-r-place-logo-png_seeklogo-437003.png" height="160px" />
</p>
<h1 align="center"> RPlaceLike </h1>

---

## 📝 Introduction

C'est un projet mono-repo pour le projet PixelBoard MBDS 2025. Il contient les packages suivants:
- `client`: le frontend du projet
- `api`: le backend du projet

Vous pouvez utiliser ce squelette pour démarrer votre projet.
Vous devez éditer le fichier package.json racine :
- remplacez la propriété name (remplacez xxxx par la première lettre de chaque membre de votre groupe)
- définissez le dépôt en définissant l'URL de votre projet

## 📍 Installation

Pour démarrer le projet, vous devez exécuter les commandes suivantes dans le répertoire racine du projet (dans deux terminaux séparés) :
``` js
yarn start:client 
```


## 📍 Prérequis pour la compilation

Pour commencez le projet, vous devez exécuter les commandes suivantes dans le répertoire racine du projet (dans deux terminaux séparés) :
``` js
yarn start:client 
```

*appelle le script start dans ./packages/client package.json (pour démarrer le client react)*  

``` js
yarn start:api 
```

*appelle le script start dans ./packages/api package.json (pour démarrer l'api)*

## 🚀 Ajout des librairies

Si vous voulez ajouter une librairie, vous pouvez utiliser les commandes suivantes (dans le répertoire racine du projet) :
``` js
yarn workspace <client|api> add <package-name> 
```
Par exemple pour ajouter `express` au package api vous pouvez exécuter :
``` js
yarn workspace api add express
```

Par exemple pour ajouter une librairie pour devDependencies au package client vous pouvez exécuter :
``` js
yarn workspace client add -D <package-name>
```



## ✍️ Auteurs

👤 **VALLEIX Benjamin**

* GitHub: [@B3njaminV](https://github.com/B3njaminV)
* LinkedIn: [@Benjamin VALLEIX](https://www.linkedin.com/in/benjamin-valleix-27115719a)

👤 **GIRAUDIER Augustin**

* GitHub: [@GIRAUDIERAugustin](https://github.com/AugustinGiraudier)
* LinkedIn: [@Augustin_GIRAUDIER](https://fr.linkedin.com/in/augustin-giraudier)

👤 **ESCOBAR Quentin**

* GitHub: [@Moustik06](https://github.com/Moustik06)
* LinkedIn: [@Quentin_ESCOBAR](https://fr.linkedin.com/in/quentin-escobar-78a544302)

👤 **WAUQUIER Guillaume**

* GitHub: [@Guille-wo](https://github.com/Guille-wo)

👤 **BOUSSIK Khalil**

* GitHub: [@GearzYs](https://github.com/GearzYs)

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

Copyright © 2025


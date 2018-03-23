# Projet Fidlink Mobile

Application mobile dont le but est de permettre aux utilisateurs du programme Fidlink de rassembler la gestion de leurs cartes.

# Liste des plugins utilises 

* com.phonegap.plugins.barcodescanner 6.0.5 "BarcodeScanner"
* cordova-plugin-android-permissions 0.11.0 "Permissions"
* cordova-plugin-app-version 0.1.9 "AppVersion"
* cordova-plugin-compat 1.1.0 "Compat"
* cordova-plugin-device 1.1.5 "Device"
* cordova-plugin-geolocation 2.4.2 "Geolocation"
* cordova-plugin-splashscreen 4.0.2 "Splashscreen"
* cordova-plugin-whitelist 1.3.2 "Whitelist"
* cordova-plugin-firebase    "communication push" (https://github.com/arnesson/cordova-plugin-firebase)

#Special MONACA <!> a modifier avant d'essayer de compiler la release <!>

Package name : 

* Android : com.novatec.fidlink
* IOS : com.novatec.fidlink

# Version de cordova => 7.0.0

* Penser a ajouter au path gradle (depuis l'installation d'android studio)

# Important 

## ADB
* => https://www.howtogeek.com/125769/how-to-install-and-use-abd-the-android-debug-bridge-utility/
* => http://ourcodeworld.com/articles/read/48/how-to-debug-a-cordova-app-on-your-device-with-google-chrome (seulement android >=4.4)
* => https://developer.android.com/studio/command-line/adb.html

## Le Pb de webview sous Android 4.3 et en dessous
=> https://neilsteventon.wordpress.com/2015/03/31/cordova-webview-issues-android-4-3-x-and-below-pre-kit-kat/
=> http://stackoverflow.com/questions/20880037/webview-causing-errors-on-second-activity

##ONSEN, ANGULAR, BOOTSTRAP
=> https://onsen.io/getting-started/#npm
npm install onsenui
npm install angular
npm install bootstrap@3

En cas de mise a jour d'onsen, penser a recopier le repertoire node_modules/onsenui dans le repertoire www/mods/onsenui
Idem pour le repertoire angular
Idem pour le repertoire bootstrap

=> Sinon possibilité de passer par un CDN, ça va alléger l'appli (https://cdnjs.com/libraries/onsen)

/** TRIGGERS UTILISES SUR LA PAGE PRINCIPALE * */
function onDeviceReady() {
	// Populate device info
	populateDevice();
	// For geolocation
	updateGeoPosition();
	// App version
	updateNumVers();
	// for push comm
	ecouterPushNotification();
    //Forcer le chargement du tab courant <!>Uniquement si pas page carte <!>
	setTimeout(function(){
		tabLoad(true);
	},1000);
    // Show version
	if (GLOBAL_appParams.showVersion) {
		versionOn();
		setTimeout(versionOff, 6000);
	}
	logDebug("################# DEVICE IS READY");
}

function switchEnvTrigger() {
	logDebug("[CHEAT] Cheat code, il manque "
			+ (10 - GLOBAL_appParams.switch_env_cpt) + " clics ");
	if (GLOBAL_appParams.switch_env_cpt == 10) {
		if (GLOBAL_appParams.current_env == "dev") {
			switchTo("prod");
		} else {
			switchTo("dev");
		}
	} else {
		GLOBAL_appParams.switch_env_cpt++;
	}
}

function updateNumVers() {
	// Plugin : https://github.com/whiteoctober/cordova-plugin-app-version
	$("#numvers").html("v" + GLOBAL_appVersion);
	// <!> Not supported on browser platform <!>
	// Activable only if cordova-plugin-app-version is added
	if (typeof cordova != "undefined"
			&& typeof cordova.getAppVersion != "undefined") {
		cordova.getAppVersion.getVersionNumber(function(version) {
			GLOBAL_appVersion = version;
			logDebug("NUMERO DE VERSION : " + GLOBAL_appVersion);
			$("#numvers").html("v" + GLOBAL_appVersion);
		});
	}

	// Attrapper l'année
	var d = new Date();
	$("#yearvers").html(d.getUTCFullYear());
}

function keyTrigger(event) {
	// https://developer.mozilla.org/fr/docs/Web/API/KeyboardEvent
	// Problème rencontré similaire à ici :
	// http://stackoverflow.com/questions/13913834/weird-issue-with-phonegap-2-2-predictive-text-and-input-type-text-on-android
	// Solution possible : https://www.npmjs.com/package/cordova-plugin-keyboard
	logDebug("key:" + event.key + " " + event.charCode);
	var elem = document.activeElement;
	logDebug($(elem).prop('nodeName') + " X" + $(elem).val() + "X ");
	logDebug($(elem).html());
	// logDebug(event);
}



/**
 * https://onsen.io/v2/api/js/ons-pull-hook.html Permet de capter le scrolldown
 * DEPRECATED
 */
function pullHookTrigger(event) {
	// logDebug("[PULL HOOK] Element avec le focus
	// :"+$(":focus").attr("class"));
	// logDebug("[PULL HOOK] Position du curseur :");
	// logDebug($("#enseignes_body table").position());
	// logDebug(event);
	var mgL = $(document).width() / 2 - 25;
	var mgH = $(document).height() * 0.25;
	// Si aucun élément n'a le focus au moment du déclenchement du hook
	// Contournement pour éviter les désagréments lors de la descente de liste
	// Pour GLOBAL_yPos, peuplé au dragstart, voir index.html
	if (GLOBAL_yPos < mgH) {
		// logDebug("[PULL HOOK] Pull hook D" + event.pullHook.pullDistance+"px
		// + start point :"+ GLOBAL_yPos+" vs mgH"+ mgH);
		$("#pull-hook").removeClass("hidden")
		var message = "";
		switch (event.state) {
		case 'initial':
			// message= "<i class=\"fa fa-arrow-down\"
			// aria-hidden=\"true\"></i>&nbsp;&nbsp;Tirez pour recharger";
			// $("#pull-hook").attr("class","");
			// break;
		case 'preaction':

			message = "<span class=\"preload\" style=\"margin-left:" + mgL
					+ "px\"></span>";
			$("#pull-hook").attr("class", "in-load");
			break;
		case 'action':
			var mgL = $(document).width() / 2 - 25;
			logDebug("[PULL HOOK] Pull hook triggered :" + event.state
					+ " current tab " + appTab.getActiveTabIndex() + " margin "
					+ mgL);
			message = "<span class=\"loading\" style=\"margin-left:" + mgL
					+ "px\"></span>";
			$("#pull-hook").attr("class", "in-load");
			// Rechargement du tab
			setTimeout(function() {
				tabLoad(true);
			}, 200);
			break;
		}
		$("#pull-hook").html(message);
	} else {
		// Parce qu'en fait, ben on le voit quand même...
		$("#pull-hook").addClass("hidden");
	}
}

/**
 * Se déclenche lors d'un appui sur le bouton back
 */
function backButtonCallback(event) {
	logDebug("[BACK] Catchin callback ");
	try {
		logDebug("[BACK] Pop page ");
		appNav.popPage();
	} catch (err) {
		logDebug("[BACK] Empty page stack ");
		logDebug("[BACK] Default callback action ");
		dialogBox("Quitter Fidlink", "Voulez vous quitter l'application ?",
				"exit-app", "Oui", "Non", function() {
					appNav.app.exitApp(); // Close the app
				}, pullHookTrigger, 1, 0);
	}
}

/**
 * Se déclenche lorsque le keyboard numérique est montré
 */
function keyBoardShow() {
	logDebug("[KEYBOARD] Show");
	appTab.set("animation", "fade");
	appTab.set("hide-tabs", true);
}

/**
 * Se déclenche lorsque le clavier numérique est caché
 */
function keyBoardHide() {
	logDebug("[KEYBOARD] Hide");
	appTab.set("animation", "fade");
	appTab.set("hide-tabs", false);
}

function numCardTrigger() {
	var numCarte = $("#numCarte").val().replace(" ", "");
	logDebug("Numero de carte: " + numCarte);
}

/**
 * TRIGGER DE CHANGEMENT DE TAB
 */
function appTabTrigger() {
	tabLoad(false);
}
/** TRIGGERS UTILISES SUR LA PAGE PRINCIPALE * */
function tabLoad(force_refresh) {

	if (!force_refresh) {
		logDebug("Trigger changement tab => Active tab "
				+ appTab.getActiveTabIndex());
	} else {
		loadRefreshOn();
		logDebug("[FORCE REFRESH]=> Active tab " + appTab.getActiveTabIndex())
	}

	// Send Trace to eurofid to update device info
	var infos = {
		"os" : GLOBAL_device.os,
		"version" : GLOBAL_device.version,
		"model" : GLOBAL_device.model,
		"serial" : GLOBAL_device.serial,
		"push_token" : GLOBAL_device.push_token
	};
	if (GLOBAL_cardList.length > 0)
		infos["cardList"] = GLOBAL_cardList;

	if (GLOBAL_userData != null)
		infos["user"] = GLOBAL_userData;

	trace("update", JSON.stringify(infos));
	// End send trace
	
	//Par défaut, montrer le bouton refresh
	showRefresh();
	
	//Mettre à jour le page header
	$("#page-header").html("");
	//Adaptations visuelles à la volée
	switch(GLOBAL_device.os){
	case "iOS":
		//Bande du haut pour logo
		$(".toolbar").attr("style","background-size: auto 68% !important; background-position: center 15px !important;");
		break;
	//Android and default (undefined)
	default:
		$(".toolbar").attr("style","");
		break;
	}
	
	switch (appTab.getActiveTabIndex()) {
	case 0:
		//Cacher le bouton refresh par défaut
		hideRefresh();
		// Onglet mes cartes
		var reloadCards = GLOBAL_appParams.autoReloadCards;
		if (!GLOBAL_autoLogInProgress) {
			if (GLOBAL_userData != null) {
				if (reloadCards || force_refresh) {
					if (!force_refresh)
						loaderOn();
					else
						//pullHookOn();
						showRefresh();

					setTimeout(function() {
						logDebug("Load cards");
						// Timeout pour permettre que le popPage s'exécute
						loadPage({
							destination : 'consulter',
							credentials : true,
							local : true,
							divId : "#mescartes-body"
						});
					}, 500);
				} else {
					// Page déjà chargée
					// loaderOff();
					showRefresh();
				}
			} else {
				if ($("#login-form").attr("class") == "hidden") {
					if (!force_refresh)
						loaderOn();
					else
						pullHookOn();

					setTimeout(function() {
						// Charger la page de login en page principale
						loadPage({
							destination : 'login',
							withCredentials : false,
							local : true,
							divId : '#mescartes-content'
						});
					}, 500);
				} else {
					// Si déjà chargée
					// loaderOff();
				}
			}
		}
		break;
	// Onglet Bon plans
	case 1:
		var reloadBP = false;
		// METHODE CTOOLS REPO
		// Commenter pour provoquer le rechargement à chaque touche de l'onglet
		if (GLOBAL_appParams.autoReloadBonplans
				|| $("#bonplan-frame").attr("src").length == 0 || force_refresh) {
			reloadBP = true;
		}

		if (reloadBP) {
			if (!force_refresh)
				loaderOn();
			else
				pullHookOn();

			setTimeout(function() {
				// Dans openCartAPI.js L1658
				loadCToolsDir();
			}, 500);

		}

		break;
	// Scan Barcode
	case 2:
		hideRefresh();
		break;

	case 3:
		// Enseignes
		//Adaptations visuelles à la volée
		switch(GLOBAL_device.os){
		case "iOS":
			//Bande du haut pour logo
			$("ons-toolbar").attr("style","height:100px !important; background-size: auto 34%; background-position: center 15px !important;");
			break;
		//Android and default (undefined)
		default:
			$("ons-toolbar").attr("style","height:100px !important; background-size: auto 60%;");
			break;
		}
		
		//Ajout header enseigne
		$("#page-header").html("<div id=\"enseignes-header\"> <div class=\"row\"><div class=\"col-xs-9\"><ons-search-input placeholder=\"Rechercher par nom ou par activité\" onkeyup=\"searchEnseignes(($(this).val()))\"></ons-search-input></div>"+
           "<div class=\"col-xs-2\"><ons-fab modifier=\"geo-arround\" onclick=\"loaderOn();appNav.pushPage('geolocation');setTimeout(initMap,500);\"><ons-icon icon=\"fa-street-view\"></ons-icon></ons-fab></div>"+
           "</div></div>");
		
		if (!force_refresh)
			loaderOn();
		else
			pullHookOn();
		if(typeof $("#enseignes-content").html() !== "undefined"){
		var ensContent = $("#enseignes-content").html().trim();
			//logDebug("X"+ensContent+"X");
			if (ensContent.length < 40 || force_refresh) {
				loadPage({
					destination : 'enseignes',
					credentials : false,
					local : true,
					divId : '#enseignes-content'
				});
			} else {
				loaderOff();
			}
		}
		break;
	// Mon compte
	case 4:
		//Cacher le bouton refresh
		hideRefresh();
		if (!GLOBAL_autoLogInProgress) {
			if (!force_refresh)
				loaderOn();
			else
				pullHookOn();

			if (GLOBAL_reloadAccountPage) {
				loaderOn();
				setTimeout(function() {

					if (GLOBAL_loginRes.success) {
						loadPage({
							destination : 'profile',
							credentials : true,
							local : true,
							divId : '#compte-content',
							loadComplete : loaderOff
						});
					} else {
						loadPage({
							destination : 'register',
							credentials : false,
							force_logout : true,
							local : true,
							divId : '#compte-content',
							loadComplete : loaderOff
						});
					}
					GLOBAL_reloadAccountPage = false;
				}, 500);
			} else {
				loaderOff();
			}
		}
		break;

	default:
		// logDebug("TABCHANGE:"+appTab.getActiveTabIndex());
		break;
	}
	
}

function initTrigger(event) {
	var page = event.target;
	// https://github.com/angular/angular.js/issues/7981
	// logDebug("Trigger init => evenement angular "+page.ng339);
	try {
		if (page.matches('#login-page')) {
			// Déclencher le chargement des informations de login
			// loadLogin('2');
		}
		if (page.matches('#main-page')) {
			// Déclencher l'autoLogin
			loaderOn();
			// A commenter si silentLogin activé
			// Chargement du formulaire de login
			// setTimeout(function(){loadPage({destination:'login',
			// credentials:false, local:true,
			// divId:'#mescartes-content'})},500);
			// Déclencher le chargement des enseignes
			loadPage({
				destination : 'enseignes',
				credentials : false,
				local : true,
				divId : '#enseignes-content'
			});
		}
	} catch (e) {
		// Versions d'android antérieures à la 5.0
		if (e.name == 'TypeError') {
			logDebug("[ATTENTION] Votre version d'android ou d'Ios peut présenter des incompatibilités avec l'application ");
			logDebug("[ATTENTION] Silent Login indisponible");
			logDebug("[ATTENTION] Tentative de chargement des credentials");
			loaderOn();
			if (page.ng339 == 16) {
				logDebug("[ATTENTION] Chargement pages");
				setTimeout(function() {
					loadPage({
						destination : 'login',
						credentials : false,
						local : true,
						divId : '#mescartes-content'
					})
				}, 500);
				$("#login-msg").attr("class", "danger bg-danger");
				$("#login-msg")
						.html(
								"Attention, votre système n'est pas pleinement compatible avec l'application.");
				// Déclencher le chargement des enseignes
				loadPage({
					destination : 'enseignes',
					credentials : false,
					local : true,
					divId : '#enseignes-content'
				});
			} else {
			}
			return -1;
		}
	}
}

function keyTrigger(event) {
	// https://developer.mozilla.org/fr/docs/Web/API/KeyboardEvent
	// Problème rencontré similaire à ici :
	// http://stackoverflow.com/questions/13913834/weird-issue-with-phonegap-2-2-predictive-text-and-input-type-text-on-android
	// Solution possible : https://www.npmjs.com/package/cordova-plugin-keyboard
	logDebug("key:" + event.key + " " + event.charCode);
	var elem = document.activeElement;
	logDebug($(elem).prop('nodeName') + " X" + $(elem).val() + "X ");
	logDebug($(elem).html());
	// logDebug(event);
}

/**
 * Se déclenche lorsque le keyboard numérique est montré
 */
function keyBoardShow() {
	logDebug("[KEYBOARD] Show");
	appTab.set("animation", "fade");
	appTab.set("hide-tabs", true);
}

/**
 * Se déclenche lorsque le clavier numérique est caché
 */
function keyBoardHide() {
	logDebug("[KEYBOARD] Hide");
	appTab.set("animation", "fade");
	appTab.set("hide-tabs", false);
}

function numCardTrigger() {
	var numCarte = $("#numCarte").val().replace(" ", "");
	logDebug("Numero de carte: " + numCarte);
}

/**
 * Fonction utilisée pour les boites de dialogue
 * 
 * @param tit:
 *            titre de la fenêtre
 * @param msg:
 *            message à passer (raw text)
 * @param mod:
 *            nom de la classe de style à apposer,
 * @param okLabel:
 *            label du bouton OK
 * @param okCallback :
 *            function de callBack pour le cas où l'utilisateur clique sur OK
 * @param cancelCallback :
 *            function de callBack pour le cas où l'utilisateur clique sur OK
 */
function dialogBox(tit, msg, mod, okLabel, okCallback, cancelCallback, argOK,
		argCancel) {
	ons.notification.confirm({
		title : tit,
		message : msg,
		modifier : mod,
		buttonLabels : [ "Annuler", okLabel ],
		callback : function(idx) {
			switch (idx) {
			case 0:
				// En cas d'appui sur Cancel
				if (typeof cancelCallback != 'undefined'
						&& cancelCallBack != null)
					cancelCallback(argCancel);
				break;
			case 1:
				// En cas d'appui sur OK
				if (typeof okCallback != 'undefined')
					okCallback(argOK);
				break;
			}
		}
	});
}

/**
 * La même chose, mais avec les alertes uniquement
 */
function alertBox(tit, msg, mod, okLabel) {
	ons.notification.alert({
		title : tit,
		message : msg,
		modifier : mod,
		buttonLabel : okLabel
	});
}

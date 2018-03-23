/**
 * FONCTIONNALITES DE LOGIN/ACCES <=> OPENCART
 * Repose sur l'API REST de openCart
 * => http://opencartoauth.opencart-api.com/schema_v2.0_oauth
 * => http://sv2109.com/en/article/opencart-api-system (API native)
 * => https://isenselabs.com/posts/using-the-new-api-methods-of-opencart-2x
 * => Voir également le répertoire controller/api de l'installation openCart cible
 * ==> https://github.com/opencart/opencart/tree/master/upload/catalog/controller/api
 * ==> https://forum.opencart.com/viewtopic.php?f=190&t=170990&hilit=api%2Fcustomer%2Flogin
 */


/**
 * Fonction qui vérifie si l'appli est toujours connectée
 * 
 * @param reLog
 *            true|false reconnecte si true et que session expirée
 * @return boolean true|false Renvoie vrai si l'utilisateur est connecté
 */
function checkLogin(reLog) {
	var isLogged = false;
	// Dans le cas d'openCart, on fait appel à la route account/login.
	// Si l'utilisateur est connecté => renvoie sur la page compte personnel
	// Sinon => renvoie sur le formulaire de login
	var destURL = GLOBAL_serverBase + "index.php?route=account/login&m=1";
	var opts = {
		url : destURL,
		crossDomain : true,
		context : this,
		async : false,
		xhrFields : {
			withCredentials : true
		},
		dataType : "html",
		type : 'GET',
		timeout : GLOBAL_appParams.reqTimeout,
		success : function(data) {
			var pTitle = $(data).find("h1.heading-title").html();
			if (pTitle === "Consulter mon solde") {
				// logDebug("pTitle :"+pTitle);
				// L'user est connecté
				isLogged = true;
			} else {
				isLogged = false;
			}

		},
		error : function(req, textStatus, errorThrown) {
			onReqErr("checkLogin",req,textStatus);
			isLogged = false;
		},
	};
	$.ajax(opts);

	if (isLogged) {
		logDebug("Session still active !");
		if (!reLog) {
			// Deconnect user
			var destURL = GLOBAL_serverBase
					+ "index.php?route=account/logout&m=1";
			var opts = {
				url : destURL,
				crossDomain : true,
				async : false,
				xhrFields : {
					withCredentials : true
				},
				dataType : "html",
				type : 'GET',
				timeout : GLOBAL_appParams.reqTimeout,
				success : function(data) {
					logDebug("USER LOGGED OUT");
				},
				error : function(req, textStatus, error) {
					logDebug("ERROR WHEN LOGGING OUT:" + destURL);
					logDebug(error);
					logDebug(req.responseText + " " + req.responseXML);
				},
			};
			$.ajax(opts);
		}
	} else {
		logDebug("Session expired");
		// Relog user with last known credentials
		if (reLog) {

		}
	}

	return isLogged;
}

function loginF(username, password, postFunction) {
	var loginURL = GLOBAL_serverBase + "index.php?route=account/login&m=1";
	var loginArr = {
		"email" : username,
		"password" : password
	};
	var loginData = new FormData();
	$.each(loginArr, function(key, value) {
		loginData.append(key, value);
	});
	// logDebug(loginData);

	var opts = {
		url : loginURL,
		data : loginData,
		// async:false,
		cache : false,
		xhrFields : {
			withCredentials : true
		},
		contentType : false,
		processData : false,
		type : 'POST',
		timeout : GLOBAL_appParams.reqTimeout,
		success : function(data) {
			// Le code réponse est 302 ou 200
			// logDebug(data);
			GLOBAL_autoLogInProgress = false;
			GLOBAL_reloadAccountPage=true;
			if (($(data).find("#mobile-content .alert")).length > 0
					&& $(data).find("#mobile-content .login-wrap").length > 0) {
				// La connexion s'est mal passée
				logDebug("LOGIN: Echec de connexion");
				GLOBAL_loginRes.success = false;
				GLOBAL_loginRes.msg = $(data).find("#mobile-content .alert").html();
				GLOBAL_isLogged = false;
			} else {
				logDebug("LOGIN: Connexion OK");
				GLOBAL_loginRes.success = true;
				GLOBAL_loginRes.msg = "Authentification réalisée avec succès";
				GLOBAL_userData = {
					username : username,
					password : password
				};
				GLOBAL_isLogged = true;
				// appNav.popPage();
			}
			// loaderOff();
		},
		error : function(req, textStatus, errorThrown) {
			logDebug("[loginF] ERROR ");
			logDebug(req);

			GLOBAL_isLogged = false;
			GLOBAL_autoLogInProgress = false;
			onReqErr("loginF",req,textStatus);
		},
		// Perform post login actions
		complete : postFunction
	};

	if (loginData.fake) {
		// Make sure no text encoding stuff is done by xhr
		// opts.xhr = function() { var xhr = jQuery.ajaxSettings.xhr();
		// logDebug("LOGIN XHR");
		// xhr.send = xhr.sendAsBinary;
		// logDebug(xhr);
		// return xhr; }
		opts.contentType = "multipart/form-data; boundary="
				+ loginData.boundary;
		opts.data = loginData.toString();
	}
	$.ajax(opts);
}

/**
 * Fonction de chargement des pages. Prend en option un tableau destination =>
 * page choisie credentials => page nécessitant authentification ou pas level =>
 * niveau de profondeur de navigation title => titre de la page (sinon, précisé
 * suivant la destination) silent => chargement silencieux de la page si à vrai
 * timerAjust => si défini, détermine le temps avant la disparition du loader à
 * la fin de la requête local => pas de pushpage si à vrai divId => div à
 * remplacer par le contenu chargé si à vrai titleId => div à remplacer par le
 * titre choisi si à vrai animation => type d'animation de transition
 * slide|lift|fade|none (slide par défaut) postData => si setté, fait une
 * requête post vers la page au lieu d'une requête get, avec en paramètre les
 * données passées
 */
function loadPage(options) {
	var title = "Aucun";
	var cLog = false;
	var local = false
	var timerAjust = 000;
	var anim = 'slide';

	if (typeof options["timerAjust"] !== "undefined") {
		timerAjust = options["timerAjust"];
	}

	if (typeof options["animation"] !== "undefined") {
		switch (options["animation"]) {
		case 'slide':
		case 'lift':
		case 'fade':
		case 'none':
			anim = options["animation"];
			break;
		default:
			break;
		}
	}

	if (typeof options["title"] !== "undefined")
		title = options["title"];

	var cLog = false;
	if (typeof options["credentials"] !== "undefined")
		cLog = options["credentials"];

	var destination = "";
	if (typeof options["destination"] !== "undefined")
		destination = options["destination"];
	var level = 1;
	if (typeof options["level"] !== "undefined")
		level = options["level"];

	if (typeof options["force_logout"] !== "undefined")
		// Forcer expiration
		checkLogin(false);

	var divId = "#gen-content-div" + level;
	if (typeof options["divId"] !== "undefined")
		divId = options["divId"];

	var titleId = "#gen-title" + level;
	if (typeof options["titleId"] !== "undefined")
		titleId = options["titleId"];

	if (typeof options["local"] !== "undefined") {
		local = options["local"];
		logDebug("Local call => " + divId);
	}

	logDebug("Destination : " + destination.split("&")[0]);

	// Flusher le contenu de session
	/*if (!cLog && !GLOBAL_isLogged && !GLOBAL_autoLogInProgress) {
		logDebug("No user connected : force logout applied");
		var destURL = GLOBAL_serverBase + "index.php?route=account/logout&m=1";
		var opts = {
			url : destURL,
			crossDomain : true,
			xhrFields : {
				withCredentials : true
			},
			dataType : "html",
			type : typeR,
			timeout : GLOBAL_appParams.reqTimeout,
			async : false,
			cache : false,
			success : function(data, textStatus, xhr) {
				logDebug("Force logout processed successfully");
			},
			error : function(req, textStatus, errorThrown) {
				logDebug("Error when performing forceLogout");
				onReqErr("loadPage -- Session Flush",req,textStatus);
			}
		};
		$.ajax(opts);
	}*/

	// Si pas encore loggé et page protégée
	if (!GLOBAL_isLogged && cLog) {
		logDebug("Login required for dest:" + destination);
		logDebug("User data : ");
		logDebug(GLOBAL_userData);
		logDebug("cLog :" + cLog);
		// https://onsen.io/v2/docs/angular2/ons-navigator.html#methods-summary

		switch (destination.split("&")[0]) {
		// Cas où on ne pousse pas en arrière
		case 'consulter':
			// Double sécurité, normalement inutile
			// hidePrivateIcons();
			break;
		default:
			//Remettre sur le tab 0
			appTab.setActiveTab(0);
			break;
		}
		loaderOff();
		return -1;
	} else {
		var destURL = GLOBAL_serverBase + "index.php?route=";
		$("#gen-title").html("Generic");
		switch (destination.split("&")[0]) {
		case 'login':
		case 'account/login':
			if (!local){
//				appNav.pushPage('login', {
//					animation : anim
//				});
				loadLogin('');
				//Remettre sur le tab 0
				appTab.setActiveTab(0);
		 }else {
				logDebug("Local login call:");
				// Cas ou la div appelante contient déjà le formulaire de login
				// logDebug($(divId).html());
				$(divId).children().each(function() {
					if (!$(this).hasClass("hidden"))
						$(this).addClass("hidden");
				})
				$(divId).find("#login-form").removeClass("hidden");
				$(divId).find("#login-msg").html("&nbsp;");

				// Mettre à jour le formulaire de login en cas de changement de
				// compte
				loadLogin('');
				//Remettre sur le tab 0
				appTab.setActiveTab(0);
			}
			loaderOff();
			return true;
			break;
		case 'forgotten':
		case 'account/forgotten':
			destURL += "account/forgotten&m=1";
			break;
		case 'logout':
		case 'account/logout':
			destURL += "account/logout&m=1";
			break;
		case 'profile':
		case 'account/edit':
			destURL += "account/edit&m=1";
			title = "Mon profil";
			break;
		case 'historique':
			destURL += "account/order&m=1";
			title = "Mes commandes";
			break;
		case 'enseignes':
			destURL += "custompage/liste&m=1";
			title = "Enseignes";
			break;
		case 'offrir':
			destURL += "product/category&path=59&m=1";
			title = "Commander";
			break;
		case 'bonplan':
		case 'account/cartes/bonsplans':
			destURL += "account/cartes/bonsplans&m=1";
			title = "Coupons";
			break;
		case 'cgu':
			destURL += "information/information&information_id=5&m=1";
			title = "C.G.U.";
			break;
		case 'register':
		case 'account/register':
			destURL += "account/register&m=1";
			title = "Créer";
			break;
		case 'showBasket':
		case 'checkout/cart':
			destURL += "checkout/cart&m=1";
			title = "Mon panier";
			break;
		case 'activer':
		case 'account/cartes/activation':
			if (destination.length > 25)
				destURL += destination + "&m=1";
			else
				destURL += "account/cartes/activation&m=1";
			title = "Activation";
			break;
		case 'consulter':
		case 'account/cartes/consultation':
			destURL += "account/cartes/consultation&m=1";
			title = "Consulter";
			level = 1;
			break;
		case 'recharge':
		case 'account/cartes/rechargement':
			destURL += "account/cartes/rechargement&m=1";
			title = "Saisir une recharge";
			level = 1;
			break;
		case 'geolocation':
			destURL += "custompage/liste&m=1";
			title = "Autour";
			break;
		case 'scanBarcode':
			destURL += "custompage/liste&m=1";
			title = "Scanner";
			break;
		// Cas d'une requete custom
		default:
			destURL += (destination + "&m=1");
			// destURL="https://www.google.com";
			break;
		}

		// Si chargement non silencieux
		if (typeof options["silent"] === "undefined" && local === false) {
			logDebug("LoadPage PUSH generic-div" + level);
			appNav.pushPage('generic-div' + level, {
				animation : anim
			});
		}
		logDebug("Chargement URL: " + destURL);
		var typeR = 'GET';
		var dataP = null;
		if (typeof options["postData"] != "undefined") {
			typeR = 'POST';
			dataP = options["postData"];
			logDebug("POST Request to " + destURL);
			logDebug(dataP);
		}

		var opts = {
			url : destURL,
			crossDomain : true,
			xhrFields : {
				withCredentials : true
			},
			dataType : "html",
			type : typeR,
			data : dataP,
			// async:false,
			cache : false,
			success : function(data, textStatus, xhr) {
				if (typeof options["silent"] === "undefined") {
					// logDebug("[NOT SILENT] Destination
					// :"+destination+"=>"+divId);
					var pTitle = $(data).find("h2.secondary-title");
					var loggedOut = false;
					if (pTitle.length > 1) {
						if ($(pTitle[1]).html() == "Identification") {
							// Session expirée, remettre à la page de login
							loggedOut = true;
							// logDebug("LoadPage PUSH LOGIN");
							//appNav.pushPage('login');
							loadLogin('');
							//Remettre sur le tab 0
							appTab.setActiveTab(0);
						}
					}

					if (!loggedOut) {
						$(titleId).html(title);
						// logDebug("Div modifiée :"+$(divId).attr("id")+"
						// "+divId);
						// logDebug($(data).find("div#mobile-content").html());
						$(divId)
								.html($(data).find("div#mobile-content").html());
						if (level > 4)
							level = 1;
						adaptContent(destination, level, divId);
					}
					// logDebug(opts);
				} else {
					// logDebug ("Silent : "+destination);
				}
			},
			error : function(req, textStatus, errorThrown) {
				appNav.pushPage("unavailable");
				onReqErr("loadPage -- main",req,textStatus);
			},
			// Exécuté dans tous les cas après la requête
			complete : function(req, textStatus) {
				switch (destination) {
				case 'logout':
				case 'account/logout':
					logDebug("Logout : load login form");
					setTimeout(function() {
						loadPage({
							destination : 'login',
							credentials : false,
							local : true,
							divId : '#mescartes-content'
						})
					}, 500);
					break;
				case 'consulter':
					$(divId).parent().children().each(function() {
						logDebug("Div " + $(this).attr("id"));
						if (!$(this).hasClass("hidden"))
							$(this).addClass("hidden");
					});

					$(divId).removeClass("hidden");
					// So nasty
					$("#mescartes-header").removeClass("hidden");
					break;
				}
				// Donner du temps à la page de se charger
				// logDebug("LoaderOff Timer: "+timerAjust);
				setTimeout(loaderOff, timerAjust);

				if (typeof options["loadComplete"] !== "undefined") {
					var loadComplete = options["loadComplete"];
					loadComplete();
				}

				// logDebug("LoadPage END ");
			}
		};
		$.ajax(opts);
		// var appBrowser=window.open(destURL,"_self","location=no");
	}

}

/**
 * Fonction utilisée pour adapter le contenu renvoyé par une requête AJAX à
 * OpenCart en contenu qui peut être rendu sur la plateforme.
 */
function adaptContent(destination, level, divId) {
	logDebug("ADAPT CONTENT " + destination + " " + level);
	// Rewrite img src
	var images = $(divId).find("img");
	// logDebug(images);
	$(images).each(function() {
		$(this).attr("src", GLOBAL_serverBase + $(this).attr("src"));
	});

	// Rewrite links
	var links = $(divId).find("a");
	$(links).each(
			function() {
				var val = $(this).attr("href");
				if (typeof val !== "undefined") {
					var destination = (val.split("route="))[1];
					if (destination.length > 0) {
						destElems = (destination.split("&"))
						destination = destElems[0];
						$.each(destElems, function() {
							var kVals = this.split("=");
							if (kVals.length > 1) {
								if (kVals[0] != "m") {
									destination += "&" + kVals[0] + "="
											+ kVals[1];
								}
							}
						});
					}
					var parent = $(this).parent();
					var content = $(this).html();
					// logDebug(destination);
					if (content == "Retour")
						$(parent).append(
								"<span class=\"link\" onclick=\"appNav.popPage();\">"
										+ content + "</span>");
					else
						$(parent).append(
								"<span class=\"link\" onclick=\"loadPage({credentials: true, destination:'"
										+ destination + "', level:"
										+ ((level + 1) % 4) + "})\">" + content
										+ "</span>");
					$(this).remove();
				}
			});

	// Rewrite forms
	var forms = $(divId).find("form");
	var formNum = 0;
	var formId = "";
	GLOBAL_formData = null;
	$(forms)
			.each(
					function() {
						var submits = $(this).find("input[type=submit]");
						formId = $(this).attr("id");
						if (typeof formId == "undefined") {
							formNum++;
							$(this).attr("id", "form" + formNum);
							formId = "form" + formNum;
						}
						$(this)
								.append(
										"<span id=\"novaform_"
												+ formId
												+ "\" class=\"btn btn-primary button\" onclick=\"loaderOn();submitForm('"
												+ formId + "'," + level
												+ ");\"></span>");

						$(submits)
								.each(
										function() {
											var form = $(this).parent();
											var content = $(this).attr("value");
											var clicAct = $(this).attr(
													"onclick");

											if (typeof clicAct !== "undefined")
												$("#novaform_" + formId)
														.attr(
																"onclick",
																clicAct
																		+ $(
																				"#novaform_"
																						+ formId)
																				.attr(
																						"onclick"));
											logDebug("Content <" + content
													+ "> ");
											if (content.length == 0)
												content = "Valider";

											$("#novaform_" + formId).text(
													content);
											$(this).remove();
										});
						// Rajout de la div pour les messages
						$(this).html(
								"<span id=\"novaform-msg\"></span>"
										+ $(this).html());

					});

	// Adaptations du dom suivant la destination choisie (quand c'est
	// nécessaire)
	switch (destination.split("&")[0]) {

	case 'activer':
	case 'account/cartes/activation':
		// Cacher le reliquat de bouton submit du form et passer par le JS pour
		// faire la soumission
		$("#novaform_formulaire").addClass("hidden");
		$("input[name=num_carte]").attr("id", "numCarte");
		// $("#numCarte").attr("type", "text");
		// $("#numCarte").attr("maxlength", "21");
		// $("#numCarte").removeClass("form-control");
		// Attacher le listener au champ input

		// Contrôle le masque pour la saisie du numéro de carte (masked input)
		// http://digitalbush.com/projects/masked-input-plugin/
		// <!> 2017.09.12 -- Masque buggé <!>
		// $("#numCarte").mask("9999 9999 9999 9?999 9");
		if (typeof $(".alert-success") != "undefined") {
			// Cas ajout de carte déjà activée + compte connecté
			var lnk = $(".alert-success").find(".link");
			// Retirer le lien de consultation
			$(lnk).each(function() {
				$(this).remove();
			});
		}

		break;
	// Recharge
	case 'recharge':
	case 'account/cartes/rechargement':
		// Retirer l'élément alert en haut
		$($.find(".alert")).remove();
		$($.find("h4")).addClass("recharge-title");

		var cartes = $.find(".product-thumb");

		$(cartes).each(
				function() {

					var modalClass = $($(this).parent()).attr("class").split(
							" ")[0];
					if (typeof modalClass.split("_")[1] !== "undefined") {
						var opts = {
							modalClass : '',
							numCarte : '',
							numReseau : '',
							imgCarte : ''
						};
						opts.modalClass = modalClass;
						opts.numCarte = $(this).find(".card_num").html();
						opts.numReseau = modalClass.split("_")[2];
						opts.imgCarte = $(this).find("img").attr("src");

						logDebug("Numcarte " + opts.numCarte + " "
								+ opts.numReseau);
						$(this).addClass("recharge-carte");

						// Reecriture du numero de carte
						var sC = opts.numCarte.split("");

						opts.numCarte = ""
						for (i = 0; i < sC.length; i++) {
							if (i % 4 == 0)
								opts.numCarte += " ";
							opts.numCarte += sC[i];
						}
						opts.numCarte = opts.numCarte.trim();
						$(this).find(".card_num").html(opts.numCarte);

						$(this).find("a").attr(
								"onclick",
								"showRechargeForm('" + opts.numCarte + "',"
										+ parseInt(opts.numReseau) + ",'"
										+ opts.imgCarte + "');");
					}
				});
		break;
	// Creation de compte
	case 'register':
	case 'account/register':
		// Retirer le message en haut de formulaire
		var alertP = $.find(".account-text");
		$(alertP).html("");
		$(alertP).addClass("hidden");
		break;
	// Card consultation
	case 'consulter':
	case 'account/cartes/consultation':
		// MISE A JOUR COMPTE CLIENT
		var client = $.find("#idClient");
		if (typeof client != "undefined") {
			GLOBAL_userData["novId"] = $(client).html();
		}
		// END MAJ IDCLIENT
		// Retirer l'élément alert en haut
		if (typeof $.find("#nothing") !== "undefined") {
			var elem = $.find("#nothing");
			$(elem)
					.html(
							"<ons-button modifier=\"scanbarcode\" onclick=\"appTab.setActiveTab(2);\">Cliquez pour <br/>ajouter une carte !</ons-button>");
		}
		$($.find(".alert")).remove();
		var cartes = $.find(".image");
		// logDebug(cartes);
		$(cartes)
				.each(
						function() {
							var opts = {
								nomEns : '',
								imgCarte : '',
								numCarte : '',
								statutCarte : '',
								soldePME1 : '',
								soldePME2 : '',
								listTransac : '',
								idEnseigne : '',
								isActive : true
							};
							opts.nomEns = $(this).find(".first-image").attr(
									"title").toUpperCase();
							opts.imgCarte = $(this).find(".first-image").attr(
									"src");
							opts.numCarte = $(this).find(".card_num").html();
							opts.statutCarte = "";// $($($(this).find(".card_num").parent()).find("span")[1]).html();
							opts.soldePME1 = $($(this).find(".btn")[0]).html();
							opts.soldePME2 = $($(this).find(".btn")[1]).html();

							// Reecriture du numero de carte
							var sC = opts.numCarte.split("");

							opts.numCarte = ""
							for (i = 0; i < sC.length; i++) {
								if (i % 4 == 0)
									opts.numCarte += " ";
								opts.numCarte += sC[i];
							}
							opts.numCarte = opts.numCarte.trim();
							$(this).find(".card_num").html(opts.numCarte);

							// Active ou pas
							var baseH = $(this).find(".card_num").parent();
							var elem = $(baseH).find("span")[1];
							var cState = $(elem).find("span")[0];
							var isActive = false;
							if ($(cState).html().toLowerCase() === "active") {
								$(cState).attr("class", "cardActive");
								isActive = true;
							} else {
								$(cState).html("Opposée");
								$(cState).attr("class", "cardOpposed");
							}
							$(cState).attr("style", "");

							// Reecriture PME1 et PME2
							$(elem).attr("class", "cardFooter");
							$(elem).attr("style", "");

							// Vérifier qu'ils sont bien définis
							if (typeof opts.soldePME1 !== "undefined")
								$(elem)
										.html(
												$(elem).html()
														+ "<span class=\"cardDetail-pme1\">"
														+ opts.soldePME1
														+ "</span>");
							if (typeof opts.soldePME2 !== "undefined")
								$(elem)
										.html(
												$(elem).html()
														+ "<span class=\"cardDetail-pme2\">"
														+ opts.soldePME2
														+ "</span>");
							//Etat carte (active ou opposée
							opts.isActive = isActive;

//   Bouton opposer carte
//						   if (isActive)
//							   $(elem).html(
//									$(elem).html()
//										+ "<span class=\"cardDetail-oppose\" onclick=\"oppoCard('"
//										+ opts.numCarte
//										+ "')\"><ons-icon icon=\"fa-minus-square\"></ons-icon></span>");

							var links = $(this).find('.cadeau_icon');
							// logDebug(links);
							var link1 = $(links[0]).attr('onclick');
							var link2 = $(links[1]).attr('onclick');

							// logDebug(link2.substring(3, link2.length - 17));
							// Récupérer le modal qui contient la liste des
							// transacs
							if (typeof link2 !== "undefined")
								opts.listTransac = link2.substring(3,
										link2.length - 17);

							// Récupérer le numéro de groupement pour la liste
							// des avantages
							if (typeof link1 !== "undefined")
								opts.idEnseigne = parseInt(link1.split("'")[1]);

							// Transformer le tableau en chaine
							var optString = "{";
							$.each(opts, function(key, value) {
								optString += key + ":'" + value + "',";
							})
							optString = optString.substring(0,
									optString.length - 1);
							optString += "}";
							// logDebug(optString);

							// Nettoyage
							$(this).find(".btn").each(function() {
								$(this).remove();
								// $(this).attr("style","");
							})
							$(this).find('.cadeau_icon').each(function() {
								$(this).remove();
							})

							$(this).find(".first-image").attr("onclick",
									"showCard(" + optString + ");");
						})
		$("#mescartes-body").attr("class", "");

		// MAJ ASSOCIATION DEVICE ET COMPTE
		populateDevice();
		// Charger les cartes existantes en mémoire (ASYNC)
		loadCartes(true);
		// MAJ info device pour notifs push et cTools (ASYNC)
		updateCToolsDir(true);
		// END MAJ DEVICE ET COMPTE
		break;

	// Edition de l'adresse
	case "account/address/edit":
		break;
	// Cas des bons plans //<!> DEPRECATED ON PASSE PAR E-FRAME <!>
	case 'bonplan':
	case 'account/cartes/bonsplans':
		logDebug("Destination :" + destination.split("&")[0] + " adaptation");
		// Adaptation des images
		var img = $.find(".bonplan img");
		$(img).each(
				function() {
					var serverPathL = GLOBAL_serverBase.length;
					$(this).attr(
							"src",
							$(this).attr("src").substring(serverPathL,
									$(this).attr("src").length));
				});
		// Retrait de l'iframe
		var iframe = $.find("#bonplan-frame");
		$(iframe).remove();

		var select = $.find("#select-bp");
		$(select).attr("onchange", "updateBpList($(this).val());");

		break;
	default:
		logDebug("Destination :" + destination.split("&")[0]
				+ " aucune modification du DOM prévue !");
		break;
	}
	logDebug("FIN ADAPT CONTENT =>" + destination + " " + level);
}

/**
 * Fonction qui réalise la vérification d'un formulaire avant envoi
 * Attention, ne réalise que les contrôles de conformité de champ, pas si le champ est obligatoire ou pas
 * @param formId
 */
function checkForm(formId){
	var form = $.find("form#" + formId);
	var errors=false;
	var msg="";
	$("#novaform-msg").html("");
	$("#novaform-msg").attr("class"," ");
	if (typeof form !== "undefined") {
		logDebug("[CHECK] Verification formulaire "+formId);
		//Formulaire trouvé, on va boucler sur chaque attribut
		var inputs = $(form).find("input");
		var selects = $(form).find("select");
		$(inputs).each(function() {
			var attrName = $(this).attr("name");
			var attrVal = $.trim($(this).val());
			//logDebug("[CHECK]  "+attrName+" : "+attrVal);
			switch(attrName){
				case "firstname":
					break;
				case "lastname":
					break;
				case "telephone":
					var exp = /^\d{10}$/;
					if(!attrVal.match(exp) && attrVal.length>0){
						errors=true;
						msg+="Le numero de telephone saisi est incorrect<br/>";
					}
					break;
				case "email":
					var exp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; 
					if(!attrVal.match(exp) && attrVal.length>0){
						errors=true;
						msg+="Veuillez vérifier l'adresse mail saisie !<br/>";
					}
					break;
				case "fax":
					var exp = /^\d{10}$/;
					if(!attrVal.match(exp) && attrVal.length>0){
						errors=true;
						msg+="Le numero de fax saisi est incorrect<br/>";
					}
					break;
				case "zipcode":
				case "postcode":
					var exp = /^\d{5}$/;
					if(!attrVal.match(exp) && attrVal.length>0 ){
						errors=true;
						msg+="Le code postal saisi est incorrect<br/>";
					}
					break;
				case "city":
					break;
			}
		});
	}
	if(errors){
		$("#novaform-msg").html(msg);
		$("#novaform-msg").attr("class","text-danger bg-danger");
		//Mettre le focus sur le premier champ input du formulaire
		logDebug("[CHECK] Erreurs: "+msg);
		$(inputs)[0].focus();
	}
	return !errors;
}

/**
 * Fonction utilisée pour réaliser la soumission des formulaires <!> Attention
 * ne fonctionne pas en mode navigateur <!> A cause des credentials de session :
 * OpenCart attends nécessairement que les données d'un post soient associées à
 * un cookie de session. Or, en mettant withCredentials à false la dite session
 * n'est jamais repassée à OpenCart
 */
function submitForm(formId, level) {
	var form = $.find("form#" + formId);
	if (typeof form !== "undefined") {
		logDebug("Submit form : " + formId)
		
		var verifForm = true;
		verifForm = checkForm(formId);
		if(!verifForm){
			//Echec de la verif, on envoie pas le formulaire
			loaderOff();
			return false;
		}
		var destURL = $(form).attr("action");
		var method = $(form).attr("method");
		var formId = $(form).attr("id");
		var inputs = $(form).find("input");
		var selects = $(form).find("select");
		var fData = new FormData();
		var postTraitDest = destURL.split("?");

		
		
		$(inputs).each(function() {
			fData.append($(this).attr("name"), $.trim($(this).val()));
		});

		// Collecte au besoin d'infos avant soumission du formulaire
		switch (postTraitDest[1]) {
		case "route=account/register&m=1":
			// Cas où c'est un formulaire d'enregistrement
			// 1 Récup le login et le mot de passe des données postées
			GLOBAL_credFilecontent = {
				user : $("#input-email").val(),
				pass : $("#input-password").val()
			};
			logDebug("Stockage des infos de log:");
			logDebug(GLOBAL_credFilecontent);
			break;
		default:
			break;
		}

		$(selects).each(
				function() {
					logDebug("Name: " + $(this).attr("name") + " Val:"
							+ $(this).val());
					if ($(this).val() != null)
						fData.append($(this).attr("name"), $(this).val());
					else
						fData.append($(this).attr("name"), 0);
				});

		$("#novaform-msg").html("");
		var opts = {
			url : destURL,
			data : fData,
			// async:false,
			cache : false,
			xhrFields : {
				withCredentials : true
			},
			contentType : "html",
			processData : false,
			type : 'POST',
			timeout : GLOBAL_appParams.reqTimeout,
			success : function(data) {
				// logDebug(data);
				// logDebug("SUCCESS ");
				var errors = $(data).find(".text-danger");
				if (errors.length > 0) {
					logDebug("[FORM][ATTENTION] Erreurs dans le formulaire");
					logDebug(errors);
					if (errors.length > 0) {
						// logDebug(errors);
						$("#novaform-msg")
								.html(
										"<b>Veuillez corriger les erreurs ci-dessous:<b/><br/>")
						$.each(errors,
								function() {
									$("#novaform-msg").append(
											$(this).html() + "<br/>");
								});
						$("#novaform-msg").attr("class",
								"text-danger bg-danger");
						// Faire un scrollTop vers novaform-msg
						// Cas formulaires enregistrement et modif
						$("#account-menu").scrollTop(0);

					} else {
						logDebug("[ATTENTION] CAS BIZARRE");
						$("#gen-content-div" + level).html($(resp).html());
					}
				} else {
					logDebug("[FORM] soumission form OK");
					resp = $(data).find(".text-success");
					if (resp.length > 0) {
						$("#gen-content-div" + level).html(
								"<div id=\"novaform-success\" class=\"text-success bg-success\">"
										+ $(resp).html() + "</div>");

						// Post traitement
						switch (postTraitDest[1]) {
						case "route=account/register&m=1":
							// Cas où c'est un formulaire d'enregistrement
							// soumis avec succès
							// Déclenchement du login
							logDebug("Création du compte acceptée :");
							$("#novaform-msg").html($(resp).html());
							$("#novaform-msg").attr("class",
									"text-success bg-success");
							loginF(GLOBAL_credFilecontent.user,
									GLOBAL_credFilecontent.pass, postLogin);

							break;
						case "route=account/edit&m=1":
							// Cas modification de compte
							logDebug("Modification de compte validée");
							$("#novaform-msg").html($(resp).html());
							$("#novaform-msg").attr("class",
									"text-success bg-success");
							// Rajouter le scrolltop
							$("#account-menu").scrollTop(0);
							break;
						default:
							logDebug("Form post-traitement : "
									+ postTraitDest[1] + " nothing done");
							break;
						}
					} else {
						logDebug("[FORM] Cas ou post traitement : "
								+ postTraitDest[1] + " all is loaded");
						// On charge tout
						$("#gen-content-div" + level).html($(data).html());
						// Cas mot de passe oublié
						if (postTraitDest[1] == "route=account/forgotten&m=1") {
							$(".account-text")
									.html(
											"Félicitations ! Un nouveau mot de passe a été envoyé à votre adresse courriel.");
							$(".account-text").attr("class",
									"alert-success success");
							setTimeout(function() {
								appNav.popPage();
							}, 1200);
						}
					}
				}
				loaderOff();
			},
			error : function(error) {
				logDebug("ERROR: " + error.statusText);
				logDebug(error);
				$("#novaform-msg").html(
						"Une erreur s'est produite, veuillez réessayer !")
				$("#novaform-msg").attr("class", "text-danger bg-danger");
				loaderOff();
			}
		};
		if (fData.fake) {
			// Make sure no text encoding stuff is done by xhr
			/*
			 * opts.xhr = function() { var xhr = jQuery.ajaxSettings.xhr();
			 * logDebug("FORM"); xhr.send = xhr.sendAsBinary; logDebug(xhr);
			 * return xhr; }
			 */
			opts.contentType = "multipart/form-data; boundary="
					+ fData.boundary;
			opts.data = fData.toString();
		}
		// logDebug(opts.data);
		$.ajax(opts);
	}
}

/**
 * Fonction qui ajoute la carte dont le numéro est passé en paramètre au compte
 * Revu : 2017.04.11 pour nouveau workflow acquisition
 * 
 * level1 => Ajout depuis scan level2 => Ajout depuis consultation scan
 */
function addCard(numCarte) {

	logDebug("ADDCARD: Numero de carte: " + numCarte);
	$("#novaform-msg").attr("class", "");
	$("#novaform-msg").html("");
	var destURL = GLOBAL_serverBase
			+ "index.php?route=account/cartes/verification_existence&m=1";

	// <!> Traitement forcé en synchrone pour éviter bugs d'affichage <!>
	var opts = {
		url : destURL,
		async : true,
		data : {
			num_carte : numCarte
		},
		xhrFields : {
			withCredentials : true
		},
		type : 'POST',
		dataType : 'json',
		timeout : GLOBAL_appParams.reqTimeout,
		// Révision suite nouveau modèle enrolement
		complete : function(data2) {
			var data = JSON.parse(data2.responseText);
			// logDebug(data);
			if (data.success) // le traitement s'est bien passé
			{
				logDebug(data);
				// Attention, l'envoi de code / activation ne marche que si date
				// activation NULL et Statut = -1 (clientfid)
				// le gars est connecté, il n'a pas de code à saisir
				if (data.estConnecte && data.code.length == 0) {
					logDebug("[ACTIVATION] Connecté et pas de code à saisir ");
					// window.location.replace("index.php?route=account/cartes/activation&actok="+
					// numCarte+"&m=1");
					loadPage({
						destination : 'account/cartes/activation&actok='
								+ numCarte + '&m=1',
						credentials : true,
						local : true,
						divId : '#gen-content-div1',
						loadComplete : loaderOff
					});
					// Donner le temps pour le page reload
					setTimeout(function() {
						appNav.popPage();
						appTab.setActiveTab(0);
						// Donner le temps pour le page reload
						setTimeout(function() {
							tabLoad(true);
						}, 500);
					}, 1500);

				}// le gars est connecté mais il a un code a saisir
				else if (data.estConnecte && data.code.length != 0) {
					logDebug("[ACTIVATION] Connecté et code à saisir ");
					if (data.message_error != null
							&& data.message_error.length > 0) {
						// Erreur à afficher
						$("#novaform-msg").attr("class",
								"text-danger bg-danger");
						$("#novaform-msg").html(data.message_error);

					} else {
						// L'envoyer vers une page d'activation
						// Champ input name="code" type="text"
						var msg = ""
						// route=account/cartes/activation_ok
						/**
						 * Codes de retour 1 : email 2 : teléphone 3 : date
						 * naiss 99 : code d'activation
						 */
						$("#numCarte").attr("name", "code");
						switch (parseInt(data.code[0])) {
						case 1:
							msg = "Veuillez saisir votre adresse e-mail";
							$("#numCarte").mask("");
							break;
						case 2:
							msg = "Veuillez saisir votre numéro de téléphone mobile";
							$("#numCarte").attr("type", "tel");
							$("#numCarte").mask("9999999999");
							break;
						case 99:
							msg = "Veuillez saisir votre code d'activation ";
							msg+="envoyé au "+data.fiche.telephone+" ";
							$("#numCarte").attr("type", "tel");
							$("#numCarte").mask("9999");
							$('#numCarte').attr("placeholder","XXXX");
							// Reprendre le cas de soumission classique du
							// formulaire
							// <!>SO NASTY, KOB, AVENTURA<!>

							break;
						}
						$("#lblNumCarte").html(msg);
						// Vider les paragraphes au dessus
						var par = $("#div_numcarte").find("p");
						$(par).each(function() {
							$(this).html("");
						});
						$("#numCarte").val("");
						$("#submit").attr("onclick",
								"checkActCode('" + numCarte + "');");
					}
					setTimeout(function() {
						loaderOff()
					}, 1000);
				}// le gars n'est pas connecté
				else if (!data.estConnecte || data.estConnecte == null) {
					logDebug("[ACTIVATION] Pas connecté ");
					// Charger la page d'ajout de compte avec les données
					// associées à la carte lorsquelles existent
					// logDebug(data.fiche);
					var cliF = {
						"email" : data.fiche.email,
						"civilite" : data.fiche.civilite,
						"firstname" : data.fiche.firstname,
						"lastname" : data.fiche.lastname,
						"dateNaiss" : data.fiche.dateNaiss,
						"telephone" : data.fiche.telephone,
						"address_1" : data.fiche.address_1,
						"address_2" : data.fiche.address_2,
						"postcode" : data.fiche.postcode,
						"city" : data.fiche.city,
						"not_validate" : 1
					};

					logDebug("Données carte : ")
					logDebug(cliF);
					appNav.popPage();
					
					//Charger le formulaire client
					appTab.setActiveTab(4);
					setTimeout(function(){
						loaderOn();
						loadPage({
							destination : 'register',
							credentials : GLOBAL_isLogged,
							local : true,
							divId : '#compte-content',
							postData : cliF,
							loadComplete : loaderOff
						});
					},1000);
				}
			} else { // la carte est inconnue
				logDebug("[ACTIVATION] Carte inconnue ");
				$("#novaform-msg")
						.html(
								"<p class='text-danger bg-danger'>Cette carte est inconnue.</p>");
				setTimeout(function() {
					loaderOff()
				}, 500);
			}
		},
		error : function(req, textStatus, errorThrown) {
			onReqErr("addCard",req,textStatus);
			setTimeout(function() {
				loaderOff();
			}, 500);
		}
	};
	//
	// loaderOn();

	$.ajax(opts);
}

/**
 * Vérification du code d'activation pour une carte donnée Fonction appellée
 * depuis la page d'activation d'une carte
 */

function checkActCode(numcarte) {

	var destURL = GLOBAL_serverBase
			+ "index.php?route=account/cartes/activation_ok&m=1";
	var fData = new FormData();
	fData.append("num_carte", numcarte);
	fData.append("code", $("#numCarte").val());
	var opts = {
		url : destURL,
		data : fData,
		xhrFields : {
			withCredentials : true
		},
		type : 'POST',
		dataType : 'html',
		timeout : GLOBAL_appParams.reqTimeout,
		success : function(data2) {
			var textSuccess = $(data2).find("p.alert-success").html()
			if (typeof textSuccess != "undefined" && textSuccess.length > 0) {
				$("#activation_form")
						.html(
								"<p class=\"alert alert-success\" style=\"text-align:center;margin-top:10%;margin-bottom:20%;\"> "
										+ "Félicitations !<br/> Votre carte  a été liée à votre compte<br/></p>");
				// Forcer le rechargement la page des cartes

				// Donner le temps pour le page reload
				setTimeout(function() {
					appNav.popPage();
					appTab.setActiveTab(0);
					// Donner le temps pour le page reload
					setTimeout(function() {
						tabLoad(true);
					}, 500);
				}, 1000);
			} else {
				$("#activation_form")
						.html(
								"<p class=\"text-danger bg-danger\" style=\"text-align:center;margin-top:10%;margin-bottom:20%;\"> "
										+ "Une erreur s'est produite, veuillez réessayer<br/></p>");
			}
		},
		error : function(req, textStatus, errorThrown) {
			onReqErr("checkActCode",req,textStatus);
		},
		complete : function() {
			loaderOff();
		}
	}
	if (fData.fake) {
		// Make sure no text encoding stuff is done by xhr
		/*
		 * opts.xhr = function() { var xhr = jQuery.ajaxSettings.xhr();
		 * logDebug("FORM"); xhr.send = xhr.sendAsBinary; logDebug(xhr); return
		 * xhr; }
		 */
		opts.contentType = "multipart/form-data; boundary=" + fData.boundary;
		opts.data = fData.toString();
	}

	loaderOn();
	// Pour permettre au loader de se déclencher
	setTimeout(function() {
		$.ajax(opts);
	}, 500);

}
/**
 * Opposition d'une carte sur la base de son numéro
 */
function oppoCard(numCarte) {
	dialogBox("Attention !", "Souhaitez vous réellement opposer la carte n°"
			+ numCarte, "oppoDialogBox", "Opposer !", oppoCardOK, null,
			argOK = numCarte, null);
}
function oppoCardOK(numCarte) {
	loaderOn();
	logDebug("OPPOCARD: Numero de carte: " + numCarte);
	$("#novaform-msg").attr("class", "");
	$("#novaform-msg").html("");
	var destURL = GLOBAL_serverBase
			+ "index.php?route=account/cartes/verification_existence&m=1";
	var opts = {
		url : destURL,
		data : {
			num_carte : numCarte
		},
		xhrFields : {
			withCredentials : true
		},
		type : 'POST',
		dataType : 'json',
		timeout : GLOBAL_appParams.reqTimeout,
		success : function(data2) {
			logDebug(data2);
			// Si c'est bon on balance le formulaire
			// $("#novaform").click();
			if (data2.success) {
				// Valider l'opposition
				// $("#novaform-msg").attr("class","text-danger bg-danger");
				// $("#novaform-msg").html("&nbsp;Carte opposée !
				// "+numCarte+"&nbsp;");
				logDebug("Carte valide " + numCarte);
				var destURL = GLOBAL_serverBase
						+ "index.php?route=account/cartes/opposition_ok&m=1";
				data2 = {
					num_carte : numCarte
				};
				var fData = new FormData();
				fData.append("num_carte", numCarte);
				fData.append("code", "");
				var opts2 = {
					url : destURL,
					data : fData,
					// async:false,
					cache : false,
					xhrFields : {
						withCredentials : true
					},
					contentType : "html",
					processData : false,
					type : 'POST',
					timeout : GLOBAL_appParams.reqTimeout,
					success : function(data3) {
						appNav.popPage();
						// Ramener à mes cartes
						appTab.setActiveTab(0);
						var alert = $(data3).find(".alert-danger");
						// logDebug(data3);
						// logDebug(alert);
						if (alert.length > 0) {
							// Cas d'erreur
							alertBox("Une erreur s'est produite ...", $(alert)
									.html(), "oppoAlertBox", "Fermer");
						}
						// Recharger les cartes
						setTimeout(function() {
							loadPage({
								destination : 'consulter',
								credentials : true,
								local : true,
								divId : '#mescartes-body'
							})
						}, 500);

					},
					error : function(req, textStatus, errorThrown) {
						onReqErr("oppoCard2",req,textStatus);
						loaderOff();
					}
				};
				if (fData.fake) {
					// Make sure no text encoding stuff is done by xhr
					/*
					 * opts.xhr = function() { var xhr =
					 * jQuery.ajaxSettings.xhr(); logDebug("FORM"); xhr.send =
					 * xhr.sendAsBinary; logDebug(xhr); return xhr; }
					 */
					opts2.contentType = "multipart/form-data; boundary="
							+ fData.boundary;
					opts2.data = fData.toString();
				}
				$.ajax(opts2);
			} else {
				// $("#novaform-msg").attr("class","text-danger bg-danger");
				// $("#novaform-msg").html("&nbsp;Carte inconnue
				// "+numCarte+"&nbsp;");
				logDebug("Carte inconnue ! " + numCarte);
				loaderOff();
			}
		},
		error : function(req, textStatus, errorThrown) {
			onReqErr("oppoCard1",req,textStatus);
			// alert("ERROR "+error.statusText+"
			// "+error.responseText);
			loaderOff();
		}
	};
	//
	$.ajax(opts);
}

/**
 * Fonction qui met à jour la liste des cartes de l'utilisateur Renseigne une
 * variable global GLOBAL_cardList avec la liste des cartes et le numero réseau
 * correspondant OK : 2017.10.18
 */
function loadCartes(isAsync) {
	GLOBAL_cardList = [];
	var destURL = GLOBAL_serverBase
			+ "index.php?route=account/cartes/rechargement&m=1";
	var opts = {
		url : destURL,
		async : isAsync,
		crossDomain : true,
		xhrFields : {
			withCredentials : true
		},
		dataType : "html",
		type : "GET",
		// async:false,
		timeout : GLOBAL_appParams.reqTimeout,
		cache : false,
		success : function(data, textStatus, xhr) {
			var cartes = $(data).find(".product-thumb");
			$(cartes)
					.each(
							function() {
								var modalClass = $($(this).parent()).attr(
										"class").split(" ")[0];
								if (typeof modalClass.split("_")[1] !== "undefined"
										&& typeof modalClass.split("_")[2] !== "undefined") {
									var numCarte = modalClass.split("_")[1];
									var numReseau = modalClass.split("_")[2];
									if (typeof GLOBAL_cardList[numReseau] == "undefined")
										GLOBAL_cardList[numReseau] = [];

									GLOBAL_cardList[numReseau][GLOBAL_cardList[numReseau].length] = numCarte;
								}
							});
			// logDebug(GLOBAL_cardList);
			$.each(GLOBAL_cardList, function(key, value) {
				// logDebug("Reseau: "+key);
				$.each(value, function() {
					if (this.length > 0)
						logDebug("LOAD CARTES : Rez " + key + " Card " + this);
				});
			});
		},
		error : function(req, textStatus, error) {
			logDebug("LoadCardList " + destination + " ERROR URL:" + destURL);
			logDebug(error);
			logDebug(req.responseText + " " + req.responseXML);
		},
		// Exécuté dans tous les cas après la requête
		complete : function(req, textStatus) {
		}
	};
	$.ajax(opts);
}

/**
 * Fonction d'affichage d'une carte de fidélité nomEns = nom enseigne imgCarte =
 * url image carte numCarte = numéro de la carte statutCarte = statut de la
 * carte soldePME1 = solde nb points fidé soldePME2 = solde nb euros fidé
 * listTransac = id du modal contenant les transactions idEnseigne = id de
 * l'enseigne à laquelle appartient la carte dans OpenCart
 */
function showCard(opts) {
	appNav.pushPage('cardDetail');
	// loaderOn();
	setTimeout(function() {
		$("#cardDetail-title").html(opts.nomEns);
		$("#cardDetail-numCarte").html(opts.numCarte);
		$("#cardDetail-image").attr("src", opts.imgCarte);
		if (opts.soldePME1 !== "undefined")
			$("#cardDetail-pme1").html(opts.soldePME1);
		else
			$("#cardDetail-pme1").html("N/A");

		if (opts.soldePME2 !== "undefined")
			$("#cardDetail-pme2").html(opts.soldePME2);
		else
			$("#cardDetail-pme2").html("N/A");

		if(opts.isActive =="true"){
			$("#cardDetail-status").html("Active");
			$("#cardDetail-status").attr("class","active");
			$("#cardDetail-actions").html("<span class=\"cardDetail-oppose\" onclick=\"oppoCard('"+ opts.numCarte+ "')\"><ons-icon icon=\"fa-minus-circle\"></ons-icon> Opposer la carte</span>");
		}else{
			$("#cardDetail-status").html("Opposée");
			$("#cardDetail-status").attr("class","opposed");
		}
		
		$("#cardDetail-transacs").html(
				$(opts.listTransac).find("#transac").html());

		// Appel AJAX pour la liste des avantages
		var destURL = GLOBAL_serverBase
				+ "index.php?route=product/manufacturer/info&id_groupement="
				+ opts.idEnseigne + "&m=1";
		var params = {
			url : destURL,
			xhrFields : {
				withCredentials : true
			},
			dataType : "html",
			type : "GET",
			// async:false,
			cache : false,
			timeout : GLOBAL_appParams.reqTimeout,
			success : function(data) {
				var avantage = $(data).find(".fide-ens");
				$("#cardDetail-avantages").html("<br/>");
				$.each(avantage, function() {
					$("#cardDetail-avantages").html(
							$("#cardDetail-avantages").html() + $(this).html()
									+ "<br/><br/>");
				})
				loaderOff();
			},
			error : function(error) {
				$("#cardDetail-avantages").attr("html",
						"Pas d'avantages publiés pour cette enseigne !");
				loaderOff();
			}
		}
		$.ajax(params);
	}, 500);

}

/**
 * REMPLACEMENT FONCTIONS DEDIEES OPEN CART
 */

function clean_phone(number){
	var retVal = ((number.replace(/ /g,'')).replace(".","")).replace(/\s/g,'');
	logDebug("Num original <"+number+"> => <"+retVal+">");
	//Calcul indicatif
	switch(retVal.substr(0,3)){
	case "059":
	case "069":
			retVal = "+59"+retVal.substr(3,1)+retVal.substr(1,9)
		break;
	}
	return retVal;
}

function show_enseigne(idEnseigne) {
	loaderOn();
	options = {
		destination : "product/manufacturer/info&id_groupement=" + idEnseigne,
		credentials : false,
		level : 2,
		title : "Detail enseigne",
		loadComplete : function() {
			drawEnsMap("enseigne-map");
			//Fonctions complémentaires
			//Rajouter l'appel téléphonique à chaque lien
			$(".ens-tel").each(function(){
				if($(this).html().length>0){
					$(this).html("<a href=\"tel:"+clean_phone($(this).html())+"\">"+$(this).html()+"</a>");
				}
			});
		}
	};
	setTimeout(function(){
		loadPage(options);
	},500);
}

// Permet au clic sur une enseigne de centrer la carte dessus
function showEnsDetail(el) {
	// logDebug("[ELEMENT EN COURS] "+$(el).attr("class"));

	var coord_ens = $(el).find(".json-mag");
	// logDebug($(coord_ens).html());
	var cEns = JSON.parse($(coord_ens).html());
	//logDebug(cEns);
	//Rajouter le lien de partage
	var shareLink = "<span class=\"fidshare\" onClick=\"shareTrigger('Découvrez les avantages de "+cEns.nom+" sur Fidlink !','"+GLOBAL_playStoreURL+"');\"><i class=\"fa fa-share-alt\"></i></span>";
	//Rajouter le lien d'appel
	//var callLink = "<a class=\"fidtel\" href=\"tel:"+clean_phone(cEns.tel)+"\"><i class=\"fa fa-phone\"></i></a>";
	var callLink = "<a class=\"fidtel\" href=\"#\" onclick=\"window.open('tel:"+clean_phone(cEns.tel)+"', '_system'); logDebug('Appel tel a "+cEns.nom+"');return false;\"><i class=\"fa fa-phone\"></i></a>";
	
	$("#gen-content-div2 h3.heading-title").html(cEns.nom + callLink + shareLink);
	
	$(".sel-ens").removeClass("sel-ens");
	$(el).addClass("sel-ens");

	// Chargement de la map
	$("#enseigne-map").attr("class", "body-spinner");
	drawEnsMap("enseigne-map", cEns);
	$("#enseigne-map").attr("class", "");
	// Ramener en haut de carte
	$("#gen-content-div2").scrollTop(0);
}

function drawEnsMap(map_div, map_center) {
	var zoom = 12;
	var default_view = false
	var mapOptions = {
		center : new google.maps.LatLng(0, 0),
		zoom : 1,
		disableDefaultUI : true,
		zoomControl : false,
		scaleControl : false,
		mapTypeControl : false
	/*
	 * mapTypeControl: true, mapTypeControlOptions: { style:
	 * google.maps.MapTypeControlStyle.DROPDOWN_MENU, mapTypeIds: ['roadmap',
	 * 'terrain','satellite','hybrid'] }
	 */
	};

	map = new google.maps.Map(document.getElementById(map_div), mapOptions);

	var center = null;
	if (typeof map_center != "undefined")
		center = new google.maps.LatLng(map_center.lat, map_center.lon);
	else {
		// Vue par défaut, centrée sur la position, toutes enseignes visibles
		center = new google.maps.LatLng(GLOBAL_geoPosition.latitude,
				GLOBAL_geoPosition.longitude);
		default_view = true;
	}
	logDebug("[MAP] Map center:" + JSON.stringify(center));

	var listEns = $("#enseigne-list").find(".ens-item");

	if (default_view)
		// Pour autoscale de la carte
		var mLimit = new google.maps.LatLngBounds();

	// Ramener les points à dessiner
	$(listEns).each(
			function() {
				var ens = $(this).find(".json-mag");
				var cEns = JSON.parse($(ens).html());
				var latLong = new google.maps.LatLng(cEns.lat, cEns.lon);
				var imgMarker = "http://maps.gstatic.com/mapfiles/markers2/marker.png"; //$(this).find(".logo-mag").find("img").attr("src");
				logDebug("[MAP] Draw marker lat:" + cEns.lat + " - lon:"
						+ cEns.lon + " src=" + imgMarker);
				var iM = {
					url : imgMarker,
					//scaledSize : new google.maps.Size(40, 40),
					//origin : new google.maps.Point(0, 0),
					//anchor : new google.maps.Point(0, 0),
				};
				var cMarker = new google.maps.Marker({
					position : latLong,
					icon : iM
				});
				cMarker.setMap(map);

				if (default_view)
					// Etendre la frontière à un nouveau point
					mLimit.extend(latLong);
			});

	map.setZoom(zoom);
	map.setCenter(center);

	if (default_view) {
		// Rajouter le centre à l'enveloppe
		mLimit.extend(center);
		// Centrer la carte, vue par défaut
		map.fitBounds(mLimit);
	}

}

/**
 * Recherche d'enseignes OK
 */
function searchEnseignes(nomEns) {
	if (nomEns.length >= 3) {
		// logDebug("Nom recherché :"+nomEns);
		$(".groupe_name").each(function() {
			var nomE = $(this).html().toLowerCase();
			var mDiv = $(this).parent().parent();
			var descE = $($(this).parent().find(".groupe_description")).html().toLowerCase();
			//logDebug("Does "+nomE+" or "+descE+" includes "+nomEns.toLowerCase())
			if (nomE.indexOf(nomEns.toLowerCase()) != -1 || descE.indexOf(nomEns.toLowerCase()) != -1 ) {
				$(mDiv).attr("style", "");
			} else {
				$(mDiv).attr("style", "display:none");
			}
		});
	} else {
		$(".groupe_name").each(function() {
			var nomE = $(this).html().toLowerCase();
			var mDiv = $(this).parent().parent();
			$(mDiv).attr("style", "");
		});
	}
}
/**
 * Utilisé dans la partie ajout de carte
 * 
 * level1 => depuis scan level2 => depuis consultation carte
 */
function verif_existence() {
	loaderOn();
	var numCarte = $("#numCarte").val().replace(" ", "");
	logDebug("Verification existence :"+numCarte);
	$("#erreur").html("");
	$("#erreur").attr("style", "display:none;");
	if (numCarte == null)
		numCarte = " ";
	// Appel synchrone, pour permettre au loader de se charger
	setTimeout(function() {
		// Pas nécessaire dans ce cas ci de recharger activate
		addCard(numCarte, false);
	}, 500);

}

/**
 * Rechargement => Form action
 * index.php?route=account/cartes/rechargement_ok&m=1
 */
function showRechargeForm(numCarte, numReseau, imgCarte) {

	appNav.pushPage("cardRecharge");

	setTimeout(function() {
		var cCarte = $.find('#cardRech-numCarte');
		$(cCarte).html(numCarte);
		var inputC = $.find("input[name='numCarte']");
		$(inputC).val(numCarte.replace(/ /g, ""));
		var img = $.find("img");
		$(img).attr("src", imgCarte);
	}, 500);

	setTimeout(loaderOff, 500);
}

/**
 * Fonction qui réalise l'envoi du formulaire de recharge
 */
function sendRechargeForm() {

	var destURL = GLOBAL_serverBase
			+ "index.php?route=account/cartes/rechargement_ok&m=1";
	var fData = new FormData();
	var lInput = $.find("#cardRech-form input");
	$.each(lInput, function() {
		fData.append($(this).attr("name"), $(this).val());
	});
	var opts = {
		url : destURL,
		data : fData,
		xhrFields : {
			withCredentials : true
		},
		type : 'POST',
		dataType : 'json',
		timeout : GLOBAL_appParams.reqTimeout,
		success : function(data2) {
			logDebug(data2);
			if (data2.success) {
				$("#cardRech-message").html("Carte rechargée avec succès !");
				$("#cardRech-message").attr("class", "text-success bg-success");
			} else {
				if (typeof data2.msg !== "undefined")
					$("#cardRech-message").html("Attention:" + data2.msg);
				else
					$("#cardRech-message").html(
							"Attention:" + data2.error_description);

				$("#cardRech-message").attr("class", "text-danger bg-danger");
			}
		},
		error : function(req, textStatus, errorThrown) {
			onReqErr("sendRechargeForm",req,textStatus);
		},
		complete : function() {
			loaderOff();
		}
	}
	if (fData.fake) {
		// Make sure no text encoding stuff is done by xhr
		/*
		 * opts.xhr = function() { var xhr = jQuery.ajaxSettings.xhr();
		 * logDebug("FORM"); xhr.send = xhr.sendAsBinary; logDebug(xhr); return
		 * xhr; }
		 */
		opts.contentType = "multipart/form-data; boundary=" + fData.boundary;
		opts.data = fData.toString();
	}

	$.ajax(opts)
}

/**
 * FOnction ouvrePopUp Utilisé pour les mentions légales et autres
 */

function ouvrePopUp(destURL) {
	appNav.pushPage('generic-popup')
	loaderOn();

	var opts = {
		url : destURL,
		xhrFields : {
			withCredentials : true
		},
		type : 'GET',
		dataType : 'html',
		timeout : GLOBAL_appParams.reqTimeout,
		success : function(data2) {
			$("#generic-content-popup").html($(data2).html());
		},
		error : function(error) {
			logDebug("ERROR: " + error.statusText);
			logDebug(error);
			$("#generic-content-popup")
					.html(
							"<h1>Une erreur s'est produite pendant le chargement de la page</h1>");
		},
		complete : function() {
			loaderOff();
		}
	}
	$.ajax(opts);
}

/**
 * CUSTOMER
 */

/**
 * COUPONTOOLS
 */

// MISE A JOUR URL DIR
function updateCToolsDir(isAsync) {
	if (typeof isAsync === "undefined")
		isAsync = false;
	// Récupération du dir couponTools avec appel AJAX
	var infos = {
		"os" : GLOBAL_device.os,
		"version" : GLOBAL_device.version,
		"model" : GLOBAL_device.model,
		"serial" : GLOBAL_device.serial,
		"push_token" : GLOBAL_device.push_token
	};

	var postData = {
		action : "coupons",
		content : JSON.stringify(infos)
	};

	// Faire apparaitre la trace dans les logs
	logDebug("[CTOOLS] Objet passé : =>  " + GLOBAL_traceServerURL + " "
			+ JSON.stringify(postData));

	// Envoi de la trace au serveur
	// SYNC AJAX CALL
	$.ajax({
		url : GLOBAL_traceServerURL,
		type : "POST",
		data : postData,
		async : isAsync,
		crossDomain : true,
		timeout : GLOBAL_appParams.reqTimeout,
		context : this,
		success : function(data) {
			// logDebug(data.urlCTools);
			GLOBAL_couponDirectory = data.urlCTools;
		},
		error : function(error) {
			logDebug(error);
		},
		dataType : "json"
	});
}

// APPEL DIRECTORY CTOOLS
function loadCToolsDir() {
	if (GLOBAL_couponDirectory.length == 0) {
		updateCToolsDir();
	}
	logDebug("[CTOOLS] urlDir = " + GLOBAL_couponDirectory);

	// Appel dans la frame

	$("#bonplan-frame").attr(
			"style",
			"margin-left:" + (window.innerWidth * 0.025) + "px; width:"
					+ (window.innerWidth * 0.95) + "px; height:"
					+ (window.innerHeight * 0.92) + "px; border:none;");
	$("#bonplan-frame").attr("src", GLOBAL_couponDirectory);
	setTimeout(function() {
		$("#bonplan-frame").attr(
				"style",
				"margin-left:" + (window.innerWidth * 0.025) + "px; width:"
						+ (window.innerWidth * 0.95) + "px; height:"
						+ (window.innerHeight * 0.95) + "px; border:none;");
		loaderOff();
	}, 5000);

}

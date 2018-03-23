/**
 * INFORMATIONS GLOBALES DE CONFIGURATION DE L'APPLICATION
 * 
 * Derniere modif : 
 *  => MP - 2017.08.29 -- Modif visuelles pour passer en FidLink 
 * /
 */
//Version
var GLOBAL_appVersion="1.1.60_PROD";
var GLOBAL_playStoreURL="https://play.google.com/store/apps/details?id=com.novatec.fidlink&hl=fr";

// BARCODE 
var GLOBAL_barcodeCache="";

// AUTHENTIFICATION - OPEN CART
var GLOBAL_authToken="";

//TURN ON OR OFF DEBUG MSG 
var GLOBAL_Debug = true;
var GLOBAL_logserverURL = "https://orion.novacorp.fr/novacard_log/logger.php";
//var GLOBAL_logserverURL = "https://dev.novacorp.fr/novacard_log/logger.php";
var GLOBAL_sendLogs = true;

//TRACE SYSTEM
var GLOBAL_sendTrace = true;
//var GLOBAL_traceServerURL = "https://dev.novacorp.fr/eurofid/scripts/novacard/webhook.php";
var GLOBAL_traceServerURL = "https://orion.novacorp.fr/eurofid/scripts/novacard/webhook.php";
//var GLOBAL_traceServerURL = "https://fidlink.novacorp.fr/eurofid/scripts/novacard/webhook.php";
//var GLOBAL_traceServerURL = "https://fidlink2.novacorp.fr/eurofid/scripts/novacard/webhook.php";

//NOVACARD
//<!> DEPRECATED <!>
//var GLOBAL_apiKey="z1U4RfK6PA2PY8Ajc1r0PbzFQX7HpaYmSPf04zGTZ61nfGgenbqQ88RcgScwa78qSBaOTokKjCEeylCk2rdTFTkK0A8cAiUnQbXcHGNaYt5qF44pRVyw8uO0FjG1n0UZUkP23wRycx1YxPvMT7zRZgPtWtU3Q1K6eutqg5pmRC18bHTMDTA6gEAq8YEuZh8TT1LJQhsGQFgEfsgySB31B1OJrYd7ZcMuyDGV14j8Tzmnr6FfsqFzJwknWiUlomvf";
//var GLOBAL_apiName="MobileApp";
//<!> DEPRECATED <!>

//DEV ONLY
//var GLOBAL_serverBase = "https://dev.novacorp.fr/novacard/";
//Timeout occasionnels
var GLOBAL_serverBase = "https://orion.novacorp.fr/novacard/";
//var GLOBAL_serverBase = "https://fidlink.novacorp.fr/novacard/";
//2017.09.06 Err 404 au login
//var GLOBAL_serverBase = "https://fidlink2.novacorp.fr/novacard/";
//var GLOBAL_serverBase = "https://orion.novacorp.fr/novacard/";

//Used for geolocation
//var GLOBAL_eurofidBase = "https://dev.novacorp.fr/eurofid/";
var GLOBAL_eurofidBase = "https://orion.novacorp.fr/eurofid/";
//var GLOBAL_eurofidBase = "https://fidlink.novacorp.fr/eurofid/";
//var GLOBAL_eurofidBase = "https://fidlink2.novacorp.fr/eurofid/";
//var GLOBAL_eurofidBase = "https://orion.novacorp.fr/eurofid/";

//Directory coupontools
var GLOBAL_couponDirectory = "";//"https://couponapp.directory/index.php?dir=IQSYbFzd7fhOkAmF7Xx34&app=true&deviceid="; 

var GLOBAL_apiId="";

//<!>DEPRECATED<!>
//var GLOBAL_credFilename = "Novacard_logon.json";
//<!> DEPRECATED <!>
//Alimenté par la fonction de login
var GLOBAL_credFilecontent = null;
var GLOBAL_credFileLength = 300;
var GLOBAL_loginRes = {success:false , msg:""} ;
var GLOBAL_device   = {os:"FFox", version:"MPEROUMA", model:"MONACA", serial:"XXXX", push_token:"" };
var GLOBAL_cardList = [];
var GLOBAL_userData = null;

var GLOBAL_isLogged = false;
//Utilisé uniquement si autologin activé
var GLOBAL_autoLogInProgress = false;
var GLOBAL_currentPushToken ="";
var GLOBAL_pushList =[];

var GLOBAL_yPos=0;

//Parametres application -- 2017.08.30
var GLOBAL_appParams ={
    autoLogin : true,
    autoLoadAccountForm : false,
    autoReloadCards : false,
    autoReloadBonplans : false,
    showVersion: false,
    askGeo: true,
    //Timeout de request (ms)
    reqTimeout:40000,
    switch_env_cpt:0,
    current_env:"prod"
};

//Page édition du compte 
GLOBAL_reloadAccountPage=true;

// GEOLOCATION
var GLOBAL_geoPosition = {longitude:-61.5784549, latitude:16.2538111, accuracy:null, altitudeAccuracy:null, heading:null, speed:null, timestamp:null, Map:null};

/**
 * AJUSTEMENTS CSS PAR RAPPORT A LA TAILLE DU DEVICE
 */
function styleAdjust(){
	var screenW = $(document).width();
	var screenH= $(document).height();
	var toolbarH = $(".toolbar").height();
	var tabbarH = $(".ons-tabbar__footer").height();
	
	
	
	logDebug("[CSS] Dimensions device : "+screenW+"px X "+screenH+"px  Tabbar height: "+tabbarH+"px ");
	logDebug("[CSS] Loader ajust Height: "+(screenH-tabbarH-toolbarH)+"px  margin-top "+toolbarH+"px ");
	
	//var style=".spinner{ height:"+(screenH-tabbarH)+"px !important} ";
	//$("style").html(style);
	$(".spinner").attr("style","height:"+(screenH-tabbarH-toolbarH)+"px !important; margin-top:"+toolbarH+"px !important;");
	
	//Adaptations visuelles à la volée
switch(GLOBAL_device.os){
	case "iOS":
		//Bande du haut pour logo
		logDebug("[CSS]IOs adaptation");
		$(".button--barbutton").attr("style","top:15px !important;");
		$("#styleFly").html("<style>" +
				".toolbar {"+
				"background-size: auto 68% !important; background-position: center 15px !important;"+
				"}"+
				"</style>");
		break;
	//Android and default (undefined)
	 default:
		logDebug("[CSS]Android and default");
		break;
	}
}

//Permet de basculer de la prod vers dev et vice-versa
function switchTo(env){
	switch(env){
		case "dev":
				GLOBAL_traceServerURL = "https://fidlink.novacorp.fr/eurofid/scripts/novacard/webhook.php";
				//DEV ONLY
				GLOBAL_serverBase = "https://fidlink.novacorp.fr/novacard/";
				GLOBAL_eurofidBase = "https://fidlink.novacorp.fr/eurofid/";	
			break;
		case "prod":
			default:
				GLOBAL_traceServerURL = "https://orion.novacorp.fr/eurofid/scripts/novacard/webhook.php";
				GLOBAL_serverBase = "https://orion.novacorp.fr/novacard/";
				GLOBAL_eurofidBase = "https://orion.novacorp.fr/eurofid/";
			break;
	}
	GLOBAL_appParams.switch_env_cpt=0;
	GLOBAL_appParams.current_env=env;
	dialogBox("FIDLINK BASCULE","Vous venez de basculer en environnement de "+env,null,"OK");
	logDebug("[ENV] Bascule effectuée en environnement de "+env);
	logout();
}


function pullHookOn(){
  logDebug("PullHook ON");
  var elem = $.find("#pull-hook");
  var mgL = $(document).width()/2 - 20;
  $(elem).html("<span class=\"loading\"  style=\"margin-left:"+mgL+"px\"></span>");
  $(elem).attr("class","in-load");
  //Modif faite par rapport au pb avec le pull hook et les listes
  $(elem).removeClass("hidden");
}

function pullHookOff(){
	logDebug("PullHook OFF");
	var elem = $.find("#pull-hook");
	 var mgL = $(document).width()/2 - 20;
	$(elem).html("<span class=\"preload\" style=\"margin-left:"+mgL+"px\"></span>");
	$(elem).attr("class","in-load");
	//Modif faite par rapport au pb avec le pull hook et les listes
	$(elem).addClass("hidden");
}

function loadRefreshOn(){
	$("#refresh-button").addClass("load-refresh");
}

function showRefresh(){
	$("#refresh-button").removeClass("hidden");
}

function hideRefresh(){
	$("#refresh-button").addClass("hidden");
}


function loaderOn() {
    logDebug("LoaderOn");
    var elem = $.find(".spinner");
    $(elem).removeClass("hidden");
}
function loaderOff() {
    logDebug("LoaderOff");
	var elem = $.find(".spinner");
    $(elem).addClass("hidden");
    $("#refresh-button").removeClass("load-refresh");
    pullHookOff();
}

function dragStart(){
	GLOBAL_dragRecord.x=0;
	GLOBAL_dragRecord.y=0;
}

function dragEnd(){
	GLOBAL_dragRecord.x=0;
	GLOBAL_dragRecord.y=0;
}

function versionOn(){
	 logDebug("Version pop on");
	 var elem = $.find(".version-pop");
	 $(elem).removeClass("hidden");
}

function versionOff(){
	 logDebug("Version pop off");
	 var elem = $.find(".version-pop");
	 $(elem).addClass("hidden");
}



function populateDevice (){
    //console.log(device.cordova);
	//logDebug("Collect device info :");
	if(typeof device !== "undefined"){
	    GLOBAL_device.os = device.platform;
        if(typeof device.version !== "undefined")
	      GLOBAL_device.version = device.version;
	    if(typeof device.model !== "undefined")
          GLOBAL_device.model = device.model;
        if(typeof device.uuid !== "undefined")
	      GLOBAL_device.serial = device.uuid;
        //Token push récupéré en asynchrone
        if(GLOBAL_currentPushToken !== "")
          GLOBAL_device.push_token = GLOBAL_currentPushToken; 
         
	}
	else if(GLOBAL_device.serial.length == 0){
		var date = new Date(Date.now());
		//Cas ou le plugin device ne fonctionne pas
		GLOBAL_device.os = "UNKNOWN";
        GLOBAL_device.model ="UNKNOWN";
		GLOBAL_device.serial = date.getFullYear()+"." + 
		handleSingleDigit(date.getMonth()+1) + "."
        + handleSingleDigit(date.getDate()) + "."
        + handleSingleDigit(handleHours(date.getHours())) + 
        + handleSingleDigit(date.getMinutes()) + 
        + handleSingleDigit(date.getSeconds());
	}
    //logDebug(GLOBAL_device);
}

/*
 * Fonction utilisée en cas d'échec sur une req AJAX
 */
function onReqErr(callF,req,textStatus){
	var motif = "";
	if (req.readyState == 4) {
		// HTTP error (can be checked by
		// XMLHttpRequest.status and
		// XMLHttpRequest.statusText)
		motif = "Oups ! Le service demandé est indisponible... <br/>";
		motif += "<b>Erreur:</b> " + textStatus;
		motif += "<h3> Veuillez réessayer ultérieurement ou relancer l'application !</h3>";
	} else if (req.readyState == 0) {
		// Network error (i.e. connection refused, access
		// denied due to
		// CORS, etc.)
		motif = "Oups ! Une erreur réseau s'est produite ... <br/>";
		motif += "<b>Erreur:</b> " + req.statusText + "<br/>";
		motif += "<h3> Veuillez vérifier votre connexion et relancer l'application !</h3>";
	} else {
		// something weird is happening
		motif = "Oups ! Là c'est bizarre... <br/>";
		motif += "<b>Erreur:</b>" + textStatus;
		motif += "<h3> Veuillez relancer l'application !</h3>";
	}
	logDebug("["+callF+"]" + motif);
	setTimeout(function(){
		appNav.pushPage("unavailable");
		setTimeout(function(){
			$("#unavailable-motif").html(motif);
		},500);
	},500);
}

function getFormattedDate(format) {
    var date = new Date(Date.now()),
        formattedDate;

    formattedDate = date.getFullYear() + "-"
                  + handleSingleDigit(date.getMonth()+1) + "-"
                  + handleSingleDigit(date.getDate()) + " "
                  + handleSingleDigit(handleHours(date.getHours())) + ":"
                  + handleSingleDigit(date.getMinutes()) + ":"
                  + handleSingleDigit(date.getSeconds()) + "."
                  + handleSingleDigit(date.getMilliseconds()) + " "
                  + (date.getHours() < 12 ? "AM" : "PM");

    return formattedDate;
}

// Prepends 0 to a single digit number.
function handleSingleDigit(num) {
    return (( num.toString().length === 1 ) ? "0" + num : num);
}


// Accepts an hour 0-23, returns 1-12
function handleHours(hours) {
    hours = (hours > 12 ? hours-12 : hours);
    if ( hours.toString() === "0" ) hours = "12";
    return hours;
}

function logDebug(message){
	//Pour une lecture des logs en local
    if(GLOBAL_Debug && !GLOBAL_sendLogs){
        var date = getFormattedDate();
        var callerName = "undefined";
        if(arguments.callee.caller != null)
            callerName = arguments.callee.caller.name;
        
        if(typeof message != "string"){
        	console.log("["+date+"]["+callerName+"] Objet passé : "+JSON.stringify(message));
        	
        }
        else{
        	console.log("["+date+"]["+callerName+"]"+message);
        }
    }
    
    if(GLOBAL_sendLogs){
    	//Send logs through an ajax async call
        var date = getFormattedDate();
        var callerName = "undefined";
        if(arguments.callee.caller != null)
            callerName = arguments.callee.caller.name;
        
    	populateDevice();
    	var device = GLOBAL_device.model+"_"+GLOBAL_device.os+"_"+GLOBAL_device.version;
    	var serial = GLOBAL_device.serial;
    	var msg = "";
    	if(typeof message != "string"){
        	msg="["+date+"]["+callerName+"]["+GLOBAL_appVersion+"] Objet passé : "+JSON.stringify(message);
        	
        }
        else{
        	msg="["+date+"]["+callerName+"]["+GLOBAL_appVersion+"]"+message;
        }
    	
    	//ASYNC AJAX CALL
    	var postData = {
    		"serial" : serial,
    		"device" : device,
    		"log": msg
    	};
		$.ajax({
			type : "POST",
			url : GLOBAL_logserverURL ,
			data : postData,
			success : function(data) {
			},
			error : function(error){
				
			},
			dataType : "html"
		});
    }
}

/**
 * Fonction qui permet de remonter les infos du device au serveur eurofid
 */
function trace(a, c){
    var postData ={
        action : a,
        content : c
    };
    
    //Faire apparaitre la trace dans les logs
    logDebug("[TRACE] Objet passé : =>  "+GLOBAL_traceServerURL+" "+JSON.stringify(postData));
    
    //Envoi de la trace au serveur
    //ASYNC AJAX CALL
	$.ajax({
        url : GLOBAL_traceServerURL ,
		type : "POST",
		data : postData,
        crossDomain : true,
		success : function(data) {
		},
		error : function(error){
			
		},
		dataType : "json"
	});
}




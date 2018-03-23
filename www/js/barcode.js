/**
 * FONCTIONNALITES DE LECTURE ET D'EXPLOITATION DU CODE-BARRE
 * Attention, repose sur le plugin monaca mobi.monaca.plugins.BarcodeScanner
 * => https://docs.monaca.io/en/reference/third_party_phonegap/barcode_scanner/
 * 
 * Derniere modif : 
 *  => MP - 2016.12.12 -- Création du fichier 
 */
 
    
function scanBarcode() {
	 logDebug("[SCAN] Lancement scan");
    $("#scanError").html("");
    
    // 2017.04.10 - Mise en place du nouveau workflow d'enrolement, pas de vérif si loggé
        try{
            
            cordova.plugins.barcodeScanner.scan(
                function(result) {
                    GLOBAL_barcodeCache=result.text;
                    if(GLOBAL_barcodeCache.length > 3){
                    	loaderOn();
                        setTimeout(processBarcode,500);
                    }
                    else{
                      //Retiré à la demande de XB - 2017.09.17
                      //$("#scanError").html("Code-barre non reconnu");
                      appNav.popPage();
                      loaderOff();
                    }
                }, 
                function(error) {
                    $("#scanError").html("Erreur lors de la lecture du code-barre");
                    loaderOff();
                }
                //<!> There is an option that blocks the plugin execution on iOs <!>
                /*{
                  "preferFrontCamera" : true, // iOS and Android
                  "showFlipCameraButton" : true, // iOS and Android
                  "showTorchButton" : true, // iOS and Android
                  "disableAnimations" : true, // iOS
                  "prompt" : "Placer le code-barre au centre de la fenêtre", // supported on Android only
                  "formats" : "QR_CODE,PDF_417", // default: all but PDF_417 and RSS_EXPANDED
                  "orientation" : "portrait" // Android only (portrait|landscape), default unset so it rotates with the device 
                }*/
            );
          //Envoyer le formulaire classique de saisie de carte en cas d'exception
          loadPage({credentials: GLOBAL_isLogged, destination:'activer', level:1});
        }
        catch(e){
            logDebug("Erreur lors de l'utilisation du plugin :"+e.name);
            logDebug(e);
            switch(e.name){
                case "TypeError":
                default :
                    $("#scanError").html("Scan indisponible !");
                	loadPage({credentials: GLOBAL_isLogged, destination:'activer', level:1});
                    break;
                
            }
            loaderOff();
        }
 }

/**
 * Fonction qui réalise les traitements postérieurs à la lecture du code barre
 * Fait appel à la fonction loadPage définie dans le fichier d'API actif (nomPlateformeAPI.js => openCartAPI.js par exemple)
 */
function processBarcode(){
    $("#scanError").html("");
    //Format du codeBarre <urlbase>/index.php?cardID=<numcard>
    logDebug("Code barre lu: "+GLOBAL_barcodeCache);
    var argList = GLOBAL_barcodeCache.split("?");
    
    //Rajout controle complémentaire format code barre -- 2017.12.06
    if(argList.length < 2){
    	$("#scanError").html("Code barre incorrect ");
    	logDebug("Nb elements : "+argList.length);
    	logDebug(argList);
    	appNav.popPage();
    	loaderOff();
    	return null;
    }
    //Retirer le dernier caractère
    //argList = argList.substring(0, argList.length - 1);
    //console.log("List arg: "+argList);
    
    var fData = new FormData();
    var numRezo = -1;
    var cardID = null;
    var typeTransac = null;
    var expList = argList[1].split("&");
    
    //Si le code barre n'est pas au bon format
    if(expList.length == 0){
    	$("#scanError").html("Code barre non reconnu");
    	logDebug("Nb elements : "+expList.length);
    	logDebug(expList);
    	appNav.popPage();
    	loaderOff();
    	return null;
    }
    //logDebug(expList);
    
    $.each(expList, function(){
        var kVal = this.split("=");
        if(kVal.length == 2){
	        fData.append(kVal[0],kVal[1]);
	        
	        if(kVal[0]=="r")
	            numRezo = kVal[1];
	            
	        if(kVal[0]=="cardID")
	            cardID = kVal[1];
	        
	        if(kVal[0]=="typeTransac")
	            typeTransac = kVal[1];
        }
    });
   
    //console.log("CardID: "+ cardID +" numRezo: "+numRezo);
    if(cardID == null ){
        //Cas de la recharge, pas de card id
    	 logDebug("PROCESSBARCODE => RECHARGE :");
    	 logDebug(expList);
    	 logDebug(fData);
        //Recharger les cartes utilisateurs
        loadCartes(false);
        
        //Si l'utilisateur possède une carte dans le réseau
        if(typeof GLOBAL_cardList[numRezo] !=="undefined"){
            
            //Par défaut, on prend la première carte du réseau en question pour ajouter la recharge
            if(typeof GLOBAL_cardList[numRezo][0] !== "undefined"){
                
                fData.append("numCarte",(GLOBAL_cardList[numRezo][0]).replace(/ /g,""));
                logDebug("PROCESSBARCODE RECHARGE => CARTE CHOISIE:"+GLOBAL_cardList[numRezo][0]);
                var destURL = GLOBAL_serverBase+"index.php?route=account/cartes/rechargement_ok&m=1";
                var opts={
                    url: destURL,
                    data: fData,
                    xhrFields: { withCredentials: true },
                    type: 'POST',
                    dataType:'json',
                    success: function(data2){
                        //console.log(data2);
                        if(data2.success){
                            //CAS OK
                        	appNav.popPage();
                        	logDebug("PROCESSBARCODE RECHARGE => Recharge OK ");
                        	$("#scanError").attr("class","text-success bg-success");
                            $("#scanError").html("Félicitations, votre recharge est comptabilisée !");
                            //Recharger la page des cartes
                            setTimeout(function(){
                            	appTab.setActiveTab(0);
                            	//Donner le temps pour le page reload
                            	setTimeout(function(){
                            		tabLoad(true);
                            	},200);
                            },1500);
                        }
                        else{
                            if(typeof data2.msg !== "undefined"){
                            	appNav.popPage();
                            	logDebug("PROCESSBARCODE RECHARGE => Recharge KO :"+data2.msg);
                                $("#scanError").html("Attention: " +data2.msg);
                            }
                            else{
                            	appNav.popPage();
                            	logDebug("PROCESSBARCODE RECHARGE => Recharge KO :"+data2.error_description);
                                $("#scanError").html("Attention: " +data2.error_description);
                            }
                        }
                        loaderOff();
                    },
                    error: function(error){
                        //Retour à la page d'erreur
                    	appNav.popPage();
                    	logDebug("PROCESSBARCODE RECHARGE => Erreur recharge :"+error.responseText);
                        $("#scanError").html("Erreur recharge:"+error.responseText);
                        loaderOff();
                }};
                
                if(fData.fake) {
                    // Make sure no text encoding stuff is done by xhr
                    /*opts.xhr = function() { 
                        var xhr = jQuery.ajaxSettings.xhr(); 
                        console.log("FORM");
                        xhr.send = xhr.sendAsBinary; 
                        console.log(xhr);
                        return xhr; 
                    }*/
                    opts.contentType = "multipart/form-data; boundary="+fData.boundary;
                    opts.data = fData.toString();
                }
                
                try{
                    $.ajax(opts);
                }
                catch(e){
                	appNav.popPage();
                    logDebug(e.message)
                    $("#scanError").html("Une erreur inconnue s'est produite, veuillez réessayer");
                    loaderOff();
                }
            }
            else{
            	appNav.popPage();
            	logDebug("[RECHARGE] Aucune carte disponible pour la recharge scannée !");
            	logDebug(GLOBAL_cardList);
                $("#scanError").html("Aucune carte disponible pour la recharge scannée !");
                loaderOff();                
            }
        }
        else{
        	appNav.popPage();
        	logDebug("[RECHARGE] Aucune carte disponible pour la recharge scannée [2] !");
        	logDebug(GLOBAL_cardList);
            $("#scanError").html("Aucune carte disponible pour la recharge scannée !");
            loaderOff();
        }
    }
    else{
        if(typeTransac !== null){
            
            switch(parseInt(typeTransac)){
                case 97:
                    //Init
                default:
                    //Cas d'un ajout de carte
                	logDebug("[ACTIVATION] Cas ajout de carte 97");
                	addCard(cardID);
                break;
            }
            
        }
        else{
          //Cas d'un ajout de carte
          logDebug("[ACTIVATION] Cas ajout de carte NORMAL");
      	  addCard(cardID);
        } 
    }
}
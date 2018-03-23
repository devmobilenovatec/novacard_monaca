/**
 * Fonctions globales liées à la gestion 
 * de l'authentification
 * 
 * Date der modif : 2016-12-27 
 */
 
 
 /**
  * Fonction qui vérifie s'il y a déjà au moins un profil stocké
  */
 function getProfilesLS(){
	 logDebug("Vérification des profils enregistrés");
	 var storage = window.localStorage;
	 var availableProfiles =[];
	 
	 for ( var i = 0, len = storage.length; i < len; ++i ) {
		  availableProfiles[i] = storage.getItem( storage.key( i ) );
	 }
	 logDebug(availableProfiles.length+" profil(s) trouvés ") 
	 return availableProfiles;
 }
 
 /**
  * Fonction qui utilise le localStorage pour lire le dernier profil utilisé
  */
 function readLoginLS(profileNumber){
     logDebug("Recherche du profil :"+profileNumber);
     var profEntry = profileNumber;
     var storage = window.localStorage;
     if(profileNumber==null){
         profileNumber="last";
     }
     var credentials=null;
     var sData = storage.getItem(profileNumber);
     if (sData != null){
        logDebug ("Profil trouvé :"+sData);
        return JSON.parse(sData);
     }
     else{
        logDebug ("Aucune donnée trouvée !");
        return null;
     }
 }
 
 /**
  * Fonction qui écrit les informations de login dans le localStorage, met à jour last par défaut
  */
 function writeLoginLS(username, password){
     var profEntry = username;
     var storage = window.localStorage;
     var loginChain = JSON.stringify({user:username, pass:password});
     
     logDebug("Enregistrement du profil :"+profEntry+" "+loginChain);
     storage.setItem(profEntry, loginChain);
     //Mettre à jour le dernier login utilisé
     if(profEntry != "last"){
         logDebug("Mise à jour du dernier profil utilisé :"+profEntry+" "+loginChain);
         storage.setItem("last", loginChain);
     }
 }
 
 /**
  * Fonction qui réalise l'authentification en back
  */ 
 function silentLogin(){
    //GLOBAL_credFilecontent=readLoginLS("last");
  
    if(typeof GLOBAL_credFilecontent !== "undefined"){
    	//Uniquement si du crédential
    	GLOBAL_autoLogInProgress = true;
        logDebug("[AUTOLOGIN] : "+GLOBAL_credFilecontent.user+" "+GLOBAL_credFilecontent.pass);
        //Rajouter le body spinner
        $("#mescartes-body").attr("class","body-spinner");
        loginF(GLOBAL_credFilecontent.user,GLOBAL_credFilecontent.pass, postLogin);
    }
    return 0;
 }
 
 
 /**
  * Fonction qui remplit automatiquement les champs login 
  * et mot de passe à partir des données enregistrées en local
  * Repose sur le plugin http://ngcordova.com/docs/plugins/file/
  * https://www.html5rocks.com/en/tutorials/file/filesystem/
  * => on va utiliser le système de fichiers temporaire
  */ 
 function loadLogin(complement){
    logDebug("Loading login info");
    var fileContent = null;
    loaderOn();
    GLOBAL_credFilecontent = readLoginLS("last");
   
    setTimeout(function(){
   
    	if(GLOBAL_credFilecontent !== null){
            	//Cacher les champs de login / mdp
            	$("#login-form"+complement+" h3").html("");
            	$("#login"+complement).attr("type","hidden");
            	$("#password"+complement).attr("type","hidden");
            	$("#login"+complement).attr("style","display:none !important");
            	$("#password"+complement).attr("style","display:none !important");
                $("#login"+complement).val(GLOBAL_credFilecontent.user);
                $("#password"+complement).val(GLOBAL_credFilecontent.pass);
                $("#login-profile-name").html(GLOBAL_credFilecontent.user)
                //Afficher le champ d'input joli
                $("#login-profile").attr("class","");
                //Changer les boutons du bas
                $("#login-forgotten"+complement).html("<span>Changer d'utilisateur</span>");
                $("#login-forgotten"+complement).attr("onclick","appNav.pushPage('login');");
                $("#login-recall").remove();
                $("#login-submit").attr("style","margin-left:0 !important");
                
            }else{
            	logDebug("[LOADLOGIN] Impossible de trouver les informations de login");
            	//logDebug(GLOBAL_credFilecontent);
            	$("#login-msg"+complement).attr("class","text-info bg-info");
                $("#login-msg"+complement).html("Veuillez saisir votre identifiant<br/> et votre mot de passe");
            }
        loaderOff();
    }, 500);
    return 0;
 }
 
 //Fonction qui réalise l'authentification à proprement parler
 function login(complement){
    var username=$("#login"+complement).val();
    var password=$("#password"+complement).val(); 
    logDebug("TENTATIVE LOGIN :"+username+" "+password);
    loaderOn();
    setTimeout(function(){
        loginF(username,password,postLogin);
    },300);
    //logDebug(GLOBAL_loginRes);    
}

//Fonction exécutée lorsque l'appel AJAX est terminé
function postLogin(){
    logDebug("POSTLOGIN");
    if(GLOBAL_loginRes.success){
    	// Charger la pushList <!> DEBUG ONLY <!>
    	loadPushList();
    	
        //saveLogin(GLOBAL_userData["username"],GLOBAL_userData["password"]);
        writeLoginLS(GLOBAL_userData["username"],GLOBAL_userData["password"]);
        logDebug("POSTLOGIN : connection acceptée");
        $("#login-msg").attr("class","success bg-success");
        $("#login-msg").html(GLOBAL_loginRes.msg);
        //logDebug(GLOBAL_userData);
        loaderOn();
        showPrivateIcons();
        setTimeout(function(){
            if(GLOBAL_userData != null){
                logDebug("LOGIN : Load cards");
                //Timeout pour permettre que le popPage s'exécute
                loadPage({destination:'consulter', credentials:true, local: true, divId:"#mescartes-body", animation:'fade'});
            }
        },500);
        //Utile lorsque l'on se connecte depuis la page de login
        //Sinon pop d'une pile vide (warning dans les logs)
        var pLength = appNav.pages.length;
        //logDebug("Page stack length :"+pLength);
        if(pLength>1)
            appNav.popPage();
    }
    else{
        logDebug("POSTLOGIN : echec de connection");
        logDebug(GLOBAL_loginRes.msg);
        loaderOff();
        //appTab.setActiveTab(0);
        setTimeout(function(){
        	$("#login-msg").attr("class","danger text-danger bg-danger");
        	$("#login-msg").html(GLOBAL_loginRes.msg);
        	//setTimeout(function(){loadPage({destination:'register', credentials:true, local: true, divId:"#mescartes-content"});},500);
        	hidePrivateIcons();
        },200);
    }
    //Recharger le tab courant, ça fait pas de mal
    //setTimeout(function(){
    //	tabLoad(false);
    //},200);
}

 //permet de se déconnecter
 function logout(){
     GLOBAL_loginRes.success=false;
     GLOBAL_userData = null;
     loaderOn();
     loadPage({destination:'logout', credentials:true, 'silent':true});
     hidePrivateIcons();
     //appNav.pushPage('login');
    
    //Reinit des infos du formulaire de login
    $("#login-form").attr("class","");
 	$("#login-msg").attr("class","");
 	$("#login-msg").html(" ");
 }

  //Affiche les icones
  function showPrivateIcons(){
    $(".button--private").each(function(index,value){
        $(this).attr("style","visibility:visible");
    });  
    
    $(".button--public").each(function(index,value){
        $(this).attr("style","display:none");
    });
  }
  
  //Cache les icones
  function hidePrivateIcons(){
    //logDebug("Hide private");
    $(".button--private").each(function(index,value){
        $(this).attr("style","");
    });
    
    $(".button--public").each(function(index,value){
        $(this).attr("style","");
    });
    
    //Remettre le login form d'applomb
    $("#mescartes-header").attr("class","hidden");
	$("#mescartes-body").attr("class","hidden");
	
	//Si la fonctionnalité de login-form est activée, recharger le formulaire par défaut
	if(GLOBAL_appParams.autoLoadAccountForm){
            loadPage({destination:'register', credentials:false, force_logout: true, local:true, divId:'#account-menu'});
    }
  }

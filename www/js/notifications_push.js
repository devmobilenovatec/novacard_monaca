// This is a JavaScript file that populate push token to the server
//=> https://github.com/arnesson/cordova-plugin-firebase

function saveDeviceToken(token) {
	if (token !== GLOBAL_currentPushToken) {
		GLOBAL_currentPushToken = token;
		GLOBAL_device.push_token = token;
	}
}

/* récupération des statuts notifications push */
function ecouterPushNotification() {
	if (typeof window.FirebasePlugin == "undefined") {
		logDebug("[PUSH] Incompatibilite avec le plugin firebase");
		return null;
	} else {
		// Charger la pushList
		loadPushList();
	}
	window.FirebasePlugin.getToken(function(token) {
		// save this server-side and use it to push notifications to this device
		saveDeviceToken(token);
		logDebug("[PUSH] Push Token Received for this Device: " + token);

	}, function(error) {
		logDebug("[PUSH] Push Token Not Received cause this error: " + error);
	});

	window.FirebasePlugin.onTokenRefresh(function(token) {
		// save this server-side and use it to push notifications to this device
		saveDeviceToken(token);
		logDebug("[PUSH] Push Token Refresh: " + token)
	}, function(error) {
		logDebug("[PUSH] Push Token Not Received cause this error: " + error);
	});

	window.FirebasePlugin.onNotificationOpen(function(notification) {
		// popup the notification if New notification not open yet
		var date = getFormattedDate();
		var titre = null;
		var msg = null;
		
		logDebug("[PUSH] Notification open:"+notification);
		logDebug(notification);
		//Suivant les versions de device, le plugin ne se comporte pas pareil sur l'objet reçu
		if(typeof notification.titre != "undefined" && notification.titre.length > 0)
			titre=notification.titre;
		
		if(typeof notification.message != "undefined" && notification.message.length > 0)
			msg = notification.message;
		
		//Stocker le push uniquement si le message et le titre sont non nuls
		if(msg!= null && titre !=null){
			GLOBAL_pushList [GLOBAL_pushList.length]={
				"statut" : notification.tap,
				"titre": titre,
				"message" : msg,
				"date" : notification.date,
				"reseau" : notification.idRes
			};
			// Sauvegarder la push list
			savePushList();
		
			//Lorsque l'appli s'ouvre
			alertBox(notification.titre, notification.message,"push-alert","OK !");	
		}

	}, function(error) {
		logDebug("Push Token Not Received cause this error: " + error);
	});
}

/* Ne voulant plus de notification push */
function unsubscribeFromNovacardPush(token) {
	window.FirebasePlugin.unregister();
	// update BO
	// UnsubscribeForPush(deviceId,token);
}

function loadNotifs(){
	logDebug("[PUSH] Chargement notifications pour visualisation")
	if(GLOBAL_pushList.length > 0){
		$("#notifs-list").html(" ");
		var content = "";
		var cRead = "";
		var i=0;
		$(GLOBAL_pushList).each(
				function(){
					logDebug(this);
					if(!this.statut)
						cRead="unread";
					else
						cRead="";
					content+="<div class='row "+cRead+"' onclick='expandNotif(this,"+i+");'>";
					content+="<div class='notif-date col-xs-3'>";
					content+=this.date;
					content+="</div>";
					content+="<div class='notif-titre col-xs-7'>";
					content+=this.titre;
					content+="</div>";
					content+="<div class='notif-del col-xs-1'>";
					content+="<icon class='fa fa-trash-o' onclick='deleteNotif(this,"+i+");'></icon>";
					content+="</div>";
					content+="<div class='notif-content col-xs-12 hidden'>";
					content+=this.message;
					content+="</div>";
					
					content+="</div>";
					i++;
				}
		);
		content+="";
		$("#notifs-list").html(content);
	}
}

function expandNotif(el,index){
	var notif = $(el).find(".notif-content");
	if($(notif).hasClass("hidden"))
		$(notif).removeClass("hidden");
	else
		$(notif).addClass("hidden");
	
	if($(el).hasClass("unread")){
		GLOBAL_pushList[index].statut=true;
		savePushList();
		//Recharger la liste de notif et mettre à jour
		loadPushList();
		$(el).removeClass("unread");
	}
}

function deleteNotif(el,index){
	var notif = $(el).parent().parent();
	
	if(GLOBAL_pushList.length >1)
		GLOBAL_pushList.splice(index,1);
	else
		GLOBAL_pushList = null;
	
	savePushList();
	if(GLOBAL_pushList !=null)
		$(notif).attr("style","display:none");
	else
		$("#notifs-list").html("<h4>Aucune notification</h4>");
}

/**
 * Fonction qui permet de charger la pushList
 */
function loadPushList() {
	logDebug("[PUSH] Récupération de la PushList");
	var storage = window.localStorage;
	var sData = storage.getItem("pushList");
	if (sData != null) {
		logDebug("[PUSH] Push list trouvée :" + sData);
		GLOBAL_pushList = JSON.parse(sData);
		var isUnread = false;
		logDebug("[PUSH] Verification si notifs non lues ");
		$(GLOBAL_pushList).each(
			function(){
				logDebug(this)
				if(!this.statut){
					isUnread = true;
				}
			}
		);
		if(isUnread){
			logDebug("[PUSH] Notif non lue trouvée ");
			//console.log($("#notif-ico").html());
			$(".button--notif").html("<ons-icon icon='fa-envelope'></ons-icon>");	
		}
		else{
			$(".button--notif").html("<ons-icon icon='fa-envelope-o'></ons-icon>");
		}
		return true
	} else {
		logDebug("[PUSH] Aucune donnée trouvée !");
		return false;
	}
}

/**
 * Fonction qui écrit la pushList dans le localStorage
 */
function savePushList() {
	var storage = window.localStorage;
	if(GLOBAL_pushList != null){
		if(GLOBAL_pushList.length>0){
			var pLChain = JSON.stringify(GLOBAL_pushList);
			logDebug("[PUSH] Enregistrement de la pushList " + pLChain);
			storage.setItem("pushList", pLChain);
		}
	}else{
		logDebug("[PUSH] Push liste vide !");
		storage.setItem("pushList", null);
	}
}
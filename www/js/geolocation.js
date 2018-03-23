/**
 * FONCTIONNALITES DE GEOLOCALISATION <=> OPENCART
 * Attention, repose sur le plugin cordova geolocation
 * => https://docs.monaca.io/en/reference/cordova_3.5/geolocation/
 * => https://github.com/apache/cordova-plugin-geolocation/blob/master/README.md
 * Derniere modif : 
 *  => MP - 2017.09.13 -- Mise à jour gestion géoloc et position par défaut 
 */

    function updateGeoPosition(){
    	try{
        	if(GLOBAL_appParams.askGeo){
	    		cordova.plugins.locationAccuracy.canRequest(function(canRequest){
	    			if(canRequest){
	    				cordova.plugins.locationAccuracy.request(function (success){
	    					logDebug("[GEOLOC] Demande accuracy OK : "+success.message);
	    	        }, function (error){
	    	        		//Ne pas redemander en cas d'erreur
	    	        		GLOBAL_appParams.askGeo=false;
	    	        		//On garde les positions par défaut
	    	        		logDebug("[ECHEC DEMANDE ACCURACY]"+error.code+"; error message="+error.message);
	    	        		if(error.code !== cordova.plugins.locationAccuracy.ERROR_USER_DISAGREED){
	    	        			if(window.confirm("Nous n'avons pas pu effectuer le réglage géographique automatiquement, souhaitez vous le réaliser manuellement ? ")){
	    	        				cordova.plugins.diagnostic.switchToLocationSettings();
	    	        			}
	    	        		}
	    	        }, cordova.plugins.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY);
	    	    }
	    		});
        	}
     		  //Appel à la méthode navigator
            navigator.geolocation.getCurrentPosition(onSuccess, onError);
    	}
        catch(e){
            logDebug("Erreur lors de l'utilisation du plugin :"+e.name);
            logDebug(e);
            //Appel à la fonction d'erreur
            onError(e);
            switch(e.name){
                case "TypeError":
                default :
                    //$("#scanError").html("Scan indisponible !");
                    break;
                
            }
            loaderOff();
        }
      
    }
    // onSuccess Callback
    // This method accepts a Position object, which contains the
    // current GPS coordinates
    //
    var onSuccess = function(position) {
        GLOBAL_geoPosition["latitude"]=position.coords.latitude;
        GLOBAL_geoPosition["longitude"]=position.coords.longitude;
        GLOBAL_geoPosition["altitude"]=position.coords.altitude;
        GLOBAL_geoPosition["accuracy"]=position.coords.accuracy;
        GLOBAL_geoPosition["altitudeAccuracy"]=position.coords.altitudeAccuracy;
        GLOBAL_geoPosition["heading"]=position.coords.heading;
        GLOBAL_geoPosition["speed"]=position.coords.speed;
        GLOBAL_geoPosition["timestamp"]=position.timestamp;
        logDebug('[GEOLOCATION] Init OK');
        debugPosition();
        
        //Appel à la fonction de géolocalisation en utilisant l'API Eurofid directement
        //car la fonctionnalité n'est pas présente sur OpenCart
        
        
    };
    
    // onError Callback receives a PositionError object
    //
    function onError(error) {
        //Position par défaut
        GLOBAL_geoPosition["latitude"]=16.2538111;
        GLOBAL_geoPosition["longitude"]=-61.5784549;
        //GLOBAL_geoPosition["longitude"]=-1*Math.random()*100
        logDebug('[GEOLOCATION]Impossible de lire les coordonnées GPS ! \n'+
              'code: '    + error.code    + '\n' +
              'message: ' + error.message + '\n');
        debugPosition();
    }
    
    function debugPosition(){
     logDebug('Latitude: '          + GLOBAL_geoPosition.latitude          + '\n' +
      'Longitude: '         + GLOBAL_geoPosition.longitude         + '\n' +
      'Altitude: '          + GLOBAL_geoPosition.altitude          + '\n' +
      'Accuracy: '          + GLOBAL_geoPosition.accuracy          + '\n' +
      'Altitude Accuracy: ' + GLOBAL_geoPosition.altitudeAccuracy  + '\n' +
      'Heading: '           + GLOBAL_geoPosition.heading           + '\n' +
      'Speed: '             + GLOBAL_geoPosition.speed             + '\n' +
      'Timestamp: '         + GLOBAL_geoPosition.timestamp                + '\n');
    }
    
    
    /** NOVACARD */
    
    /**
     * Permet de ramener une liste d'enseignes dans un rayon de XKm autour de la position donnée
     * Chaque enseigne est désignée par sa latitude, sa longitude et un lien vers sa description (OpenCart)
     * Le format de renvoi est un array avec la liste des enseignes trouvées, null sinon
     */
    function getEnseignes(latitude, longitude, rayon){
        var result = null;
        var geodata = {
            latitude: latitude,
            longitude: longitude,
            rayon: rayon
        };
        var opts = {
          url: GLOBAL_eurofidBase+"oauth2/get_enseignes_aroundme.php",
          type:"POST",
          data: geodata,
          //Obligé sinon le draw passe pas
          async: false,
          context: this,
          dataType: "json",
          success: function(data){
              //console.log(data.message);
              if(data.success){
                //console.log(data.data);
                result=data.data;
              }
          },
          error: function(error){
              console.log("ERROR: "+error.statusText);
              console.log(error);
          }
        };
        $.ajax(opts);
        
        return result;
    }
    
    
    /**
     * Fonction qui permet de redessiner les enseignes à chaque changement de zoom
     */
    function drawEnseignes(lat,long,gMap,zoomLevel){
        var rayon = (20-zoomLevel)*(100/zoomLevel);
        var enseignes = getEnseignes(lat, long, rayon);
        //console.log("Zoom "+zoomLevel+" Rayon "+rayon+"km");
        var markers = {};
        $(enseignes).each(function(){
            /*
                Structure d'un élément : 
                idcommercantFid => id de l'enseigne dans novacard
                latitude => latitude de l'enseigne dans novacard en degrés décimaux
                longitude => longitude de l'enseigne dans novacard en degrés décimaux
                distance (m) => distance du point actuel à l'enseigne (vol d'oiseau)
                nom => nom enseigne
                image => chemin relatif de l'image sur serveur OpenCart 
                      =>  image/
            */
            //console.log(this);
            var coordM = new google.maps.LatLng(this.latitude, this.longitude);
            var divM = "<div class=\"markerDiv\" ";
            //divM +="onclick=\"loadPage({destination:'product/manufacturer/info&id_groupement="+parseInt(this.id_groupement)+"', withCredentials:true, title:'"+this.nom+"'});\">";
            divM +="onclick=\"show_enseigne("+parseInt(this.id_groupement)+");\">";
            divM +="<img class=\"markerImg\" src=\""+GLOBAL_serverBase+"image/"+this.image+"\"/>";
            divM +="<h1 class=\"markerTitle\">"+this.nom+"</h1></div>";
            var infoM = new google.maps.InfoWindow({
               content: divM 
            });
            var markEns = new google.maps.Marker({
                position: coordM,
                title: this.nom
            });
            markEns.addListener('click', function(){
                infoM.open(gMap, markEns);
            })
            
            markEns.setMap(gMap);
        });
    }
    
    /** GOOGLE MAPS */
  
    /**
     * Obtenir une carte centrée sur une longitude et une latitude donnée
     */ 
    function getMap(latitude, longitude) {
        var zoom = 11;
        var mapOptions = {
            center: new google.maps.LatLng(0, 0),
            zoom: 1,
            disableDefaultUI:true,
            zoomControl: true,
            scaleControl: true,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
    
        map = new google.maps.Map
        (document.getElementById("map"), mapOptions);
    
    
        var latLong = new google.maps.LatLng(latitude, longitude);
        var imgMarker = 'img/iconUserNovacard_small.png';
        var cMarker = new google.maps.Marker({
            position: latLong,
            animation: google.maps.Animation.BOUNCE,
            icon: imgMarker
        });
    
        //Ajout des marqueurs d'enseigne
        drawEnseignes(latitude,longitude,map,zoom);
        cMarker.setMap(map);
       
        map.setZoom(zoom);
        map.setCenter(cMarker.getPosition());
        
        map.addListener('zoom_changed', function(){
        	//Mettre à jour les infos de géoloc au zoom out
        	updateGeoPosition();
            var center = new google.maps.LatLng(GLOBAL_geoPosition.latitude, GLOBAL_geoPosition.longitude);//map.getCenter();
            map.setCenter(center);
            cMarker.setMap(null);
            cMarker = null;
            cMarker = new google.maps.Marker({
                position: center,
                animation: google.maps.Animation.BOUNCE,
                icon: imgMarker
            });
            cMarker.setMap(map);
            
            setTimeout(function(){
                drawEnseignes(center.lat(),center.lng(),map,map.getZoom());
            },500);
        });
        map.addListener('dragend', function(){
            var center = map.getCenter();
            //console.log(center);
            //console.log(center.lat()+" "+center.lng());
            setTimeout(function(){
                drawEnseignes(center.lat(),center.lng(),map,map.getZoom());
            },500);
        });
   }
   
   function initMap() {
        updateGeoPosition();
        //console.log(document.getElementById("map"));
        logDebug("Coordonnées relevées : LAT=>"+GLOBAL_geoPosition.latitude+"; LON=>"+GLOBAL_geoPosition.longitude);
        getMap(GLOBAL_geoPosition.latitude,GLOBAL_geoPosition.longitude);
        //debugPosition();
        loaderOff();
    }
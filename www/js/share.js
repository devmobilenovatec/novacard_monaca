/**
 * Fonction de partage, basée sur propriétés chrome
 * @param link
 */
function shareTrigger(msg,link){
	try{
		window.plugins.share.show({
		      subject: 'Viens sur Fidlink !',
		      text: msg+" "+link
		  },function(){
			  logDebug("Partage réussi :"+link);
		  },function(){
			  logDebuf("Echec du partage");
		  });
	}
	 catch(e){
         logDebug("Erreur lors de l'utilisation du plugin :"+e.name);
         logDebug(e);
     }
}
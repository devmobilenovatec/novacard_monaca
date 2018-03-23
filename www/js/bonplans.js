/** Réecriture de la fonciton showBp de Novacard */
function showBp(el, url){
	$(".selected").removeClass("selected");
    $(el).addClass("selected");
    appNav.pushPage("generic-divbp");
    loaderOn();
    setTimeout(function(){
        //$("#bonplan-frame").attr("src",url);
    	$("#divbp-frame").attr("src",url); 
    },500);
}

function updateBpList(numRes){
    logDebug("Show only "+numRes);
	if(numRes !=-1)
	{
		$(".bonplan").each(
				function(){
					if($(this).attr("class").indexOf(numRes)!=-1)
						//$(this).removeClass("hidden");
						$(this).fadeIn(500);
					else
						//$(this).addClass("hidden");
						$(this).fadeOut(500);
				}
		);
	}
	else{
		$(".bonplan").each(
				function(){
					//$(this).removeClass("hidden");
					$(this).fadeIn(500);
				}
		);
	}
}
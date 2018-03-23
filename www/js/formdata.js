/**
 * Emulate FormData for some browsers
 * MIT License
 * (c) 2010 François de Metz
 * => https://github.com/francois2metz/html5-formdata
 */
(function(w) {
    //if (w.FormData)
    //    return;
    function FormData() {
        this.fake = true;
        this.boundary = "---------------------------" + "12904236694068";
        this._fields = [];
        this.firstLine = "Content-Type: multipart/form-data; boundary="+this.boundary;
    }
    FormData.prototype.append = function(key, value) {
        this._fields.push([key, value]);
    }
    FormData.prototype.toString = function() {
        var boundary = this.boundary;
        var body = "";
        this._fields.forEach(function(field) {
            body += "--" + boundary + "\r\n";
            // file upload
            if (field[1].name) {
                var file = field[1];
                body += "Content-Disposition: form-data; name=\""+ field[0] +"\"; filename=\""+ file.name +"\"\r\n";
                body += "Content-Type: "+ file.type +"\r\n\r\n";
                body += file.getAsBinary() + "\r\n";
            } else {
                body += "Content-Disposition: form-data; name=\""+ field[0] +"\"\r\n\r\n";
                body += field[1] + "\r\n";
            }
        });
        body += "--" + boundary +"--";
        //Appose header
        body = "Content-Length: "+body.length+"\r\n\r\n"+body;
        body = this.firstLine + "\r\n"+body;
        return body;
    }
    w.FormData = FormData;
})(window);


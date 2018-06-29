var pinNo = parent.document.URL.substring(parent.document.URL.indexOf('?gamePin='), parent.document.URL.length);
pinNo = pinNo.substring(9);
pinNo = parseInt(pinNo);
//console.log(pinNo);
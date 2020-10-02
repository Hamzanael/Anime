function testImage(url, timeoutT) {
    return new Promise(function(resolve, reject) {
      var timeout = timeoutT || 5000;
      var timer, img = new Image();
      img.onerror = img.onabort = function() {
          clearTimeout(timer);
      	  reject("error");
      };
      img.onload = function() {
           clearTimeout(timer);
           resolve("success");
      };
      timer = setTimeout(function() {
          // reset .src to invalid URL so it stops previous
          // loading, but doens't trigger new load
          img.src = "//!!!!/noexist.jpg";
          reject("timeout");
      }, timeout); 
      img.src = url;
    });
}
    

function record(url, result) {
    document.body.innerHTML += "<span class='" + result + "'>" + 
        result + ": " + url + "</span><br>";
}   

function runImage(url) {
	  testImage(url).then(record.bind(null, url), record.bind(null, url));
}

runImage($("#imege").val());
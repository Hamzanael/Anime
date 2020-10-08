$(document).ready(function(){
  var elem = document.documentElement;
  var state = false;
  $("#full").click(function() {
    state = !state;
    if (state) {
      $("#full").css("color","blue");
     
      openFullscreen();
      $("#full").hover(function(){
        $(this).css("color", "red");
      }, function(){
        $(this).css("color", "blue");
      });
     
    } else {
      $("#full").css("color","red");
      closeFullscreen();
      $("#full").hover(function(){
        $(this).css("color", "blue");
      }, function(){
        $(this).css("color", "red");
      });
    }
  });


function openFullscreen() {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) { /* Firefox */
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE/Edge */
    elem.msRequestFullscreen();
  }
}

function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}
});
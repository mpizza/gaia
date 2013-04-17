'use strict';

function showresult(QRresult){
  if (qrcode.run_num !== null){
    window.clearInterval(qrcode.run_num);
    qrcode.run_fuocus = null;
    var parselinkText = LinkHelper.searchAndLinkClickableData(QRresult) + '<br />';
    document.getElementById("qr_result_box").innerHTML = parselinkText;
    document.getElementById("qr_result_box").classList.add("show");
    document.getElementById("viewcanvas").classList.add("show");
    var r_link = document.body.querySelector("div#qr_result_box a");
    window.navigator.vibrate([200]);
    r_link.addEventListener('click',  function(evt){
      LinkActionHandler.handleTapEvent(evt);
    } );
  }
}

var Canvas_pad = {
  get pad() {
    return document.getElementById("viewcanvas");
  },

  get cam_source() {
    return document.getElementById("viewfinder");
  },

  copy_video: function canvas_copy_video() {
    var width = document.body.clientHeight;
    var height = document.body.clientWidth;

    console.log("Gary copy_video start");
    var context = this.pad.getContext("2d");
    // context.drawImage(this.cam_source, width/4, width/4, width/2, width/2, 0, 0, width/2, width/2);
    context.drawImage(this.cam_source, 0, 0, width, height);
    console.log("Gary copy_video end");
    qrcode.callback = showresult; // setup result function

    qrcode.canvas = this.pad;
    qrcode.ctx = this.pad.getContext('2d');
    qrcode.decode();
  },

  set_Canvas_style: function initCanvas_style(camera){
    console.log("canvas init");
    var decodeCanvas = this.pad;
    var style  = decodeCanvas.style;

    var width = document.body.clientHeight;
    var height = document.body.clientWidth;

    // set up canvas css
    style.top = ((width / 2) - (height / 2)) + 'px';
    style.left = -((width / 2) - (height / 2)) + 'px';
    // style.top = (((width / 2) - (width / 2)) / 2) + 'px';
    // style.left = -(((width / 2) - (width / 2)) / 2) + 'px';

    var transform = 'rotate(90deg)';
    var rotation;
    if (camera == 1) {
      /* backwards-facing camera */
      transform += ' scale(-1, 1)';
      rotation = 0;
    } else {
      /* forwards-facing camera */
      rotation = 0;
    }

    // set canvas width/height and css
    decodeCanvas.width = (width);
    decodeCanvas.height = (height);
    // decodeCanvas.height = (width / 2);
    style.MozTransform = transform;
    style.width = width + 'px';
    style.height = height + 'px';
    // style.height = width / 2 + 'px';
    
  }
  
};

document.addEventListener('mozvisibilitychange', function() {
  if (document.mozHidden) {
    if (qrcode.run_num !== null){
      window.clearInterval(qrcode.run_num);
    }
    document.getElementById("qr_result_box").classList.remove("show");
    document.getElementById("viewcanvas").classList.remove("show");
    document.getElementById("qr_result_box").innerHTML = "";
    LinkActionHandler.resetActivityInProgress();
    Camera.focusRing.removeAttribute('data-state');
    Camera.viewfinder.addEventListener('playing', init_canvas, false);
  } else {
    //console.log("focusring"+Camera.focusRing.dataset.state);
    //Camera.viewfinder.addEventListener('playing', init_canvas, false);
    Camera.hideFocusRing.bind(this);
  }
});

//load lib
init_qr_lib();
//addEventListener
Camera.viewfinder.addEventListener('playing', init_canvas, false);
function init_canvas(evt){
  evt.target.removeEventListener('playing', init_canvas, false);
  console.log('viewfinder playing');
  //setup canvas
  Canvas_pad.set_Canvas_style(Camera.camera);
  qrcode.run_num = window.setInterval(function(){
    console.log('focused'+Camera.focusRing.dataset.state);
    if ( Camera.focusRing.dataset.state == 'focused' || Camera.focusRing.dataset.state == 'focusing' ){
      if(Camera.focusRing.dataset.state == 'focused'){
        Canvas_pad.copy_video();
      }
    }else{
      Camera.focusRing.setAttribute('data-state', 'focusing');
      Camera._cameraObj.autoFocus(Camera.autoFocusDone_qrcode.bind(Camera)); // autoFocusDone will take a shot, but we dont need it
    }
  },30);
   
}

Camera.autoFocusDone_qrcode = function autoFocusDone_qrcode(success){
  if (!success) {
    this.enableButtons();
    this.focusRing.setAttribute('data-state', 'fail');
    window.setTimeout(this.hideFocusRing.bind(this), 1000);
    //console.log('fail~'+this.focusRing.dataset.state);
    return;
  }
  this.focusRing.setAttribute('data-state', 'focused');
}

//Camera.viewfinder.addEventListener('click', Camera.hideFocusRing.bind(Camera));
Camera.viewfinder.addEventListener('click', init_canvas, false);
function init_qr_lib(){
  console.log('lazyload');
  var qr_loader = LazyLoader;
  var qr_files = [
    'js/filmstrip.js',
    'js/link_action_handler.js',
    'js/link_helper.js',
    'js/grid.js',
    'js/version.js',
    'js/detector.js',
    'js/formatinf.js',
    'js/errorlevel.js',
    'js/bitmat.js',
    'js/datablock.js',
    'js/bmparser.js',
    'js/datamask.js',
    'js/rsdecoder.js',
    'js/gf256poly.js',
    'js/gf256.js',
    'js/decoder.js',
    'js/findpat.js',
    'js/alignpat.js',
    'js/databr.js',
  ];
  qr_loader.load(qr_files, function() {
    self.delayedInit();
    console.log('lazyload');
  });
}
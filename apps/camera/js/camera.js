'use strict';
var gCtx = null;
var gCanvas = null;
var stop = null;
var imageData = null;

var Camera = {
  _camera: 0,

  get viewfinder() {
    return document.getElementById('viewfinder');
  },

  get switchButton() {
    return document.getElementById('switch-button');
  },

  get captureButton() {
    return document.getElementById('capture-button'); 
  },

  get qrCanvas() {
    return document.getElementById('qr-canvas'); 
  },
  
  get galleryButton() {
    return document.getElementById('gallery-button');
  },

  init: function cameraInit() {
    this.switchButton.addEventListener('click', this.toggleCamera.bind(this));
    this.galleryButton.addEventListener('click', function() {
      // This is bad. It should eventually become a hyperlink or Web Intent.
      window.parent.WindowManager.launch('../gallery/gallery.html');
    });
    
    
    this.setSource(this._camera);
    console.log('pizaza debug:'+this.viewfinder.src);   
    //qr code init
    /*
    var v =this.viewfinder;
    var cw, ch;
    var canvas_qr = this.qrCanvas;
    var context = canvas_qr.getContext('2d');
    this.setCanvas(); 
    
    var back = document.createElement('canvas');
		var backcontext = back.getContext('2d');
		
    v.addEventListener('play', function() {
      cw = v.clientWidth;
      ch = v.clientHeight;
      canvas_qr.height = ch;
      canvas_qr.width = cw;
      //drawVideo(v, context, cw, ch, qrcode.stop);
      draw_grey(v, context, backcontext, cw, ch)
    },false);
    */
  },

  setSource: function camera_setSource(camera) {
    this.viewfinder.src = '';

    var width, height;
    var viewfinder = this.viewfinder;

    width = document.body.clientHeight;
    height = document.body.clientWidth;
      
    var top = ((width/2) - ((height)/2));
    var left = -((width/2) - (height/2));
    viewfinder.style.top = top + 'px';
    viewfinder.style.left = left + 'px';

    var transform = 'rotate(90deg)';
    if (this._camera == 1)
      transform += ' scale(-1, 1)';

    viewfinder.style.MozTransform = transform;

    var config = {
      height: height,
      width: width,
      camera: camera
    }

    viewfinder.style.width = width + 'px';
    viewfinder.style.height = height + 'px';
    if(navigator.mozCamera)
      viewfinder.src = navigator.mozCamera.getCameraURI(config);
    
  },
  
  setCanvas: function set_canvas() {
    var width, height;
    var qrCanvas = this.qrCanvas;

    width = document.body.clientHeight;
    height = document.body.clientWidth;
      
    var top = ((width/2) - ((height)/2));
    var left = -((width/2) - (height/2));
    qrCanvas.style.top = top + 'px';
    qrCanvas.style.left = left + 'px';

    var transform = 'rotate(90deg)';
    if (this._camera == 1)
      transform += ' scale(-1, 1)';

    qrCanvas.style.MozTransform = transform;
    qrCanvas.style.width = width + 'px';
    qrCanvas.style.height = height + 'px';
   
  },

  pause: function pause() {
    this.viewfinder.pause();
  },

  toggleCamera: function toggleCamera() {
    this._camera = 1 - this._camera;
    this.setSource(this._camera);
  },

};

window.addEventListener('DOMContentLoaded', function CameraInit() {
  Camera.init();
});

// Bug 690056 implement a visibility API, and it's likely that
// we want this event to be fire when an app come back to life
// or is minimized (it does not now).
window.addEventListener('message', function CameraPause(evt) {
  if (evt.data.message !== 'visibilitychange')
    return;

  if (evt.data.hidden) {
    Camera.pause();
  } else {
    Camera.init();
  }
});

function read(a) {
  if (qrcode.stop != null) {
    var v = document.getElementById('viewfinder');
    clearTimeout(qrcode.stop);
    v.pause();
  }
  //alert(a);
  console.log("result:"+a);
}

function draw_grey(v,c,bc,w,h) {
    if(v.paused || v.ended)	return false;
    // First, draw it into the backing canvas
    bc.drawImage(v, 0 ,0 ,w ,h);
    // Grab the pixel data from the backing canvas
    var idata = bc.getImageData(0,0,w,h);
    var data = idata.data;
    
    // Loop through the pixels, turning them grayscale
    for(var i = 0; i < data.length; i+=4) {
      var r = data[i];
      var g = data[i+1];
      var b = data[i+2];
      var brightness = (3*r+4*g+b)>>>3;
      data[i] = brightness;
      data[i+1] = brightness;
      data[i+2] = brightness;
    }
    idata.data = data;
    // Draw the pixels onto the visible canvas
    c.putImageData(idata,0,0);
    // Start over!
    setTimeout(draw_grey, 20, v, c, bc ,w, h);
}
	
function drawVideo(v, context, cw, ch, stop) {
  if (v.paused || v.ended) {
    return false;
  }
  context.drawImage(v, 0, 0, cw, ch);
  qrcode.callback = read;
  // detec again?
  qrcode.stop = setTimeout(drawVideo, 20, v, context, cw, ch, qrcode.stop);
  qrcode.decode();
}

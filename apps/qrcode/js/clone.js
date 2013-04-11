'use strict';

function showresult(QRresult){
  if (qrcode.run_num !== null){
    window.clearInterval(qrcode.run_num);
    qrcode.run_num = null;
    var result = document.createTextNode("qrcode result:"+QRresult);
    document.getElementById("image_reg").appendChild(result);
    document.getElementById("image_reg").classList.add("show");
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

    style.top = ((width / 2) - (height / 2)) + 'px';
    style.left = -((width / 2) - (height / 2)) + 'px';

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

    style.MozTransform = transform;
    style.width = width + 'px';
    style.height = height + 'px';
  }
  
};

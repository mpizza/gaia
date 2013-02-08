'use strict';

var Canvas = {
  get pad() {
    return document.getElementById('clonevid');
  },
  
  get cloneBtn() {
    return document.getElementById('clone-button');
  },
  
  get video() {
    return document.getElementById('viewfinder');
  },
  
  init: function canvas_init() {
    var width = document.body.clientHeight/2;
    var height = document.body.clientWidth/2;
    this.pad.style.top = '80px';
    this.pad.style.left = '150px';
    this.pad.style.MozTransform = 'rotate(90deg) scale(-1, 1)';
    this.pad.style.width = this.video.style.width;
    this.pad.style.height = this.video.style.height;
    this.cloneBtn.addEventListener('click', this.copy_video.bind(this));
    console.log('Gary canvas_init');
  },
  
   copy_video: function canvas_copy_video(e) {
    var width = document.body.clientHeight/2;
    var height = document.body.clientWidth/2;
    console.log('Gary copy_video');
    var context = this.pad.getContext('2d');
    context.drawImage(this.video, 0, 0, width, height);
   }
}

window.addEventListener('DOMContentLoaded', function CameraInit() {
  Canvas.init();
});
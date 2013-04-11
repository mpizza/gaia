'use strict';
/*
   Copyright 2012 Gary Chen ( gchen@mozilla.com )
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var gCtx = null;
var gCanvas = null;
var stop = null;
var imageData = null;
/*
document.addEventListener('DOMContentLoaded', function() {
  var v = document.getElementById('viewfinder');
  var cw, ch;
  var canvas_qr = document.getElementById('qr-canvas');
  var context = canvas_qr.getContext('2d');
  v.addEventListener('play', function() {
    cw = v.clientWidth;
    ch = v.clientHeight;
    canvas_qr.height = ch;
    canvas_qr.width = cw;
    drawVideo(v, context, cw, ch, qrcode.stop);
  },false);
},false);

document.getElementById('capture-button').addEventListener('click', function() {
  var v = document.getElementById('viewfinder');
  v.play();
});
*/
function read(a) {
  if (qrcode.stop != null) {
    var v = document.getElementById('viewfinder');
    clearTimeout(qrcode.stop);
    v.pause();
  }
  //alert(a);
  console.log("qrcode result:"+a);
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

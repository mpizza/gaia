/*
  This file is modified by PoYu Chen(Gary Chen, gchen@mozilla.com, http://github.com/mpizza/gaia) on 2013.
  
  Copyright 2011 Lazar Laszlo (lazarsoft@gmail.com, www.lazarsoft.info)

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


qrcode = {};
qrcode.run_num = null; // stop
qrcode.imagedata = null;
qrcode.width = 0;
qrcode.height = 0;
qrcode.qrCodeSymbol = null;
// get canvas
qrcode.canvas = null;
qrcode.ctx = null;

qrcode.sizeOfDataLengthInfo =  [  [ 10, 9, 8, 8 ],  [ 12, 11, 16, 10 ],  [ 14, 13, 16, 12 ] ];

qrcode.callback = null;
qrcode.unlock = false; 
qrcode.decode = function(src) {
		
	if(arguments.length == 0) { // use camera
		qrcode.width = qrcode.canvas.width;
		qrcode.height = qrcode.canvas.height;
		qrcode.imagedata = qrcode.ctx.getImageData(0, 0, qrcode.width, qrcode.height);

    try {
				qrcode.result = qrcode.process(qrcode.ctx);
				if(qrcode.callback != null) {
				 	qrcode.callback(qrcode.result);
				}
        //console.log("qrcode result:"+qrcode.result);
        //$('#result').append("result:"+qrcode.result+"<br/>");
		}
		catch(e) {
				//do nothing 
				//qrcode.result = "error decoding QR Code";
        //console.log("error decoding QR Code");
        qrcode.unlock = false;
		}
	} else { // use image
		// var image = new Image();
		// image.onload=function(){
		// 	//draw in out-canvas
		// 	var canvas_out = document.getElementById("out-canvas");
		// 	console.log(image.width+":"+image.height);
		// 	if(canvas_out!=null){
		// 		var outctx = canvas_out.getContext('2d');
		// 		outctx.clearRect(0, 0, canvas_out.width,canvas_out.height);
		// 		outctx.drawImage(image, 0, 0, image.width, image.height);
		// 	}
			
		// 	qrcode.canvas.width = image.width+100;
		// 	qrcode.canvas.height = image.height+100;
		// 	qrcode.ctx.drawImage(image, 0, 0, image.width, image.height);
		// 	console.log("qr"+image.width+","+image.height);
		// 	qrcode.width = image.width;
		// 	qrcode.height = image.height;
		// 	try{
		// 		qrcode.imagedata = qrcode.ctx.getImageData(0, 0, image.width, image.height);
		// 	}catch(e){
		// 		qrcode.result = "Cross domain image reading not supported in your browser! Save it to your computer then drag and drop the file!";
		// 		if(qrcode.callback!=null)
		// 			qrcode.callback(qrcode.result);
		// 		return;
		// 	}
		// 	var start = new Date().getTime();
		// 	try{
		// 		qrcode.result = qrcode.process(qrcode.ctx);
		// 	}
		// 	catch(e){
		// 		console.log(e);
		// 		qrcode.result = "error decoding QR Code";
  //        qrcode.unlock = false;
		// 	}
		// 	var end = new Date().getTime();
		// 	var time = end - start;
		// 	console.log(time);
			
		// 	if(qrcode.callback!=null)
		// 		qrcode.callback(qrcode.result);
		// 	}
			
		// 	image.src = src;
	}// end image
}

qrcode.process = function(ctx){
  qrcode.unlock = true;
  var image = qrcode.grayScaleToBitmap(qrcode.grayscale());
  
  var detector = new Detector(image);
  
  var qRCodeMatrix = detector.detect();
  ctx.putImageData(qrcode.imagedata, 0, 0);
  
  var reader = Decoder.decode(qRCodeMatrix.bits);
  var data = reader.DataByte;
  var str="";
  for(var i=0;i<data.length;i++){
    for(var j=0;j<data[i].length;j++)
      str+=String.fromCharCode(data[i][j]);
  }
  qrcode.unlock = false;
  return str;
}

qrcode.getPixel = function(x,y){
  if (qrcode.width < x) {
    throw "point error";
  }
  if (qrcode.height < y) {
    throw "point error";
  }
  point = (x * 4) + (y * qrcode.width * 4);
  // gary process
  p = (qrcode.imagedata.data[point]*30 + qrcode.imagedata.data[point + 1]*59 + qrcode.imagedata.data[point + 2]*11)/100;
  return p;
}

qrcode.binarize = function(th){
  var ret = new Array(qrcode.width*qrcode.height);
  for (var y = 0; y < qrcode.height; y++){
    for (var x = 0; x < qrcode.width; x++){
      var gray = qrcode.getPixel(x, y);
      
      ret[x+y*qrcode.width] = gray<=th?true:false;
    }
  }
  return ret;
}

qrcode.getMiddleBrightnessPerArea=function(image){
  var numSqrtArea = 4; //4*4block
  //obtain middle brightness((min + max) / 2) per area
  var areaWidth = Math.floor(qrcode.width / numSqrtArea);
  var areaHeight = Math.floor(qrcode.height / numSqrtArea);
  var minmax = new Array(numSqrtArea);
  for (var i = 0; i < numSqrtArea; i++){
    minmax[i] = new Array(numSqrtArea);
    for (var i2 = 0; i2 < numSqrtArea; i2++){
      minmax[i][i2] = new Array(0,0);
    }
  }
	for (var ay = 0; ay < numSqrtArea; ay++){
		for (var ax = 0; ax < numSqrtArea; ax++){
			minmax[ax][ay][0] = 0xFF;
			for (var dy = 0; dy < areaHeight; dy++){
				for (var dx = 0; dx < areaWidth; dx++){
					var target = image[areaWidth * ax + dx+(areaHeight * ay + dy)*qrcode.width];
					if (target < minmax[ax][ay][0])
						minmax[ax][ay][0] = target;
					if (target > minmax[ax][ay][1])
						minmax[ax][ay][1] = target;
				}
			}
			//minmax[ax][ay][0] = (minmax[ax][ay][0] + minmax[ax][ay][1]) / 2;
		}
	}
	var middle = new Array(numSqrtArea);
	for (var i3 = 0; i3 < numSqrtArea; i3++){
		middle[i3] = new Array(numSqrtArea);
	}
  for (var ay = 0; ay < numSqrtArea; ay++){
    for (var ax = 0; ax < numSqrtArea; ax++){
      middle[ax][ay] = Math.floor((minmax[ax][ay][0] + minmax[ax][ay][1]) / 2);
      //Console.out.print(middle[ax][ay] + ",");
    }
    //Console.out.println("");
  }
  //Console.out.println("");
  return middle;
}

qrcode.grayScaleToBitmap=function(grayScale){
  var middle = qrcode.getMiddleBrightnessPerArea(grayScale);
  var sqrtNumArea = middle.length;
  var areaWidth = Math.floor(qrcode.width / sqrtNumArea);
  var areaHeight = Math.floor(qrcode.height / sqrtNumArea);
  //2d to 1d array
  var bitmap = new Array(qrcode.height*qrcode.width);
  
  for (var ay = 0; ay < sqrtNumArea; ay++){
    for (var ax = 0; ax < sqrtNumArea; ax++){
      for (var dy = 0; dy < areaHeight; dy++){
        for (var dx = 0; dx < areaWidth; dx++){
          //bitmap[areaWidth * ax + dx+ (areaHeight * ay + dy)*qrcode.width] = (grayScale[areaWidth * ax + dx+ (areaHeight * ay + dy)*qrcode.width] );
          // draw MiddleBrightness to bitmap 
          bitmap[areaWidth * ax + dx+ (areaHeight * ay + dy)*qrcode.width] = (grayScale[areaWidth * ax + dx+ (areaHeight * ay + dy)*qrcode.width] < middle[ax][ay])?true:false;
        }
      }
    }
  }
  return bitmap;
}

qrcode.grayscale = function(){
  var data_length = qrcode.imagedata.data.length;
  var ret = new Array(qrcode.width*qrcode.height);
  var ret_index = 0;
  for(var i = 0; i < data_length; i+=4) {
    ret[ret_index] = (3*qrcode.imagedata.data[i]+4*qrcode.imagedata.data[i+1]+qrcode.imagedata.data[i+2])>>>3;
    console.log('color'+ret[ret_index]);
    ret_index += 1;
  }
  return ret;
}

// qrcode.grayscale = function(){
//   var ret = new Array(qrcode.width*qrcode.height);
//   for (var y = 0; y < qrcode.height; y++){
//     for (var x = 0; x < qrcode.width; x++){
//       var gray = qrcode.getPixel(x, y);
//       ret[x+y*qrcode.width] = gray;
//     }
//   }
//   return ret;
// }

function URShift( number,  bits){
  if (number >= 0)
    return number >> bits;
  else
    return (number >> bits) + (2 << ~bits);
}


Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

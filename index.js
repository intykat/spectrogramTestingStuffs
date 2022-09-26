var getPixels = require("get-pixels")
var lamejs = require("lamejs");
const fs = require('fs')

async function getImageData() {
    getPixels("pfp.PNG", function(err, pixels) {
        if(err) {
          console.log("Bad image path")
          return
        }
        console.log("got pixels", pixels)
        const Data = pixels.data 
        const width = pixels.shape[0]
        const height = pixels.shape[1]
    
        var durationSeconds = 8;
        var tmpData = [];
        var maxFreq = 0;
        var data = [];
        var sampleRate = 44100;
        var channels = 1;
        var numSamples = Math.round(sampleRate * durationSeconds);
        var samplesPerPixel = Math.floor(numSamples / width);
        var maxSpecFreq = 500;
        var C = maxSpecFreq / height;
        var yFactor = 2 // parseFloat($('#yFactor').val());

        for (var x = 0; x < numSamples; x++) {
            var rez = 0;
            var pixel_x = Math.floor(x / samplesPerPixel);

            for (var y = 0; y < height; y += yFactor) {
                var pixel_index = (y * width + pixel_x) * 4;
                var r = Data[pixel_index];
                var g = Data[pixel_index + 1];
                var b = Data[pixel_index + 2];

                var s = r + b + g;
                var volume = Math.pow(s * 100 / 765, 2);

                var freq = Math.round(C * (height - y + 1));
                rez += Math.floor(volume * Math.cos(freq * 6.28 * x / sampleRate));
            }

            tmpData.push(rez);

            if (Math.abs(rez) > maxFreq) {
                maxFreq = Math.abs(rez);
            }
        }

        for (var i = 0; i < tmpData.length; i++) {
            data.push(32767 * tmpData[i] / maxFreq); //32767
        }

        console.log(data)
        data = Int16Array.from(data)

        mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 16);
        sampleBlockSize = 1152; 

        var mp3Data = [];
        for (var i = 0; i < data.length; i += sampleBlockSize) {
        sampleChunk = data.subarray(i, i + sampleBlockSize);
        var mp3buf = mp3encoder.encodeBuffer(sampleChunk);
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
        }
        var mp3buf = mp3encoder.flush();   //finish writing mp3

        if (mp3buf.length > 0) {
            mp3Data.push(new Int8Array(mp3buf));
        }
        var blob = new Blob(mp3Data, {type: 'audio/mp3'});

        const buffer = Buffer.from(blob,'binary');
        var imageName = './spectro.mp3';

        fs.createWriteStream(buffer).write(imageName);
    })
}

getImageData()
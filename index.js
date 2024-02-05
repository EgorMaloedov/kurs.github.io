import 'https://esm.sh/rvfc-polyfill'

class ChangeStatusButton{
  
  constructor(btnId, callbackFunction){
    this.button = document.getElementById(btnId);
    this.pressed = false;
    this.button.addEventListener('click', ()=>{
      this.pressed = !this.pressed;
      callbackFunction();
    })
  }

  setText(text){
    this.button.innerHTML = text;
  }

}

class VapourSynthWannabe {
    /**
     * @param  {HTMLVideoElement} video
     * @param  {HTMLCanvasElement} canvas
     */

    constructor (video, canvas) {

      this.filters = new Map();

      this.filters.set('invertion', this.invertion);
      this.filters.set('oneColor', this.oneColor);
      this.filters.set('binarization', this.binarization);
      this.filters.set('colorEdges', this.differentialEdgeDetection)

      this.disabledLinks = new Map();

      this.disabledLinks.set('oneColor', ['redOneColor','blueOneColor','greenOneColor'])
      this.disabledLinks.set('binarization', ['binarizationRange']);
      this.disabledLinks.set('colorEdges', ['edgesRange']);

      this.destroyed = false
      this.video = video
      this.canvas = canvas
      this.currentFilter = NaN

      navigator.mediaDevices.getUserMedia({video: true, width: 500, height: 500}).
      then((stream)=>{
      video.srcObject = stream
      video.addEventListener('resize', this.resize.bind(this))
      video.addEventListener('loadedmetadata', this.resize.bind(this))
      this.resize()
      
      this.filterData = {
        oneRed : false,
        oneGreen: false,
        oneBlue: true,
        binarization : 0,
        threshold : 128
      }

      this.invertionRadio = document.getElementById('invertion');
      this.invertionRadio.addEventListener('change', this.changeVideoFilter.bind(this));

      this.oneColorRadio = document.getElementById('oneColor');
      this.oneColorRadio.addEventListener('change', this.changeVideoFilter.bind(this));
      document.getElementById('redOneColor').addEventListener('change', (evt)=>{
        this.filterData.oneRed = evt.target.checked ? true : false;
      })
      document.getElementById('greenOneColor').addEventListener('change', (evt)=>{
        this.filterData.oneGreen = evt.target.checked ? true : false;
      })
      document.getElementById('blueOneColor').addEventListener('change', (evt)=>{
        this.filterData.oneBlue = evt.target.checked ? true : false;
      })

      this.binarizationRadio = document.getElementById('binarization');
      this.binarizationRadio.addEventListener('change', this.changeVideoFilter.bind(this));
      document.getElementById('binarizationRange').addEventListener('change', (evt)=>{
        this.filterData.binarization = evt.target.value;
      })

      this.edgeRadio = document.getElementById('colorEdges');
      this.edgeRadio.addEventListener('change', this.changeVideoFilter.bind(this));
      document.getElementById('edgesRange').addEventListener('change', (evt)=>{
        this.filterData.threshold = evt.target.value;
      })

      document.getElementById('clearFilters').addEventListener('click', ()=>{
        this.currentFilter = NaN;
        document.getElementsByName('filter').forEach((el)=>{
          el.checked = false;
        })
        this.disabledLinks.forEach((id)=>{
          id.forEach((el)=>{
            document.getElementById(el).disabled = true;
          })
        })
      })

      this.pauseBtn = new ChangeStatusButton('videoStatus', ()=>{
        if (this.pauseBtn.pressed){
          this.video.pause();
          this.pauseBtn.setText('Воспроизвести')
        }
        else{
          this.video.play();
          this.pauseBtn.setText('Остановить')
        }
      });


      this.callback = video.requestVideoFrameCallback(this.processFrame.bind(this))
      this.ctx = canvas.getContext('2d', { willReadFrequently: true });
      this.timeout = setTimeout(this.processFrame.bind(this), 16)
      })
    }

    changeVideoFilter(evt){
      this.currentFilter = this.filters.get(evt.target.id);
      this.disabledLinks.forEach((id)=>{
        id.forEach((el)=>{
          document.getElementById(el).disabled = true;
        })
      })
      if (this.disabledLinks.get(evt.target.id)){
        this.disabledLinks.get(evt.target.id).forEach((el)=>{
          document.getElementById(el).disabled = false;
        })
      }
    }

    processFrame () {
      this.ctx.drawImage(this.video, 0, 0)
      if (this.canvas.height != 0 && this.canvas.width != 0 && this.currentFilter){
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
      const processed = document.getElementById('monochrom').checked ? this.currentFilter(this.monochrom(imageData)) : this.currentFilter(imageData)
      this.ctx.putImageData(processed, 0, 0)
      }
      if (this.canvas.height != 0 && this.canvas.width != 0 && document.getElementById('monochrom').checked){
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const processed = this.monochrom(imageData);
        this.ctx.putImageData(processed, 0, 0)
      }
      this.callback = this.video.requestVideoFrameCallback(this.processFrame.bind(this))
    }

    invertion(imageData){
      for (let i = 0; i < imageData.data.length; i+=4){
        imageData.data[i+0] = 255 - imageData.data[i+0];
				imageData.data[i+1] = 255 - imageData.data[i+1];
				imageData.data[i+2] = 255 - imageData.data[i+2]; 
      }
      return imageData;
    }

    oneColor(imageData){
      for (let i = 0; i < imageData.data.length; i+=4){
        imageData.data[i+0] = this.filterData.oneRed ? imageData.data[i+0] : 0;
        imageData.data[i+1] = this.filterData.oneGreen ? imageData.data[i+1] : 0;
        imageData.data[i+2] = this.filterData.oneBlue ? imageData.data[i+2] : 0;
      }
      return imageData;
    }

    binarization(imageData){
        for (let i = 0; i < imageData.data.length; i+=4){
          if (imageData.data[i+0] < this.filterData.binarization)  imageData.data[i+0] = 0;
          if (imageData.data[i+1] < this.filterData.binarization)  imageData.data[i+1] = 0;
          if (imageData.data[i+2] < this.filterData.binarization)  imageData.data[i+2] = 0;

          if (imageData.data[i+0] > this.filterData.binarization)  imageData.data[i+0] = 255;
          if (imageData.data[i+1] > this.filterData.binarization)  imageData.data[i+1] = 255;
          if (imageData.data[i+2] > this.filterData.binarization)  imageData.data[i+2] = 255;	
        }
      return imageData;
    }

    differentialEdgeDetection(imageData) {
      var width = imageData.width;
      var height = imageData.height;

      var resultImageData = new ImageData(width, height);
  
      for (var y = 0; y < height; y++) {
          for (var x = 0; x < width; x++) {
              var currentPixelIndex = (y * width + x) * 4;
  
              var currentPixel = {
                  red: imageData.data[currentPixelIndex],
                  green: imageData.data[currentPixelIndex + 1],
                  blue: imageData.data[currentPixelIndex + 2],
                  alpha: imageData.data[currentPixelIndex + 3]
              };
  
              var leftPixel = {
                  red: imageData.data[currentPixelIndex - 4],
                  green: imageData.data[currentPixelIndex - 3],
                  blue: imageData.data[currentPixelIndex - 2],
                  alpha: imageData.data[currentPixelIndex - 1]
              };
              var rightPixel = {
                  red: imageData.data[currentPixelIndex + 4],
                  green: imageData.data[currentPixelIndex + 5],
                  blue: imageData.data[currentPixelIndex + 6],
                  alpha: imageData.data[currentPixelIndex + 7]
              };
              var topPixel = {
                  red: imageData.data[currentPixelIndex - width * 4],
                  green: imageData.data[currentPixelIndex - width * 4 + 1],
                  blue: imageData.data[currentPixelIndex - width * 4 + 2],
                  alpha: imageData.data[currentPixelIndex - width * 4 + 3]
              };
              var bottomPixel = {
                  red: imageData.data[currentPixelIndex + width * 4],
                  green: imageData.data[currentPixelIndex + width * 4 + 1],
                  blue: imageData.data[currentPixelIndex + width * 4 + 2],
                  alpha: imageData.data[currentPixelIndex + width * 4 + 3]
              };
  
              var diffX = Math.abs(leftPixel.red - rightPixel.red) + Math.abs(leftPixel.green - rightPixel.green) + Math.abs(leftPixel.blue - rightPixel.blue);
              var diffY = Math.abs(topPixel.red - bottomPixel.red) + Math.abs(topPixel.green - bottomPixel.green) + Math.abs(topPixel.blue - bottomPixel.blue);

              var diff = diffX + diffY;
              var threshold = this.filterData.threshold;

              if (diff > threshold) {
                  resultImageData.data[currentPixelIndex] = 255; 
                  resultImageData.data[currentPixelIndex + 1] = 255; 
                  resultImageData.data[currentPixelIndex + 2] = 255;
                  resultImageData.data[currentPixelIndex + 3] = 255;
              } else {
                  resultImageData.data[currentPixelIndex] = 0;
                  resultImageData.data[currentPixelIndex + 1] = 0;
                  resultImageData.data[currentPixelIndex + 2] = 0;
                  resultImageData.data[currentPixelIndex + 3] = 255;
              }
          }
      }
  
      return resultImageData;
  }
    

    monochrom(imageData){
      let L = 0;
      for (let i = 0; i < imageData.data.length; i += 4){
        L = 0.4*imageData.data[i+0] + 0.4*imageData.data[i+1] + 0.2*imageData.data[i+2];

        imageData.data[i+0] = L;
        imageData.data[i+1] = L;
        imageData.data[i+2] = L;
      }
      return imageData;
    }

    resize () {
      this.canvas.width = this.video.videoWidth
      this.canvas.height = this.video.videoHeight
    }

    destroy () {
      this.destroyed = true
      this.video.removeEventListener('resize', this.resize)
      this.video.removeEventListener('loadedmetadata', this.resize)
      clearTimeout(this.timeout)
      this.video.cancelVideoFrameCallback(this.callback)
    }
  }
  
  window.processor = new VapourSynthWannabe(document.querySelector('video'), document.querySelector('canvas'))
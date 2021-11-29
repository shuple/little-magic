window.addEventListener('load', function () {
  class LittleMagic {
    constructor() {
      this.contexts = {};
      const [gameWidth, gameHeight] = [ 512, 448 ];
      const scale = (window.innerWidth > gameWidth && window.innerHeight > gameHeight) ? 1 : 0.5;
      for (let canvas of document.querySelectorAll('canvas')) {
        canvas.width  = gameWidth  * scale;
        canvas.height = gameHeight * scale;
        this.contexts[canvas.id] = canvas.getContext('2d');
        this.contexts[canvas.id].scale(scale, scale);
      }
      // default block sprite size 32x32
      this.imageSize = 32 * scale;
      // default layer
      this.layer = 'layer1';
    }  // constructor()

    mouseEvent(canvas, event) {
      const [x, y] = this.mousePosition(canvas, event);
      const [ col, row ] = this.mousePositionToIndex(x, y);
      switch (event.button) {
      // left click
      case 0:
        break;
      // right click
      case 2:
        this.removeSpriteBlock(col, row);
        break;
      default:
      }
    }  // mouseEvent

    mousePosition(canvas, event) {
      const rect = canvas.getBoundingClientRect()
      return [ parseInt(event.clientX - rect.left), parseInt(event.clientY - rect.top) ]
    }  // mousePosition()

    mousePositionToIndex(x, y) {
      let [ col, row ] = [ parseInt(x / this.imageSize), parseInt(y / this.imageSize) ];
      if (isNaN(col)) col = 0;
      if (isNaN(row)) row = 0;
      return [ col, row ];
    }  // mousePositionToIndex

    removeSpriteBlock(col, row) {
      const x = col * this.imageSize;
      const y = row * this.imageSize;
      this.contexts[this.layer].clearRect(x, y, this.imageSize, this.imageSize);
    }  // removeSpriteBlock()

    rest(url, restData, callback) {
      fetch(url, {
        method: 'POST',
        body: JSON.stringify(restData),
        headers: { 'Content-Type': 'application/json' },
      })
      .then(response => response.json())
      .then(data => {
        data = JSON.parse(data['data']);
        callback(this, data);
      })
      .catch(error => {
        console.log(error);
      });
    };  // rest()

    imagesrc(src, graphic) {
      return '/static/image/sprite/' + graphic + '/' + src + '.png';
    } // imagesrc()

    loadMap(layer, restData) {
      const context = this.contexts[layer];
      const data = restData[layer];
      for (let row = 0; row < data.length; row++) {
        for (let col = 0; col < data[row].length; col++) {
          if (data[row][col] === '') continue;
          let image = new Image();
          image.onload = function() {
            context.drawImage(image, image.width * col, image.height * row);
          };
          let src = data[row][col];
          if (/^layer[0-9]/.test(src) === false) src = layer + '/' + src;
          image.src = this.imagesrc(src, restData['graphic']);
        }
      }
    }  // loadMap()
  }  // class LittleMagic

  // callback for /post/stage rest
  //
  let loadMap = function(littleMagic, restData) {
    for (let i = 0; i < 4; i++) {
      const layer = 'layer' + i;
      littleMagic.loadMap(layer, restData);
    }
  };  // let loadMap

  let littleMagic = new LittleMagic();
  littleMagic.rest('/post/stage', { 'stage': '001', 'graphic': 'sfc' }, loadMap);

  // event listener
  let canvas = document.getElementById('control')

  // left, right click
  for (mouseEvent of [ 'click', 'contextmenu' ]) {
    canvas.addEventListener(mouseEvent, function(event) {
      event.preventDefault();
      littleMagic.mouseEvent(canvas, event);
    });
  }
});

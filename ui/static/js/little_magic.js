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
      this.layer = 'background';
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

    loadMap(canvas, restData) {
      const context = this.contexts[canvas];
      const data = restData[canvas];
      for (let row = 0; row < data.length; row++) {
        for (let col = 0; col < data[row].length; col++) {
          if (data[row][col] == '') continue;
          let image = new Image();
          image.onload = function() {
            context.drawImage(image, image.width * col, image.height * row);
          };
          image.src = this.imagesrc(data[row][col], restData['graphic']);
        }
      }
    }  // loadMap()
  }  // class LittleMagic

  // callback for /post/stage rest
  //
  let loadMap = function(littleMagic, restData) {
    littleMagic.loadMap('admin', restData);
    littleMagic.loadMap('background', restData);
    littleMagic.loadMap('foreground', restData);
    littleMagic.loadMap('object', restData);
  };  // let loadMap

  let littleMagic = new LittleMagic();
  littleMagic.rest('/post/stage', { stage: '001' }, loadMap);

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

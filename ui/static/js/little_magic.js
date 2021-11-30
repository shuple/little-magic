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

      // hide item layer
      this.contexts['layer5'].globalAlpha = 0.0;
      this.contexts['layer6'].globalAlpha = 0.0;

      // default block sprite size 32x32
      this.imageSize = 32 * scale;

      // default value
      this.graphic = 'sfc';
      this.layer = 'layer1';

      // enable debug
      this.mouseDebug();
    }  // constructor()

    mouseDebug() {
      let context = this.contexts['layer7'];
      context.font = '12px Merio';
      context.fillStyle = 'white';
      context.fillText('X', 452, 14);
      context.fillText('Y', 452, 34);
      context.fillText('COL', 452, 54);
      context.fillText('ROW', 452, 74);
    }  // mouseDebug()

    mouseDebugStatus(x, y, col, row) {
      let context = this.contexts['layer7'];
      context.clearRect(480, 0, this.imageSize, this.imageSize * 4);
      context.fillText(': ' + x, 480, 14);
      context.fillText(': ' + y, 480, 34);
      context.fillText(': ' + col, 480, 54);
      context.fillText(': ' + row, 480, 74);
    }  // mouseDebug()

    mouseEvent(canvas, event) {
      const [x, y] = this.mousePosition(canvas, event);
      const [ col, row ] = this.mousePositionToIndex(x, y);
      switch (event.button) {
      // left click
      case 0:
        break;
      // right click
      case 2:
        this.rightClick(col, row);
        break;
      default:
      }

      this.mouseDebugStatus(x, y, col, row);
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

    rightClick(col, row) {
      if (col >= 1 && col <= 13 && row >= 0 && row <= 13) {
        this.removeSpriteBlock(col, row);
      }
    }  // rightClick()

    removeSpriteBlock(col, row) {
      const x = col * this.imageSize;
      const y = row * this.imageSize;
      this.contexts[this.layer].clearRect(x, y, this.imageSize, this.imageSize);
    }  // removeSpriteBlock()

    imagesrc(src, graphic) {
      return '/static/image/sprite/' + this.graphic + '/' + src + '.png';
    } // imagesrc()

    setSprite(layer, layerData) {
      const context = this.contexts[layer];
      for (let row = 0; row < layerData.length; row++) {
        for (let col = 0; col < layerData[row].length; col++) {
          if (layerData[row][col] === '') continue;
          let image = new Image();
          image.onload = function() {
            context.drawImage(image, image.width * col, image.height * row);
          };
          let src = layerData[row][col];
          image.src = this.imagesrc(src);
        }
      }
    }  // setSprite()


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
  }  // class LittleMagic

  // callback for /post/stage rest
  //
  let setSprite = function(littleMagic, restData) {
    for (const [layer, layerData] of Object.entries(restData)) {
      littleMagic.setSprite(layer, layerData);
    }
  };  // let setSprite

  let littleMagic = new LittleMagic();
  littleMagic.rest('/post/sprite', { 'content': 'menu/admin', 'graphic': 'sfc' }, setSprite);
  littleMagic.rest('/post/sprite', { 'content': 'stage/001' , 'graphic': 'sfc' }, setSprite);
  littleMagic.rest('/post/sprite', { 'content': 'admin/item', 'graphic': 'sfc' }, setSprite);

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

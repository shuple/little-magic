window.addEventListener('load', function () {
  class LittleMagic {
    constructor() {
      this.canvas = {}
      this.contexts = {};
      const [gameWidth, gameHeight] = [ 512, 448 ];
      const scale = (window.innerWidth > gameWidth && window.innerHeight > gameHeight) ? 1 : 0.5;
      for (let canvas of document.querySelectorAll('canvas')) {
        canvas.width  = gameWidth;
        canvas.height = gameHeight;
        this.canvas[canvas.id] = canvas;
        this.contexts[canvas.id] = canvas.getContext('2d');
        this.contexts[canvas.id].scale(scale, scale);
      }

      // key layer, value 2D array
      // hold data stored in array[row][col]
      this.blocks = {}

      // default block sprite size 32x32
      this.imageSize = 32;

      // state
      this.state = {
        'graphic': 'sfc',
        'item'   : '',
        'layer'  : 'layer1'
      };

      // previous state
      this.cache = {
        'layer' : 'layer1'
      };

      // layer name
      this.layers  = {
        'itembox': 'layer5'
      };

      // default layer setting
      this.contexts[this.layers['itembox']].fillStyle = '#cccccc';
      this.contexts[this.layers['itembox']].fillRect(0, 0, gameWidth, gameHeight);
      this.canvas[this.layers['itembox']].style.display = 'none';

      // enable debug
      this.mouseDebug();
    }  // constructor()

    mouseDebug() {
      let context = this.contexts['layer6'];
      context.font = '12px Merio';
      context.fillStyle = 'white';
      context.fillText('X'  , 452, 20);
      context.fillText('Y'  , 452, 40);
      context.fillText('COL', 452, 60);
      context.fillText('ROW', 452, 80);
      context.fillText('CTX', 452, 100);
    }  // mouseDebug()

    mouseDebugStatus(x, y, col, row) {
      let context = this.contexts['layer6'];
      const ctx = /(\d)/.exec(this.state['layer'])[1];
      context.clearRect(480, 0, this.imageSize, this.imageSize * 4);
      context.fillText(': ' + x  , 480, 20);
      context.fillText(': ' + y  , 480, 40);
      context.fillText(': ' + col, 480, 60);
      context.fillText(': ' + row, 480, 80);
      context.fillText(': ' + ctx, 480, 100);
    }  // mouseDebug()

    mouseEvent(canvas, event) {
      const [x, y] = this.mousePosition(canvas, event);
      const [ col, row ] = this.mousePositionToIndex(x, y);
      switch (event.button) {
      // left click
      case 0:
        this.leftClick(col, row);
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

    leftClick(col, row) {
      switch (this.state['layer']) {
      case this.layers['itembox']:
        this.selectItem(col, row);
        break;
      default:
        if (col == 14 && row >= 6 && row <= 7) {
          this.itemBox();
        }
      }
    }  // leftClick()

    rightClick(col, row) {
      switch (this.state['layer']) {
      case 'layer1':
      case 'layer2':
      case 'layer3':
        if (col >= 1 && col <= 13 && row >= 0 && row <= 13) {
          this.removeSpriteBlock(col, row);
        }
        break;
      case this.layers['itembox']:
        this.canvas[this.state['layer']].style.display = 'none';
        this.state['layer'] = this.cache['layer']
        break;
      default:
      }
    }  // rightClick()

    removeSpriteBlock(col, row) {
      const x = col * this.imageSize;
      const y = row * this.imageSize;
      this.contexts[this.state['layer']].clearRect(x, y, this.imageSize, this.imageSize);
    }  // removeSpriteBlock()

    itemBox() {
      this.state['layer'] = this.layers['itembox'];
      this.canvas[this.layers['itembox']].style.display = 'inline';
    }  // itemBox()

    selectItem(col, row) {
      this.state['item'] = this.blocks[this.layers['itembox']][row][col]
      const layer = /^(layer\d)/.exec(this.state['item']);
      if (layer) {
        this.state['layer'] = layer[1];
        this.cache['layer'] = layer[1];
        this.canvas[this.layers['itembox']].style.display = 'none';
      }
    }  // itemToLayer()

    imagesrc(src, graphic) {
      return '/static/image/sprite/' + this.state['graphic'] + '/' + src + '.png';
    } // imagesrc()

    setSprite(layer, layerData) {
      this.blocks[layer] = layerData;
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
  littleMagic.rest('/post/sprite', { 'content': 'menu/admin'   , 'graphic': 'sfc' }, setSprite);
  littleMagic.rest('/post/sprite', { 'content': 'stage/001'    , 'graphic': 'sfc' }, setSprite);
  littleMagic.rest('/post/sprite', { 'content': 'admin/itembox', 'graphic': 'sfc' }, setSprite);

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

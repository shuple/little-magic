window.addEventListener('load', function () {
  class LittleMagic {
    constructor() {
      // object[layer]: array[row][col]
      // hold game data
      this.blocks = {}

      // default sprite block size 32x32
      this.imageSize = 32;

      this.crntState = {
        'graphic': 'sfc',
        'item'   : '',
        'col'    : 0,
        'row'    : 0,
        'layer'  : 'layer1',
        'field'  : 0,
      };

      this.prevState = {
        'layer' : 'layer1'
      };

      this.layers  = {
        'system' : 'layer4',
        'itembox': 'layer5'
      };

      this.canvas = {}
      this.contexts = {};
      this.initContext();

      // enable debug
      this.mouseDebug();
    }  // constructor()

    initContext() {
      const [gameWidth, gameHeight] = [ 512, 448 ];
      const scale = (window.innerWidth > gameWidth && window.innerHeight > gameHeight) ? 1 : 0.5;
      for (let canvas of document.querySelectorAll('canvas')) {
        canvas.width  = gameWidth;
        canvas.height = gameHeight;
        this.canvas[canvas.id] = canvas;
        this.contexts[canvas.id] = canvas.getContext('2d');
        this.contexts[canvas.id].scale(scale, scale);
      }

      this.contexts[this.layers['itembox']].fillStyle = 'white';
      this.contexts[this.layers['itembox']].fillRect(
        this.imageSize, 0, gameWidth - this.imageSize * 3, gameHeight);
      this.canvas[this.layers['itembox']].style.display = 'none';

      // icon
      let context = this.contexts[this.layers['system']];
      this.setIcon(context, 15,  4, 'Item');
      this.setIcon(context, 15,  5, 'Field');
      this.setIcon(context, 15, 12, 'Save');
    }  // initContext()

    setIcon(context, col, row, desc) {
      context.font = '12px Merio';
      context.fillStyle = 'white';
      context.textAlign='center';
      context.textBaseline = 'middle';
      const [ iconWidth, iconHeight ] = [ this.imageSize * col, this.imageSize * row ];
      context.fillText(desc, iconWidth + (this.imageSize / 2), iconHeight + (this.imageSize / 2));
    }  // initIcon

    mouseDebug() {
      let context = this.contexts[this.layers['system']];
      context.font = '12px Merio';
      context.fillStyle = 'white';
      context.textAlign = 'start';
      context.textBaseline = 'alphabetic';
      context.fillText('X'  , 452, 20);
      context.fillText('Y'  , 452, 40);
      context.fillText('COL', 452, 60);
      context.fillText('ROW', 452, 80);
      context.fillText('CTX', 452, 100);
    }  // mouseDebug()

    mouseDebugStatus(x, y, col, row) {
      let context = this.contexts[this.layers['system']];
      const ctx = /(\d)/.exec(this.crntState['layer'])[1];
      context.clearRect(480, 0, this.imageSize, this.imageSize * 4);
      context.fillText(`: ${x}`  , 480, 20);
      context.fillText(`: ${y}`  , 480, 40);
      context.fillText(`: ${col}`, 480, 60);
      context.fillText(`: ${row}`, 480, 80);
      context.fillText(`: ${ctx}`, 480, 100);
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
      switch (this.crntState['layer']) {
      case 'layer1':
      case 'layer2':
      case 'layer3':
        if (this.areaStage(col, row) && this.crntState['item']) {
          const layer = /^(layer\d)/.exec(this.crntState['item']);
          this.setSpriteBlock(col, row, layer[0], this.crntState['item']);
        } else if (this.areaItem(col, row)) {
          this.selectItembox();
        } else if (this.areaField(col, row)) {
          this.selectField(col, row, 1);
        }
        break;
      case this.layers['itembox']:
        if (this.areaStage(col, row)) {
          this.selectItem(col, row);
        } else if (this.areaField(col, row)) {
          this.selectField(col, row, 1);
        }
        break;
      }
    }  // leftClick()

    rightClick(col, row) {
      switch (this.crntState['layer']) {
      case 'layer1':
      case 'layer2':
      case 'layer3':
        if (this.areaStage(col, row)) {
          this.crntState['layer'] = this.activeLayer(col, row);
          this.removeSpriteBlock(col, row, this.crntState['layer']);
        } else if (this.areaField(col, row)) {
          this.selectField(col, row, -1);
        }
        break;
      case this.layers['itembox']:
        if (this.areaStage(col, row)) {
          this.canvas[this.crntState['layer']].style.display = 'none';
          this.crntState['layer'] = this.prevState['layer']
        } else if (this.areaField(col, row)) {
          this.selectField(col, row, -1);
        }

        break;
      default:
      }
    }  // rightClick()

    areaStage(col, row) {
        return (col >= 1 && col <= 13 && row >= 0 && row <= 13);
    }  // areaStage()

    areaItem(col, row) {
      return (col == 14 && row == 4);
    }  // areaItem()

    areaField(col, row) {
      return (col == 14 && row == 5);
    }  // areaField()

    activeLayer(col, row) {
      for (let layer of [ 'layer3', 'layer2', 'layer1' ]) {
        if (this.blocks[layer][row][col]) return layer;
      }
      return this.crntState['layer'];
    }  // activeBlock()

    selectItembox() {
      this.crntState['layer'] = this.layers['itembox'];
      this.canvas[this.layers['itembox']].style.display = 'inline';
    }  // selectItembox()

    selectField(col, row, rotate) {
      let field = this.crntState['field'] + rotate
      const lastStage = 5;
      if (field > lastStage) {
        field = 0;
      } else if (field < 0) {
        field = lastStage;
      }
      this.crntState['field'] = field;
      const src = `layer1/stage/0${field}/field/00`;
      this.setSpriteBlock(col, row, this.layers['system'], src);
    }  // selectField()

    selectItem(col, row) {
      this.crntState['item'] = this.blocks[this.layers['itembox']][row][col]
      if (this.crntState['item']) {
        const layer = /^(layer\d)/.exec(this.crntState['item']);
        this.setSpriteBlock(14, 4, this.layers['system'], this.crntState['item']);
        this.crntState['layer'] = layer[1];
        this.prevState['layer'] = layer[1];
        this.canvas[this.layers['itembox']].style.display = 'none';
      }
    }  // selectItem()

    setSpriteBlock(col, row, layer, src) {
      this.removeSpriteBlock(col, row, layer);
      const context = this.contexts[layer];
      let image = new Image();
      image.onload = function() {
        context.drawImage(image, image.width * col, image.height * row);
      };
      image.src = this.imagesrc(src);
      this.blocks[layer][row][col] = src;
    }  // setSpriteBlock();

    removeSpriteBlock(col, row, layer) {
      const x = col * this.imageSize;
      const y = row * this.imageSize;
      this.contexts[layer].clearRect(x, y, this.imageSize, this.imageSize);
      this.blocks[layer][row][col] = '';
    }  // removeSpriteBlock()

    imagesrc(src) {
      return `/static/image/sprite/${this.crntState['graphic']}/${src}.png`;
    } // imagesrc()

    setSprite(layer, layerData) {
      this.blocks[layer] = layerData;
      const context = this.contexts[layer];
      context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (let row = 0; row < layerData.length; row++) {
        for (let col = 0; col < layerData[row].length; col++) {
          if (layerData[row][col] === '') continue;
          let image = new Image();
          image.onload = function() {
            context.drawImage(image, image.width * col, image.height * row);
          };
          image.src = this.imagesrc(layerData[row][col]);
        }
      }
    }  // setSprite()

    async rest(url, restData, callback) {
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

  // callback for /post/read rest
  //
  let setSprite = function(littleMagic, restData) {
    for (const [layer, layerData] of Object.entries(restData)) {
      littleMagic.setSprite(layer, layerData);
    }
  };  // let setSprite()

  let littleMagic = new LittleMagic();
  const initSprite = async function() {
    await littleMagic.rest('/post/read', { 'content': 'menu/admin' , 'graphic': 'sfc' }, setSprite);
    await littleMagic.rest('/post/read', { 'content': 'status/make', 'graphic': 'sfc' }, setSprite);
    await littleMagic.rest('/post/read', { 'content': 'stage/001'  , 'graphic': 'sfc' }, setSprite);
  }
  initSprite();

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

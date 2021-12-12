window.addEventListener('load', function () {
  class LittleMagic {
    constructor() {
      // object[layer]: array[row][col]
      // hold game data
      this.blocks = {};

      // sprite meta data
      this.metaData = {};

      // default sprite block size 32x32
      this.imageSize = 32;

      this.crntState = {
        'graphic': 'sfc',
        'item'   : '',
        'col'    : 0,
        'row'    : 0,
        'layer'  : 'layer1',
        'stage'  : 0,
      };

      this.prevState = {
        'layer' : 'layer1'
      };

      this.layers  = {
        'system' : 'layer4',
        'itembox': 'layer5'
      };

      this.canvas = {};
      this.contexts = {};
      this.initContext();

      // enable debug
      this.mouseDebug();
    }  // constructor()

    initContext() {
      const [gameWidth, gameHeight] = [ 512, 448 ];
      const scale = (window.innerWidth > gameWidth && window.innerHeight > gameHeight) ? 1 : 0.5;
      for (const canvas of document.querySelectorAll('canvas')) {
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
      const context = this.contexts[this.layers['system']];
      this.setIcon(context, 15,  4, 'Item');
      this.setIcon(context, 15,  5, 'Block');
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
      const context = this.contexts[this.layers['system']];
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
      const context = this.contexts[this.layers['system']];
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
      const [ col, row ] = [ parseInt(x / this.imageSize), parseInt(y / this.imageSize) ];
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
        } else if (this.areaBlock(col, row)) {
          this.selectBlock(col, row, 1);
        }
        break;
      case this.layers['itembox']:
        if (this.areaStage(col, row)) {
          this.selectItem(col, row);
        } else if (this.areaBlock(col, row)) {
          this.selectBlock(col, row, 1);
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
        } else if (this.areaBlock(col, row)) {
          this.selectBlock(col, row, -1);
        }
        break;
      case this.layers['itembox']:
        if (this.areaStage(col, row)) {
          this.canvas[this.crntState['layer']].style.display = 'none';
          this.crntState['layer'] = this.prevState['layer']
        } else if (this.areaBlock(col, row)) {
          this.selectBlock(col, row, -1);
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

    areaBlock(col, row) {
      return (col == 14 && row == 5);
    }  // areaBlock()

    activeLayer(col, row) {
      for (const layer of [ 'layer3', 'layer2', 'layer1' ]) {
        if (this.blocks[layer][row][col]) return layer;
      }
      return this.crntState['layer'];
    }  // activeBlock()

    selectItembox() {
      this.crntState['layer'] = this.layers['itembox'];
      this.canvas[this.layers['itembox']].style.display = 'inline';
    }  // selectItembox()

    selectItem(col, row) {
      this.crntState['item'] = this.blocks[this.layers['itembox']][row][col]
      if (this.crntState['item']) {
        const layer = /^(layer\d)/.exec(this.crntState['item']);
        this.setSpriteBlock(14, 4, this.layers['system'], this.crntState['item']);
        [ this.crntState['layer'], this.prevState['layer'] ] = [ layer[1], layer[1] ];
        this.canvas[this.layers['itembox']].style.display = 'none';
      }
    }  // selectItem()

    selectBlock(col, row, rotate) {
      let stage = this.crntState['stage'] + rotate;
      const lastStage = 5;
      stage = stage < 0 ? lastStage : stage %= lastStage + 1;
      this.crntState['stage'] = stage;
      const src = `layer1/stage/0${stage}/field/00`;
      this.setSpriteBlock(col, row, this.layers['system'], src);
      // update sprite
      this.updateStage(stage);
      this.updateItem(stage);
      this.updateItembox(stage);
    }  // selectBlock()

    replaceStage(src, stage) {
      const match = /\/(stage\/\d)/.exec(src);
      return match ? src.replace(/stage\/\d{2}/, `${match[1]}${stage}`) : '';
    }  // replaceStage()

    updateStage(stage) {
      for (const layer of [ 'layer1', 'layer2', 'layer3' ]) {
        const block = this.blocks[layer];
        for (let row = 0; row < block.length; row++) {
          for (let col = 0; col < block[row].length; col++) {
            const src = this.replaceStage(block[row][col], stage);
            if (src) this.setSpriteBlock(col, row, layer, src);
          }
        }
      }
    }  // updateStage()

    updateItem(stage) {
      const layer = this.layers['system'];
      const block = this.blocks[layer];
      const col = 14, row = 4;
      const src = this.replaceStage(block[row][col], stage);
      if (src) {
        const context = this.contexts[layer];
        context.fillStyle = 'black';
        context.fillRect(
          this.imageSize * col, this.imageSize * row, this.imageSize, this.imageSize);
          this.crntState['item'] = src;
          this.setSpriteBlock(col, row, layer, src, false);
      }
    }  // updateItem()

    updateItembox(stage) {
      const layer = this.layers['itembox'];
      const block = this.blocks[layer];
      const context = this.contexts[layer];
      context.fillStyle = 'white';
      context.fillRect(this.imageSize * 2, this.imageSize, this.imageSize * 7, this.imageSize);
      const row = 1;
      for (let col = 0; col < block[row].length; col++) {
        const src = this.replaceStage(block[row][col], stage);
        if (src) this.setSpriteBlock(col, row, layer, src, false);
      }
    }  // updateItembox()

    setSpriteBlock(col, row, layer, src, overwrite = true) {
      if (overwrite) this.removeSpriteBlock(col, row, layer);
      const context = this.contexts[layer];
      const image = new Image();
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

    setSpriteBlocks(layer, layerData) {
      this.blocks[layer] = layerData;
      const context = this.contexts[layer];
      context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (let row = 0; row < layerData.length; row++) {
        for (let col = 0; col < layerData[row].length; col++) {
          if (layerData[row][col] === '') continue;
          const image = new Image();
          image.onload = function() {
            context.drawImage(image, image.width * col, image.height * row);
          };
          image.src = this.imagesrc(layerData[row][col]);
        }
      }
    }  // setSpriteBlocks()

    imagesrc(src) {
      return `/static/image/sprite/${this.crntState['graphic']}/${src}.png`;
    } // imagesrc()

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
  const setSprite = function(littleMagic, restData) {
    for (data of restData) {
      for (const [layer, layerData] of Object.entries(data)) {
        if (layerData[0].constructor === Array) {
          littleMagic.setSpriteBlocks(layer, layerData);
        } else if (typeof layerData[0] === 'object') {
          for (const d of layerData) {
            littleMagic.setSpriteBlock(d['col'], d['row'], layer, d['sprite']);
          }
        }
      }
    }
  };  // const setSprite()

  const setMeta = function(littleMagic, restData) {
    littleMagic.metaData = restData;
  }  // setMeta()

  const littleMagic = new LittleMagic();
  const initSprite = async function() {
    await littleMagic.rest('/post/read',
      { 'file': 'meta/sprite', 'graphic': 'sfc', 'returnData': {} }, setMeta);
    await littleMagic.rest('/post/read',
      { 'file': [ 'menu/make', 'stage/000' ], 'graphic': 'sfc', 'returnData': [] }, setSprite);

  }
  initSprite();

  // event listener
  const canvas = document.getElementById('control')

  // left, right click
  for (mouseEvent of [ 'click', 'contextmenu' ]) {
    canvas.addEventListener(mouseEvent, function(event) {
      event.preventDefault();
      littleMagic.mouseEvent(canvas, event);
    });
  }
});

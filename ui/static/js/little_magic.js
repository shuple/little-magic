window.addEventListener('load', function () {
  class LittleMagic {
    constructor() {
      // object[layer]: array[row][col]
      this.blocks = {};

      // object[sprite]: {}
      this.metaData = {};

      this.position = {
        'block'     : { 'col': 14, 'row':  5 },
        'item'      : { 'col': 14, 'row':  4 },
        'stageEnd'  : { 'col': 13, 'row': 13 },
        'stageStart': { 'col':  1, 'row':  0 },
        'save'      : { 'col': 14, 'row': 12 },
      };

      this.font = {
        'medium': '12px Merio'
      };

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
        'menu'  : 'layer4',
        'system': 'layer5'
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

      this.contexts[this.layers['system']].fillStyle = 'white';
      this.contexts[this.layers['system']].fillRect(
        this.imageSize, 0, gameWidth - this.imageSize * 3, gameHeight);
      this.canvas[this.layers['system']].style.display = 'none';

      // icon
      const context = this.contexts[this.layers['menu']];
      for (const content of [ 'item', 'block', 'save' ]) {
        const key = content.toLowerCase();
        const position = this.position[key];
        this.setIcon(context, position['col'] + 1,  position['row'], content);
      }
    }  // initContext()

    setIcon(context, col, row, desc) {
      context.font = this.font['medium'];
      context.fillStyle = 'white';
      context.textAlign='center';
      context.textBaseline = 'middle';
      const [ iconWidth, iconHeight ] = [ this.imageSize * col, this.imageSize * row ];
      context.fillText(desc, iconWidth + (this.imageSize / 2), iconHeight + (this.imageSize / 2));
    }  // initIcon

    mouseDebug() {
      const [ x, y ] = [  452, 20 ];
      const context = this.contexts[this.layers['menu']];
      context.font = this.font['medium'];
      context.fillStyle = 'white';
      context.textAlign = 'start';
      context.textBaseline = 'alphabetic';
      context.fillText('X'  , x, y);
      context.fillText('Y'  , x, y * 2);
      context.fillText('COL', x, y * 3);
      context.fillText('ROW', x, y * 4);
      context.fillText('CTX', x, y * 5);
    }  // mouseDebug()

    mouseDebugStatus(xAxis, yAxis, col, row) {
      const [ x, y ] = [  480, 20 ];
      const context = this.contexts[this.layers['menu']];
      const ctx = /(\d)/.exec(this.crntState['layer'])[1];
      context.clearRect(480, 0, this.imageSize, this.imageSize * 4);
      context.fillText(`: ${xAxis}`, x, y);
      context.fillText(`: ${yAxis}`, x, y * 2);
      context.fillText(`: ${col}`  , x, y * 3);
      context.fillText(`: ${row}`  , x, y * 4);
      context.fillText(`: ${ctx}`  , x, y * 5);
    }  // mouseDebug()

    mouseEvent(canvas, event) {
      const [x, y] = this.mousePosition(canvas, event);
      const [ col, row ] = this.mousePositionToIndex(x, y);
      switch (event.button) {
      // left click
      case 0:
        this.leftClick(col, row, event);
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

    leftClick(col, row, event) {
      switch (this.crntState['layer']) {
      case 'layer1':
      case 'layer2':
      case 'layer3':
        if (this.crntState['item'] === '' && event.ctrlKey === false)
          this.crntState['item'] = this.itemOnBlock(col, row);
        if (this.areaRange(col, row, 'stage') && this.crntState['item']) {
          if (event.ctrlKey) {
            this.crntState['layer'] = this.activeLayer(col, row);
            this.itemRotateReset();
            this.removeSpriteBlock(col, row, this.crntState['layer']);
          } else {
            const layer = /^(layer\d)/.exec(this.crntState['item']);
            const src = this.itemRotate(col, row, layer[0], this.crntState['item']);
            this.crntState['item'] = src;
            this.setSpriteBlock(col, row, layer[0], src);
          }
        } else if (this.areaBlock(col, row, 'item')) {
          this.selectItembox();
        } else if (this.areaBlock(col, row, 'block')) {
          this.selectBlock(col, row, 1);
        }
        break;
      case this.layers['system']:
        if (this.areaRange(col, row, 'stage')) {
          this.selectItem(col, row);
        } else if (this.areaBlock(col, row, 'block')) {
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
        if (this.areaRange(col, row, 'stage')) {
          this.crntState['layer'] = this.activeLayer(col, row);
          this.itemRotateReset();
          this.removeSpriteBlock(col, row, this.crntState['layer']);
        } else if (this.areaBlock(col, row, 'item')) {
          this.setSpriteBlock(col, row, this.layers['menu'], 'layer0/void/01');
          this.crntState['item'] = ''
        } else if (this.areaBlock(col, row, 'block')) {
          this.selectBlock(col, row, -1);
        }
        break;
      case this.layers['system']:
        if (this.areaRange(col, row, 'stage')) {
          this.canvas[this.crntState['layer']].style.display = 'none';
          this.crntState['layer'] = this.prevState['layer']
        } else if (this.areaBlock(col, row, 'block')) {
          this.selectBlock(col, row, -1);
        }
        break;
      default:
      }
    }  // rightClick()

    areaRange(col, row, content) {
        const start = this.position[`${content}Start`];
        const end = this.position[`${content}End`];
        return (col >= start['col'] && col <= end['col'] && row >= start['row'] && row <= end['row']);
    }  // areaRange()

    areaBlock(col, row, content) {
      const position = this.position[content];
      return (col == position['col'] && row == position['row']);
    }  // areaBlock()

    activeLayer(col, row) {
      for (const layer of [ 'layer3', 'layer2', 'layer1' ]) {
        if (this.blocks[layer][row][col]) return layer;
      }
      return this.crntState['layer'];
    }  // activeBlock()

    selectItembox() {
      this.crntState['layer'] = this.layers['system'];
      this.canvas[this.layers['system']].style.display = 'inline';
    }  // selectItembox()

    selectItem(col, row) {
      this.crntState['item'] = this.blocks[this.layers['system']][row][col]
      if (this.crntState['item']) {
        const layer = /^(layer\d)/.exec(this.crntState['item']);
        const position = this.position['item'];
        this.setSpriteBlock(position['col'], position['row'], this.layers['menu'], this.crntState['item']);
        [ this.crntState['layer'], this.prevState['layer'] ] = [ layer[1], layer[1] ];
        this.canvas[this.layers['system']].style.display = 'none';
      }
    }  // selectItem()

    selectBlock(col, row, rotate) {
      let stage = this.crntState['stage'] + rotate;
      const lastStage = 5;
      stage = stage < 0 ? lastStage : stage %= lastStage + 1;
      this.crntState['stage'] = stage;
      const src = `layer1/stage/0${stage}/field/00`;
      this.setSpriteBlock(col, row, this.layers['menu'], src);
      // update sprite
      this.updateStage(stage);
      this.updateItem(stage);
      this.updateItembox(stage);
    }  // selectBlock()

    itemOnBlock(col ,row) {
      let src = '';
      for (const layer of [ 'layer3', 'layer2', 'layer1' ]) {
        if (this.blocks[layer][row][col]) {
          src = this.blocks[layer][row][col];
          const position = this.position['item'];
          this.setSpriteBlock(position['col'], position['row'], this.layers['menu'], src);
          break;
        }
      }
      return src;
    }  // itemOnBlock()

    itemRotate(col, row, layer, src) {
      return this.blocks[layer][row][col] == src && 'rotateItem' in this.metaData[src] ?
        this.metaData[src]['rotateItem'] : src;
    }  // itemRotate

    itemRotateReset() {
      if (this.crntState['item'] && 'rotateItem' in this.metaData[this.crntState['item']]) {
        const [ col, row ] = [ this.position['item']['col'], this.position['item']['row'] ];
        this.crntState['item'] = this.blocks[this.layers['menu']][row][col]
      }
    }  // itemRotateReset()

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
      const layer = this.layers['menu'];
      const block = this.blocks[layer];
      const [ col, row ] = [ this.position['item']['col'], this.position['item']['row'] ];
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
      const layer = this.layers['system'];
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
      if (src === this.blocks[layer][row][col]) return;
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
      { 'file': [ 'meta/make' ], 'graphic': 'sfc', 'returnData': {} }, setMeta);
    await littleMagic.rest('/post/read',
      { 'file': [ 'menu/make', 'stage/000' ], 'graphic': 'sfc', 'returnData': [] }, setSprite);

  }
  initSprite();

  // event listener
  const canvas = document.getElementById('control')

  // mouse event
  for (mouseEvent of [ 'click', 'contextmenu' ]) {
    canvas.addEventListener(mouseEvent, function(event) {
      event.preventDefault();
      littleMagic.mouseEvent(canvas, event);
    });
  }
});

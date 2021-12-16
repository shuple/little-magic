import { LittleMagicSprite, setSprite, setMeta } from './little_magic.js';

window.addEventListener('load', function () {
  class LittleMagicMaker extends LittleMagicSprite {
    constructor() {
      super();

      this.position = {
        'block'     : { 'col': 14, 'row':  5 },
        'item'      : { 'col': 14, 'row':  4 },
        'stageEnd'  : { 'col': 13, 'row': 13 },
        'stageStart': { 'col':  1, 'row':  0 },
        'save'      : { 'col': 14, 'row': 12 },
      };

      this.crntState = Object.assign(this.crntState, {
        'item'   : '',
        'col'    : 0,
        'row'    : 0,
        'layer'  : 'layer1',
        'stage'  : 0
      });

      this.prevState = {
        'layer' : 'layer1'
      };

      this.layers  = {
        'menu'  : 'layer4',
        'system': 'layer5',
        'grid'  : 'layer6'
      };

      this.canvas = {};
      this.contexts = {};
      this.initContext();

      // enable debug
      this.mouseDebug();
    }  // constructor()

    initContext() {
      super.initContext();
      this.menuContext();
      this.systemContext();
      this.gridContext();
    }  // initContext()

    menuContext() {
      const context = this.contexts[this.layers['menu']];
      for (const content of [ 'Item', 'Block', 'Save' ]) {
        const key = content.toLowerCase();
        const position = this.position[key];
        this.setIcon(context, position['col'] + 1,  position['row'], content);
      }
    }  // menuContext()

    systemContext() {
      const context = this.contexts[this.layers['system']];
      context.fillStyle = 'black';
      context.fillRect(this.imageSize, 0, this.gameWidth - this.imageSize * 3, this.gameHeight);
      this.canvas[this.layers['system']].style.display = 'none';
    }  // systemContext()

    gridContext() {
      const context = this.contexts[this.layers['grid']];
      const imageSize = this.imageSize
      const [ col, row ] = [ 1, 1 ];
      const [ colEnd, rowEnd ] = [ this.col - 3, this.row - 1];
      const color = 'red';
      for (let i = 0; i < colEnd; i++) {
        // col line
        this.drawLine(
          context,
          [ imageSize * 2, imageSize * (row + i)],
          [ imageSize * colEnd, imageSize * (row + i)], color
        );
        // row line
        if (i > 0) {
          this.drawLine(
            context,
            [ imageSize * (col + i), imageSize ],
            [ imageSize * (col + i), imageSize * rowEnd ], color
          );
        }
      }
      this.canvas[this.layers['grid']].style.display = 'none';
    }  // gridContext()

    drawLine(context, begin, end, stroke = 'black', width = 1) {
      context.strokeStyle = stroke;
      context.lineWidth = width;
      context.beginPath();
      context.moveTo(...begin);
      context.lineTo(...end);
      context.stroke();
    }  // drawLine()

    setIcon(context, col, row, desc) {
      context.font = this.font['medium'];
      context.fillStyle = 'white';
      context.textAlign='center';
      context.textBaseline = 'middle';
      const [ iconWidth, iconHeight ] = [ this.imageSize * col, this.imageSize * row ];
      context.fillText(desc, iconWidth + (this.imageSize / 2), iconHeight + (this.imageSize / 2));
    }  // initIcon

    mouseDebug() {
      const imageSize = this.imageSize
      const [ x, y ] = [ (imageSize * 14) + (imageSize / 8), imageSize * 0.6 ];
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
      const imageSize = this.imageSize
      const [ x, y ] = [  imageSize * 15, imageSize * 0.6 ];
      const context = this.contexts[this.layers['menu']];
      const ctx = /(\d)/.exec(this.crntState['layer'])[1];
      context.clearRect(x, 0, imageSize, imageSize * 4);
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
        if (this.areaRange(col, row, 'stage')) {
          if (event.ctrlKey) {
            this.crntState['layer'] = this.activeLayer(col, row);
            this.removeSpriteBlock(col, row, this.crntState['layer']);
            this.rotateItemReset();
          } else if (event.altKey) {
            this.crntState['item'] = this.itemOnBlock(col, row);
            this.crntState['layer'] = this.itemLayer(this.crntState['item']);
          } else if (this.crntState['item']) {
            const layer = this.itemLayer(this.crntState['item']);
            const src = this.rotateItem(col, row, layer, this.crntState['item']);
            this.crntState['item'] = src;
            this.crntState['layer'] = this.itemLayer(src);
            this.setSpriteBlock(col, row, layer, src);
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
          this.removeSpriteBlock(col, row, this.crntState['layer']);
          this.rotateItemReset();
        } else if (this.areaBlock(col, row, 'item')) {
          this.setSpriteBlock(col, row, this.layers['menu'], 'layer0/void/01');
          this.crntState['item'] = ''
        } else if (this.areaBlock(col, row, 'block')) {
          this.selectBlock(col, row, -1);
        }
        break;
      case this.layers['system']:
        if (this.areaRange(col, row, 'stage')) {
          this.crntState['layer'] = this.prevState['layer']
          this.closeItembox();
        } else if (this.areaBlock(col, row, 'item')) {
          this.setSpriteBlock(col, row, this.layers['menu'], 'layer0/void/01');
          this.crntState['layer'] = this.prevState['layer']
          this.crntState['item'] = ''
          this.closeItembox();
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

    itemLayer(item) {
      const layer = /^(layer\d)/.exec(item);
      return layer[0];
    }  // itemLayer()

    activeLayer(col, row) {
      for (const layer of [ 'layer3', 'layer2', 'layer1' ]) {
        if (this.blocks[layer][row][col]) return layer;
      }
      return this.crntState['layer'];
    }  // activeBlock()

    selectItembox() {
      this.crntState['layer'] = this.layers['system'];
      for (const layer of [ 'system', 'grid']) {
        this.canvas[this.layers[layer]].style.display = 'inline';
      }
    }  // selectItembox()

    selectItem(col, row) {
      this.crntState['item'] = this.blocks[this.layers['system']][row][col]
      if (this.crntState['item']) {
        const layer = /^(layer\d)/.exec(this.crntState['item']);
        const position = this.position['item'];
        this.setSpriteBlock(position['col'], position['row'], this.layers['menu'], this.crntState['item']);
        [ this.crntState['layer'], this.prevState['layer'] ] = [ layer[1], layer[1] ];
        this.closeItembox();
      }
    }  // selectItem()

    closeItembox() {
      for (const layer of [ 'system', 'grid']) {
        this.canvas[this.layers[layer]].style.display = 'none';
      }
    }  // closeItembox()

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

    rotateItem(col, row, layer, src) {
      return this.blocks[layer][row][col] == src && 'rotateItem' in this.metaData[src] ?
        this.metaData[src]['rotateItem'] : src;
    }  // rotateItem

    rotateItemReset() {
      if (this.crntState['item'] && 'rotateItem' in this.metaData[this.crntState['item']]) {
        const [ col, row ] = [ this.position['item']['col'], this.position['item']['row'] ];
        this.crntState['item'] = this.blocks[this.layers['menu']][row][col]
      }
    }  // rotateItemReset()

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
      context.fillStyle = 'black';
      context.fillRect(this.imageSize * 2, this.imageSize, this.imageSize * 7, this.imageSize);
      const row = 1;
      for (let col = 0; col < block[row].length; col++) {
        const src = this.replaceStage(block[row][col], stage);
        if (src) this.setSpriteBlock(col, row, layer, src, false);
      }
    }  // updateItembox()
  }  // class LittleMagicMaker

  const littleMagic = new LittleMagicMaker();
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
  for (const mouseEvent of [ 'click', 'contextmenu' ]) {
    canvas.addEventListener(mouseEvent, function(event) {
      event.preventDefault();
      littleMagic.mouseEvent(canvas, event);
    });
  }
});

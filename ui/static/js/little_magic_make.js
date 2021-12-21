import { LittleMagic } from './little_magic.js';
export { LittleMagicMake }

class LittleMagicMake extends LittleMagic {
  constructor() {
    super();

    this.position = {
      'menuEnd'     : { 'col': 14, 'row':  0 },
      'menuStart'   : { 'col': 15, 'row': 13 },
      'stageEnd'    : { 'col': 13, 'row': 13 },
      'stageStart'  : { 'col':  1, 'row':  0 },
      'itemboxStart': { 'col':  6, 'row':  0 },
      'itemboxEnd'  : { 'col': 13, 'row':  6 },
      'item'        : { 'col': 14, 'row':  4 },
      'block'       : { 'col': 14, 'row':  5 }
    };

    this.state = Object.assign(this.state, {
      'prev' : { 'layer': 'layer1' },
      'item' : '',
      'col'  : 0,
      'row'  : 0,
      'layer': 'layer1',
      'block': 0,
      'lastBlock' : 0
    });

    // layer alias
    this.stageLayers = [ 'layer1', 'layer2', 'layer3' ];
    this.layers  = {
      'menu'  : 'layer5',
      'system': 'layer6'
    };

    // static parameter
    this.static = {
      'lastBlock': 5
    };

    // initialize context
    this.makeContext();

    // enable debug
    this.mouseDebug();
  }  // constructor()

  makeContext() {
    this.menuContext();
    this.systemContext();
    this.canvas[this.layers['menu']].style.display = 'none';
  }

  menuContext() {
    const context = this.contexts[this.layers['menu']];
    for (const content of [ 'Item', 'Block' ]) {
      const key = content.toLowerCase();
      const position = this.position[key];
      this.setIcon(context, position['col'] + 1,  position['row'], content);
    }
  }  // menuContext()

  systemContext() {
    const [ x, y ] = [ this.imageSize * this.position['itemboxStart']['col'], 0 ];
    const width = this.gameWidth - this.imageSize *
      (this.position['itemboxEnd']['col'] - this.position['itemboxStart']['col'] + 1);
    const height = this.gameHeight - this.imageSize * this.position['itemboxEnd']['row'];
    const itemboxStart = this.position['itemboxStart'];
    const itemboxEnd = this.position['itemboxEnd'];
    const context = this.contexts[this.layers['system']];
    context.fillStyle = '#222';
    context.fillRect( x, y, width, height);
    this.canvas[this.layers['system']].style.display = 'none';
  }  // systemContext()

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
  }  // setIcon

  mouseDebug() {
    const imageSize = this.imageSize
    const [ x, y ] = [ (imageSize * 14) + (imageSize / 8), imageSize * 0.6 ];
    const context = this.contexts[this.layers['menu']];
    context.font = this.font['medium'];
    context.textAlign = 'start';
    context.textBaseline = 'alphabetic';
    context.fillStyle = 'white';
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
    const ctx = /(\d)/.exec(this.state['layer'])[1];
    context.clearRect(x, 0, imageSize, imageSize * 4);
    context.fillStyle = 'white';
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
    const [ col, row ] = [ parseInt(x / this.scrollWidth), parseInt(y / this.scrollWidth) ];
    if (isNaN(col)) col = 0;
    if (isNaN(row)) row = 0;
    return [ col, row ];
  }  // mousePositionToIndex

  // call after this.setMeta() and this.setSprite()
  //
  init() {
    this.setBlock();
    this.setLastBlock();
    this.canvas[this.layers['menu']].style.display = 'inline';
  }  // init()

  leftClick(col, row, event) {
    switch (this.state['layer']) {
    case 'layer1':
    case 'layer2':
    case 'layer3':
      if (this.areaRange(col, row, 'stage')) {
        if (event.ctrlKey) {
          this.state['layer'] = this.activeLayer(col, row);
          this.removeSpriteBlock(col, row, this.state['layer']);
          this.rotateItemReset();
        } else if (event.altKey) {
          this.state['item'] = this.itemOnBlock(col, row);
          this.state['layer'] = this.itemLayer(this.state['item']);
        } else if (this.state['item']) {
          const layer = this.itemLayer(this.state['item']);
          const src = this.rotateItem(col, row, layer, this.state['item']);
          this.state['item'] = src;
          this.state['layer'] = this.itemLayer(src);
          this.setSpriteBlock(col, row, layer, src);
        }
      } else if (this.areaBlock(col, row, 'item')) {
        this.selectItembox();
      } else if (this.areaBlock(col, row, 'block')) {
        this.selectBlock(col, row, 1);
      }
      break;
    case this.layers['system']:
      if (this.areaRange(col, row, 'itembox')) {
        this.selectItem(col, row);
      } else if (this.areaRange(col, row, 'stage')) {
        this.state['layer'] = this.state['prev']['layer'];
        this.closeItembox();
      } else if (this.areaBlock(col, row, 'item')) {
        this.state['layer'] = this.state['prev']['layer']
        this.closeItembox();
      } else if (this.areaBlock(col, row, 'block')) {
        this.selectBlock(col, row, 1);
      }
      break;
    }
  }  // leftClick()

  rightClick(col, row) {
    switch (this.state['layer']) {
    case 'layer1':
    case 'layer2':
    case 'layer3':
      if (this.areaRange(col, row, 'stage')) {
        this.state['layer'] = this.activeLayer(col, row);
        this.removeSpriteBlock(col, row, this.state['layer']);
        this.rotateItemReset();
      } else if (this.areaBlock(col, row, 'item')) {
        this.setSpriteBlock(col, row, this.layers['menu'], 'layer0/void/00');
        this.state['item'] = ''
      } else if (this.areaBlock(col, row, 'block')) {
        this.selectBlock(col, row, -1);
      }
      break;
    case this.layers['system']:
      if (this.areaRange(col, row, 'stage')) {
        this.state['layer'] = this.state['prev']['layer']
        this.closeItembox();
      } else if (this.areaBlock(col, row, 'item')) {
        this.state['layer'] = this.state['prev']['layer']
        this.setSpriteBlock(col, row, this.layers['menu'], 'layer0/void/00');
        this.state['item'] = ''
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
    for (const layer of [ ...this.stageLayers ].reverse()) {
      if (this.blocks[layer][row][col]) return layer;
    }
    return this.state['layer'];
  }  // activeBlock()

  selectItembox() {
    const layer = this.layers['system'];
    this.state['layer'] = layer;
    this.canvas[layer].style.display = 'inline';
  }  // selectItembox()

  setBlock() {
    // find block src from layer1
    const src = this.findBlock('layer1');
    const block = /\/block\/(\d{2})/.exec(src)[1];
    this.state['block'] = parseInt(block);
    this.updateItembox(this.state['block']);
    // set block on menu
    const [ col, row ] = [ this.position['block']['col'], this.position['block']['row'] ];
    this.setSpriteBlock(col, row, this.layers['menu'], `layer1/block/${block}/field/00`);
  }  // findBlock()

  findBlock(layer) {
    for (let row = 0; row < this.row; row++) {
      for (let col = 1; col < this.col - 2; col++) {
        const src = this.blocks[layer][row][col];
        if (/\/block/.exec(src)) return src;
      }
    }
    // default block
    return 'layer1/block/00/field/00';
  }  // stageBlock()

  setLastBlock() {
    while (`layer1/block/0${this.state['lastBlock']}/field/00` in this.metaData)
      this.state['lastBlock']++;
    // handle overflow
    this.state['lastBlock']--;
  }  // lastBlock

  selectItem(col, row) {
    this.state['item'] = this.blocks[this.layers['system']][row][col]
    if (this.state['item']) {
      const layer = /^(layer\d)/.exec(this.state['item']);
      const position = this.position['item'];
      this.setSpriteBlock(position['col'], position['row'], this.layers['menu'], this.state['item']);
      [ this.state['layer'], this.state['prev']['layer'] ] = [ layer[1], layer[1] ];
      this.closeItembox();
    }
  }  // selectItem()

  closeItembox() {
    this.canvas[this.layers['system']].style.display = 'none';
  }  // closeItembox()

  selectBlock(col, row, rotate) {
    let block = this.state['block'] + rotate;
    block = block < 0 ? this.state['lastBlock'] : block %= this.state['lastBlock'] + 1;
    this.state['block'] = block;
    const src = `layer1/block/0${block}/field/00`;
    this.setSpriteBlock(col, row, this.layers['menu'], src);
    // update sprite
    this.updateStage(block);
    this.updateItem(block);
    this.updateItembox(block);
  }  // selectBlock()

  itemOnBlock(col ,row) {
    let src = '';
    for (const layer of [ ...this.stageLayers ].reverse()) {
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
    if (this.state['item'] && 'rotateItem' in this.metaData[this.state['item']]) {
      const [ col, row ] = [ this.position['item']['col'], this.position['item']['row'] ];
      this.state['item'] = this.blocks[this.layers['menu']][row][col]
    }
  }  // rotateItemReset()

  replaceStage(src, block) {
    const match = /\/(block\/\d)/.exec(src);
    return match ? src.replace(/block\/\d{2}/, `${match[1]}${block}`) : '';
  }  // replaceStage()

  updateStage(replaceBlock) {
    for (const layer of this.stageLayers) {
      const block = this.blocks[layer];
      for (let row = 0; row < block.length; row++) {
        for (let col = 0; col < block[row].length; col++) {
          const src = this.replaceStage(block[row][col], replaceBlock);
          if (src) this.setSpriteBlock(col, row, layer, src);
        }
      }
    }
  }  // updateStage()

  updateItem(replaceBlock) {
    const layer = this.layers['menu'];
    const block = this.blocks[layer];
    const [ col, row ] = [ this.position['item']['col'], this.position['item']['row'] ];
    const src = this.replaceStage(block[row][col], replaceBlock);
    if (src) {
      const context = this.contexts[layer];
      context.fillStyle = 'black';
      context.fillRect(this.imageSize * col, this.imageSize * row, this.imageSize, this.imageSize);
      this.state['item'] = src;
      this.setSpriteBlock(col, row, layer, src, false);
    }
  }  // updateItem()

  updateItembox(replaceBlock) {
    const layer = this.layers['system'];
    const block = this.blocks[layer];
    const context = this.contexts[layer];
    context.fillStyle = '#222';
    context.fillRect(
      this.imageSize * (this.col - this.position['itemboxStart']['col']), this.imageSize,
      this.imageSize * 4, this.imageSize);
    const row = 1;
    for (let col = 2; col < block[row].length - 3; col++) {
      const src = this.replaceStage(block[row][col], replaceBlock);
      if (src) this.setSpriteBlock(col, row, layer, src, false);
    }
  }  // updateItembox()
}  // class LittleMagicMake

import { LittleMagic } from './little_magic.js';
export { LittleMagicMake }

class LittleMagicMake extends LittleMagic {
  constructor() {
    super();

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
    this.layers  = {
      'menu'  : 'layer5',
      'effect': 'layer6',
      'system': 'layer7'
    };
    this.layerAlias = {
      'stage' : [ 'layer1', 'layer2', 'layer3' ],
      'system': [ this.layers['effect'], this.layers['system'] ]
    };
  }  // constructor()

  makeContext() {
    this.menuContext();
    this.systemContext();
    // enable debug
    this.mouseDebug();
    this.canvas[this.layers['menu']].style.display = 'none';
  }

  menuContext() {
    const context = this.contexts[this.layers['menu']];
    for (const content of [ 'Item', 'Block' ]) {
      const key = content.toLowerCase();
      const position = this.meta['position'][key];
      this.setIcon(context, position['col'] + 1,  position['row'], content);
    }
  }  // menuContext()

  systemContext() {
    const layer = this.layers['effect'];
    const position = this.meta['position'];
    const [ x, y ] = [ this.imageSize * position['itemboxStart']['col'], 0 ];
    const width = this.gameWidth - this.imageSize *
      (position['itemboxEnd']['col'] - position['itemboxStart']['col'] + 1);
    const height = this.gameHeight - this.imageSize * position['itemboxEnd']['row'];
    const itemboxStart = position['itemboxStart'];
    const itemboxEnd = position['itemboxEnd'];
    const context = this.contexts[layer];
    context.fillStyle = '#222';
    context.fillRect( x, y, width, height);
    for (const layer of this.layerAlias['system']) {
      this.canvas[layer].style.display = 'none';
    }
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
    if (this.meta['debug']['mouseDebug']) {
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
    }
  }  // mouseDebug()

  mouseDebugStatus(xAxis, yAxis, col, row) {
    if (this.meta['debug']['mouseDebug']) {
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
    }
  }  // mouseDebug()

  mouseEvent(canvas, event) {
    const [x, y] = this.mousePosition(canvas, event);
    const [ col, row ] = this.mousePositionToIndex(x, y);
    switch (event.button) {
    // left click
    case 0:
      this.leftClick(col, row, event);
      break;
    // contextmenu
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
    let [ col, row ] = [ parseInt(x / this.scrollWidth), parseInt(y / this.scrollWidth) ];
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
        if (event.altKey) {
          this.state['item'] = this.itemOnBlock(col, row);
          this.state['layer'] = this.itemLayer(this.state['item']);
        } else if (this.state['item']) {
          const layer = this.itemLayer(this.state['item']);
          const src = this.rotateItem(col, row, layer, this.state['item']);
          this.state['item'] = src;
          this.state['layer'] = this.itemLayer(src);
          const opt = { 'prerender': true, 'clearSprite': true };
          this.setSpriteBlock(col, row, layer, src, opt);
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
        this.closeItembox(this.state['prev']['layer']);
      } else if (this.areaBlock(col, row, 'item')) {
        this.closeItembox(this.state['prev']['layer']);
      } else if (this.areaBlock(col, row, 'block')) {
        this.selectBlock(col, row, 1);
      } else if (this.areaRange(col, row, 'menu')) {
        this.closeItembox(this.state['prev']['layer']);
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
        const opt = { 'prerender': true, 'clearSprite': true };
        this.setSpriteBlock(col, row, this.layers['menu'], 'layer0/void/00', opt);
        this.state['item'] = ''
      } else if (this.areaBlock(col, row, 'block')) {
        this.selectBlock(col, row, -1);
      }
      break;
    case this.layers['system']:
      if (this.areaRange(col, row, 'stage')) {
        this.closeItembox(this.state['prev']['layer']);
      } else if (this.areaBlock(col, row, 'item')) {
        const opt = { 'prerender': true, 'clearSprite': true };
        this.setSpriteBlock(col, row, this.layers['menu'], 'layer0/void/00', opt);
        this.state['item'] = ''
        this.closeItembox(this.state['prev']['layer']);
      } else if (this.areaBlock(col, row, 'block')) {
        this.selectBlock(col, row, -1);
      } else if (this.areaRange(col, row, 'menu')) {
        this.closeItembox(this.state['prev']['layer']);
      }
      break;
    default:
    }
  }  // rightClick()

  areaRange(col, row, content) {
      const position = this.meta['position'];
      const start = position[`${content}Start`];
      const end = position[`${content}End`];
      return (col >= start['col'] && col <= end['col'] && row >= start['row'] && row <= end['row']);
  }  // areaRange()

  areaBlock(col, row, content) {
    const position = this.meta['position'][content];
    return (col === position['col'] && row === position['row']);
  }  // areaBlock()

  itemLayer(item) {
    const layer = /^(layer\d)/.exec(item);
    return layer[0];
  }  // itemLayer()

  activeLayer(col, row) {
    for (const layer of [ ...this.layerAlias['stage'] ].reverse()) {
      if (this.blocks[layer][row][col]) return layer;
    }
    return this.state['layer'];
  }  // activeBlock()

  selectItembox() {
    const layer = this.layers['system'];
    this.state['layer'] = layer;
    this.canvas[this.layers['effect']].style.display = 'inline';
    this.canvas[layer].style.display = 'inline';
  }  // selectItembox()

  setBlock() {
    // find block src from layer1
    const src = this.findBlock('layer1');
    const block = /\/block\/(\d{2})/.exec(src)[1];
    this.state['block'] = parseInt(block);
    this.updateItembox(this.state['block']);
    // set block on menu
    const position = this.meta['position'];
    const [ col, row ] = [ position['block']['col'], position['block']['row'] ];
    const opt = { 'prerender': true, 'clearSprite': true };
    this.setSpriteBlock(col, row, this.layers['menu'], `layer1/block/${block}/field/00`, opt);
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
    while (`layer1/block/0${this.state['lastBlock']}/field/00` in this.meta['sprite'])
      this.state['lastBlock']++;
    // handle overflow
    this.state['lastBlock']--;
  }  // lastBlock

  selectItem(col, row) {
    this.state['item'] = this.blocks[this.layers['system']][row][col]
    if (this.state['item']) {
      const layer = /^(layer\d)/.exec(this.state['item']);
      const position = this.meta['position']['item'];
      const opt = { 'prerender': true, 'clearSprite': true };
      this.setSpriteBlock(position['col'], position['row'], this.layers['menu'], this.state['item'], opt);
      [ this.state['layer'], this.state['prev']['layer'] ] = [ layer[1], layer[1] ];
      this.closeItembox();
    }
  }  // selectItem()

  closeItembox(layer) {
    if (layer) this.state['layer'] = layer;
    for (const layer of this.layerAlias['system']) {
      this.canvas[layer].style.display = 'none';
    }
  }  // closeItembox()

  selectBlock(col, row, rotate) {
    let block = this.state['block'] + rotate;
    block = block < 0 ? this.state['lastBlock'] : block %= this.state['lastBlock'] + 1;
    this.state['block'] = block;
    const src = `layer1/block/0${block}/field/00`;
    const opt = { 'prerender': true, 'clearSprite': true };
    this.setSpriteBlock(col, row, this.layers['menu'], src, opt);
    // update sprite
    for (const layer of this.layerAlias['stage'])
      this.updateLayerPrerender(layer, 0, this.col, 0, this.row, block);
    this.updateItem(block);
    if (this.state['layer'] === this.layers['system'])
      this.updateItemboxPrerender(block);
    else
      this.updateItembox(block);
  }  // selectBlock()

  itemOnBlock(col ,row) {
    let src = '';
    for (const layer of [ ...this.layerAlias['stage'] ].reverse()) {
      if (this.blocks[layer][row][col]) {
        src = this.blocks[layer][row][col];
        const position = this.meta['position']['item'];
        const opt = { 'prerender': true, 'clearSprite': true };
        this.setSpriteBlock(position['col'], position['row'], this.layers['menu'], src, opt);
        break;
      }
    }
    return src;
  }  // itemOnBlock()

  rotateItem(col, row, layer, src) {
    const sprite = this.meta['sprite'];
    return this.blocks[layer][row][col] === src && 'rotateItem' in sprite[src] ?
      sprite[src]['rotateItem'] : src;
  }  // rotateItem

  rotateItemReset() {
    if (this.state['item'] && 'rotateItem' in this.meta['sprite'][this.state['item']]) {
      const position = this.meta['position'];
      const [ col, row ] = [ position['item']['col'], position['item']['row'] ];
      this.state['item'] = this.blocks[this.layers['menu']][row][col]
    }
  }  // rotateItemReset()

  replaceBlock(src, block) {
    const match = /\/(block\/\d)/.exec(src);
    return match ? src.replace(/block\/\d{2}/, `${match[1]}${block}`) : '';
  }  // replaceBlock()

  async updateLayerPrerender(layer, colStart, colEnd, rowStart, rowEnd, replaceBlock) {
    const render = `render${/(\d)/.exec(layer)[1]}`
    const block = this.blocks[layer];
    for (let row = rowStart; row < rowEnd; row++) {
      for (let col = colStart; col < colEnd; col++) {
        const src = replaceBlock === undefined ?
          block[row][col] : this.replaceBlock(block[row][col], replaceBlock);
        if (src) {
          block[row][col] = src;
          await this.drawSpriteBlock(col, row, render, src);
        }
      }
    }
    this.copyCanvas(render, layer);
  }  // updateLayerPrerender()

  copyCanvas(render, layer) {
    const canvas  = this.canvas;
    const context = this.contexts;
    // display prerender
    canvas[render].style.display = 'inline';
    canvas[layer].style.display  = 'none';
    // copy prerender to layer
    context[layer].drawImage(canvas[render], 0, 0);
    // display layer
    canvas[layer].style.display  = 'inline';
    canvas[render].style.display = 'none';
  }  // copyCanvas

  updateItem(replaceBlock) {
    const layer = this.layers['menu'];
    const block = this.blocks[layer];
    const position = this.meta['position'];
    const [ col, row ] = [ position['item']['col'], position['item']['row'] ];
    const src = replaceBlock === undefined ?
      block[row][col] : this.replaceBlock(block[row][col], replaceBlock);
    if (src) {
      const context = this.contexts[layer];
      context.fillStyle = 'black';
      context.fillRect(this.imageSize * col, this.imageSize * row, this.imageSize, this.imageSize);
      this.state['item'] = src;
      const opt = { 'prerender': true, 'clearSprite': true };
      this.setSpriteBlock(col, row, layer, src, opt);
    }
  }  // updateItem()

  updateItembox(block, opt = {}) {
    const position = this.meta['position'];
    const [ colStart, colEnd ] =
      [ position['itemboxStart']['col'], position['itemboxEnd']['col'] ];
    const [ rowStart, rowEnd ] =
      [ position['itemboxStart']['row'], position['itemboxEnd']['row'] ];
    opt = Object.assign(opt, {
      'colStart': colStart,
      'colEnd'  : colEnd,
      'rowStart': rowStart,
      'rowEnd'  : rowEnd,
      'block'   : block
    });
    this.updateLayer(this.layers['system'], opt);
  }  // updateItembox()

  updateItemboxPrerender(replaceBlock) {
    const layer  = this.layers['system'];
    const render = layer.replace('layer', 'render');
    const contexts = this.contexts;
    this.copyCanvas(render, layer);
    // copy layer canvas to render canvas
    if (replaceBlock !== undefined)
      contexts[render].drawImage(this.canvas[layer], 0, 0);
    // overwrite dynamic item
    const imageSize = this.imageSize;
    const position = this.meta['position'];
    const [ x, y ] = [ imageSize * position['itemboxStart']['col'], imageSize ];
    const width = this.gameWidth - imageSize *
      (position['itemboxEnd']['col'] - position['itemboxStart']['col'] + 1);
    const height = imageSize * 2;
    contexts[render].fillStyle = '#222';
    contexts[render].fillRect(x, y, width, height);
    // prerender
    const [ colStart, colEnd ] =
      [ position['itemboxStart']['col'], position['itemboxEnd']['col'] ];
    const [ rowStart, rowEnd ] =
      [ position['itemboxStart']['row'], position['itemboxEnd']['row'] ];
    this.updateLayerPrerender(layer, colStart, colEnd, rowStart, rowEnd, replaceBlock);
  }  // updateItemboxPrerender()
}  // class LittleMagicMake

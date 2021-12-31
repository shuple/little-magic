import { LittleMagic } from './little_magic.js';
export { LittleMagicMake }

class LittleMagicMake extends LittleMagic {
  constructor() {
    super();

    // initial load
    this.loadScreen(true);

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
    this.layers  = Object.assign(this.layers, {
      'menu'  : 'layer5',
      'effect': 'layer6',
      'system': 'layer7'
    });

    this.layerGroup = Object.assign(this.layerGroup, {
      'stage' : [ 'layer1', 'layer2', 'layer3' ],
      'system': [ this.layers['effect'], this.layers['system'] ],
      'make'  : [ 'layer1', 'layer2', 'layer3', this.layers['system'] ]
    });
  }  // constructor()

  menuContext() {
    const context = this.contexts[this.layers['menu']];
    for (const content of [ 'Item', 'Block' ]) {
      const key = content.toLowerCase();
      const position = this.meta['position'][key];
      this.setMenuIcon(context, position['col'] + 1,  position['row'], content);
    }
  }  // menuContext()

  setMenuIcon(context, col, row, desc) {
    context.font = this.font['medium'];
    context.fillStyle = 'white';
    context.textAlign='center';
    context.textBaseline = 'middle';
    const [ iconWidth, iconHeight ] = [ this.imageSize * col, this.imageSize * row ];
    context.fillText(desc, iconWidth + (this.imageSize / 2), iconHeight + (this.imageSize / 2));
  }  // setMenuIcon

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
  }  // systemContext()

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

  leftClick(col, row, event) {
    switch (this.state['layer']) {
    case 'layer1':
    case 'layer2':
    case 'layer3':
      if (this.areaRange(col, row, 'stage')) {
        if (event.altKey) {
          this.state['item'] = this.itemOnStageBlock(col, row);
          this.state['layer'] = this.itemLayer(this.state['item']);
        } else if (this.state['item']) {
          const layer = this.itemLayer(this.state['item']);
          const src = this.rotateItem(col, row, layer, this.state['item']);
          this.state['item'] = src;
          this.state['layer'] = this.itemLayer(src);
          this.setSpriteBlock(col, row, layer, src);
        }
      } else if (this.areaBlock(col, row, 'item')) {
        this.selectMenuItembox();
      } else if (this.areaBlock(col, row, 'block')) {
        this.selectMenuBlock(col, row, 1);
      }
      break;
    case this.layers['system']:
      if (this.areaRange(col, row, 'itembox')) {
        this.selectSystemItembox(col, row);
      } else if (this.areaRange(col, row, 'stage')) {
        this.closeSystemItembox(this.state['prev']['layer']);
      } else if (this.areaBlock(col, row, 'item')) {
        this.closeSystemItembox(this.state['prev']['layer']);
      } else if (this.areaBlock(col, row, 'block')) {
        this.selectMenuBlock(col, row, 1);
      } else if (this.areaRange(col, row, 'menu')) {
        this.closeSystemItembox(this.state['prev']['layer']);
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
        this.selectMenuBlock(col, row, -1);
      }
      break;
    case this.layers['system']:
      if (this.areaRange(col, row, 'stage')) {
        this.closeSystemItembox(this.state['prev']['layer']);
      } else if (this.areaBlock(col, row, 'item')) {
        this.setSpriteBlock(col, row, this.layers['menu'], 'layer0/void/00');
        this.state['item'] = ''
        this.closeSystemItembox(this.state['prev']['layer']);
      } else if (this.areaBlock(col, row, 'block')) {
        this.selectMenuBlock(col, row, -1);
      } else if (this.areaRange(col, row, 'menu')) {
        this.closeSystemItembox(this.state['prev']['layer']);
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
    for (const layer of [ ...this.layerGroup['stage'] ].reverse()) {
      if (this.blocks[layer][row][col]) return layer;
    }
    return this.state['layer'];
  }  // activeBlock()

  selectMenuItembox() {
    const layer = this.layers['system'];
    this.state['layer'] = layer;
    this.canvas[this.layers['effect']].style.display = 'inline';
    this.canvas[layer].style.display = 'inline';
  }  // selectMenuItembox()

  async setMenuBlock() {
    // find block src from layer1
    const src = this.findStageBlock('layer1');
    const block = /\/block\/(\d{2})/.exec(src)[1];
    this.state['block'] = parseInt(block);
    // set block on menu
    const position = this.meta['position'];
    const [ col, row ] = [ position['block']['col'], position['block']['row'] ];
    await this.setSpriteBlock(col, row, this.layers['menu'], `layer1/block/${block}/field/00`);
  }  // setMenuBlock()

  findStageBlock(layer) {
    for (let row = 0; row < this.row; row++) {
      for (let col = 1; col < this.col - 2; col++) {
        const src = this.blocks[layer][row][col];
        if (/\/block/.exec(src)) return src;
      }
    }
    // default block
    return 'layer1/block/00/field/00';
  }  // findStageBlock()

  setStateLastBlock() {
    while (`layer1/block/0${this.state['lastBlock']}/field/00` in this.meta['sprite'])
      this.state['lastBlock']++;
    // handle overflow
    this.state['lastBlock']--;
  }  // setStateLastBlock()

  selectSystemItembox(col, row) {
    this.state['item'] = this.blocks[this.layers['system']][row][col]
    if (this.state['item']) {
      const layer = /^(layer\d)/.exec(this.state['item']);
      const position = this.meta['position']['item'];
      this.setSpriteBlock(position['col'], position['row'], this.layers['menu'], this.state['item']);
      [ this.state['layer'], this.state['prev']['layer'] ] = [ layer[1], layer[1] ];
      this.closeSystemItembox();
    }
  }  // selectSystemItembox()

  closeSystemItembox(layer) {
    if (layer) this.state['layer'] = layer;
    for (const layer of this.layerGroup['system']) {
      this.canvas[layer].style.display = 'none';
    }
  }  // closeSystemItembox()

  selectMenuBlock(col, row, rotate) {
    let block = this.state['block'] + rotate;
    block = block < 0 ? this.state['lastBlock'] : block %= this.state['lastBlock'] + 1;
    this.state['block'] = block;
    const src = `layer1/block/0${block}/field/00`;
    this.setSpriteBlock(col, row, this.layers['menu'], src);
    // update sprite
    this.updateBlock(this.layerGroup['make'], block);
    this.setSpriteLayer(this.layerGroup['stage']);
    this.updateMenuItem(block);
    this.updateSystemItembox(block);
    if (this.state['layer'] === this.layers['system']) {
      this.showPrerender(this.layers['system']);
    }
  }  // selectMenuBlock()

  updateBlock(layers, replaceBlock) {
    if (typeof layers == 'string') layers = layers.split(' ');
    for (const layer of layers) {
      const block = this.blocks[layer];
      for (let row = 0; row < this.row; row++) {
        for (let col = 0; col < this.col; col++) {
          const src = block[row][col];
          const match = /\/(block\/\d)/.exec(src);
          if (match) {
            block[row][col] = src.replace(/block\/\d{2}/, `${match[1]}${replaceBlock}`);
          }
        }
      }
    }
  }  // updateBlock()

  itemOnStageBlock(col ,row) {
    let src = '';
    for (const layer of [ ...this.layerGroup['stage'] ].reverse()) {
      if (this.blocks[layer][row][col]) {
        src = this.blocks[layer][row][col];
        const position = this.meta['position']['item'];
        this.setSpriteBlock(position['col'], position['row'], this.layers['menu'], src);
        break;
      }
    }
    return src;
  }  // itemOnStageBlock()

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

  updateMenuItem(replaceBlock) {
    const layer = this.layers['menu'];
    const block = this.blocks[layer];
    const position = this.meta['position'];
    const [ col, row ] = [ position['item']['col'], position['item']['row'] ];
    const src = this.replaceBlock(block[row][col], replaceBlock);
    if (src) {
      const context = this.contexts[layer];
      context.fillStyle = 'black';
      context.fillRect(this.imageSize * col, this.imageSize * row, this.imageSize, this.imageSize);
      this.state['item'] = src;
      this.setSpriteBlock(col, row, layer, src);
    }
  }  // updateMenuItem()

  updateSystemItembox(block) {
    const position = this.meta['position'];
    const [ colStart, colEnd ] =
      [ position['itemboxStart']['col'], position['itemboxEnd']['col'] ];
    const [ rowStart, rowEnd ] =
      [ position['itemboxStart']['row'], position['itemboxEnd']['row'] ];
    const opt = {
      'colStart': colStart,
      'colEnd'  : colEnd,
      'rowStart': rowStart,
      'rowEnd'  : rowEnd,
      'block'   : block
    };
    this.updateBlock(this.layers['system'], block);
    this.setSpriteLayer(this.layers['system'], opt);
  }  // updateSystemItembox()

  // rest callback
  //
  async setSprite(littleMagic, restData) {
    const layers = Object.keys(restData);
    littleMagic.blocks = restData;
    await littleMagic.setSpriteLayer(layers);
    await littleMagic.setMenuBlock();
    littleMagic.menuContext();
    littleMagic.systemContext();
    littleMagic.setStateLastBlock();
    // debug option
    littleMagic.mouseDebug();
    // hide system layer
    for (const layer of littleMagic.layerGroup['system']) {
      littleMagic.canvas[layer].style.display = 'none';
    }
    // show game screen
    littleMagic.loadScreen(false);
  }  // setSprite()
}  // class LittleMagicMake

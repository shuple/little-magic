import { LittleMagic } from './little_magic.js';
export { LittleMagicMake }

String.prototype.hashCode = function() {
  let hash = 0;
  let i, ch;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    ch = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + ch;
    hash |= 0; // convert to 32bit integer
  }
	return hash;
};  // String.prototype.hashCode()

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
      'stage': '001',
      'hash' : ''
    });

    this.system = Object.assign(this.system, {
      'lastBlock': 0
    });

    // layer alias
    this.layers  = Object.assign(this.layers, {
      'menu'  : 'layer5',
      'fill'  : 'layer6',
      'system': 'layer7'
    });

    this.color  = Object.assign(this.color, {
      'menu'  : '#fff',
      'system': '#222'
    });

    this.layerGroup = Object.assign(this.layerGroup, {
      'stage' : [ 'layer1', 'layer2', 'layer3' ],
      'system': [ this.layers['fill'], this.layers['system'] ],
      'make'  : [ 'layer1', 'layer2', 'layer3', this.layers['system'] ]
    });
  }  // constructor()

  async menuContext() {
    const context = this.contexts[this.layers['menu']];
    const imageSize = this.imageSize
    const item = this.meta['position']['item'];
    context.fillSytle = this.color['blank'];
    context.fillRect(item['col'] * imageSize, item['row'] * imageSize, imageSize, imageSize);
    for (const content of [ 'Item', 'Block', 'New', 'Save' ]) {
      const key = content.toLowerCase();
      const position = this.meta['position'][key];
      this.setMenuDesc(context, position['col'] + 1,  position['row'], content);
    }
    await this.setMenuBlockIcon();
    await this.setMenuIcons();
  }  // menuContext()

  setMenuDesc(context, col, row, text) {
    context.font = this.font['medium'];
    context.fillStyle = this.color['menu'];
    context.textAlign='start';
    context.textBaseline = 'middle';
    const [ iconWidth, iconHeight ] = [ this.imageSize * col, this.imageSize * row ];
    context.fillText(text, iconWidth + (this.imageSize / this.col), iconHeight + (this.imageSize / 2));
  }  // setMenuDesc

  setMenuReplyText(context, col, row, text) {
    const imageSize = this.imageSize
    const [ x, y ] = [ imageSize * col + (imageSize / 8), imageSize * (row + 1.4) ];
    context.font = this.font['medium'];
    context.textAlign = 'start';
    context.textBaseline = 'alphabetic';
    context.fillStyle = this.color['menu'];
    context.clearRect(imageSize * col, imageSize * (row + 1), imageSize * 2, imageSize);
    context.fillText(text, x, y);
    setTimeout(function(imageSize, col, row) {
      context.clearRect(imageSize * col, imageSize * (row + 1), imageSize * 2, imageSize);
    }, this.system['timeout'] * 20, imageSize, col, row);
  }  // setMenuReplyText

  systemContext() {
    const layer = this.layers['fill'];
    const position = this.meta['position'];
    const [ x, y ] = [ this.imageSize * position['itemboxStart']['col'], 0 ];
    const width = this.gameWidth - this.imageSize *
      (position['itemboxEnd']['col'] - position['itemboxStart']['col'] + 1);
    const height = this.gameHeight - this.imageSize * (position['itemboxEnd']['row'] - 1);
    const itemboxStart = position['itemboxStart'];
    const itemboxEnd = position['itemboxEnd'];
    const context = this.contexts[layer];
    context.fillStyle = this.color['system'];
    context.fillRect( x, y, width, height);
  }  // systemContext()

  mouseDebug() {
    if (this.meta['debug']['mouseDebug']) {
      const imageSize = this.imageSize
      const [ x, y ] = [ (imageSize * (this.col - 2)) + (imageSize / 8), imageSize * 0.6 ];
      const context = this.contexts[this.layers['menu']];
      context.font = this.font['medium'];
      context.textAlign = 'start';
      context.textBaseline = 'alphabetic';
      context.fillStyle = this.color['menu'];
      const contents = [ 'X', 'Y', 'COL', 'ROW', 'CTX' ];
      for (let i = 0; i < contents.length; i++) {
        context.fillText(contents[i] , x, y * (i + 1));
      }
    }
  }  // mouseDebug()

  mouseDebugStatus(xAxis, yAxis, col, row) {
    if (this.meta['debug']['mouseDebug']) {
      const imageSize = this.imageSize
      const [ x, y ] = [  imageSize * 15, imageSize * 0.6 ];
      const context = this.contexts[this.layers['menu']];
      const ctx = /(\d)/.exec(this.state['layer'])[1];
      context.clearRect(x, 0, imageSize, imageSize * 4);
      context.fillStyle = this.color['menu'];
      const contents = [ xAxis, yAxis, col, row, ctx ];
      for (let i = 0; i < contents.length; i++) {
        context.fillText(`: ${contents[i]}`, x, y * (i + 1));
      }
    }
  }  // mouseDebug()

  mouseEvent(canvas, event, button) {
    const [x, y] = this.mousePosition(canvas, event);
    const [ col, row ] = this.mousePositionToIndex(x, y);
    switch (button || event.button) {
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
      } else if (this.areaBlock(col, row, 'new')) {
        this.selectMenuNew();
      } else if (this.areaBlock(col, row, 'save')) {
        this.selectMenuSave();
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
    this.canvas[this.layers['fill']].style.display = 'inline';
    this.canvas[layer].style.display = 'inline';
  }  // selectMenuItembox()

  async setMenuBlockIcon() {
    // find block src from layer1
    const src = this.findStageBlock('layer1');
    const block = /\/block\/(\d{2})/.exec(src)[1];
    this.state['block'] = parseInt(block);

    // set block on menu
    const position = this.meta['position'];
    const [ col, row ] = [ position['block']['col'], position['block']['row'] ];
    await this.setSpriteBlock(col, row, this.layers['menu'], `layer1/block/${block}/field/00`);
  }  // setMenuBlockIcon()

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
    while (`layer1/block/0${this.system['lastBlock']}/field/00` in this.meta['sprite'])
      this.system['lastBlock']++;

    // handle overflow
    this.system['lastBlock']--;
  }  // setStateLastBlock()

  async setMenuIcons() {
    for (const content of [ 'new', 'save' ]) {
      const src = `layer0/${content}/00`;
      const position = this.meta['position'][content];
      await this.setSpriteBlock(position['col'], position['row'], this.layers['menu'], src);
    }
  }  // setMenuIcons()

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
    // prevent click bashing
    if (this.load) return;
    this.load = true;
    setTimeout(function(littleMagic) {
      littleMagic.load = false;
    }, this.system['timeout'] * 2, this);
    let block = this.state['block'] + rotate;
    block = block < 0 ? this.system['lastBlock'] : block %= this.system['lastBlock'] + 1;
    this.state['block'] = block;
    const src = `layer1/block/0${block}/field/00`;

    // update sprite
    this.setSpriteBlock(col, row, this.layers['menu'], src);
    this.updateBlock(this.layerGroup['make'], block);
    this.setSpriteLayer(this.layerGroup['stage']);
    this.updateMenuItem(block);
    this.updateSystemItembox(block);
  }  // selectMenuBlock()

  updateBlock(layers, newBlock) {
    if (typeof layers == 'string') layers = layers.split(' ');
    for (const layer of layers) {
      const block = this.blocks[layer];
      for (let row =  0; row < this.row; row++) {
        for (let col = 0; col < this.col; col++) {
          const src = block[row][col];
          const match = /\/(block\/\d)/.exec(src);
          if (match) {
            block[row][col] = src.replace(/block\/\d{2}/, `${match[1]}${newBlock}`);
          }
        }
      }
    }
  }  // updateBlock()

  selectMenuNew() {
    if (this.state['stage'] === 'new') return;
    this.state['stage'] = 'new';
    const restData = {
      'graphic': this.state['graphic'],
      'file'   : [ 'menu/make', 'stage/new' ],
    };
    this.rest('/post/read', restData, this.setStage);
  }  // selectMenuNew()

  selectMenuSave() {
    if (this.state['hash'] === this.stageHash()) {
      const context = this.contexts[this.layers['menu']];
      const position = this.meta['position']['save'];
      this.setMenuReplyText(context, position['col'], position['row'], 'No\nChanges');
      return;
    }
    let stageBlocks = {};
    for (const layer of this.layerGroup['stage']) {
      stageBlocks[layer] = this.blocks[layer];
    }
    const restData = {
      'content': 'stage',
      'graphic': this.state['graphic'],
      'stage'  : this.state['stage'],
      'blocks' : stageBlocks
    };
    this.rest('/post/write', restData , this.saveStage);
  }  // selectMenuSave()

  stageHash() {
    let stages = [];
    for (const stage of this.layerGroup['stage']) {
      stages.push(this.blocks[stage]);
    }
    return JSON.stringify(stages).hashCode();
  }  // stageHash()

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

  nextBlock(src, block) {
    const match = /\/(block\/\d)/.exec(src);
    return match ? src.replace(/block\/\d{2}/, `${match[1]}${block}`) : '';
  }  // nextBlock()

  updateMenuItem(nextBlock) {
    const layer = this.layers['menu'];
    const block = this.blocks[layer];
    const position = this.meta['position'];
    const [ col, row ] = [ position['item']['col'], position['item']['row'] ];
    const src = this.nextBlock(block[row][col], nextBlock);
    if (src) {
      const context = this.contexts[layer];
      context.fillStyle = this.color['blank'];
      context.fillRect(this.imageSize * col, this.imageSize * row, this.imageSize, this.imageSize);
      this.state['item'] = src;
      this.setSpriteBlock(col, row, layer, src);
    }
  }  // updateMenuItem()

  updateSystemItembox(nextBlock) {
    const position = this.meta['position'];
    let opt = {
      'colStart'   : position['itemboxStart']['col'],
      'colEnd'     : position['itemboxEnd']['col'],
      'rowStart'   : position['itemboxStart']['row'],
      'rowEnd'     : position['itemboxEnd']['row'],
      'noPrerender': this.state['layer'] !== this.layers['system']
    };
    this.updateBlock(this.layers['system'], nextBlock);
    this.setSpriteLayer(this.layers['system'], opt);
  }  // updateSystemItembox()

  // rest callback

  async setGame(littleMagic, restData) {
    const layers = Object.keys(restData);
    littleMagic.blocks = restData;
    littleMagic.state['hash'] = littleMagic.stageHash();
    await littleMagic.setSpriteLayer(layers);
    await littleMagic.menuContext();
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
  }  // setGame()

  async setStage(littleMagic, restData) {
    const layers = Object.keys(restData);
    littleMagic.blocks = restData;
    littleMagic.state['hash'] = littleMagic.stageHash();

    // use this.state['block'] for new stage
    if (littleMagic.state['stage'] === 'new') {
      const block = parseInt(/(\d)$/.exec(littleMagic.findStageBlock('layer1'))[1]);
      if (littleMagic.state['block'] != block) {
        const updateLayers = littleMagic.layerGroup['stage'].concat(littleMagic.layers['system']);
        littleMagic.updateBlock(updateLayers, littleMagic.state['block']);
      }
    }

    // update sprite
    littleMagic.setSpriteLayer(littleMagic.layerGroup['stage']);
    littleMagic.setSpriteLayer(littleMagic.layers['system'], { 'noPrerender': true });
    littleMagic.setMenuBlockIcon();
  }  // setStage()

  saveStage(littleMagic, restData) {
    const layer = littleMagic.layers['menu'];
    const context = littleMagic.contexts[layer];
    const position = littleMagic.meta['position']['save'];
    littleMagic.setMenuReplyText(
      context, position['col'], position['row'], `Saved ${restData['stage']}!!`);
    // save state
    littleMagic.state['stage'] = restData['stage'];
    littleMagic.state['hash'] = littleMagic.stageHash();
  }  // saveStage()
}  // class LittleMagicMake

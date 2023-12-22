import { LittleMagic } from './littlemagic.js';
export { LittleMagicMake }

/**
 * Extends the String object with a hashCode method.
 * Calculates and returns a 32-bit integer hash code for the string.
 *
 * @returns {number} The hash code of the string, represented as a 32-bit integer.
 */
String.prototype.hashCode = function() {
  let hash = 0;
  if (this.length === 0) return hash;
  for (let i = 0; i < this.length; i++) {
    const ch = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + ch;
    hash |= 0; // convert to 32bit integer
  }
  return hash;
};  // String.prototype.hashCode()

/**
 * Extends the String object with a capitalizeFirstLetter method.
 * Capitalizes the first letter of the string and returns the modified string.
 *
 * @returns {string} The string with its first letter capitalized.
 */
String.prototype.capitalizeFirstLetter = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

/**
 * LittleMagicMake provides additional functionalities specific to the 'make' mode of the game.
 * This subclass includes methods for handling game stage creation and editing, menu interactions,
 * sprite management, and stage saving/loading functionalities.
 */
class LittleMagicMake extends LittleMagic {
  /**
   * Initializes game state, layers, colors, and layer groups specific to the 'make' mode.
   */
  constructor() {
    super();

    // initial load
    this.loadScreen(true);

    this.state = Object.assign(this.state, {
      'prev' : { 'layer': 'layer1', 'cg': this.state['cg'] },
      'item' : '',
      'col'  : 0,
      'row'  : 0,
      'layer': 'layer1',
      'block': 0,
      'stage': 1,
      'hash' : ''
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
      'system': [ this.layers['fill'], this.layers['system'] ],
      'make'  : [ 'layer1', 'layer2', 'layer3', this.layers['system'] ]
    });
  }  // constructor()

  /**
   * Renders the menu context by setting descriptions, sprites,
   * and text on sprites based on metadata positions.
   *
   * @returns {Promise} A promise that resolves when all menu elements have been rendered.
   */
  async menuContext() {
    for (let content of Object.keys(this.meta['position'])) {
      const position = this.meta['position'][content];
      // text
      this.setMenuDesc(position['col'] + 1,  position['row'], content);
      // sprite
      await this.setMenuSprite(position['col'], position['row'], content);
      // text on sprite
      this.setMenuSpriteText(position['col'], position['row'], content);
    }
  }  // menuContext()

  /**
   * Sets the description text for a menu item at a specified column and row.
   *
   * @param {number} col - The column position for the text.
   * @param {number} row - The row position for the text.
   * @param {string} text - The text to be displayed.
   */
  setMenuDesc(col, row, text) {
    text = text.length > 2 ? text.capitalizeFirstLetter() : text.toUpperCase();
    const imageSize = this.imageSize;
    const [ x, y ] = [ imageSize * col, imageSize * row ];
    const context = this.menuContextText();
    context.textAlign = 'start';
    context.textBaseline = 'middle'
    context.fillText(text, x + 2, y + imageSize / 2);
  }  // setMenuDesc

  /**
   * Retrieves the canvas context for the menu layer and sets its font and fill style.
   *
   * @returns {CanvasRenderingContext2D} The canvas context configured for menu text rendering.
   */
  menuContextText() {
    const context = this.contexts[this.layers['menu']];
    context.font = this.font['medium'];
    context.fillStyle = this.color['menu'];
    return context;
  }  // menuContextText()

  /**
   * Sets the sprite for a menu item based on its content type.
   * Renders different sprites or icons for various menu items like 'item', 'stage', 'block', etc.
   *
   * @param {number} col - The column position for the sprite.
   * @param {number} row - The row position for the sprite.
   * @param {string} content - The type of content that determines the sprite to be rendered.
   * @returns {Promise} A promise that resolves when the sprite is set, particularly for asynchronous
   *                    icon setting.
   */
  async setMenuSprite(col, row, content) {
    const context = this.contexts[this.layers['menu']];
    const imageSize = this.imageSize;
    context.fillStyle = this.color['blank'];
      switch (content) {
        case 'item' :
        case 'stage':
          context.fillStyle = this.color['blank'];
          context.fillRect(col * imageSize, row * imageSize, imageSize, imageSize);
          break;
        case 'block':
          await this.setMenuBlockIcon();
          break;
        case 'fill':
        case 'cg'  :
        case 'new' :
        case 'save':
          await this.setMenuIcon(content);
          break;
      }
  }  // setMenuSprite

  /**
   * Sets the text on a sprite in the menu, with specific handling based on the content type.
   * For 'stage', it displays the current stage number or 'new' if no stage is set.
   *
   * @param {number} col - The column position for the text.
   * @param {number} row - The row position for the text.
   * @param {string} content - The type of content that determines the text to be rendered.
   */
  setMenuSpriteText(col, row, content) {
    const imageSize = this.imageSize;
    const context = this.contexts[this.layers['menu']];
    context.fillStyle = this.color['blank'];
    switch (content) {
    case 'stage':
      const stage = this.state['stage'] ? this.padZero(this.state['stage']) : 'new';
      context.fillRect(col * imageSize, row * imageSize, imageSize, imageSize);
      this.setMenuSpriteDesc(col, row, stage);
      break;
    }
  }  // setMenuSpriteText()

  /**
   * Renders text description centered on a sprite in the menu.
   *
   * @param {number} col - The column position for the text.
   * @param {number} row - The row position for the text.
   * @param {string} text - The text to be rendered on the sprite.
   */
  setMenuSpriteDesc(col, row, text) {
    const imageSize = this.imageSize;
    const [ x, y ] = [ imageSize * col , imageSize * row ];
    const context = this.menuContextText();
    context.textAlign = 'center';
    context.textBaseline = 'middle'
    context.fillText(text, x + imageSize / 2, y + imageSize / 2);
  }  // setMenuDesc

  /**
   * Displays reply text in the menu for a short duration, then clears it.
   * The text is positioned slightly offset from the specified column and row.
   *
   * @param {number} col - The column position for the text.
   * @param {number} row - The row position for the text.
   * @param {string} text - The reply text to be displayed.
   */
  setMenuReplyText(col, row, text) {
    const imageSize = this.imageSize
    const [ x, y ] = [ imageSize * col + (imageSize / 8), imageSize * (row + 1.4) ];
    const context = this.menuContextText();
    context.textAlign = 'start';
    context.textBaseline = 'alphabetic';
    context.clearRect(imageSize * col, imageSize * (row + 1), imageSize * 2, imageSize);
    context.fillText(text, x, y);
    setTimeout(function(imageSize, col, row) {
      context.clearRect(imageSize * col, imageSize * (row + 1), imageSize * 2, imageSize);
    }, this.meta['timeout'] * 20, imageSize, col, row);
  }  // setMenuReplyText

  /**
   * Sets the stage text in the menu, displayed at a specific position defined in the metadata.
   * The text is zero-padded and rendered on a blank background.
   *
   * @param {string|number} text - The stage number or text to be displayed, which will be zero-padded.
   */
  setMenuStageText(text) {
    const imageSize = this.imageSize;
    const [ col, row ] = [ this.meta['position']['stage']['col'], this.meta['position']['stage']['row'] ];
    const context = this.contexts[this.layers['menu']];
    context.fillStyle = this.color['blank'];
    context.fillRect(col * imageSize, row * imageSize, imageSize, imageSize);
    this.setMenuSpriteDesc(col, row, this.padZero(text, 3));
  }  // setMenuStage

  /**
   * Renders the system context area, filling a specified region based on metadata positions.
   * The filled area represents the system context in the game interface.
   */
  systemContext() {
    const layer = this.layers['fill'];
    const position = this.meta['positionRange']['itembox'];
    const [ x, y ] = [ this.imageSize * position['start']['col'], 0 ];
    const width = this.gameWidth - this.imageSize *
      (position['end']['col'] - position['start']['col'] + 1);
    const height = this.gameHeight - this.imageSize * (position['end']['row'] - 1);
    const itemboxStart = position['start'];
    const itemboxEnd = position['end'];
    const context = this.contexts[layer];
    context.fillStyle = this.color['system'];
    context.fillRect( x, y, width, height);
  }  // systemContext()

  /**
   * Displays mouse debugging information on the menu layer if the debug mode is enabled.
   * Shows coordinates and context-related data at a specified position.
   */
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

  /**
   * Updates and displays mouse position and context status for debugging.
   * Renders the current mouse coordinates and related information if debug mode is enabled.
   *
   * @param {number} xAxis - The X-axis coordinate of the mouse.
   * @param {number} yAxis - The Y-axis coordinate of the mouse.
   * @param {number} col - The column number corresponding to the mouse position.
   * @param {number} row - The row number corresponding to the mouse position.
   */
  mouseDebugStatus(xAxis, yAxis, col, row) {
    if (this.meta['debug']['mouseDebug']) {
      const imageSize = this.imageSize
      const [ x, y ] = [  imageSize * 15, imageSize * 0.6 ];
      const ctx = /(\d)/.exec(this.state['layer'])[1];
      const context = this.contexts[this.layers['menu']];
      context.textAlign = 'start';
      context.textBaseline = 'alphabetic';
      context.clearRect(x, 0, imageSize, imageSize * 4);
      context.fillStyle = this.color['menu'];
      const contents = [ xAxis, yAxis, col, row, ctx ];
      for (let i = 0; i < contents.length; i++) {
        context.fillText(`: ${contents[i]}`, x, y * (i + 1));
      }
    }
  }  // mouseDebugStatus()

  /**
   * Handles mouse events on the canvas, determining position and triggering appropriate actions.
   * It processes click or press-hold actions and updates the mouse debug status.
   *
   * @param {HTMLCanvasElement} canvas - The canvas element where the mouse event occurred.
   * @param {MouseEvent} event - The mouse event to be handled.
   * @param {boolean} pressHold - Indicates whether the event is a press-hold action.
   */
  mouseEvent(canvas, event, pressHold) {
    const [x, y] = this.mousePosition(canvas, event);
    const [ col, row ] = this.mousePositionToIndex(x, y);
    if (pressHold) {
      this.pressHold(col, row);
    } else {
      this.click(col, row, event);
    }
    this.mouseDebugStatus(x, y, col, row);
  }  // mouseEvent


  /**
   * Calculates the mouse position relative to the canvas.
   *
   * @param {HTMLCanvasElement} canvas - The canvas element to calculate the mouse position on.
   * @param {MouseEvent} event - The mouse event containing the client's mouse coordinates.
   * @returns {number[]} An array containing the X and Y coordinates of the mouse relative to the canvas.
   */
  mousePosition(canvas, event) {
    const rect = canvas.getBoundingClientRect()
    return [ parseInt(event.clientX - rect.left), parseInt(event.clientY - rect.top) ]
  }  // mousePosition()

  /**
   * Converts mouse coordinates to grid column and row indices.
   *
   * @param {number} x - The X coordinate of the mouse position.
   * @param {number} y - The Y coordinate of the mouse position.
   * @returns {number[]} Array containing the column and row indices corresponding to the mouse position.
   */
  mousePositionToIndex(x, y) {
    let [ col, row ] = [ parseInt(x / this.scrollWidth), parseInt(y / this.scrollWidth) ];
    if (isNaN(col)) col = 0;
    if (isNaN(row)) row = 0;
    return [ col, row ];
  }  // mousePositionToIndex

  /**
   * Handles click events based on the current layer and the clicked area.
   * Performs different actions like item selection, rotation,
   * and menu interaction depending on the layer and the clicked grid position.
   *
   * @param {number} col - The column index where the click occurred.
   * @param {number} row - The row index where the click occurred.
   * @param {MouseEvent} event - The mouse event associated with the click.
   */
  click(col, row, event) {
    switch (this.state['layer']) {
    case 'layer1':
    case 'layer2':
    case 'layer3':
      if (this.areaRange(col, row, 'stage')) {
        if (event.altKey) {
          this.state['item'] = this.itemOnStageBlock(col, row);
          if (this.state['item'])
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
      } else if (this.areaBlock(col, row, 'cg')) {
        this.selectMenuCG(col, row, 1);
      } else if (this.areaBlock(col, row, 'stage')) {
        this.selectMenuStage(col, row, 1);
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
      } else if (this.areaBlock(col, row, 'cg')) {
        this.selectMenuCG(col, row, 1);
      } else if (this.areaBlock(col, row, 'stage')) {
        this.selectMenuStage(col, row, 1);
      } else if (this.areaRange(col, row, 'menu')) {
        this.closeSystemItembox(this.state['prev']['layer']);
      }
      break;
    }
  }  // click()

  /**
   * Handles press-hold actions on different layers and areas.
   * Executes various functions like removing sprite blocks, resetting items,
   * and navigating menus based on the pressed area.
   *
   * @param {number} col - The column index where the press-hold occurred.
   * @param {number} row - The row index where the press-hold occurred.
   */
  pressHold(col, row) {
    switch (this.state['layer']) {
    case 'layer1':
    case 'layer2':
    case 'layer3':
      if (this.areaRange(col, row, 'stage')) {
        this.state['layer'] = this.activeLayer(col, row);
        this.removeSpriteBlock(col, row, this.state['layer']);
        this.rotateItemReset();
      } else if (this.areaBlock(col, row, 'item')) {
        this.setBlankBlock(col, row, this.layers['menu']);
        this.state['item'] = ''
      } else if (this.areaBlock(col, row, 'fill')) {
        this.selectMenuFill();
      } else if (this.areaBlock(col, row, 'block')) {
        this.selectMenuBlock(col, row, -1);
      } else if (this.areaBlock(col, row, 'cg')) {
        this.selectMenuCG(col, row, -1);
      } else if (this.areaBlock(col, row, 'new')) {
        this.selectMenuNew();
      } else if (this.areaBlock(col, row, 'save')) {
        this.selectMenuSave();
      } else if (this.areaBlock(col, row, 'stage')) {
        this.selectMenuStage(col, row, -1);
      }
      break;
    case this.layers['system']:
      if (this.areaBlock(col, row, 'fill')) {
        this.selectMenuFill();
      } else if (this.areaRange(col, row, 'stage')) {
        this.closeSystemItembox(this.state['prev']['layer']);
      } else if (this.areaBlock(col, row, 'item')) {
        this.setBlankBlock(col, row, this.layers['menu']);
        this.state['item'] = ''
        this.closeSystemItembox(this.state['prev']['layer']);
      } else if (this.areaBlock(col, row, 'block')) {
        this.selectMenuBlock(col, row, -1);
      } else if (this.areaBlock(col, row, 'cg')) {
        this.selectMenuCG(col, row, -1);
      } else if (this.areaBlock(col, row, 'stage')) {
        this.selectMenuStage(col, row, -1);
      } else if (this.areaRange(col, row, 'menu')) {
        this.closeSystemItembox(this.state['prev']['layer']);
      }
      break;
    default:
    }
  }  // pressHold()

  /**
   * Checks if a given column and row are within the range specified for a certain content area.
   *
   * @param {number} col - The column index to check.
   * @param {number} row - The row index to check.
   * @param {string} content - The content type whose position range is to be checked.
   * @returns {boolean} true if the specified column and row are within the content's range,
   *                    false otherwise.
   */
  areaRange(col, row, content) {
      const position = this.meta['positionRange'][content];
      const start = position['start'];
      const end = position['end'];
      return (col >= start['col'] && col <= end['col'] && row >= start['row'] && row <= end['row']);
  }  // areaRange()

  /**
   * Determines if a specified column and row match the position of a given content block.
   *
   * @param {number} col - The column index to check.
   * @param {number} row - The row index to check.
   * @param {string} content - The content type whose position is to be checked.
   * @returns {boolean} true if the column and row match the content's position, false otherwise.
   */
  areaBlock(col, row, content) {
    const position = this.meta['position'][content];
    return (col === position['col'] && row === position['row']);
  }  // areaBlock()

  /**
   * Extracts and returns the layer name from a given item string.
   *
   * @param {string} item - The item string containing the layer information.
   * @returns {string} The extracted layer name from the item string.
   */
  itemLayer(item) {
    const layer = /^(layer\d)/.exec(item);
    return layer[0];
  }  // itemLayer()

  /**
   * Extracts and returns the layer name from a given item string.
   *
   * @param {string} item - The item string containing the layer information.
   * @returns {string} The extracted layer name from the item string.
   */
  activeLayer(col, row) {
    for (const layer of [ ...this.layerGroup['stage'] ].reverse()) {
      if (this.blocks[layer][row][col]) return layer;
    }
    return this.state['layer'];
  }  // activeBlock()

  /**
   * Activates the menu item box by displaying the relevant system and fill layers.
   */
  selectMenuItembox() {
    const layer = this.layers['system'];
    this.state['layer'] = layer;
    this.canvas[this.layers['fill']].style.display = 'inline';
    this.canvas[layer].style.display = 'inline';
  }  // selectMenuItembox()

  /**
   * Sets the block icon in the menu, either using a specified block or finding one from 'layer1'.
   * The block icon is then displayed at a predefined position in the menu.
   *
   * @param {number} [block] - Optional block number to set in the menu.
   *                           If not provided, it is determined from 'layer1'.
   * @returns {Promise} A promise that resolves when the sprite block is set in the menu.
   */
  async setMenuBlockIcon(block) {
    // find block src from layer1
    if (block === undefined) {
      const src = this.findStageBlock('layer1');
      block = parseInt(/\/block\/(\d{2})/.exec(src)[1]);
      this.state['block'] = parseInt(block);
    }
    // set block on menu
    block = this.padZero(block, 2);
    const position = this.meta['position'];
    const [ col, row ] = [ position['block']['col'], position['block']['row'] ];
    await this.setSpriteBlock(col, row, this.layers['menu'], `layer1/block/${block}/field/00`);
  }  // setMenuBlockIcon()

  /**
   * Searches for and returns the first block source string in a specified layer.
   * Iterates through the grid to find a block, returning a default block source if none is found.
   *
   * @param {string} layer - The layer in which to search for the block.
   * @returns {string} The source string of the first found block,
   *                   or a default block source if none is found.
   */
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

  /**
    * Sets an icon in the menu based on the specified content type.
    * The icon is placed at a predefined position in the menu layer.
    *
    * @param {string} content - The type of content for which the icon is to be set.
    * @returns {Promise} A promise that resolves when the sprite block for the icon is set in the menu.
    */
  async setMenuIcon(content) {
    const src = `layer0/${content}/00`;
    const position = this.meta['position'][content];
    await this.setSpriteBlock(position['col'], position['row'], this.layers['menu'], src);
  }  // setMenuIcon()

  /**
   * Selects an item from the system item box based on the specified column and row.
   * Updates the state with the selected item and displays it in the menu at a predefined position.
   *
   * @param {number} col - The column index of the selected item in the system item box.
   * @param {number} row - The row index of the selected item in the system item box.
   */
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

  /**
   * Closes the system item box and optionally sets the active layer.
   * Hides all layers associated with the system item box.
   *
   * @param {string} [layer] - Optional layer to set as active after closing the item box.
   */
  closeSystemItembox(layer) {
    if (layer) this.state['layer'] = layer;
    for (const layer of this.layerGroup['system']) {
      this.canvas[layer].style.display = 'none';
    }
  }  // closeSystemItembox()

  /**
   * Handles the selection of a CG (Computer Graphics) item in the menu.
   * Updates the CG state and refreshes relevant sprites based on the selected CG.
   *
   * @param {number} col - The column index of the CG item in the menu.
   * @param {number} row - The row index of the CG item in the menu.
   * @param {number} next - The increment or decrement to apply to the current CG state.
   */
  selectMenuCG(col, row, next) {
    // prevent click bashing
    if (this.timeout('load')) return;
    const cg = this.state['cg'] + next;
    this.state['prev']['cg'] = this.state['cg'];
    this.state['cg'] = cg < 0 ? this.meta['lastCG'] : cg % (this.meta['lastCG'] + 1);

    // update sprite
    this.setSpriteLayer(this.layerGroup['stage']);
    this.setSpriteLayer(this.layers['system'],
      { 'renderOnly': this.state['layer'] != this.layers['system'] });
    this.setSpriteBlock(col, row, this.layers['menu'], 'layer0/cg/00');
    let position = this.meta['position']['block'];
    const src = `layer1/block/${this.padZero(this.state['block'], 2)}/field/00`;
    this.setSpriteBlock(position['col'], position['row'], this.layers['menu'], src);
    if (this.state['item']) {
      position = this.meta['position']['item']
      this.setSpriteBlock(position['col'], position['row'], this.layers['menu'], this.state['item']);
    }
  }  // selectMenuCG()

  /**
   * Fills a specified layer with the currently selected item.
   * If no item is selected, it uses the current layer for filling.
   * This action is performed on all blocks within the defined row and column range.
   */
  selectMenuFill() {
    if (this.state['item'] === '' && this.state['layer'] === '') return;
    const item = this.state['item'];
    const layer = item === '' ? this.state['layer'] : this.itemLayer(item);
    for (let row = 1; row < this.row - 1; row++) {
      for (let col = 2; col < this.col - 3; col++) {
        this.blocks[layer][row][col] = item;
      }
    }
    this.setSpriteLayer(layer);
  }  // selectMenuFill()

  /**
   * Selects and updates a block in the menu, cycling through available blocks based on the 'next'
   * parameter. Updates the block state and refreshes the corresponding sprite and related UI elements.
   *
   * @param {number} col - The column index where the block selection is made.
   * @param {number} row - The row index where the block selection is made.
   * @param {number} next - The ++ or -- to apply to the current block state for cycling through blocks.
   */
  selectMenuBlock(col, row, next) {
    // prevent click bashing
    if (this.timeout('load')) return;
    let block = this.state['block'] + next;
    block = block < 0 ? this.meta['lastBlock'] : block % (this.meta['lastBlock'] + 1);
    this.state['block'] = block;
    const src = `layer1/block/${this.padZero(block, 2)}/field/00`;

    // update sprite
    this.setSpriteBlock(col, row, this.layers['menu'], src);
    this.updateBlock(this.layerGroup['make'], block);
    this.setSpriteLayer(this.layerGroup['stage']);
    this.updateMenuItem(block);
    this.updateSystemItembox(block);
  }  // selectMenuBlock()

  /**
   * Updates all occurrences of a specific block type across specified layers with a new block value.
   * Iterates through each cell in the layers, replacing the block part of the source string with the
   * new block value.
   *
   * @param {string|array} layers - The layer(s) to be updated.
   *                                Can be a single string or an array of layer names.
   * @param {number} newBlock - The new block value to replace in the source strings.
   */
  updateBlock(layers, newBlock) {
    if (typeof layers == 'string')
      layers = layers.split(' ');
    for (const layer of layers) {
      const block = this.blocks[layer];
      for (let row =  0; row < this.row; row++) {
        for (let col = 0; col < this.col; col++) {
          const src = block[row][col];
          const match = /\/(block\/\d)/.exec(src);
          if (match)
            block[row][col] = src.replace(/block\/\d{2}/, `${match[1]}${newBlock}`);
        }
      }
    }
  }  // updateBlock()


  /**
   * Handles the selection of a stage in the menu, with confirmation for unsaved changes.
   * If changes are unsaved and not confirmed, prompts for confirmation.
   * Otherwise, proceeds with stage selection.
   * Triggers a REST call for stage change with the provided 'next' parameter.
   *
   * @param {number} col - The column index where the stage selection is made.
   * @param {number} row - The row index where the stage selection is made.
   * @param {number} next - The increment or decrement to apply to the current stage for navigation.
   */
  selectMenuStage(col, row, next) {
    // require confirm to discards the stage changes
    const position = this.meta['position']['stage'];
    if (this.state['hash'] != this.stageHash() && this.state['confirm'] === false) {
      this.setMenuReplyText(col, row, 'Tap Again');
      this.timeout('confirm', 20);
    } else {
      // prevent click bashing
      if (this.timeout('load')) return;
      const imageSize = this.imageSize;
      const context = this.contexts[this.layers['menu']];
      context.clearRect(imageSize * col, imageSize * (row + 1), imageSize * 2, imageSize);
      const restData = {
        'cg'    : this.state['cg'],
        'stage' : this.state['stage'],
        'next'  : next,
        'method': 'next/stage',
      };
      this.rest('/post', restData, this.nextStage);
    }
  }  // selectMenuStage()

  /**
   * Initiates the creation of a new stage, provided there are changes to the current stage.
   * Sends a REST request to load a new stage if the current stage is not empty or unchanged.
   */
  selectMenuNew() {
    if (this.state['stage'] === '' && this.state['hash'] === this.stageHash()) return;
    this.state['stage'] = 0;
    const restData = {
      'cg'    : this.state['cg'],
      'file'  : [ 'stage/new' ],
      'method': 'read/stage',
    };
    this.rest('/post', restData, this.loadStage);
  }  // selectMenuNew()

  /**
   * Handles the save operation for the current stage.
   * In demo mode, displays a message and prevents saving.
   * Otherwise, saves the stage if there are changes.
   * Sends a REST request to save the current stage configuration.
   */
  selectMenuSave() {
    // disable save in demo mode
    if (this.meta['demo']) {
      console.log('Demo mode!!');
      const position = this.meta['position']['save'];
      this.setMenuReplyText(position['col'], position['row'], `Demo mode`);
      return;
    }
    if (this.state['hash'] === this.stageHash()) {
      const position = this.meta['position']['save'];
      this.setMenuReplyText(position['col'], position['row'], 'No\nChanges');
      return;
    }
    let stageBlocks = {};
    for (const layer of this.layerGroup['stage']) {
      stageBlocks[layer] = this.blocks[layer];
    }
    const restData = {
      'content': 'stage',
      'cg'     : this.state['cg'],
      'stage'  : this.state['stage'],
      'blocks' : stageBlocks,
      'method' : 'write/stage',
    };
    this.rest('/post', restData , this.saveStage);
  }  // selectMenuSave()

  /**
   * Generates a hash code representing the current state of all stages.
   * Concatenates the stage data and computes a hash code for quick comparison of stage states.
   *
   * @returns {number} A hash code representing the current configuration of all stages.
   */
  stageHash() {
    let stages = [];
    for (const stage of this.layerGroup['stage']) {
      stages.push(this.blocks[stage]);
    }
    return JSON.stringify(stages).hashCode();
  }  // stageHash()

  /**
   * Identifies and sets the item present at a specified block on the stage.
   * Iterates through stage layers in reverse to find the topmost item at the given coordinates.
   *
   * @param {number} col - The column index of the block to check.
   * @param {number} row - The row index of the block to check.
   * @returns {string} The source string of the item found at the specified block,
   *                   or an empty string if none is found.
   */
  itemOnStageBlock(col ,row) {
    let src = '';
    for (const layer of [ ...this.layerGroup['stage'] ].reverse()) {
      if (this.blocks[layer][row][col]) {
        src = this.blocks[layer][row][col].replace('_alpha', '');
        const position = this.meta['position']['item'];
        this.setSpriteBlock(position['col'], position['row'], this.layers['menu'], src);
        break;
      }
    }
    return src;
  }  // itemOnStageBlock()

  /**
   * Determines the next state of an item based on rotation logic.
   * If the item at the specified block can be rotated and matches the source, returns its rotated state.
   *
   * @param {number} col - The column index of the item to rotate.
   * @param {number} row - The row index of the item to rotate.
   * @param {string} layer - The layer on which the item resides.
   * @param {string} src - The source string of the item to check for rotation.
   * @returns {string} The source string of the rotated item,
   *                   or the original source string if no rotation is applicable.
   */
  rotateItem(col, row, layer, src) {
    const sprite = this.meta['sprite'];
    return this.blocks[layer][row][col] === src && 'rotateItem' in sprite[src] ?
      sprite[src]['rotateItem'] : src;
  }  // rotateItem

  /**
   * Resets the rotation state of the currently selected item, if applicable.
   * Updates the item state based on its current position in the menu layer.
   */
  rotateItemReset() {
    if (this.state['item'] && 'rotateItem' in this.meta['sprite'][this.state['item']]) {
      const position = this.meta['position'];
      const [ col, row ] = [ position['item']['col'], position['item']['row'] ];
      this.state['item'] = this.blocks[this.layers['menu']][row][col]
    }
  }  // rotateItemReset()

  /**
   * Updates the block part of a source string with a new block value.
   * If the source string contains a block pattern, it is replaced with the new block value.
   *
   * @param {string} src - The original source string containing the block to be updated.
   * @param {number} block - The new block value to replace in the source string.
   * @returns {string} The updated source string with the new block value,
   *                   or an empty string if no match is found.
   */
  nextBlock(src, block) {
    const match = /\/(block\/\d)/.exec(src);
    return match ? src.replace(/block\/\d{2}/, `${match[1]}${block}`) : '';
  }  // nextBlock()

  /**
   * Updates the menu item with a new block value.
   * If a valid source string is obtained, it clears the current item area and sets the new sprite block.
   *
   * @param {number} nextBlock - The new block value to update the menu item with.
   */
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

  /**
   * Updates the system item box with a new block value.
   * Applies the update to the specified system layer and refreshes the sprite layer with new
   * rendering options.
   *
   * @param {number} nextBlock - The new block value to be applied to the system item box.
   */
  updateSystemItembox(nextBlock) {
    const position = this.meta['positionRange']['itembox'];
    let opt = {
      'col': {
        'start': position['start']['col'],
        'end'  : position['end']['col'],
      },
      'row': {
        'start': position['start']['row'],
        'end'  : position['end']['row'],
      },
      'renderOnly': this.state['layer'] !== this.layers['system']
    };
    this.updateBlock(this.layers['system'], nextBlock);
    this.setSpriteLayer(this.layers['system'], opt);
  }  // updateSystemItembox()

  // rest callback

  /**
   * Sets up the game with provided data, initializes sprites, menus, and system context.
   * It also handles the debug display and manages the visibility of system layers.
   *
   * @param {LittleMagic} littleMagic - The instance of LittleMagic to be configured.
   * @param {object} restData - Data containing block configurations for different layers.
   */
  async setGame(littleMagic, restData) {
    const layers = Object.keys(restData);
    littleMagic.blocks = restData;
    littleMagic.state['hash'] = littleMagic.stageHash();
    await littleMagic.setSpriteLayer(layers);
    await littleMagic.menuContext();
    littleMagic.systemContext();

    // debug option
    littleMagic.mouseDebug();

    // hide system layer
    for (const layer of littleMagic.layerGroup['system']) {
      littleMagic.canvas[layer].style.display = 'none';
    }

    // show game screen
    littleMagic.loadScreen(false);
  }  // setGame()

  /**
   * Loads a new stage with the provided data, updating blocks, sprites, and stage-related UI elements.
   * Handles block changes, recalculates the stage hash, and updates the stage number display.
   *
   * @param {LittleMagic} littleMagic - The instance of LittleMagic where the stage is being loaded.
   * @param {object} restData - Data containing the new stage configuration.
   */
  async loadStage(littleMagic, restData) {
    const layers = Object.keys(restData);
    littleMagic.blocks = Object.assign(littleMagic.blocks, restData);

    // block change
    const block = littleMagic.state['block'];
    littleMagic.state['block'] = parseInt(/block\/(\d{2})/.exec(littleMagic.findStageBlock('layer1'))[1]);

    // new stage
    if (littleMagic.state['stage'] === 0) {
      if (littleMagic.state['block'] != block) {
        const updateLayers = littleMagic.layerGroup['stage']
        updateLayers.concat(layers);
        littleMagic.state['block'] = block;
        littleMagic.updateBlock(updateLayers, block);
      }
    }

    // calculate new hash
    littleMagic.state['hash'] = littleMagic.stageHash();

    // update sprite
    littleMagic.setSpriteLayer(layers, { 'renderOnly': true });
    littleMagic.setMenuBlockIcon(littleMagic.state['block']);
    littleMagic.showLayer(littleMagic.layerGroup['stage']);
    if (littleMagic.state['stage'] != 0 && littleMagic.state['block'] != block) {
      littleMagic.updateMenuItem(this.state['block']);
      littleMagic.updateSystemItembox(littleMagic.state['block']);
    }

    // update stage number
    const position = littleMagic.meta['position']['stage'];
    littleMagic.setMenuSpriteText(position['col'], position['row'], 'stage');
  }  // loadStage()

  /**
   * Advances to the next stage based on the provided data.
   * Updates the stage state, sets the stage text in the menu, and loads the new stage configuration.
   *
   * @param {LittleMagic} littleMagic - The instance of LittleMagic to update with the next stage.
   * @param {object} restData - Data containing the next stage number and block configurations.
   */
  nextStage(littleMagic, restData) {
    littleMagic.state['stage'] = restData['stage'];
    littleMagic.setMenuStageText(restData['stage']);
    littleMagic.loadStage(littleMagic, restData['blocks']);
  }  // nextStage()

  /**
   * Handles the save stage operations, displaying a confirmation message and updating the stage state.
   * Updates the stage text in the menu and recalculates the stage hash to reflect the saved state.
   *
   * @param {LittleMagic} littleMagic - The instance of LittleMagic where the stage is saved.
   * @param {object} restData - Data containing the saved stage number.
   */
  saveStage(littleMagic, restData) {
    const imageSize = littleMagic.imageSize;
    const position = littleMagic.meta['position']['save'];
    const stage = littleMagic.padZero(restData['stage']);
    littleMagic.setMenuReplyText(position['col'], position['row'], `Saved ${stage}!!`);
    littleMagic.setMenuStageText(restData['stage']);
    // save state
    littleMagic.state['stage'] = restData['stage'];
    littleMagic.state['hash'] = littleMagic.stageHash();
  }  // saveStage()
}  // class LittleMagicMake

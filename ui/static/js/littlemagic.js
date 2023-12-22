export { LittleMagic };

/**
 * Represents the core functionality of the Little Magic game.
 * This class manages game state, handles rendering and sprite management,
 * and interacts with the backend for data retrieval and updates.
 */
class LittleMagic {
  /**
   * Constructor to initialize properties and call methods that comes with it.
   */
  constructor() {
    // object[layer]: array[row][col]
    this.blocks = {};

    // read from rest
    this.meta = {};

    // game state
    this.state = {
      'cg': 0,
      'confirm': false,
      'load'   : false,
      'windowWidth' : window.width,
      'windowHeigth': window.heigth
    };

    // layer alias
    this.layers = {};
    this.layerGroup = {
      'stage': [ 'layer1', 'layer2', 'layer3' ]
    };

    this.color = {
      'blank': '#000'
    };

    // static game sprite parameter
    this.imageSize = 32;
    [ this.col, this.row ] = [ 16, 14 ];
    [ this.gameWidth, this.gameHeight ] =
      [ this.col * this.imageSize, this.row * this.imageSize ];

    this.canvas = {};
    this.contexts = {};

    this.initContext();
    this.setGameSize();
  }  // constructor

  /**
   * Initialize canvas dimension and 2d context.
   */
  initContext() {
    for (const canvas of document.querySelectorAll('canvas')) {
      canvas.width  = this.gameWidth;
      canvas.height = this.gameHeight;
      this.canvas[canvas.id] = canvas;
      this.contexts[canvas.id] = canvas.getContext('2d');
      if (/render/.exec(canvas.id))
        this.canvas[canvas.id].style.display = 'none';
    }
  }   // initContext()

  /**
   * Calculate and set canvas scrollWidth.
   */
  setGameSize() {
    this.scrollWidth = this.canvas['layer0'].scrollWidth / this.col;
    this.font= { 'medium': `bold ${this.imageSize * 0.30 }px Arial` };
    this.setCanvasScale();
  }  // setGameSize()

  /**
   * Adjusts canvas size based on window dimensions and orientation.
   */
  setCanvasScale() {
    const [ width, height ] = [ window.width, window.height ];
    if (this.state['windowWidth'] !== width && this.state['windowHeigth'] !== heigth) {
      const orientation = window.width > window.heigth ? 'landscape' : 'portrait';
      for (const canvas of document.querySelectorAll('canvas')) {
        if (orientation === 'landscape')
          canvas.style.heigth = '100%';
        else
          canvas.style.width = '100%';
      }
    }
  }  // setCanvasScale()

  /**
   * Sets a temporary flag for a specified content, which auto-resets after a defined timeout.
   *
   * @params {string} content - The key for the content to set a timeout on.
   * @params {number} [timeout=2] - The duration int seconds to wait before resetting.
   */
  timeout(content, timeout = 2) {
    if (this.state[content]) return this.state[content];
    this.state[content] = true;
    setTimeout(function(littleMagic, content) {
      littleMagic.state[content] = false;
    }, this.meta['timeout'] * timeout, this, content);
  }  // timeout

  /**
   * Toggles the loading screen on or off on the last canvas layer.
   *
   * @param {boolean} on - If true, displays the loading screen; if false, clears it.
   */
  loadScreen(on) {
    const layer = document.querySelector('canvas:last-child').id
    const context = this.contexts[layer];
    if (on) {
      context.fillStyle = this.color['blank'];
      context.fillRect(0, 0, this.gameWidth, this.gameHeight);
    } else {
      context.clearRect(0, 0, this.gameWidth, this.gameHeight);
    }
  }  // loadScreen()

  /**
   * Sets up and renders sprite images on specified layers.
   *
   * @param {string|array} layers - The layer(s) to set up sprites on.
   *                                Can be a space-separated string or an array of layer names.
   * @param {object} [opt={}] - Optional settings for sprite rendering.
   *                            Keys:
   *                              'renderOnly' (boolean): If true, renders the layer without displaying.
   */
  async setSpriteLayer(layers, opt = {}) {
    if (typeof layers === 'string')
      layers = layers.split(' ');
    let images = [];
    for (const layer of layers) {
      this.setLayerImage(images, layer, opt);
    }
    if (images.length > 0) {
      // draw on render
      this.clearLayer(layers, true);
      await this.drawSpriteImages(images, false);
      if (!opt['renderOnly'])
        this.showLayer(layers, true);

      // copy render to layer
      images = [];
      this.setCanvasImage(images, layers);
      await this.drawSpriteImages(images);
      if (!opt['renderOnly'])
        this.showLayer(layers);
    }
  }  // setSpriteLayer

  /**
   * Populates an array with image data for a specific layer based on the provided options.
   *
   * @param {array} images - The array to populate with image data.
   * @param {string} layer - The layer name for which images are being set.
   * @param {object} opt - Options to define the range of rows and columns to process.
   *                       Keys:
   *                        'row': { 'start': number, 'end': number } - Defines the row range.
   *                        'col': { 'start': number, 'end': number } - Defines the column range.
   */
  setLayerImage(images, layer, opt) {
    const block = this.blocks[layer];
    const imageSize = this.imageSize;
    const render = layer.replace('layer', 'render');
    for (const series of [ 'col', 'row']) {
      if (opt[series] === undefined)
        opt[series] = { 'start': 0, 'end': this[series] };
    }
    for (let row = opt['row']['start']; row < opt['row']['end']; row++) {
      for (let col = opt['col']['start']; col < opt['col']['end']; col++) {
        let src = block[row][col];
        if (src) {
          if (this.layerGroup['stage'].includes(layer))
            src = this.meta['sprite'][block[row][col]]['alpha'] || src;
          images.push({
            'src'   : this.imagesrc(src),
            'layer' : layer,
            'render': render,
            'x'     : col * imageSize,
            'y'     : row * imageSize,
            'width' : imageSize,
            'height': imageSize
          });
        }
      }
    }
  }  // setLayerImage()

  /**
   * Captures the current state of specified canvas layers and adds them to an image array.
   *
   * @param {array} images - The array to be populated with canvas data.
   * @param {string|array} layers - The layer(s) to set up sprites on.
   *                                Can be a space-separated string or an array of layer names.
   */
  setCanvasImage(images, layers) {
    if (typeof layers === 'string')
      layers = layers.split(' ');
    const canvas = this.canvas;
    for (const layer of layers) {
      const render = layer.replace('layer', 'render');
      const src = canvas[render].toDataURL('image/png');
      images.push({
        'src'   : src,
        'layer' : render,
        'render': layer,
        'x'     : 0,
        'y'     : 0,
        'width' : this.gameWidth,
        'height': this.gameHeight
      });
    }
  }  // setCanvasImage

  /**
   * Draws a sequence of sprite images onto their respective canvas contexts.
   * Processes the images array recursively and supports optional clearing of the canvas before drawing.
   *
   * @param {array} images - An array of image data objects to be drawn. Each object should contain the
   *                         source, target render layer, position, and dimensions for the image.
   * @param {boolean} [clear=true] - Whether to clear the specified canvas area before drawing each image.
   * @returns {Promise} A promise that resolves when all images have been drawn.
   */
  drawSpriteImages(images, clear = true) {
    return new Promise((resolve, reject) => {
      const data = images.shift();
      const context = this.contexts[data['render']];
      const image = new Image();
      image.onload = () => {
        if (clear)
          context.clearRect(data['x'], data['y'], data['width'], data['height']);
        context.drawImage(image, data['x'], data['y'], data['width'], data['height']);
        if (images.length > 0)
          resolve(this.drawSpriteImages(images));
        else
          resolve();
      };
      image.src = data.src;
      image.onerror = (error) => reject(error);
    });
  }  // drawSpriteImages()

  /**
   * Toggles the visibility of specified layers and their corresponding render layers.
   *
   * @param {array|string} layers - The layer(s) to show or hide.
   *                                Can be an array of layer names or a space-separated string.
   * @param {boolean} [renderLayer=false] - If true, shows the render layers, hides the original layers;
   *                                        if false, shows the original layers, hides the render layers.
   */
  showLayer(layers, renderLayer = false) {
    const canvas = this.canvas;
    for (const layer of layers) {
      const render = layer.replace('layer', 'render');
      if (renderLayer) {
        canvas[render].style.display = 'inline';
        canvas[layer].style.display = 'none';
      } else {
        canvas[layer].style.display = 'inline';
        canvas[render].style.display = 'none';
      }
    }
  }  // showLayer

  /**
   * Toggles the visibility of specified layers and their corresponding render layers.
   *
   * @param {array|string} layers - The layer(s) to show or hide.
   *                                Can be an array of layer names or a space-separated string.
   * @param {boolean} [renderLayer=false] - If true, shows the render layers and hides the original layers;   *                                        if false, shows the original layers and hides the render layers.
   */
  clearLayer(layers, renderLayer) {
    if (typeof layers === 'string')
      layers = layers.split(' ');
    for (let layer of layers) {
      if (renderLayer)
        layer = layer.replace('layer', 'render');
      this.contexts[layer].clearRect(0, 0, this.gameWidth, this.gameHeight);
    }
  }  // clearLayer

  /**
   * Clears the entire canvas area of the specified layer.
   *
   * @param {string} layer - The name of the layer whose canvas context is to be cleared.
   */
  clearContext(layer) {
    this.contexts[layer].clearRect(0, 0, this.gameWidth, this.gameHeight);
  }

  /**
    * Sets a sprite block at a specified column and row in a given layer, and draws it.
    * If the sprite source is the same as the current one and the game state hasn't changed,
    * the method exits early.
    *
    * @param {number} col - The column position where the sprite block will be set.
    * @param {number} row - The row position where the sprite block will be set.
    * @param {string} layer - The layer on which the sprite block will be set.
    * @param {string} src - The source identifier for the sprite image.
    */
  async setSpriteBlock(col, row, layer, src) {
    const blocks = this.blocks
    if (this.layerGroup['stage'].includes(layer))
      src = this.meta['sprite'][src]['alpha'] || src;
    if (src === blocks[layer][row][col] && this.state['cg'] === this.state['prev']['cg'])
      return;
    const context = this.contexts[layer];
    context.save();
    await this.drawSpriteBlock(col, row, layer, src);
    context.restore();
    blocks[layer][row][col] = src;
  }  // setSpriteBlock();

  /**
   * Draws a sprite block at a specified column and row on a given layer.
   * The method returns a promise that resolves once the sprite is successfully drawn.
   *
   * @param {number} col - The column position where the sprite block will be drawn.
   * @param {number} row - The row position where the sprite block will be drawn.
   * @param {string} layer - The layer on which the sprite block will be drawn.
   * @param {string} src - The source identifier for the sprite image.
   * @returns {Promise} A promise that resolves when the sprite block is drawn.
   */
  drawSpriteBlock(col, row, layer, src) {
    return new Promise((resolve, reject) => {
      const context = this.contexts[layer];
      const imageSize = this.imageSize;
      const image = new Image();
      image.onload = () => {
        context.clearRect(imageSize * col, imageSize * row, imageSize, imageSize);
        resolve(context.drawImage(image, imageSize * col, imageSize * row, imageSize, imageSize));
      };
      image.src = this.imagesrc(src);
      image.onerror = (error) => reject(error);
    });
  }  // drawSpriteBlock();

  /**
   * Fills a block at a specified column and row on a given layer with a blank color.
   * This is used to clear or reset a specific area in the sprite grid.
   *
   * @param {number} col - The column position of the block.
   * @param {number} row - The row position of the block.
   * @param {string} layer - The canvas layer on which the block will be filled.
   */
  setBlankBlock(col, row, layer) {
    const context = this.contexts[layer];
    const imageSize = this.imageSize;
    context.fillStyle = this.color['blank'];
    context.fillRect(col * imageSize, row * imageSize, imageSize, imageSize);
  }  // setBlankBlock()

  /**
   * Removes a sprite block from a specified column and row on a given layer.
   * This is achieved by clearing the corresponding area in the canvas context.
   * If the layer matches a certain pattern (e.g., 'layer1'), the internal block data is also removed.
   *
   * @param {number} col - The column position of the block to be removed.
   * @param {number} row - The row position of the block to be removed.
   * @param {string} layer - The canvas layer from which the block will be removed.
   */
  removeSpriteBlock(col, row, layer) {
    const x = col * this.imageSize;
    const y = row * this.imageSize;
    this.contexts[layer].clearRect(x, y, this.imageSize, this.imageSize);
    if (/layer\d/.exec(layer))
      this.blocks[layer][row][col] = '';
  }  // removeSpriteBlock()

  /**
   * Constructs the URL path for a sprite image based on the provided source identifier.
   * The path includes the current game state and is zero-padded as necessary.
   *
   * @param {string} src - The source identifier for the sprite image.
   * @returns {string} The constructed URL path for the sprite image.
   */
  imagesrc(src) {
    return `/static/image/sprite/${this.padZero(this.state['cg'], 2)}/${src}.png`;
  } // imagesrc()

  /**
   * Pads a number with leading zeros to ensure it has a specified minimum length.
   *
   * @param {number|string} n - The number to pad with zeros.
   * @param {number} [k=3] - The desired minimum length of the output string.
   * @returns {string} The zero-padded string representation of the number.
   */
  padZero(n, k = 3) {
    return ('00' + n).slice(-k);
  }  // padZero

  /**
   * Performs an asynchronous HTTP POST request to a specified URL with given data.
   * Upon receiving a response, a callback function is executed with the response data.
   *
   * @param {string} url - The URL to which the POST request is sent.
   * @param {object} restData - The data to be sent in the POST request.
   * @param {function} callback - The callback function to execute with the response data.
   */
  async rest(url, restData, callback) {
    await fetch(url, {
      method: 'POST',
      body: JSON.stringify(restData),
      headers: { 'Content-Type': 'application/json' },
    })
    .then(response => response.json())
    .then(json => {
      callback(this, json['data']);
    })
    .catch(error => {
      console.log(error);
    });
  };  // rest()

  // rest callback

  /**
   * Updates the 'meta' property of the LittleMagic instance with provided data.
   *
   * @param {object} littleMagic - The instance of LittleMagic to be updated.
   * @param {object} restData - The data to be assigned to the 'meta' property of the instance.
   */
  setMeta(littleMagic, restData) {
    littleMagic.meta = restData;
  }  // setMeta
};  // class LittleMagic

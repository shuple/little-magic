export { LittleMagic };

class LittleMagic {
  constructor() {
    // object[layer]: array[row][col]
    this.blocks = {};

    // read from rest
    this.meta = {};

    // game state
    this.state = {
      'timeout': 100,
      'graphic': 'sfc',
      'windowWidth' : window.width,
      'windowHeigth': window.heigth,
    };

    // layer alias
    this.layers = {};
    this.layerAlias = {};

    // static game size
    this.imageSize = 32;
    [ this.col, this.row ] = [ 16, 14 ];
    [ this.gameWidth, this.gameHeight ] =
      [ this.col * this.imageSize, this.row * this.imageSize ];

    this.canvas = {};
    this.contexts = {};

    this.initContext();
    this.setGameSize();

    this.flag = {
      'load': true
    };
  }  // constructor

  initContext() {
    for (const canvas of document.querySelectorAll('canvas')) {
      canvas.width  = this.gameWidth;
      canvas.height = this.gameHeight;
      this.canvas[canvas.id] = canvas;
      this.contexts[canvas.id] = canvas.getContext('2d');
      if (/render/.exec(canvas.id)) {
        this.canvas[canvas.id].style.display = 'none';
      }
    }
  }   // initContext()

  setGameSize() {
    this.scrollWidth = this.canvas['layer0'].scrollWidth / this.col;
    this.font= { 'medium': `bold ${this.imageSize * 0.35 }px Merio` };
    this.setCanvasScale();
  }  // setGameSize()

  setCanvasScale() {
    const [ width, height ] = [ window.width, window.height ];
    if (this.state['windowWidth'] !== width && this.state['windowHeigth'] !== heigth) {
      const orientation = window.width > window.heigth ? 'landscape' : 'portrait';
      for (const canvas of document.querySelectorAll('canvas')) {
        if (orientation === 'landscape') {
          canvas.style.heigth = '100%';
        } else {
          canvas.style.width = '100%';
        }
      }
    }
  }  // setCanvasScale()

  loadScreen(flag) {
    const layer = document.querySelector('canvas:last-child').id
    const context = this.contexts[layer];
    if (flag) {
      context.fillStyle = '#222';
      context.fillRect(0, 0, this.gameWidth, this.gameHeight);
    } else {
      context.clearRect(0, 0, this.gameWidth, this.gameHeight);
    }
  }  // loadScreen()

  setMeta(littleMagic, restData) {
    littleMagic.meta = restData;
  }  // setMeta

  setSprite(littleMagic, restData) {
    let layers = [];
    for (const data of restData) {
      for (const [layer, layerData] of Object.entries(data)) {
        layers.push(layer);
        littleMagic.blocks[layer] = layerData;
      }
    }
    littleMagic.setSpriteLayer(layers);
  }  // setSprite()

  async setSpriteLayer(layers) {
    let images = [];
    for (const layer of layers) {
      const render = layer.replace('render', 'layer');
      this.setLayerImage(images, layer);
    }
    if (images.length > 0) await this.drawSpriteImages(images);
    this.copyRender(layers);
    this.flag['load'] = false;
  }  // setSpriteImage

  setLayerImage(images, layer) {
    const block = this.blocks[layer];
    const imageSize = this.imageSize;
    for (let row = 0; row < this.row; row++) {
      for (let col = 0; col < this.col; col++) {
        if (block[row][col]) {
          images.push({
            'src'   : this.imagesrc(block[row][col]),
            'layer' : layer,
            'x'     : col * imageSize,
            'y'     : row * imageSize,
            'width' : imageSize,
            'height': imageSize
          });
        }
      }
    }
  }  // setLayerImage()

  drawSpriteImages(images) {
    return new Promise((resolve, reject) => {
      const data = images.shift();
      const render = data['layer'].replace('layer', 'render');
      const context = this.contexts[render];
      const image = new Image();
      image.onload = () => {
        context.drawImage(image, data['x'], data['y'], data['width'], data['height']);
        if (images.length > 0) {
          // recursion to await iteration
          resolve(this.drawSpriteImages(images));
        } else {
          // complete
          resolve();
        }
      };
      image.src = data.src;
      image.onerror = (error) => reject(error);
    });
  }  // drawSpriteImages()

  copyRender(layers) {
    if (typeof layers == 'string') layers = layers.split(' ');
    const canvas  = this.canvas;
    const context = this.contexts;
    // display prerender
    for (const layer of layers) {
      const render = layer.replace('layer', 'render');
      canvas[render].style.display = 'inline';
      canvas[layer].style.display = 'none';
      // copy render to layer
      context[layer].clearRect(0, 0, this.gameWidth, this.gameHeight);
      context[layer].drawImage(canvas[render], 0, 0);
      // display layer
      canvas[layer].style.display = 'inline';
      // clear render
      canvas[render].style.display = 'none';
      this.clearContext(render);
    }
  }  // copyRender()

  clearContext(layer) {
    this.contexts[layer].clearRect(0, 0, this.gameWidth, this.gameHeight);
  }

  imagesrc(src) {
    return `/static/image/sprite/${this.state['graphic']}/${src}.png`;
  } // imagesrc()

  async rest(url, restData, callback) {
    await fetch(url, {
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
};  // class LittleMagic

export { LittleMagic, setSprite, setMeta };

class LittleMagic {
  constructor() {
    // object[layer]: array[row][col]
    this.blocks = {};

    // read from rest
    this.meta = {};

    // game state
    this.state = {
      'graphic': 'sfc',
      'windowWidth' : window.width,
      'windowHeigth': window.heigth,
    };

    // static game size
    this.imageSize = 32;
    [ this.col, this.row ] = [ 16, 14 ];
    [ this.gameWidth, this.gameHeight ] =
      [ this.col * this.imageSize, this.row * this.imageSize ];

    this.canvas = {};
    this.contexts = {};

    this.initContext();
    this.setGameSize();
  }  // constructor

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

  setSprite(restData) {
    for (const data of restData) {
      for (const [layer, layerData] of Object.entries(data)) {
        if (layerData[0].constructor === Array) {
          this.setSpriteBlocks(layer, layerData);
        } else if (typeof layerData[0] === 'object') {
          for (const d of layerData) {
            const opt = { 'prerender': true, 'clearSprite': true };
            this.setSpriteBlock(d['col'], d['row'], layer, d['sprite'], opt);
          }
        }
      }
    }
  }  // setSprite()

  setMeta(restData) {
    this.meta = restData;
  }  // setMeta

  async setSpriteBlock(col, row, layer, src, opt = {}) {
    if (src === this.blocks[layer][row][col]) return;
    const render = `render${/layer(\d)\//.exec(src)[1]}`
    if (opt['prerender']) {
      this.removeSpriteBlock(col, row, render);
      await this.drawSpriteBlock(col, row, render, src);
      this.canvas[render].style.display = 'inline';
    }
    if (opt['clearSprite'])
      this.removeSpriteBlock(col, row, layer);
    await this.drawSpriteBlock(col, row, layer, src);
    this.blocks[layer][row][col] = src;
    // remove prerender
    this.removeSpriteBlock(col, row, render);
    this.canvas[render].style.display = 'none';
  }  // setSpriteBlock();

  drawSpriteBlock(col, row, layer, src) {
    return new Promise((resolve, reject) => {
      const context = this.contexts[layer];
      const imageSize = this.imageSize;
      const image = new Image();
      image.onload = () => {
        resolve(context.drawImage(image, imageSize * col, imageSize * row, imageSize, imageSize));
      };
      image.src = this.imagesrc(src);
      image.onerror = (error) => reject(error);
    });
  }  // drawSpriteBlock();

  removeSpriteBlock(col, row, layer) {
    const x = col * this.imageSize;
    const y = row * this.imageSize;
    this.contexts[layer].clearRect(x, y, this.imageSize, this.imageSize);
    if (/layer\d/.exec(layer)) this.blocks[layer][row][col] = '';
  }  // removeSpriteBlock()

  setSpriteBlocks(layer, layerData) {
    this.blocks[layer] = [...Array(this.row)].map(x=>Array(this.col).fill(''));
    const context = this.contexts[layer];
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let row = 0; row < layerData.length; row++) {
      for (let col = 0; col < layerData[row].length; col++) {
        if (layerData[row][col]) {
          this.setSpriteBlock(col, row, layer, layerData[row][col]);
        }
      }
    }
  }  // setSpriteBlocks()

  async updateLayer(layer, opt) {
    const block = this.blocks[layer];
    for (let row = opt['rowStart'] || 0; row < (opt['rowEnd'] || this.row); row++) {
      for (let col = opt['colStart'] || 0; col < (opt['colEnd'] || this.col); col++) {
        let src = block[row][col];
        if (opt['block'] !== undefined)
          src = this.replaceBlock(block[row][col], opt['block']);
        if (src) {
          this.setSpriteBlock(col, row, layer, src, opt);
        }
      }
    }
  }  // updateLayer()

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

// callback for /post/read rest
//
const setSprite = function(littleMagic, restData) {
  littleMagic.setSprite(restData);
};  // const setSprite()

const setMeta = function(littleMagic, restData) {
  littleMagic.setMeta(restData);
}  // setMeta()

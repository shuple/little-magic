export { LittleMagic, setSprite, setMeta };

class LittleMagic {
  constructor() {
    // object[layer]: array[row][col]
    this.blocks = {};

    // object[sprite]: {}
    this.metaData = {};

    // object[component]: { 'col':, 'row': }
    this.position = {}

    // game state
    this.state = {
      'graphic': 'sfc',
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
    }
  }   // initContext()

  setGameSize() {
    this.scrollWidth = this.canvas['layer0'].scrollWidth / this.col;
    this.font= { 'medium': `bold ${this.imageSize * 0.35 }px Merio` };
  }  // setGameSize()

  setSprite(restData) {
    for (const data of restData) {
      for (const [layer, layerData] of Object.entries(data)) {
        if (layerData[0].constructor === Array) {
          this.setSpriteBlocks(layer, layerData);
        } else if (typeof layerData[0] === 'object') {
          for (const d of layerData) {
            this.setSpriteBlock(d['col'], d['row'], layer, d['sprite']);
          }
        }
      }
    }
  }  // setSprite()

  setMeta(restData) {
    this.metaData = restData['sprite']
  }  // setMeta

  setSpriteBlock(col, row, layer, src, overwrite = true) {
    if (src === this.blocks[layer][row][col]) return;
    if (overwrite) this.removeSpriteBlock(col, row, layer);
    const context = this.contexts[layer];
    const image = new Image();
    const imageSize = this.imageSize;
    image.onload = function() {
      context.drawImage(image, imageSize * col, imageSize * row, imageSize, imageSize);
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
    this.blocks[layer] = [...Array(this.row)].map(x=>Array(this.col).fill(''));
    const context = this.contexts[layer];
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let row = 0; row < layerData.length; row++) {
      for (let col = 0; col < layerData[row].length; col++) {
        if (layerData[row][col]) {
          this.setSpriteBlock(col, row, layer, layerData[row][col], false);
        }
      }
    }
  }  // setSpriteBlocks()

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

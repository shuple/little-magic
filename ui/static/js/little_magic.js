class LittleMagicSprite {
  constructor() {
    // object[layer]: array[row][col]
    this.blocks = {};

    // object[sprite]: {}
    this.metaData = {};

    // default size
    const [ gameWidth, gameHeight ] = [ 512, 448 ];
    const imageSize = 32;
    [ this.col, this.row ] = [ gameWidth / imageSize, gameHeight / imageSize ]

    // adjust scale
    const [ clientWidth, clientHeight ] =
      [ document.documentElement.clientWidth, document.documentElement.clientHeight ];
    this.scale = (clientWidth > gameWidth && clientHeight > gameHeight) ? 1 : 0.75;
    this.imageSize = this.scale * imageSize;
    [this.gameWidth, this.gameHeight] = [ this.imageSize * this.col, this.imageSize * this.row ];

    this.font = {
      'medium': `bold ${this.imageSize * 0.375 }px Merio`
    };

    this.crntState = {
      'graphic': 'sfc',
    };
  }  // constructor

  initContext() {
    for (const canvas of document.querySelectorAll('canvas')) {
      canvas.width  = this.gameWidth;
      canvas.height = this.gameHeight;
      this.canvas[canvas.id] = canvas;
      this.contexts[canvas.id] = canvas.getContext('2d');
    }
  }   // initContext()

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
    const [ colSize, rowSize ] =
      [ this.gameWidth / this.imageSize, this.gameHeight / this.imageSize ];
    this.blocks[layer] = [...Array(rowSize)].map(x=>Array(colSize).fill(''));
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
    return `/static/image/sprite/${this.crntState['graphic']}/${src}.png`;
  } // imagesrc()

  async rest(url, restData, callback) {
    fetch(url, {
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
  littleMagic.metaData = restData;
}  // setMeta()

export { LittleMagicSprite, setSprite, setMeta };

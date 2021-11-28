window.addEventListener('load', function () {
  class LittleMagic {
    constructor() {
      this.contexts = {};
      const [gameWidth, gameHeight] = [ 512, 448 ];
      const scale = (window.innerWidth > gameWidth && window.innerHeight > gameHeight) ? 1 : 0.5;
      for (let canvas of document.querySelectorAll('canvas')) {
        canvas.width  = gameWidth  * scale;
        canvas.height = gameHeight * scale;
        this.contexts[canvas.id] = canvas.getContext('2d');
        this.contexts[canvas.id].scale(scale, scale);
      }
    }  // constructor()

    mouseEvent(canvas, event) {
      const [x, y] = this.mouseCoordinate(canvas, event);
      switch (event) {
      // left click
      case 0:
        break;
      // right click
      case 2:
        break;
      default:
      }
    }  // mouseEvent

    mouseCoordinate(canvas, event) {
      const rect = canvas.getBoundingClientRect()
      return [ event.clientX - rect.left, event.clientY - rect.top ]
    }  // mouseCoordinate()

    rest(url, restData, callback) {
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

    imagesrc(src, graphic) {
      return '/static/image/sprite/' + graphic + '/' + src + '.png';
    } // imagesrc()

    loadMap(canvas, restData) {
      const context = this.contexts[canvas];
      const data = restData[canvas];
      for (let row = 0; row < data.length; row++) {
        for (let col = 0; col < data[row].length; col++) {
          if (data[row][col] == '') continue;
          let image = new Image();
          image.onload = function() {
            context.drawImage(image, image.width * col, image.height * row);
          };
          image.src = this.imagesrc(data[row][col], restData['graphic']);
        }
      }
    }  // loadMap()
  }  // class LittleMagic

  // callback for /post/stage rest
  //
  let loadMap = function(littleMagic, restData) {
    littleMagic.loadMap('background', restData);
    littleMagic.loadMap('foreground', restData);
    littleMagic.loadMap('object', restData);
  };  // let loadMap

  let littleMagic = new LittleMagic();
  littleMagic.rest('/post/stage', { stage: '001' }, loadMap);

  // event listener
  let canvas = document.getElementById('control')

  // 'click'       : left click
  // 'contextmenu' : right click
  for (mouseEvent of [ 'click', 'contextmenu' ]) {
    canvas.addEventListener(mouseEvent, function(event) {
      event.preventDefault();
      littleMagic.mouseEvent(canvas, event);
    });
  }
});

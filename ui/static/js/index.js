import { setMeta, setSprite } from './little_magic.js';
import { LittleMagicMake } from './little_magic_make.js';

window.addEventListener('load', function () {
  const littleMagic = new LittleMagicMake();
  const init = async function() {
    await littleMagic.rest('/post/read',
      { 'file': [ 'meta/make' ], 'graphic': 'sfc', 'returnData': {} }, setMeta);
    await littleMagic.rest('/post/read',
      { 'file': [ 'menu/make', 'stage/default' ], 'graphic': 'sfc', 'returnData': [] }, setSprite);
    littleMagic.init();
  }
  init();

  const canvas = document.getElementById('control')

  // mouse event
  const mouseHandler = function(event) {
    event.preventDefault();
    littleMagic.mouseEvent(canvas, event);
  }  // mouseHandler()

  for (const type of [ 'click', 'contextmenu' ]) {
    canvas.addEventListener(type, mouseHandler);
  }

  // resize event
  window.addEventListener('resize', function() {
    littleMagic.setGameSize();
  });
});

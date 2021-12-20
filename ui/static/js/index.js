import { setMeta, setSprite } from './little_magic.js';
import { LittleMagicMake } from './little_magic_make.js';

window.addEventListener('load', function () {
  const littleMagic = new LittleMagicMake();
  const init = async function() {
    await littleMagic.rest('/post/read',
      { 'file': [ 'meta/make' ], 'graphic': 'sfc', 'returnData': {} }, setMeta);
    await littleMagic.rest('/post/read',
      { 'file': [ 'menu/make', 'stage/000' ], 'graphic': 'sfc', 'returnData': [] }, setSprite);
    littleMagic.init();
  }
  init();

  // event listener
  const canvas = document.getElementById('control')

  // mouse event
  for (const mouseEvent of [ 'click', 'contextmenu' ]) {
    canvas.addEventListener(mouseEvent, function(event) {
      event.preventDefault();
      littleMagic.mouseEvent(canvas, event);
    });
  }

  // resize event
  window.addEventListener('resize', function() {
    littleMagic.setGameSize();
  });
});

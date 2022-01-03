import { LittleMagicMake } from './little_magic_make.js';

window.addEventListener('load', function () {
  const littleMagic = new LittleMagicMake();
  const init = async function() {
    const path = 'meta/make';
    const metaData = [ `${path}/sprite`, `${path}/position`, `${path}/debug` ];
    await littleMagic.rest('/post/read',
      { 'file': metaData, 'graphic': 'sfc', 'returnData': {} }, littleMagic.setMeta);
    await littleMagic.rest('/post/read',
      { 'file': [ 'menu/make', `stage/${littleMagic.state['stage']}` ],
        'graphic': 'sfc', 'returnData': {} }, littleMagic.setGame);
  }
  init();

  // control canvas layer
  const canvas = document.querySelector('canvas:last-child');

  // click event, hold emulates right click
  canvas.addEventListener('contextmenu', function(event) {
    event.preventDefault();
    littleMagic.mouseEvent(canvas, event);
  });
  let [ clickTimer, clickDuration ] = [ 0, 300 ];
  canvas.addEventListener('mousedown', function(event) {
    clickTimer = new Date().getTime();
  });
  canvas.addEventListener('mouseup', function(event) {
    let button = undefined;
    if (event.button === 0) {
      const clickReleaseTime = new Date().getTime();
      if (clickReleaseTime - clickTimer > clickDuration) {
        // right click
        button = 2;
      }
      littleMagic.mouseEvent(canvas, event, button);
    }
  });

  // tap event, hold emulates right click
  let [ touchTimer, touchDuration ] = [ null, 300 ];
  let tapLock = false;
  const touchHandler = function(event) {
    event.preventDefault();
    tapLock = true;
    let touch = event.touches[0];
    littleMagic.mouseEvent(canvas, touch, 2);
  }  // touchHandler()
  const touchStart = function(event) {
    if (event.touches.length === 1)
      touchTimer = setTimeout(touchHandler, touchDuration, event);
    else
      event.preventDefault();
  }
  const touchEnd = function(event) {
    if (tapLock) {
      event.preventDefault();
      tapLock = false;
    }
    if (touchTimer)
      clearTimeout(touchTimer);
  }
  canvas.addEventListener('touchstart', touchStart);
  canvas.addEventListener('touchend', touchEnd);

  // resize event
  const resizeHandler = function() {
    littleMagic.setGameSize();
  }
  window.addEventListener('resize', resizeHandler);
});

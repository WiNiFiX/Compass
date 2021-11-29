const {Virtual, Hardware, getAllWindows} = require('keysender');
const pixels = require('image-pixels');


// GLOBALS //

let w, m, k, win;
const delay = 75;
let test = false;


// END OF GLOBALS //

const sleep = (time) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time);
  });
}

const findTheGame = (name) => {
  try {
    const {handle, className} = getAllWindows().find(({title, className}) => {
      if(new RegExp(name).test(title) && (className == `RiotWindowClass`)) {
          return true;
        }
      });

    return new Hardware(handle);
    } catch(e) {
      throw new Error(`Can't find the window of the game.`);
    }
};


class Vec{
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  plus(vec) {
    return new Vec(this.x + vec.x, this.y + vec.y);
  }

  get dist() {
    return Math.sqrt(Math.pow(Math.abs(this.x), 2) + Math.pow(Math.abs(this.y), 2));
  }

}

class Rgb {
  constructor(rgb, width, height) {
    this.rgb = rgb;
    this.width = width;
    this.height = height;
  }

  colorAt({x, y}) {
    if(x < 0 || y < 0 || x > this.width - 1 || y > this.height - 1) { return false};
    return this.rgb[y][x];
  }

  findColor (color, cond) {
    for(let y = 0; y < this.rgb.length; y++) {
      for(let x = 0; x < this.rgb[0].length; x++) {
        let pixel = this.rgb[y][x];
        if(color(pixel)) {
          let point = new Vec(x, y);
          if(!cond || cond(this, point)){
            return point;
          }
        }
      }
    }
  }

  checkAround(center, color, size = 3) {
   for(let y = center.y - size; y <= center.y + size; y++) {
     for(let x = center.x - size; x <= center.x + size; x++) {
       if(y < 0 || x < 0 || x > this.width || y > this.height) { continue }
         let point = new Vec(x, y);
         if(point.x != center.x &&
            point.y != center.y &&
            color(this.colorAt(point))) {
           return point;
         }
     }
   }
 };
}



class Display {
  constructor({x, y, width, height}) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  rel(x, y, width, height) {
    return new Display({
      x: Math.floor(this.width * x),
      y: Math.floor(this.height * y),
      width: Math.floor(this.width * width),
      height: Math.floor(this.height * height)
    });
  }

  get center() {
    return new Vec(this.width / 2, this.height / 2);
  }

  async getRgb() {
    const captured = w.capture(this).data;
    const {data: rgb} = await pixels(captured,
                      {width: this.width, height: this.height});

    let whole = [];
    for (let y = 0, i = 0; y < this.height; y++) {
      let row = [];
      for (let x = 0; x < this.width; x++, i += 4) {
        let r = rgb[i];
        let g = rgb[i + 1];
        let b = rgb[i + 2];
        row.push([r, g, b]);
      }
    whole.push(row);
    }

    return new Rgb(whole, this.width, this.height);
  }

  static create(scr) {
    return new Display(scr);
  }
}



const isEnemy = (rgb, {x, y}) => {
  let center = new Vec(x, y)
  .plus(new Vec(3, 10));

  for(let angle = 0, step = 0.1; angle < Math.PI * 2; angle += step) {
    let x = Math.floor(center.x + (Math.cos(angle) * 12.5));
    let y = Math.floor(center.y + (Math.sin(angle) * 12.5));

    let point = new Vec(x, y);
    if(!rgb.checkAround(point, isRedandWhite)) {
      return false;
     }
  }

  return true;
};

const findSide = (area, {x, y}) => {
  let side = new Vec(0, 0);

  if(x > area.width / 2) {
     side.x = 1
   } else {
     side.x = -1
   };

  if(y > area.height / 2) {
    side.y = 1;
  } else {
    side.y = -1;
  }

  return side;
};

const isViewScreen = (rgb, start) => {
  let side = findSide(rgb, start);


  for(let x = start.x; x != start.x + (side.x * 10); x += side.x) {
    let point = new Vec(x, start.y);
    if(!rgb.checkAround(point, isWhite, 1)) {
      return false;
    }
  }

  for(let y = start.y; y != start.y + (side.y * 10); y += side.y) {
    let point = new Vec(start.x, y);
    if(!rgb.checkAround(point, isWhite, 1)) {
      return false;
    }
  }

  return true;
};

const relPos = ({x, y}, center, coof) => {
  x *= coof.x;
  y *= coof.y;
  /*
  if(x > 965) { x = 965; }
  else if(x < -965) { x = -965;}

  if(y > 515) { y = 515; }
  else if(y < -515) {  y = -515;}
  */
  // console.log(x, y);
  return center.plus(new Vec(x, y));
}

const alreadyVisible = (player, visible) => {
  if(player.x > visible.x &&
     player.x < visible.x + visible.width &&
     player.y > visible.y &&
     player.y < visible.y + visible.height) {
       return true;
     }
};
const checkLimit = (inner, outer) => {
  let x = Math.max(outer.x, inner.x);
  let y = Math.max(outer.y, inner.y);
  let rightmostLimit = outer.x + outer.width;
  let downmostLimit = outer.y + outer.height;
  let width = inner.x + inner.width > rightmostLimit ? rightmostLimit - inner.x : inner.width;
  let height = inner.y + inner.height > downmostLimit ? downmostLimit - inner.y : inner.height;

  return Display.create({x, y, width, height});
};



const startApp = async () => {
  const {workwindow, mouse, keyboard} = findTheGame(`League of Legends`);
  w = workwindow;
  m = mouse;
  k = keyboard;

  m.buttonTogglerDelay = delay;
  k.keyTogglerDelay = delay;
  k.keySenderDelay = delay

  const display = Display.create(w.getView());
  const map = Display.create({x: 1606, y: 766, width: 314, height: 314});
  // const map = display.rel(.82, .72, .148, .264);
  const size = 50;
  if(test) {
    setInterval(() => {
      let {x, y} = m.getPos();
      if(x < 0 || y < 0 || x > x + display.width || y > y + display.height) { return };
      let color = w.colorAt(x, y, 'array');
      console.log(x, y, color);

    }, 1000);
  } else {
    for(;;) {
      const mapRgb = await map.getRgb();
      const viewScreen = mapRgb.findColor(isWhite, isViewScreen);
      console.log(viewScreen);
      m.moveTo(map.x + viewScreen.x, map.y + viewScreen.y);

      process.exit();
      let mainScreen = Display.create({x: map.x + (viewScreen.x - size),
                                       y: map.y + (viewScreen.y - size),
                                       width: 80 + size * 2,
                                       height: 46 + size * 2});

      mainScreen = checkLimit(mainScreen, map);

      const visibleScreen = {x: size + 10, y: size + 10, width: 70, height: 36};
      const mainScreenRgb = await mainScreen.getRgb();
      let player = mainScreenRgb.findColor(isRed, isEnemy)

      if(player) {
          player = player.plus(new Vec(3, 10)); // adjust to center
          if(!alreadyVisible(player, visibleScreen)) {

            const pos = new Vec(player.x - ((80 + size * 2) / 2),
                                 player.y - ((46 + size *2) / 2));

            let relCoof = {x: display.width / (80 + size * 2), y: display.height / (46 + size *2)}

            win.webContents.send('set-enemy', relPos(pos, display.center, relCoof));

          } else {
            win.webContents.send('hide-enemy');
          }
          //let {x, y} = new Vec(mainScreen.x + player.x, mainScreen.y + player.y);
          //m.moveTo(x, y);
      } else {
        win.webContents.send('hide-enemy');
      }
      await sleep(50);
    }
  }
}


const isRed = (color) => {
  if(!color) return;
  let [r, g, b] = color;
  return (r - g > 100 && r - b > 100);
};

const isRedandWhite = (color) => {
  if(!color) return;
  let [r, g, b] = color;
  return (r - g > 100 && r - b > 100) || isWhite(color);
};


const isWhite = (color) => {
  if(!color) return;
  let [r, g, b] = color;
  return r > 225 && g > 225 && b > 225;
}

const runApp = exports.runApp = (mainWindow) => {
  win = mainWindow;
  win.show();
  try {
    console.log(`here`);
    startApp();
  } catch(e) {
    console.log(e);
  }
};

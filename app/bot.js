const {Virtual, Hardware, getAllWindows} = require('keysender');
const pixels = require('image-pixels');

// GLOBALS //

let w, m, k, win;
const delay = 75;
let test = true;

// END OF GLOBALS //

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
            console.log(color, `here`);
            return point;
          }
        }
      }
    }
  }

  checkAround(center) {
   for(let y = center.y - 5; y <= center.y + 5; y++) {
     for(let x = center.x - 5; x <= center.x + 5; x++) {
       if(y < 0 || x < 0 || x > this.width || y > this.height) { continue }
         let point = new Vec(x, y);
         if(point.x != center.x &&
            point.y != center.y &&
            isRedandWhite(this.colorAt(point))) {
           return point;
         }
     }
   }
 };
}

const moveAround = (rgb, {x, y}) => {
  let start = new Vec(x, y);
  let circleSize = new Vec(3, 10);
  let center = start.plus(circleSize);

  let angle = 0;
  let step = 0.1;


  for(let i = 0; i < 25; i++) {
    let x = Math.floor(center.x + (Math.cos(angle += step) * 12.5));
    let y = Math.floor(center.y + (Math.sin(angle += step) * 12.5));

    let point = new Vec(x, y);
    if(!rgb.checkAround(point)) {
      return false;
     }
  }
  console.log('Found the whole circle!');
  return true;
};


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
    const {data: rgb} = await pixels(w.capture(this).data,
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


const startApp = async () => {
  const {workwindow, mouse, keyboard} = findTheGame(`League of Legends`);
  w = workwindow;
  m = mouse;
  k = keyboard;

  m.buttonTogglerDelay = delay;
  k.keyTogglerDelay = delay;
  k.keySenderDelay = delay

  const display = Display.create(w.getView());
  const displayCenter = display.center;
  // const map = Display.create({x: 1625, y: 779, width: 286, height: 286});
  const map = display.rel(.82, .72, .148, .264);

  for(;;) {
    const mapRgb = await map.getRgb();
    let userScreenStart = mapRgb.findColor(isWhite);
    let mainScreen = Display.create({x: map.x + userScreenStart.x,
                                     y: map.y + userScreenStart.y,
                                     width: 80,
                                     height: 46});
    let mainScreenCenter = new Vec(mainScreen.width / 2, mainScreen.height / 2);
    let mainScreenRgb = await mainScreen.getRgb();
    let player = await mainScreenRgb.findColor(isRed, moveAround);
    if(player) {

        let center = new Vec(player.x - mainScreenCenter.x, player.y - mainScreenCenter.y);
        let {x, y} = displayCenter.plus(new Vec(center.x * 5, center.y * 5));
        win.setPosition(x, y);
        // m.moveTo(mainScreen.x + player.x, mainScreen.y + player.y);
    }
    await sleep(10);
  }


if(test) {

  setInterval(() => {
    let {x, y} = m.getPos();
    if(x < 0 || y < 0 || x > x + display.width || y > y + display.height) { return };
    let color = w.colorAt(x, y, 'array');
    console.log(x, y, color);

  }, 1000);
}

}


const isBlue = (color) => {
  if(!color) return;
  let [r, g, b] = color;
  return b - r > 40 && b - g > 40;
};

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
  return r > 250 && g > 250 && b > 250;
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

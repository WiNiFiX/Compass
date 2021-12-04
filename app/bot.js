const {Virtual, Hardware, getAllWindows, sleep} = require('keysender');
const pixels = require('image-pixels');

// GLOBALS //

let w, m, k, win;
const delay = 75;
let test = false;
let testMap;
let testMainScreen;

// END OF GLOBALS //

const asleep = (time = 0) => {
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

const theSamePos = (first, second) => {
  for(let y = first.y - 10; y < first.y + 10; y++) {
    for(let x = first.x - 10; x < first.x + 10; x++) {
      if(second.x == x && second.y == y) {
        return true;
      }
    }
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

  minus(vec) {
    return new Vec(this.x - vec.x, this.y - vec.y);
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
    return this.rgb[Math.floor(y)][Math.floor(x)];
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

  findColors (color, cond) {
    let found = [];

    for(let y = 0; y < this.rgb.length; y++) {
      for(let x = 0; x < this.rgb[0].length; x++) {
        let pixel = this.rgb[y][x];
        if(color(pixel)) {
          let point = new Vec(x, y);
          if(!cond || !found.some(p => theSamePos(p, point)) && cond(this, point)){
              found.push(point)
          }
        }
      }
    }
    return found;
  }
  testCheckAround(center, color, size = 1) {
   let points = [];
   for(let y = center.y - size; y <= center.y + size; y++) {
     for(let x = center.x - size; x <= center.x + size; x++) {
       if(y < 0 || x < 0 || x > this.width || y > this.height) { continue }
         let point = new Vec(x, y);
         if(color(this.colorAt(point))) {
           points.push(point);
         }
     }
   }

   return points.length ? points : false;
 }

  checkAround(center, color, size = 1) {
   for(let y = center.y - size; y <= center.y + size; y++) {
     for(let x = center.x - size; x <= center.x + size; x++) {
       if(y < 0 || x < 0 || x > this.width || y > this.height) { continue }
         let point = new Vec(x, y);
         if(color(this.colorAt(point))) {
           return point;
         }
     }
   }
 }
}


const isEnemy = (rgb, found) => {
  let center = found.plus(new Vec(-11, -1)); // 3, 10


//  let points = [];
  for(let angle = 0, step = 0.1; angle < Math.PI; angle += step) {
    let x = Math.floor(center.x + (Math.cos(angle) * 12));
    let y = Math.floor(center.y + (Math.sin(angle) * 12));

    let point = new Vec(x, y);
    let redPos = rgb.checkAround(point, isRedandWhite, 2)
    if(!redPos) {
      return false;
     }
    //points.push(redPos);
  }

  /*
    console.log(testMainScreen);
    m.moveTo(testMainScreen.x + center.x, testMainScreen.y + center.y);
   console.log(`found`, center);
   console.log(points.reduce((a, b) => a.concat(b)).length);

  let finishPoints = [];
  for(let p of points) {
    finishPoints.push(p.minus(center));
  };
  */

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

  getRgb() {
    const captured = w.capture(this).data;
    let rgb = [];
    for(let v of captured.values()) rgb.push(v);

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

  enlarge(size) {
    let x = this.x - size;
    let y = this.y - size;
    let width = this.width + (size * 2);
    let height = this.height + (size * 2);
    return Display.create({x, y, width, height});
  }

  static create(scr) {
    return new Display(scr);
  }
}









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

  if(!isViewScreen.side) {
    for(let x = start.x; x < start.x + 30; x++) {
      let point = new Vec(x, start.y);
      if(!rgb.checkAround(point, isWhite, 1)) {
        return false;
      }
    }

    isViewScreen.side = findSide(rgb, start);
  }

  let side = isViewScreen.side

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


const relPos = (player, display, mainScreen) => {
  player = player.plus(new Vec(-12.5, 0));

  let {x, y} = new Vec(player.x - mainScreen.center.x,
                       player.y - mainScreen.center.y);

  let limit = new Vec(20, 10);

  if(isVisible({x, y}, limit)) {
    return false;
  }

  let angle = Math.atan2(y, x);
  if(angle < 0) {angle = Math.PI + (Math.PI + angle)}
  let angle360 = angle * (360 / (Math.PI * 2));

  return {angle360, angle};
}



const isVisible = (player, visible) => {
  if(player.x < visible.x &&
     player.x > -visible.x &&
     player.y < visible.y &&
     player.y > -visible.y) {
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

const createMainScreen = (viewScreen, map) => {
  const side = isViewScreen.side;

  const width = 80;
  const height = 46;

  const widthRel = side.x < 0 ? -width : 0;
  const heightRel = side.y < 0 ? -height: 0;

  let x = map.x + viewScreen.x + widthRel;
  let y = map.y + viewScreen.y + heightRel;

  mainScreen = Display.create({x, y, width, height});

  isViewScreen.side = null;
  return checkLimit(mainScreen, map);
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
  testMap = map;
  // const map = display.rel(.82, .72, .148, .264);
  const size = 60;
  if(test) {
    setInterval(() => {
      let {x, y} = m.getPos();
      if(x < 0 || y < 0 || x > x + display.width || y > y + display.height) { return };
      let color = w.colorAt(x, y, 'array');
      console.log(x, y, color);

    }, 1000);
  } else {
    for(;;) {
      const mapRgb = map.getRgb();
      const viewScreen = mapRgb.findColor(isWhite, isViewScreen);
      if(!viewScreen) {continue};
      const mainScreen = createMainScreen(viewScreen, map, size).enlarge(size);
      testMainScreen = mainScreen;
      const mainScreenRgb = mainScreen.getRgb();

      const players = mainScreenRgb.findColors(isRedandWhite, isEnemy); // TEST FIND COLORS

      const playersRel = players.map(player => relPos(player, display, mainScreen))
      .filter(p => p);

      win.webContents.send('set-enemies', playersRel);
      await asleep();
    }
  }
}



const isRed = (color) => {
  if(!color) return;
  let [r, g, b] = color;
  return r - g > 150 && r - b > 150;
};

const isRedandWhite = (color) => {
  return isRed(color) || isWhite(color);
};


const isWhite = (color) => {
  if(!color) return;
  let [r, g, b] = color;
  return r > 254 && g > 254 && b > 254;
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

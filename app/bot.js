const {Virtual, Hardware, getAllWindows, sleep} = require('keysender');
const pixels = require('image-pixels');

// GLOBALS //

let w, m, k, win;
const delay = 75;
let state = true;

let test = false;
let mapTest;
// END OF GLOBALS //



const asleep = (time = 0) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time);
  });
};

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

const theSamePos = (first, second, size = 12) => {
  for(let y = first.y - size; y < first.y + size; y++) {
    for(let x = first.x - size; x < first.x + size; x++) {
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

  findColors (color, cond) {
    let found = [];
    for(let y = 0; y < this.rgb.length; y++) {
      for(let x = 0; x < this.rgb[0].length; x++) {
        let pixel = this.rgb[y][x];
        if(color(pixel)) {
          let point = new Vec(x, y);
          let center = cond(this, point);
          if(center && !found.some(foundPoint => theSamePos(foundPoint, center))) {
              found.push(center);
          }
        }
      }
    }

    return found;
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

  return points.length && points;
}

}
const smallestDistance = (a, b) => {
  if(a.dist < b.dist) {
    return a;
  } else {
    return b;
  }
};



const isEnemy = (rgb, found) => {
  let center = found.plus(new Vec(-12, 0));

  for(let angle = 0, step = Math.PI * 2 / 8; angle < Math.PI * 2; angle += step) {
    let x = Math.round(center.x + (Math.cos(angle) * 12));
    let y = Math.round(center.y + (Math.sin(angle) * 12));

    let point = new Vec(x, y);
    if(!rgb.testCheckAround(point, isRedandWhite, 1)) {
      return false;
     }
  }

  return center;
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
    return new Vec(this.x + this.width / 2, this.y + this.height / 2);
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

const isViewPort = (rgb, start) => {

  if(!isViewPort.side) {
    for(let x = start.x; x < start.x + 30; x++) {
      let point = new Vec(x, start.y);
      if(!isWhite(rgb.colorAt(point))) {
        return false;
      }
    }
    isViewPort.side = findSide(rgb, start);
  }

  let side = isViewPort.side

  for(let x = start.x; x != start.x + (side.x * 10); x += side.x) {
    let point = new Vec(x, start.y);
    if(!isWhite(rgb.colorAt(point))) {
      return false;
    }
  }

  for(let y = start.y; y != start.y + (side.y * 10); y += side.y) {
    let point = new Vec(start.x, y);
    if(!isWhite(rgb.colorAt(point))) {
      return false;
    }
  }

  return true;
};


const checkLimit = (inner, outer) => {
  let x = Math.max(0, inner.x);
  let y = Math.max(0, inner.y);
  let width = inner.x + inner.width > outer.width ? outer.width - inner.x : inner.width;
  let height = inner.y + inner.height > outer.height ? outer.height - inner.y : inner.height;

  return Display.create({x, y, width, height});
};

const createMainScreen = (viewPort, map, size) => {
  const side = isViewPort.side;

  const width = size.width;
  const height = size.height;

  const widthRel = side.x < 0 ? -width : 0;
  const heightRel = side.y < 0 ? -height: 0;

  let x = viewPort.x + widthRel;
  let y = viewPort.y + heightRel;

  isViewPort.side = null;
  return checkLimit({x, y, width, height}, map);
};


const stopApp = exports.stopApp = () => {
  state = false;
};

const startApp = exports.startApp = async (win) => {

  const {workwindow, mouse, keyboard} = findTheGame(`League of Legends`);
  w = workwindow;
  m = mouse;
  k = keyboard;

  m.buttonTogglerDelay = delay;
  k.keyTogglerDelay = delay;
  k.keySenderDelay = delay

  const display = Display.create(w.getView());
  const map = Display.create({x: 1606, y: 766, width: 314, height: 314});
  const viewPortSize = {width: 80, height: 46};
  const viewPortLimit = {width: 70, height: 40};
  const size = 50;

  mapTest = map;

  w.setForeground();
  win.show();

  state = true;

    for(;state;) {
      if(!w.isOpen()) { throw new Error(`Can't find the window of the game.`) };
      if(!w.isForeground() && win.isVisible()) { win.hide() };
      if(w.isForeground() && !win.isVisible()) { win.show() };
      if(!win.isVisible()) {
        await asleep(250);
        continue;
      }

      const mapRgb = map.getRgb();
      const viewPort = mapRgb.findColor(isWhite, isViewPort);

      if(!viewPort) {continue}
      const mainScreen = createMainScreen(viewPort, map, viewPortSize);

      const enemies = mapRgb.findColors(isRedandWhite, isEnemy)
      .filter(enemy => inRangeOf(enemy, mainScreen.enlarge(size)) &&
                      !inRangeOf(enemy, mainScreen.enlarge(-10)))
      .map(enemy => getRel(enemy, mainScreen.center))
      .map(getAngle)

      win.webContents.send('set-enemies', enemies);
      await asleep();
    }
};

const inRangeOf = (enemy, zone) => {
 return enemy.x > zone.x &&
        enemy.x < zone.x + zone.width &&
        enemy.y > zone.y &&
        enemy.y < zone.y + zone.height;
};

const getRel = (enemy, center) => {
  return new Vec(enemy.x - center.x,
                 enemy.y - center.y);
};

const getAngle = (pos) => {
  let angle = Math.atan2(pos.y, pos.x);
  if(angle < 0) {
    angle = Math.PI + (Math.PI + angle)
  }
  let dist = pos.dist;
  let scale = 1 - (dist / 600);

  return {scale, angle};
};

const isRed = (color) => {
  if(!color) return;
  let [r, g, b] = color;
  return r - g > 75 && r - b > 75;
};

const isRedandWhite = (color) => {
  return isRed(color) || isWhite(color);
};

const isWhite = (color) => {
  if(!color) return;
  let [r, g, b] = color;
  return r > 254 && g > 254 && b > 254;
};

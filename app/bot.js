const {Hardware, getAllWindows, sleep} = require('keysender');

let w, m, state, options;
let testMap;
const updateOptsApp = exports.updateOptsApp = (newOpts) => {
  options = newOpts;
};

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

  findColor(color, cond) {
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

  findColors(color, cond) {
    let found = [];
    for(let y = 0; y < this.rgb.length; y++) {
      for(let x = 0; x < this.rgb[0].length; x++) {
        let pixel = this.rgb[y][x];
        if(color(pixel)) {
          let point = new Vec(x, y);
          let center = cond && cond(this, point);
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

}

const centers = [
  {pos: new Vec(-12, 0), startAngle: 0},
  {pos: new Vec(12, 0),  startAngle: Math.PI },
  {pos: new Vec(0, 12),  startAngle: Math.PI * 3 / 2},
  {pos: new Vec(0, -12), startAngle: Math.PI / 2}
];
/*
TESTS:
1. 8 / MATH.PI / isRed / 110
2. 8 / MATH.PI * 2 / isRedandWhite / 75
*/


const isEnemy = (rgb, found) => {
  for(let {pos, startAngle} of centers) {
    let center = pos.plus(found);
    for(let angle = startAngle, step = Math.PI * 2 / 8; angle < startAngle + Math.PI * 2; angle += step) {
      let x = Math.round(center.x + (Math.cos(angle) * 12));
      let y = Math.round(center.y + (Math.sin(angle) * 12));

      let point = new Vec(x, y);
      if(!rgb.checkAround(point, isRedandWhite)) {
        center = false;
        break;
      }
    }
    if(center) {
      return center;
    }
  }
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
    for(let x = start.x; x < start.x + 20; x++) {
      let point = new Vec(x, start.y);
      if(!rgb.checkAround(point, isWhite)) {
        return false;
      }
    }
    isViewPort.side = findSide(rgb, start);
  }
  let side = isViewPort.side

  for(let x = start.x; x != start.x + (side.x * 15); x += side.x) {
    let point = new Vec(x, start.y);
    if(!rgb.checkAround(point, isWhite)) {
      return false;
    }
  }

  for(let y = start.y; y != start.y + (side.y * 15); y += side.y) {
    let point = new Vec(start.x, y);
    if(!rgb.checkAround(point, isWhite)) {
      return false;
    }
  }

  return true;
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
  return Display.create({x, y, width, height});
};


const stopApp = exports.stopApp = () => {
  state = false;
};

const startApp = exports.startApp = async (win) => {

  const {workwindow, mouse, keyboard} = findTheGame(`League of Legends`);

  w = workwindow;
  m = mouse;

  state = true;

  const display = Display.create(w.getView());
  const map = display.rel(.837, .709, .163, .290);
  console.log(map);
  testMap = map;

  const viewPortSize = {width: .041 * display.width,
                        height: .042 * display.height};

  const basesLimit = [
    {x: map.width - 70, y: 0, height: 70, width: 70},
    {x: 0, y: map.height - 70, width: 70, height: 70}
  ];

  w.setForeground();
  win.show();

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
      if(!viewPort) {
        continue
      } else {
        viewPort.y += 5;
      }

      const mainScreen = createMainScreen(viewPort, map, viewPortSize);


      const enemies = mapRgb.findColors(isRed, isEnemy)
      .filter(enemy => inRangeOf(enemy, mainScreen.enlarge(options.outerLimit)) &&
                       !inRangeOf(enemy, mainScreen.enlarge(options.innerLimit - viewPortSize.height)) &&
                       !basesLimit.some((zone) => inRangeOf(enemy, zone))
                    )



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
  let scale = options.scale ? Math.min(1 - ((dist - options.innerLimit) / (options.outerLimit * 2)), 1) : 1;
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
  return r > 240 && g > 240 && b > 240;
};

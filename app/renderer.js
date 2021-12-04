const { ipcRenderer } = require('electron');

const renderEnemy = ({angle, angle360}) => {
  let enemy = document.createElement('div');
  enemy.classList.add('enemy');
  enemy.style.left = `${876 + Math.cos(angle) * 150}px`;
  enemy.style.top = `${477 + Math.sin(angle) * 150}px`;

  enemy.style.transform = `rotate(${Math.floor(angle360)}deg)`;
  return enemy;
};

const append = (node) => {
  document.body.append(node);
}

let count = 0;
ipcRenderer.on('set-enemies', (event, enemies) => {

  if(count == 5) {
    document.body.innerHTML = ``;
    count = 0;
  };

  if(enemies.length > 0) {
    document.body.innerHTML = ``;
    enemies.map(renderEnemy).forEach(append);
  } else {
    count++;
  }

});

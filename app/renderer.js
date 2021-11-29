const { ipcRenderer } = require('electron');

const renderEnemy = (pos) => {
  let enemy = document.createElement('div');
  document.body.append(enemy);
  enemy.classList.add('enemy');
  return enemy;
};

let enemy;
ipcRenderer.on('set-enemy', (event, pos) => {
  if(!enemy) {
    enemy = renderEnemy(pos);
    enemy.style.opacity = 1; 
  };
  enemy.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
});

ipcRenderer.on('hide-enemy', (event) => {
  enemy.style.opacity = 0;
  document.body.innerHTML = ``;
  enemy = null;
});

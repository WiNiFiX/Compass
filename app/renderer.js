const { ipcRenderer } = require('electron');

const renderEnemy = (pos) => {
  let enemy = document.createElement('div');
  enemy.classList.add('enemy');
  enemy.style.left = `${pos.x}px`;
  enemy.style.top = `${pos.y}px`;
  return enemy;
};

const append = (node) => {
  document.body.append(node);
}

ipcRenderer.on('set-enemies', (event, enemies) => {
  document.body.innerHTML = ``;
  if(enemies.length > 0) {
    enemies.map(renderEnemy).forEach(append);
  }
});

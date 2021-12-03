const { ipcRenderer } = require('electron');

const renderEnemy = (pos) => {
  let enemy = document.createElement('div');
  enemy.classList.add('enemy');
  enemy.style.left = `${876 + Math.cos(pos.angle) * 150}px`;
  enemy.style.top = `${477 + Math.sin(pos.angle) * 150}px`;

  enemy.style.transform = `rotate(${Math.floor(pos.angle360)}deg)`;
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

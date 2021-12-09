const { ipcRenderer } = require('electron');

const renderEnemy = ({angle}) => {
  let enemy = document.createElement('div');
  enemy.classList.add('enemy');
  enemy.style.left = `${960 + Math.cos(angle) * 150}px`;
  enemy.style.top = `${540 + Math.sin(angle) * 150}px`;

  enemy.style.transform = `rotate(${angle / (Math.PI * 2)}turn)`;
  return enemy;
};

const append = (node) => {
  document.body.append(node);
}

let count = 0;
ipcRenderer.on('set-enemies', (event, enemies) => {

  if(count == 10) {
    document.body.innerHTML = ``;
    count = 0;
  };

  if(enemies.length > 0) {
    document.body.innerHTML = ``;
    enemies.map(renderEnemy).forEach(append);
  } else {
    count += 1;
  }

});

ipcRenderer.on('clear-enemies', () => {
  document.body.innerHTML = ``;
});

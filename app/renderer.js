const { ipcRenderer } = require('electron');

const renderEnemy = ({scale, angle}) => {
  let enemy = document.createElement('div');
  enemy.classList.add('enemy');
  enemy.style.left = `${890 + Math.cos(angle) * 200}px`;
  enemy.style.top = `${500 + Math.sin(angle) * 200}px`;

  enemy.style.transform = `scale(${scale}) rotate(${angle / (Math.PI * 2)}turn)`;
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
    count += 1;
  }

});

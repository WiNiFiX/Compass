const { ipcRenderer } = require('electron');

const compassArea = document.querySelector('.compassArea');

let options;

ipcRenderer.invoke('get-options')
.then(newOpts => options = newOpts);


const renderEnemy = ({scale, angle}) => {
  let enemy = document.createElement('img');
  enemy.src = 'img/arrow_blue.png';
  enemy.classList.add('enemy');
  enemy.style.left = `${885 + Math.cos(angle) * options.radius}px`;
  enemy.style.top = `${485 + Math.sin(angle) * options.radius}px`;

  enemy.style.width = `${options.size}px`;
  enemy.style.height = `${options.size}px`;
  enemy.style.opacity = `${options.opacity / 100}`;

  enemy.style.transform = `scale(${scale}) rotate(${angle / (Math.PI * 2)}turn)`;
  return enemy;
};


(() => {
  let count = 0;
  ipcRenderer.on('set-enemies', (event, enemies) => {

    if(count == 10) {
      compassArea.innerHTML = ``;
      count = 0;
    };

    if(enemies.length > 0) {
      compassArea.innerHTML = ``;
      enemies.map(renderEnemy).forEach(node => compassArea.append(node));
    } else {
      count += 1;
    }
  });
})();

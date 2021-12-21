const { ipcRenderer } = require('electron');

const form = document.querySelector('.options_form');
const saveButton = document.querySelector('.save');
const savedResult = document.querySelector('.saved_result');
const getCenter = document.querySelector('#getCenter');
const defaultData = {"size":35,
                     "opacity":0.6,
                     "radius":150,
                     "innerLimit":40,
                     "outerLimit":50,
                     "color":0,
                     "scale":1,
                     "posX":885,
                     "posY":485}
const defaultButton = document.querySelector('.default');

defaultButton.addEventListener('click', () => {
  setOptions(Object.assign({}, defaultData));
  savedResult.textContent = 'Reseted successfully!';
  setTimeout(() => {
    savedResult.textContent = ``;
  }, 2000);
});

getCenter.addEventListener('click', async () => {
  let {x, y} = await ipcRenderer.invoke('get-center');
  document.querySelector('#posX').value = x;
  document.querySelector('#posY').value = y;
});

let options;

const setOptions = (newOpts) => {
  options = newOpts;
  for(let option of Object.keys(options)) {
    let input = form[option];

    if(input.type == 'range') {
      input.previousElementSibling.textContent = options[option];
    }

    if (input.type == 'checkbox') {
      input.checked = options[option];
    } else {
      input.value = options[option];
    }

  }
}

const updateOptions = () => {
  for(let option of Object.keys(options)) {
    let input = form[option];
    options[option] = +input.value;
    if(input.type == 'checkbox') {
      options[option] = +input.checked;
    }
  }
  setOptions(options);
  ipcRenderer.send('update-options', options);
}

const saveOptions = async () => {
  let result = await ipcRenderer.invoke('save-options', options);
  savedResult.textContent = 'Saved successfully!';
  setTimeout(() => {
    savedResult.textContent = ``;
  }, 2000);
};

form.addEventListener('input', updateOptions);
saveButton.addEventListener('click', saveOptions);
ipcRenderer.invoke('get-options').then(setOptions);

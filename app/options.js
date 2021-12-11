const { ipcRenderer } = require('electron');

let options;

const optionsNode = document.querySelector('.options');
const saveButton = document.querySelector('.save');
const savedResult = document.querySelector('.saved_result');

const size = document.querySelector('#size');
const opacity = document.querySelector('#opacity');
const radius = document.querySelector('#radius');

const sizeTextValue = document.querySelector('#size_value');
const opacityTextValue = document.querySelector('#opacity_value');
const radiusTextValue = document.querySelector('#radius_value');

const updateValues = () => {
  options.size = sizeTextValue.textContent = size.value;
  options.opacity = opacityTextValue.textContent = opacity.value;
  options.radius = radiusTextValue.textContent = radius.value;
  ipcRenderer.send('set-options', options);
}

const setOptions = async () => {
  options = await ipcRenderer.invoke('get-options');
  size.value = options.size;
  opacity.value = options.opacity;
  radius.value = options.radius;
  updateValues();
};

setOptions();


const saveOptions = async () => {
  let result = await ipcRenderer.invoke('save-options', options);
  savedResult.textContent = 'Saved successfully!';
};

optionsNode.addEventListener('input', updateValues);
saveButton.addEventListener('click', saveOptions);

const { ipcRenderer } = require('electron');

const form = document.querySelector('.options_form');
const saveButton = document.querySelector('.save');
const savedResult = document.querySelector('.saved_result');

let options;

const setOptions = (newOpts) => {
  options = newOpts;
  for(let option of Object.keys(options)) {
    let input = form[option];
    input.value = options[option];
    if(input.type == `range`) {
      input.previousElementSibling.textContent = options[option];
    }
  }
}

const updateOptions = () => {
  for(let option of Object.keys(options)) {
    let input = form[option];
    options[option] = input.value;
  }
  setOptions(options);
  ipcRenderer.send('set-options', options);
}

const saveOptions = async () => {
  let result = await ipcRenderer.invoke('save-options', options);
  savedResult.textContent = 'Saved successfully!';
};

form.addEventListener('input', updateOptions);
saveButton.addEventListener('click', saveOptions);
ipcRenderer.invoke('get-options').then(setOptions);

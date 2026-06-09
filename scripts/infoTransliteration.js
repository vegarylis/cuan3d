import * as data from './data.js';
import * as loader from './loader.js';

const transliterationElem = document.getElementById("transliterationContent");

function setup() {

    loader.loadLocalFile('./resources/transliterations/HS1174.json', 'transliteration');
    
}

function update() {
    if(data.getTransliteration()){
        transliterationElem.innerHTML = data.getTransliteration().replaceAll('\\n','<br>');
    }
    else {
        transliterationElem.innerHTML = "Please load a transliteration file.";
    }
}

export {setup, update};
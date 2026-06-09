import * as loader from './loader.js';

function setup(){

    const heading = document.createElement("p");
    heading.classList.add("formbold-form-label");
    heading.classList.add("padding-left");
    heading.innerHTML = "<b>Cuan3D<b>";

    const text = document.createElement("p");
    text.id = "aboutText";
    text.classList.add("formbold-form-label");
    text.classList.add("padding-left");

    const container = document.getElementById("aboutcontainer");
    container.appendChild(heading);
    container.appendChild(text);

    loader.loadFile('./resources/about.txt', 'text', "aboutText");

}

export {setup}
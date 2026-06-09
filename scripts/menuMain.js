import * as menuSetup from './menuSetup.js';
import * as menuModeSetup from './menuModeSetup.js';

import * as menuImportExport from './menuImportExport.js';
import * as menuCreate from './menuCreate.js';
import * as menuEditContent from './menuEditContent.js';
import * as menuEditForm from './menuEditForm.js';

import * as menuOverlay from './menuOverlay.js';
import * as menuHelp from './menuHelp.js';

import * as screenMouse from './screenMouse.js';

let importExportMode = false, editFormMode = false, editContentMode = false, createMode = false;

function init() {

    // set up credentials form
    menuSetup.initial();
    menuEditContent.init();
    screenMouse.enablePickingObject();

    // prepare overlay for menuCreate
    menuOverlay.init();

    // prepare help
    menuHelp.init();
    document.getElementById("modebutton").addEventListener('click', openHelp);

    // set up eventlisteners for mode buttons
    document.getElementById("importExportBtn").addEventListener('click', openImportExport);
    document.getElementById("createAnnoBoxBtn").addEventListener('click', openCreateBox);
    document.getElementById("createAnnoPolygonBtn").addEventListener('click', openCreatePolygon);
    document.getElementById("editAnnoContentBtn").addEventListener('click', openEditContent);
    document.getElementById("editAnnoFormBtn").addEventListener('click', openEditForm);

    // set up eventlisteners for done and reset buttons
    document.getElementById("reset").addEventListener('click', reset);
    document.getElementById("done").addEventListener('click', done);

}

/* Opens 'Import/Export' menu on left hand side of the screen */
function openImportExport(){
    importExportMode = true;
    
    screenMouse.disablePickingObject();
    menuModeSetup.setup("importExportBtn");

    menuImportExport.open(); 
}

/* Wrapper for opening 'Create new annotation (box)' menu on left hand side of the screen */
function openCreateBox(){
    openCreate('box');
}

/* Wrapper for opening 'Create new annotation (polygon)' menu on left hand side of the screen */
function openCreatePolygon(){
    openCreate('polygon');
}

/* Opens 'Create new annotation' menu on left hand side of the screen */
function openCreate(form){
    createMode = true;

    screenMouse.clear();
    screenMouse.disablePickingObject();

    menuCreate.open(form); 

    if(form == "box"){
        // intermediate step to place the annotation box on a position the user chooses
        menuModeSetup.setup("createAnnoBoxBtn", 1);
        // deactivate done and reset button
        document.getElementById("done").classList.add("btn-unclickable");
        document.getElementById("reset").classList.add("btn-unclickable");
        // continue after box placement
        document.getElementById("mainWindow").addEventListener('click', continueOpenCreate, {once: true});
    }
    else {
        menuModeSetup.setup("createAnnoPolygonBtn");

        menuEditContent.open();  
        menuEditForm.open(false);

        screenMouse.enableEditingForm(true);
    }

}

/* Continues openCreate in case box annotation is to be created */
function continueOpenCreate() {

    document.getElementById("mainWindow").removeEventListener('click', continueOpenCreate, {once: true});

    // make done and reset button active again
    document.getElementById("done").classList.remove("btn-unclickable");
    document.getElementById("reset").classList.remove("btn-unclickable");

    screenMouse.setPositionOfBox();

    menuModeSetup.setup("createAnnoBoxBtn", 2);

    menuEditContent.open();  
    menuEditForm.open(false);

    screenMouse.enableEditingForm(true);
}

/* Opens 'Edit annotation content' menu on left hand side of the screen */
function openEditContent(){   
    editContentMode = true;
    screenMouse.disablePickingObject();
    
    // set up display view of 'Edit annotation content' menu
    menuModeSetup.setup("editAnnoContentBtn");
    
    menuEditContent.open();
}

/* Opens 'Edit annotation form' menu on left hand side of the screen */
function openEditForm(){
    
    editFormMode = true;

    menuModeSetup.setup("editAnnoFormBtn");

    menuEditForm.open(true);
    document.getElementById("deleteBtnAnnotation").addEventListener('click', handleDeleteAnnotation);

    screenMouse.disablePickingObject();
    screenMouse.enableEditingForm(false);

}

/* Exits specific mode for annotation manipulation and restores the default mode of the annotation menu */ 
function done() {
    
    if(importExportMode) {
        menuImportExport.done();
        
        menuModeSetup.reset("importExportBtn");

        screenMouse.enablePickingObject();
        screenMouse.clear();

        importExportMode = false;
    }
    else if (createMode) {

        screenMouse.disableEditingForm();

        if(document.getElementById("overlayBtnContainer")){
            document.getElementById("overlayBtnContainer").addEventListener('click', continueDoneCreate, {once: true});
        }
        else {
            continueDoneCreate();
        }

    }
    else if (editContentMode) {
        menuEditContent.done();

        menuModeSetup.reset("editAnnoContentBtn");

        screenMouse.enablePickingObject();
        editContentMode = false;
    }
    else if (editFormMode) {
        
        document.getElementById("deleteBtnAnnotation").removeEventListener('click', handleDeleteAnnotation);
        document.getElementById("reset").removeEventListener('click', handleResetDeletion, {once: true});

        menuEditForm.done();
        
        menuModeSetup.reset("editAnnoFormBtn");

        screenMouse.disableEditingForm();
        screenMouse.enablePickingObject();

        editFormMode = false;
    }
}

/* Resets the changed parameters when in specific mode for annotation manipulation */
function reset() {

    if(importExportMode) {
        menuImportExport.reset();
    }
    else if (createMode) {

        menuCreate.reset();
        menuEditForm.done();

        menuModeSetup.reset("createAnnoBtn");

        screenMouse.disableEditingForm();
        screenMouse.enablePickingObject();
        screenMouse.clear();

        createMode = false;
    }
    else if (editContentMode) {
        menuEditContent.reset();
    }
    else if (editFormMode) {
        menuEditForm.reset();
    }
}

/* Continues exiting createMode */
function continueDoneCreate() {

    menuCreate.done();
        
    menuEditContent.done();
    menuEditForm.done();
    
    menuModeSetup.reset("createAnnoBtn");

    screenMouse.enablePickingObject();
    screenMouse.clear();

    createMode = false;
}

/* Opens the help menu for the current mode */
function openHelp(event){

    if(importExportMode){
        menuHelp.open("importExport");
    }
    else if (createMode){
        menuHelp.open("create");
    }
    else if (editContentMode){
        menuHelp.open("editContent");
    }
    else if(editFormMode){
        menuHelp.open("editForm");
    }
    else {
        menuHelp.open("main");
    }
    
}

/* Disable deleteBtn and movement of pickedObject and setup correct 'reset' button functionality*/
function handleDeleteAnnotation(event) {

    screenMouse.disableEditingForm();
    document.getElementById("deleteBtnAnnotation").classList.add("btn-unclickable");
    document.getElementById("reset").addEventListener('click', handleResetDeletion, {once: true});

}

/* Enable movement of pickedObject after it was deleted and then reset and activate 'delete annotation' button again */
function handleResetDeletion(event) {

    screenMouse.disableEditingForm(false);
    screenMouse.enableEditingForm(false);
    document.getElementById("deleteBtnAnnotation").classList.remove("btn-unclickable");
    
}

export {init};
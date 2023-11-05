import { init2DScene } from './scene2D.js';
import { Scene3D } from './scene3D.js';
import './canvasControls.js';

document.addEventListener('DOMContentLoaded', () => {
    init2DScene();    
    let scene3D = new Scene3D("myCanvas3D", ".canvas-wrapper");
});

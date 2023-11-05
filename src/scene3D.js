import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'dat.gui';
import { initFaceShaderMaterial, addBarycentricCoordinates, constructVertexBalls, modifyIcosahedronWithVertexBalls, useRGBShader } from './scene3DUtils.js';

export class Scene3D {
    constructor(canvasId, guiContainerSelector) {

        this.canvas = document.getElementById(canvasId);
        this.context = this.canvas.getContext('webgl2', { alpha: false });
        this.guiContainer = document.querySelector(guiContainerSelector);

        this.initRGBShader();
        this.setupGUI(guiContainerSelector);
        this.initScene3D();

        document.getElementById('go3DButton').addEventListener('click', () => {
            if (this.canvas.style.display === 'block') {
                // Assuming canvas already has block style display attr. according to canvasControls
                this.setupGUI();
                this.gui.domElement.style.display = 'block'; // Show GUI
            } else {
                this.gui.domElement.style.display = 'none'; // Hide GUI
            }
        });

        this.canvas.addEventListener('resize', function() {
            const newWidth = this.canvas.width;
            const newHeight = this.canvas.height;
    
            this.camera.aspect = newWidth / newHeight;
            this.camera.updateProjectionMatrix();
    
            this.renderer.setSize(newWidth, newHeight);
    
            // Also resize the render target to match the canvas size
            this.rt.setSize(newWidth, newHeight);
        });
    
        window.addEventListener("mousemove", (e) => {
            let rect = this.canvas.getBoundingClientRect();
    
            let centerX = rect.left + rect.width / 2;
            let centerY = rect.top + rect.height / 2;
    
            let dx = e.clientX - centerX;
            let dy = e.clientY - centerY;
            
            let angle = Math.atan2(dy, dx);
            
            // modify icosahedron
            modifyIcosahedronWithVertexBalls(this.icosahedron, angle, this.camera, this.canvas);
    
            if (rect.width === 0 || rect.height === 0 || useRGBShader === false)
                return;
    
            // Set the uniform value
            this.rgbShiftPass.material.uniforms.rgbAngle.value = angle;
        });
    }

    initRGBShader() {
        // Define the RGBShiftShader
        this.RGBShiftShader = {
            uniforms: {
                "tDiffuse": { value: null },
                "amount": { value: 0.05 },
                "rgbAngle": { value: 0.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float amount;
                uniform float rgbAngle;
                varying vec2 vUv;
                const float M_PI = 3.14159265358979323846264338327950288;
                void main() {
                    vec2 directionR = vec2(cos(rgbAngle - 2.0 * M_PI / 3.0), sin(rgbAngle - 2.0 * M_PI / 3.0));
                    vec2 directionG = vec2(cos(rgbAngle), sin(rgbAngle));
                    vec2 directionB = vec2(cos(rgbAngle + 2.0 * M_PI / 3.0), sin(rgbAngle + 2.0 * M_PI / 3.0));
                    vec2 rUv = vUv + amount * directionR;
                    vec2 gUv = vUv + amount * directionG;
                    vec2 bUv = vUv + amount * directionB;
                    vec4 r = texture2D(tDiffuse, rUv);
                    vec4 g = texture2D(tDiffuse, gUv);
                    vec4 b = texture2D(tDiffuse, bUv);
                    gl_FragColor = vec4(r.r, g.g, b.b, 1.0);
                }`
        };
    }

    initScene3D() {
        // Create the scene
        this.scene = new THREE.Scene();

        // Create the camera
        this.camera = new THREE.PerspectiveCamera(40, this.canvas.width / this.canvas.height , 0.01, 1000);
        this.camera.position.z = 5; // Position the camera

        // Create the renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, context: this.context, antialias: true });

        // Set the renderer's background color
        const canvasWrapper = document.querySelector('.canvas-wrapper');
        const computedStyle = getComputedStyle(canvasWrapper);
        this.renderer.setClearColor(computedStyle.backgroundColor);

        // Create the icosahedron geometry and mesh
        this.icosahedron = this.constructIcosahedronWithVertexBalls(1.2, this.guiConfig.subdivLevel);
        this.scene.add(this.icosahedron);

        // Add orbit controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        // Create lights
        const light = new THREE.DirectionalLight(0xFFFFFF, 1);
        light.position.set(1, 1, 1).normalize();
        this.scene.add(light);

        // Create ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        this.scene.add(ambientLight);
        
        if (useRGBShader)
        {
            // Create the off-screen render target (rt)
            this.rt = new THREE.WebGLRenderTarget(this.canvas.width, this.canvas.height);

            // Create the RGB shift pass material
            this.rgbShiftPass = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
                uniforms: this.RGBShiftShader.uniforms,
                vertexShader: this.RGBShiftShader.vertexShader,
                fragmentShader: this.RGBShiftShader.fragmentShader
            }));
    
            // Create the scene for the post-process pass
            this.scenePass = new THREE.Scene();
            this.scenePass.add(this.rgbShiftPass);
    
            // Create the camera for the post-process pass
            this.cameraPass = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        }

        this.animate();
    }

    setupGUI(guiContainerSelector) {
        this.guiConfig = {
            subdivLevel: 0 // the default value
        };

        if (this.gui != undefined)
            return;

        const guiContainer = document.querySelector(guiContainerSelector);
        this.gui = new GUI({ autoPlace: false });

        this.gui.add(this.guiConfig, 'subdivLevel', 0, 5).step(1).name('Subdivision Level').onChange(
            (value) => {  // Arrow function to use the correct `this`
                this.scene.remove(this.icosahedron); // Remove the old icosahedron
                this.icosahedron = this.constructIcosahedronWithVertexBalls(1.2, value);
                this.scene.add(this.icosahedron);
        });

        guiContainer.appendChild(this.gui.domElement);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.icosahedron.rotation.x += 0.01;
        this.icosahedron.rotation.y += 0.01;

        // Render the main scene to a texture
        if (useRGBShader)
            this.renderer.setRenderTarget(this.rt);
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);

        // Apply the RGB shift effect and render the final output
        if (useRGBShader)
        {
            this.rgbShiftPass.material.uniforms.tDiffuse.value = this.rt.texture;
            this.renderer.setRenderTarget(null);
            this.renderer.clear();
            this.renderer.render(this.scenePass, this.cameraPass);
        }
    }

    constructIcosahedronWithVertexBalls(icoRadius, subdiv) {
        // Create the icosahedron geometry and mesh
        const geometry = new THREE.IcosahedronGeometry(icoRadius, subdiv);
        addBarycentricCoordinates(geometry);
        const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x326630, wireframe: true });
        const shaderMaterial = initFaceShaderMaterial();
        this.icosahedron = new THREE.Mesh(geometry, shaderMaterial);
        this.icosahedron.add(new THREE.Mesh(geometry, wireframeMaterial));

        // Create the vertex balls
        this.icosahedron.vertexBalls = constructVertexBalls(this.icosahedron);
        return this.icosahedron;
    }


}
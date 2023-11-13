import * as THREE from 'three';

export const useRGBShader = true;
export const useIcosahedron = false;

const ballMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xFF0000, 
    shininess: 100,     // Determines the brightness of the specular highlight. Default is 30.
    specular: 0xFFFFFF  // Color of the specular highlight. Default is 0x111111 (very dark).
});
// Create a single reusable unit sphere geometry
const unitSphereGeometry = new THREE.SphereGeometry(1, 32, 32);

export function modifyMeshWithVertexBalls(mesh, highlightAngle, camera, canvas) {
    if (mesh == undefined)
        return;

    const vertexBalls = mesh.vertexBalls;
    const positions = mesh.geometry.attributes.position.array;
    for (let i = 0, j = 0; i < vertexBalls.length; i++, j += 3) {
        let radius = 0.02;
        if (highlightAngle) 
        {
            const angle = computeCanvasAngleFromWorldPosition(new THREE.Vector3(positions[j], positions[j + 1], positions[j + 2]), mesh, camera, canvas);
            let angleDiff = Math.abs(angle - highlightAngle);
            angleDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff);
            const factor = Math.cos(angleDiff);
            radius = radius * (1 + factor);
        }
        vertexBalls[i].scale.set(radius, radius, radius);
    }
}

function computeCanvasAngleFromWorldPosition(pos, mesh, camera, canvas) {
    // Convert vertex world position to screen space
    const vertexWorldPos = pos.clone().applyMatrix4(mesh.matrixWorld);
    const vertexScreenPos = vertexWorldPos.project(camera);

    // The returned x and y from the project() function are in the range of [-1,1]. Convert them to fit the canvas size.
    vertexScreenPos.x = (vertexScreenPos.x + 1) / 2 * canvas.width;
    vertexScreenPos.y = (-vertexScreenPos.y + 1) / 2 * canvas.height;

    // Center of the canvas
    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 2;

    // Calculate angle in screen space between vertex and canvas center
    return Math.atan2(vertexScreenPos.y - canvasCenterY, vertexScreenPos.x - canvasCenterX);
}

export function constructVertexBalls(mesh) {
    const vertexBalls = [];
    const positions = mesh.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        const vertexBall = new THREE.Mesh(unitSphereGeometry, ballMaterial);
        vertexBall.position.set(positions[i], positions[i + 1], positions[i + 2]);
        const diam = 0.05;
        vertexBall.scale.set(diam, diam, diam);
        vertexBalls.push(vertexBall);
        mesh.add(vertexBall);
    }

    return vertexBalls;
}

export function addBarycentricCoordinates(geometry) {
    const vertices = geometry.attributes.position.array;
    const length = vertices.length;
    const barycentric = [];

    for (let i = 0; i < length; i += 9) {
        barycentric.push(1, 0, 0, 0, 1, 0, 0, 0, 1);
    }

    geometry.setAttribute('aBarycentric', new THREE.Float32BufferAttribute(barycentric, 3));
}

export function initFaceShaderMaterial() {
    // Vertex shader:
    // takes in the normal of each vertex, transforms it with the normal matrix, and passes it to the fragment shader as a 
    // varying variable.
    const vertexShader = `
        attribute vec3 aBarycentric;
        varying vec3 vBarycentric;
        varying vec3 vNormal;  // Declared vNormal here to pass the vertex normal to the fragment shader.
        
        void main() {
            vNormal = normalize(normalMatrix * normal);  // Transform the vertex normal.
            vBarycentric = aBarycentric;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    // Fragment shader:
    // calculates the brightness of each pixel by taking the dot product of the transformed normal and a light vector.
    // The color of each pixel is set to a green color modulated by the brightness.
    const fragmentShader = `
        varying vec3 vBarycentric;
        varying vec3 vNormal;  // You need to declare vNormal here as well.
        
        void main() {
            vec3 light = vec3(1.0, 1.0, 1.0);
            float brightness = dot(normalize(vNormal), normalize(light));  // Now you can use vNormal.
        
            float edgeFactor = 0.1;
        
            float distance = min(min(vBarycentric.x, vBarycentric.y), vBarycentric.z);
        
            // Compute alpha for antialiased wireframe: close to 1.0 at edges, and decreasing as we move to face interior
            float alpha = 1.0 - smoothstep(0.0, edgeFactor, distance);
        
            if (alpha < 0.02) discard;
        
            gl_FragColor = brightness * vec4(0.3, 0.6, 0.3, alpha);
        }        
    `;

    // Shader material
    const material = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        depthWrite: false, // Important! To ensure the transparent wireframe is properly rendered
        side: THREE.DoubleSide // If you want it to be visible from both sides
    });

    return material;
}

export function updateRotation(obj) {
    if (!obj) return;

    if (obj instanceof THREE.Mesh) {
        obj.rotation.x += 0.01;
        obj.rotation.y += 0.01;
    } else if (obj instanceof THREE.Group || obj instanceof THREE.Object3D) {
        obj.children.forEach(child => this.updateRotation(child));
    }
}

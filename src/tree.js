console.log("Script running...");

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';
// import { Audio } from 'three';
import mya from "./car-engine.mp3"


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const canvas = document.getElementById("draw")
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.setAnimationLoop( animate );
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
// Add helper to visualize light direction
// const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
canvas.width = 2;
canvas.height = 512;

const gradient = context.createLinearGradient(0, 0, 0, 512);
gradient.addColorStop(0, '#1e4877'); // Dark blue at top
gradient.addColorStop(0.5, '#4584b4'); // Mid blue
gradient.addColorStop(1, '#83b8d7'); // Light blue at bottom

context.fillStyle = gradient;
context.fillRect(0, 0, 2, 512);

const texture = new THREE.CanvasTexture(canvas);
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(1024, 1);

scene.background = texture;

// handle resize window width height
window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
})

const material = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    roughness: 0.7,
    metalness: 0.3
});

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(2, 2, 2);
scene.add(directionalLight);

const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00});
const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 0.5);
scene.add(directionalLightHelper);


const gui = new GUI();

// Create material folder
const materialFolder = gui.addFolder('Material');
materialFolder.add(material, 'roughness', 0, 1);
materialFolder.add(material, 'metalness', 0, 1);
materialFolder.addColor(material, 'color');

// Create lights folder
const lightsFolder = gui.addFolder('Lights');
lightsFolder.add(ambientLight, 'intensity', 0, 2).name('Ambient Intensity');
lightsFolder.add(directionalLight, 'intensity', 0, 2).name('Directional Intensity');
lightsFolder.add(directionalLight.position, 'x', -5, 5);
lightsFolder.add(directionalLight.position, 'y', -5, 5);
lightsFolder.add(directionalLight.position, 'z', -5, 5);

// Create camera folder
const cameraFolder = gui.addFolder('Camera');
cameraFolder.add(camera.position, 'z', 0, 10);
cameraFolder.add(camera, 'fov', 20, 120).onChange(() => camera.updateProjectionMatrix());

// Create GUI
const cubeFolder = gui.addFolder('Cube');
cubeFolder.add(cube.rotation, 'x', 0, Math.PI * 2);
cubeFolder.add(cube.rotation, 'y', 0, Math.PI * 2);
cubeFolder.add(cube.rotation, 'z', 0, Math.PI * 2);
cubeFolder.add(cube.position, 'x', -3, 3);
cubeFolder.add(cube.position, 'y', -3, 3);
cubeFolder.add(cube.position, 'z', -3, 3);
cubeFolder.add(material, 'wireframe');

camera.position.z = 5;
camera.position.y = 5;


// Create a tree
const treeGroup = new THREE.Group();

// Create the trunk
const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.5);
const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4d2926 });
const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
trunk.position.y = 0.25;

// Create the leaves (as a cone)
const leavesGeometry = new THREE.ConeGeometry(0.4, 1, 8);
const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x0f5f13 });
const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
leaves.position.y = 1;

// Add trunk and leaves to tree group
treeGroup.add(trunk);
treeGroup.add(leaves);

// Add tree to scene
scene.add(treeGroup);

// Add tree controls to GUI
const treeFolder = gui.addFolder('Tree');
treeFolder.add(treeGroup.position, 'x', -3, 3);
treeFolder.add(treeGroup.position, 'y', -3, 3);
treeFolder.add(treeGroup.position, 'z', -3, 3);
treeFolder.add(treeGroup.rotation, 'y', 0, Math.PI * 2);

// Create a garden with multiple trees
const garden = new THREE.Group();

// Function to create a tree at given position
function createTree(x, z) {
    const treeClone = treeGroup.clone();
    treeClone.position.set(x, 0, z);
    // Add some random rotation and slight scale variation
    treeClone.rotation.y = Math.random() * Math.PI * 2;
    const scale = 0.8 + Math.random() * 0.4;
    treeClone.scale.set(scale, scale, scale);
    return treeClone;
}

// Create a 3x3 grid of trees with some random offset
for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
        const offsetX = (Math.random() - 0.5) * 0.3;
        const offsetZ = (Math.random() - 0.5) * 0.3;
        const tree = createTree(i + offsetX, j + offsetZ);
        garden.add(tree);
    }
}

// Add garden to scene
scene.add(garden);

// Add garden controls to GUI
const gardenFolder = gui.addFolder('Garden');
gardenFolder.add(garden.position, 'x', -5, 5);
gardenFolder.add(garden.position, 'y', -5, 5);
gardenFolder.add(garden.position, 'z', -5, 5);
gardenFolder.add(garden.rotation, 'y', 0, Math.PI * 2);

// Create a zigzag road
const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 }); // Dark gray for road
const roadSegmentGeometry = new THREE.BoxGeometry(0.3, 0.05, 1); // Thin, long segments for road

const roadGroup = new THREE.Group();

// Create multiple road segments in a zigzag pattern
const numSegments = 8;
const segmentSpacing = 1;
let isZigZag = true;

for (let i = 0; i < numSegments; i++) {
    const roadSegment = new THREE.Mesh(roadSegmentGeometry, roadMaterial);

    // Position each segment
    roadSegment.position.z = i * segmentSpacing - (numSegments * segmentSpacing / 2);
    roadSegment.position.x = isZigZag ? 1 : -1;

    // Rotate alternate segments to create zigzag
    if (i < numSegments - 1) {
        const connector = new THREE.Mesh(
            new THREE.BoxGeometry(1, 0.05, 0.3),
            roadMaterial
        );
        connector.position.z = (i * segmentSpacing + segmentSpacing / 2) - (numSegments * segmentSpacing / 2);
        connector.position.x = 0;
        roadGroup.add(connector);
    }

    roadGroup.add(roadSegment);
    isZigZag = !isZigZag;
}

scene.add(roadGroup);

// Add road controls to GUI
const roadFolder = gui.addFolder('Road');
roadFolder.add(roadGroup.position, 'x', -5, 5);
roadFolder.add(roadGroup.position, 'y', -5, 5);
roadFolder.add(roadGroup.position, 'z', -5, 5);
roadFolder.add(roadGroup.rotation, 'y', 0, Math.PI * 2);


// Create a car
const carBody = new THREE.BoxGeometry(0.4, 0.2, 0.6);
const carRoof = new THREE.BoxGeometry(0.3, 0.15, 0.3);
const wheelGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 32);
const carMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

const car = new THREE.Group();

// Car body
const bodyMesh = new THREE.Mesh(carBody, carMaterial);
bodyMesh.position.y = 0.2;
car.add(bodyMesh);

// Car roof
const roofMesh = new THREE.Mesh(carRoof, carMaterial);
roofMesh.position.y = 0.375;
roofMesh.position.z = -0.05;
car.add(roofMesh);

// Wheels
const wheels = [];
const wheelPositions = [
    { x: -0.2, z: 0.2 },
    { x: 0.2, z: 0.2 },
    { x: -0.2, z: -0.2 },
    { x: 0.2, z: -0.2 }
];

wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(pos.x, 0.08, pos.z);
    wheels.push(wheel);
    car.add(wheel);
});

car.position.y = 0.1;
scene.add(car);

// Add car controls to GUI
const carFolder = gui.addFolder('Car');
carFolder.add(car.position, 'x', -5, 5);
carFolder.add(car.position, 'y', -5, 5);
carFolder.add(car.position, 'z', -5, 5);
carFolder.add(car.rotation, 'y', 0, Math.PI * 2);

// Car movement variables
const carSpeed = 0.05;
const turnSpeed = 0.03;
const keys = {};

// Keyboard controls
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Touch controls for mobile
let touchStartX = 0;
let touchStartY = 0;
const touchArea = document.getElementById('draw');

touchArea.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

touchArea.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;

    const deltaX = touchX - touchStartX;
    const deltaY = touchY - touchStartY;

    // Virtual joystick logic
    if (Math.abs(deltaY) > 20) {
        keys['ArrowUp'] = deltaY < 0;
        keys['ArrowDown'] = deltaY > 0;
    } else {
        keys['ArrowUp'] = keys['ArrowDown'] = false;
    }

    if (Math.abs(deltaX) > 20) {
        keys['ArrowLeft'] = deltaX < 0;
        keys['ArrowRight'] = deltaX > 0;
    } else {
        keys['ArrowLeft'] = keys['ArrowRight'] = false;
    }
});

touchArea.addEventListener('touchend', () => {
    keys['ArrowUp'] = keys['ArrowDown'] = keys['ArrowLeft'] = keys['ArrowRight'] = false;
});

// Update car movement in the animation loop
function updateCar() {
    if (keys['ArrowUp']) {
        car.position.x += Math.sin(car.rotation.y) * carSpeed;
        car.position.z += Math.cos(car.rotation.y) * carSpeed;
    }
    if (keys['ArrowDown']) {
        car.position.x -= Math.sin(car.rotation.y) * carSpeed;
        car.position.z -= Math.cos(car.rotation.y) * carSpeed;
    }
    if (keys['ArrowLeft']) {
        car.rotation.y += turnSpeed;
    }
    if (keys['ArrowRight']) {
        car.rotation.y -= turnSpeed;
    }
}

// Update wheel rotation based on car movement
function updateWheels() {
    // Only rotate wheels when car is moving forward or backward
    if (keys['ArrowUp'] || keys['ArrowDown']) {
        const rotationSpeed = keys['ArrowUp'] ? -0.2 : 0.2;

        // Rotate all wheels
        // frontLeftWheel.rotation.x += rotationSpeed;
        // frontRightWheel.rotation.x += rotationSpeed;
        // backLeftWheel.rotation.x += rotationSpeed;
        // backRightWheel.rotation.x += rotationSpeed;
    }
}

// Create audio for car engine sound
const carEngineSound = new Audio(mya);
console.log(carEngineSound)// Make sure to add this audio file to your project
carEngineSound.loop = true;
// Set initial volume
carEngineSound.volume = 0.5;

// Add error handling for audio context suspension
carEngineSound.addEventListener('suspend', () => {
    console.warn('Audio context suspended - attempting to resume');
    carEngineSound.play().catch(e => {
        console.warn('Failed to resume audio context:', e);
    });
});



// Function to handle car sound
function updateCarSound() {
    if (keys['ArrowUp'] || keys['ArrowDown']) {
        // Start or continue playing if not already playing
        if (carEngineSound.paused) {
            carEngineSound.play();
        }
    } else {
        // Pause sound when car stops
        if (!carEngineSound.paused) {
            carEngineSound.pause();
            carEngineSound.currentTime = 0; // Reset sound to beginning
        }
    }
}

// Handle audio loading errors
carEngineSound.addEventListener('error', (e) => {
    console.warn('Error loading car engine sound:', e);
});

// Fallback if audio fails to load
carEngineSound.onerror = () => {
    console.warn('Car engine sound failed to load - audio disabled');
    // Create stub methods to prevent errors
    carEngineSound.play = () => { };
    carEngineSound.pause = () => { };
};

// Update car position and check if it has moved
let previousPosition = car.position.clone();

function hasCarMoved() {
    const currentPosition = car.position;
    const hasMoved = !currentPosition.equals(previousPosition);
    previousPosition = currentPosition.clone();
    return hasMoved;
}



// Update car sound based on movement
if (hasCarMoved()) {
    if (carEngineSound.paused) {
        carEngineSound.play();
    }
} else {
    if (!carEngineSound.paused) {
        carEngineSound.pause();
        carEngineSound.currentTime = 0;
    }
}



function animate() {
    window.requestAnimationFrame(animate)
    // cube.rotation.x += 0.01;
    updateCarSound()

    // cube.rotation.y += 0.01;
    controls.update();
    // updateWheels()
    updateCar()
    renderer.render(scene, camera);

}








animate()



// 
// // Create a ground (street)
// const roadWidth = 10;
// const roadLength = 1000;
// const roadGeometry = new THREE.PlaneGeometry(roadWidth, roadLength);
// const roadMaterial = new THREE.MeshStandardMaterial({
//     color: 0x404040,
//     roughness: 0.8
// });
// const road = new THREE.Mesh(roadGeometry, roadMaterial);
// road.rotation.x = -Math.PI / 2;
// road.position.y = -0.1;
// // scene.add(road);

// // Create sidewalks
// const sidewalkGeometry = new THREE.PlaneGeometry(3, roadLength);
// const sidewalkMaterial = new THREE.MeshStandardMaterial({
//     color: 0x808080,
//     roughness: 0.9
// });

// const leftSidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
// leftSidewalk.rotation.x = -Math.PI / 2;
// leftSidewalk.position.set(-6.5, -0.05, 0);
// // scene.add(leftSidewalk);

// const rightSidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
// rightSidewalk.rotation.x = -Math.PI / 2;
// rightSidewalk.position.set(6.5, -0.05, 0);
// // scene.add(rightSidewalk);

// // Create grass areas
// const grassGeometry = new THREE.PlaneGeometry(20, roadLength);
// const grassMaterial = new THREE.MeshStandardMaterial({
//     color: 0x2d5a27,
//     roughness: 1
// });

// const grass = new THREE.Mesh(grassGeometry, grassMaterial);
// grass.rotation.x = -Math.PI / 2;
// grass.position.y = -0.15;
// // scene.add(grass);

// // Add trees
// function createTree(x, z) {
//     const tree = new THREE.Group();

//     // Tree trunk
//     const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 5);
//     const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4d2926 });
//     const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);

//     // Tree top
//     const leavesGeometry = new THREE.ConeGeometry(1, 1, 12);
//     const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x0f5f13 });
//     const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
//     leaves.position.y = 1.;

//     tree.add(trunk);
//     tree.add(leaves);
//     tree.position.set(x, 0.4, z);
//     scene.add(tree);
// }

// // // Place trees along the road
// // for (let i = -500; i <= 500; i += 4) {
// //     createTree(-8, i);  // Left side
// //     createTree(8, i);   // Right side
// // }

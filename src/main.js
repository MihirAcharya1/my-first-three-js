import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import CARMODEL from './models/bmw1k.glb';
import CARMODEL2 from './models/car1.glb';
import GRASSPATCH from './models/grasspatch.glb';
import { RGBELoader } from 'three/examples/jsm/Addons.js';
import speedUpSound from './sounds/speed-up.mp3'
import slowDownSound from './sounds/slow-down.mp3'
import boostSound from './sounds/boost.mp3'
import idleSound from './sounds/idle.mp3'
import GUI from 'lil-gui';
import GRASSTEXTURE from './textures/grass_txt.jpg';


function frameStart(){
    
// Create scene, camera and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#draw'),
    antialias: true
});

// Initialize audio elements
const boostSoundEffect = new Audio(boostSound);
const idleSoundEffect = new Audio(idleSound);
const slowDownSoundEffect = new Audio(slowDownSound);
const speedUpSoundEffect = new Audio(speedUpSound);

// Configure audio elements to loop
boostSoundEffect.loop = true;
idleSoundEffect.loop = true;
slowDownSoundEffect.loop = true;
speedUpSoundEffect.loop = true;

// Add user interaction check for audio
let hasInteracted = false;
let lastInteractionTime = Date.now();

document.addEventListener('click', () => {
    hasInteracted = true;
    lastInteractionTime = Date.now();
    // Initialize audio context after user interaction
    boostSoundEffect.load();
    idleSoundEffect.load();
    slowDownSoundEffect.load();
    speedUpSoundEffect.load();
}, { once: true });

// Track user activity
document.addEventListener('keydown', () => {
    lastInteractionTime = Date.now();
});

document.addEventListener('touchstart', () => {
    lastInteractionTime = Date.now();
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;

// Add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enabled = true; // Enable orbit controls for manual camera control
controls.minDistance = 5;
controls.maxDistance = 20;

// Set initial camera position
camera.position.set(0, 5, 10);
controls.update();

// Add key listener for toggling camera modes
let orbitControlsEnabled = true;
window.addEventListener('keydown', (e) => {
    if (e.key === 'c' || e.key === 'C') {
        orbitControlsEnabled = !orbitControlsEnabled;
        controls.enabled = orbitControlsEnabled;
    }
});

// Create oval race track
const trackWidth = 8;
const trackLength = 30;
const trackGeometry = new THREE.RingGeometry(trackLength/2 - trackWidth/2, trackLength/2 + trackWidth/2, 64);
const trackMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333,
    roughness: 0.8
});
const track = new THREE.Mesh(trackGeometry, trackMaterial);
track.rotation.x = -Math.PI / 2;
track.receiveShadow = true;
scene.add(track);

// Create grass field
const grassGeometry = new THREE.PlaneGeometry(100, 100);
const grassMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2d5a27,
    roughness: 0.8
});
const grass = new THREE.Mesh(grassGeometry, grassMaterial);
grass.rotation.x = -Math.PI / 2;        
grass.position.y = -0.1;
grass.receiveShadow = true;
scene.add(grass);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Add directional light for shadows
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(10, 10, 10);
dirLight.castShadow = true;
scene.add(dirLight);

// Load HDRI environment map
const rgbeLoader = new RGBELoader();
rgbeLoader.load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/flamingo_pan_1k.hdr', function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
});

// Handle window resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
const loader = new GLTFLoader();

// Add keyboard controls for the car
let carModel = null;
let wheels = []; // Array to store wheel meshes

// Store key states
const keyState = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    Shift: false,
    Control: false,
    Meta: false // For Mac Command key
};

// Function to check if car is on track
function isCarOnTrack(position) {
    const distanceFromCenter = Math.sqrt(position.x * position.x + position.z * position.z);
    return distanceFromCenter >= (trackLength/2 - trackWidth/2) && 
           distanceFromCenter <= (trackLength/2 + trackWidth/2);
}

// Add animation for the car model
let carDirection = 1;
function animateCar() {
    loader.load(CARMODEL2, (gltf) => {
        const model = gltf.scene;
        scene.add(model);
        const scale = 50; // Modify this value to change model size
        model.scale.set(scale, scale, scale);
        
        // Find and store wheel meshes
        model.traverse((child) => {
            if (child.isMesh && child.name.toLowerCase().includes('wheel')) {
                wheels.push(child);
            }
        }); 

        // Position car on track initially
        model.position.set(0, 0, trackLength/2);
        carModel = model;
    },
        // Progress callback
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            if (xhr.loaded === xhr.total) {
                console.log('Model loaded');
            }
        },
        // Error callback
        (error) => {
            console.error('An error occurred loading the model:', error);
        });
}

// Car movement variables
const carSpeed = 0.05;
let boostSpeed = 0.1;
const defaultBoostSpeed = 0.1;
const maxBoostSpeed = 0.3;
const turnSpeed = 0.03;
const wheelRotationSpeed = 0.5; // Speed of wheel rotation increased 5x
const keys = {};
let boostStartTime = 0;

// Detect OS for key mapping
const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);

// Keyboard controls with OS-specific modifications
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    // Handle boost activation for both Windows (Shift) and Mac (Command/Meta)
    if ((isMac && e.key === 'Meta') || (!isMac && e.key === 'Shift')) {
        if (keys['ArrowUp'] || keys['ArrowDown']) {
            boostStartTime = Date.now();
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    // Handle boost deactivation for both Windows (Shift) and Mac (Command/Meta)
    if ((isMac && e.key === 'Meta') || (!isMac && e.key === 'Shift')) {
        boostSpeed = defaultBoostSpeed;
        boostStartTime = 0;
    }
});

// Check if device is mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Create joystick elements only for mobile devices
const joystickContainer = document.createElement('div');
joystickContainer.style.cssText = `
    position: fixed;
    bottom: 50px;
    left: 50px;
    width: 100px;
    height: 100px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    touch-action: none;
    display: ${isMobile ? 'block' : 'none'};
`;

const joystickKnob = document.createElement('div');
joystickKnob.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 50%;
    transform: translate(-50%, -50%);
`;

joystickContainer.appendChild(joystickKnob);
document.body.appendChild(joystickContainer);

// Joystick variables
let isDragging = false;
let startX, startY;
let knobX = 0, knobY = 0;
const maxDistance = 30;

// Joystick touch handlers
joystickContainer.addEventListener('touchstart', (e) => {
    isDragging = true;
    const touch = e.touches[0];
    const rect = joystickContainer.getBoundingClientRect();
    startX = touch.clientX - rect.left;
    startY = touch.clientY - rect.top;
});

joystickContainer.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const touch = e.touches[0];
    const rect = joystickContainer.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const deltaX = x - startX;
    const deltaY = y - startY;
    const distance = Math.min(maxDistance, Math.sqrt(deltaX * deltaX + deltaY * deltaY));
    const angle = Math.atan2(deltaY, deltaX);

    knobX = Math.cos(angle) * distance;
    knobY = Math.sin(angle) * distance;

    joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

    // Update virtual keys based on joystick position
    const deadzone = 5;
    keys['ArrowUp'] = knobY < -deadzone;
    keys['ArrowDown'] = knobY > deadzone;
    keys['ArrowLeft'] = knobX < -deadzone;
    keys['ArrowRight'] = knobX > deadzone;
});

joystickContainer.addEventListener('touchend', () => {
    isDragging = false;
    knobX = 0;
    knobY = 0;
    joystickKnob.style.transform = 'translate(-50%, -50%)';
    keys['ArrowUp'] = keys['ArrowDown'] = keys['ArrowLeft'] = keys['ArrowRight'] = false;
});

// Update car movement in the animation loop
function updateCar() {
    if (!carModel) return;

    const previousPosition = carModel.position.clone();

    // Check boost duration and increase speed if necessary
    const isBoostActive = (isMac && keys['Meta']) || (!isMac && keys['Shift']);
    if (isBoostActive && (keys['ArrowUp'] || keys['ArrowDown']) && boostStartTime > 0) {
        const boostDuration = (Date.now() - boostStartTime) / 1000; // Convert to seconds
        if (boostDuration > 5) {
            boostSpeed = Math.min(maxBoostSpeed, defaultBoostSpeed + (boostDuration - 5) * 0.02);
        }
    }

    // Determine current speed based on boost key
    const currentSpeed = isBoostActive ? boostSpeed : carSpeed;

    // Rotate wheels based on movement and turning
    if (wheels.length > 0) {
        const wheelRotationAmount = currentSpeed * wheelRotationSpeed;
        wheels.forEach((wheel, index) => {
            // Forward/backward rotation
            if (keys['ArrowUp']) {
                wheel.rotation.x -= wheelRotationAmount;
            }
            if (keys['ArrowDown']) {
                wheel.rotation.x += wheelRotationAmount;
            }
            
            // Left/right wheel tilt
            if (keys['ArrowLeft']) {
                wheel.rotation.z = 0.2; // Tilt wheels left
            } else if (keys['ArrowRight']) {
                wheel.rotation.z = -0.2; // Tilt wheels right
            } else {
                wheel.rotation.z = 0; // Reset tilt when not turning
            }
        });
    }

    if (keys['ArrowUp']) {
        carModel.position.x += Math.sin(carModel.rotation.y) * currentSpeed;
        carModel.position.z += Math.cos(carModel.rotation.y) * currentSpeed;
        
        // Only allow rotation while moving forward
        if (keys['ArrowLeft']) {
            carModel.rotation.y += turnSpeed;
        }
        if (keys['ArrowRight']) {
            carModel.rotation.y -= turnSpeed;
        }
    }
    if (keys['ArrowDown']) {
        carModel.position.x -= Math.sin(carModel.rotation.y) * currentSpeed;
        carModel.position.z -= Math.cos(carModel.rotation.y) * currentSpeed;
        
        // Only allow rotation while moving backward
        if (keys['ArrowLeft']) {
            carModel.rotation.y -= turnSpeed;
        }
        if (keys['ArrowRight']) {
            carModel.rotation.y += turnSpeed;
        }
    }

    // After movement, check if car is on track
    if (!isCarOnTrack(carModel.position)) {
        // If car goes off track, revert to previous position
        carModel.position.copy(previousPosition);
    }

    // Update camera position based on current mode
    if (!orbitControlsEnabled) {
        // Car follow camera mode
        const cameraOffset = new THREE.Vector3(-5, 3, 0);
        cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), carModel.rotation.y);
        const targetCameraPos = new THREE.Vector3().copy(carModel.position).add(cameraOffset);
        camera.position.lerp(targetCameraPos, 0.05);
        camera.lookAt(carModel.position);
    } else {
        // Orbit controls mode
        controls.target.copy(carModel.position);
        controls.update();
    }
}

// Track currently playing sound
let currentSound = null;

// Function to handle car sound effects
function updateCarSound() {
    if (!hasInteracted) return;
    
    // Check if user has been inactive for 15 seconds
    const inactiveTime = (Date.now() - lastInteractionTime) / 1000;
    if (inactiveTime > 15) {
        if (currentSound) {
            currentSound.pause();
            currentSound.currentTime = 0;
            currentSound = null;
        }
        return;
    }
    
    const isMoving = keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight'];
    const isBoostActive = (isMac && keys['Meta']) || (!isMac && keys['Shift']);
    const isBoosting = isBoostActive && (keys['ArrowUp'] || keys['ArrowDown']);
    
    let nextSound = null;
    
    const isControlOrCommand = isMac ? keys['Meta'] : keys['Control'];
    
    if (isControlOrCommand && isBoostActive) {
        nextSound = speedUpSoundEffect;
    } else if (isBoostActive && isBoosting) {
        nextSound = boostSoundEffect;
    } else if (isMoving) {
        nextSound = idleSoundEffect;
    } else {
        nextSound = slowDownSoundEffect;
    }

    // Only change sound if needed
    if (nextSound !== currentSound) {
        // Stop current sound if playing
        if (currentSound) {
            currentSound.pause();
            currentSound.currentTime = 0;
        }
        
        // Start new sound
        try {
            nextSound.play();
            currentSound = nextSound;
        } catch (error) {
            console.warn('Audio playback failed:', error);
        }
    }
}

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
canvas.width = 2;
canvas.height = 512;

// background-color: #FBAB7E;
// background-image: linear-gradient(62deg, #FBAB7E 0%, #F7CE68 100%);


const gradient = context.createLinearGradient(0, 0, 0, 512);
gradient.addColorStop(0, '#020024'); // Dark blue at top
// gradient.addColorStop(0.5, '#F7CE68'); // Mid blue
gradient.addColorStop(1, '#8cff7c'); // Light blue at bottom

context.fillStyle = gradient;
context.fillRect(0, 0, 2, 512);

const texture = new THREE.CanvasTexture(canvas);
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(1024, 1);

scene.background = texture;
animateCar();


// Add helper light
const helper = new THREE.DirectionalLightHelper(dirLight, 5);
// scene.add(helper);

// Add GUI controls
// const gui = new GUI();

// // Car controls folder
// const carFolder = gui.addFolder('Car Controls');
// carFolder.add({ speed: carSpeed }, 'speed', 0.01, 0.2).onChange(value => carSpeed = value);
// carFolder.add({ boostMax: maxBoostSpeed }, 'boostMax', 0.1, 0.5).onChange(value => maxBoostSpeed = value);
// carFolder.add({ turn: turnSpeed }, 'turn', 0.01, 0.1).onChange(value => turnSpeed = value);
// carFolder.add({ wheelSpin: wheelRotationSpeed }, 'wheelSpin', 0.1, 2).onChange(value => wheelRotationSpeed = value);

// Track controls folder
// const trackFolder = gui.addFolder('Track Settings');
// trackFolder.add(track.material, 'roughness', 0, 1);
// trackFolder.addColor(track.material, 'color');
// trackFolder.add(track.position, 'y', -1, 1);

// // Lighting controls folder
// const lightFolder = gui.addFolder('Lighting');
// lightFolder.add(dirLight, 'intensity', 0, 2);
// lightFolder.add(ambientLight, 'intensity', 0, 2);
// lightFolder.add(dirLight.position, 'x', -20, 20);
// lightFolder.add(dirLight.position, 'y', -20, 20);
// lightFolder.add(dirLight.position, 'z', -20, 20);

// // Camera controls folder
// const cameraFolder = gui.addFolder('Camera');
// cameraFolder.add(camera.position, 'y', 1, 20);
// cameraFolder.add(controls, 'dampingFactor', 0.01, 0.5);
// cameraFolder.add(controls, 'minDistance', 1, 10);
// cameraFolder.add(controls, 'maxDistance', 10, 50);

// // Visual settings folder
// const visualFolder = gui.addFolder('Visual Settings');
// visualFolder.add(renderer, 'toneMappingExposure', 0, 2);


// Create grass texture
const textureLoader = new THREE.TextureLoader();
const grassTexture = textureLoader.load(GRASSTEXTURE);
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(100, 100); // Adjust repeat values to change texture density

// Update grass material with texture
grassMaterial.map = grassTexture;
grassMaterial.needsUpdate = true;

// Add grass texture controls to GUI
// const grassFolder = gui.addFolder('Grass Settings');
// grassFolder.add(grassTexture.repeat, 'x', 1, 200).name('Texture Repeat X');
// grassFolder.add(grassTexture.repeat, 'y', 1, 200).name('Texture Repeat Y');
// grassFolder.add(grassMaterial, 'roughness', 0, 1);
// grassFolder.addColor(grassMaterial, 'color');




// Add trees around the grass
function createTree(size) {
    const trunkGeometry = new THREE.CylinderGeometry(size/10, size/8, size, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a2f21 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);

    const leavesGeometry = new THREE.ConeGeometry(size/2, size*1.5, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x0f5f13,
        roughness: 0.8 
    });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = size;

    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(leaves);
    
    tree.traverse((object) => {
        if (object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
        }
    });

    return tree;
}

// Add small trees
for (let i = 0; i < 30; i++) {
    const tree = createTree(4);
    const angle = Math.random() * Math.PI * 2;
    const radius = 35 + Math.random() * 10;
    tree.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
    );
    tree.rotation.y = Math.random() * Math.PI * 2;
    scene.add(tree);
}

// Add big trees
for (let i = 0; i < 8; i++) {
    const tree = createTree(4);
    const angle = Math.random() * Math.PI * 2;
    const radius = 40 + Math.random() * 10;
    tree.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
    );
    tree.rotation.y = Math.random() * Math.PI * 2;
    scene.add(tree);
}



// Update animation function to include car movement
function animate() {
    requestAnimationFrame(animate);
    updateCarSound();
    updateCar();
    renderer.render(scene, camera);
}

animate();
}


document.addEventListener('DOMContentLoaded', () => {
    frameStart()
    // document.getElementById('view-normal').addEventListener('click', () => {
    //     document.getElementById('view-normal-div').style.display = 'none';
    //     document.getElementById('view-track-btn-2').style.display = 'block';
    //     document.getElementById('draw-visible').style.display = 'block';
    //     frameStart();
    // })
});

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import CARMODEL from './models/bmw1k.glb';
import { RGBELoader } from 'three/examples/jsm/Addons.js';
// Create scene, camera and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#draw'),
    antialias: true
});


renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;

// Add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Set initial camera position
camera.position.z = 1;

// Load HDRI environment map
const rgbeLoader = new RGBELoader();
rgbeLoader.load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/flamingo_pan_1k.hdr', function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    // scene.background = texture;
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
// loader.load(CARMODEL, (gltf) => {
//     const model = gltf.scene;
//     scene.add(model);

//     // Center the model
//     const box = new THREE.Box3().setFromObject(model);
//     const center = box.getCenter(new THREE.Vector3());
//     model.position.x += -center.x;
//     model.position.y += -center.y;
//     model.position.z += -center.z;

//     // Adjust model scale if needed
//     const scale = 10; // Modify this value to change model size
//     model.scale.set(scale, scale, scale);
// },
//     // Progress callback
//     (xhr) => {
//         console.log((xhr.loaded / xhr.total * 100) + '% loaded');
//         if (xhr.loaded === xhr.total) {
//             console.log('Model loaded');
//             // animate();

//         }
//     },
//     // Error callback
//     (error) => {
//         console.error('An error occurred loading the model:', error);
//     });


// Create a ground (street)
const roadWidth = 10;
const roadLength = 30;
const roadGeometry = new THREE.PlaneGeometry(roadWidth, roadLength);
const roadMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x404040,
    roughness: 0.8
});
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.rotation.x = -Math.PI / 2;
road.position.y = -0.1;
scene.add(road);

// Create sidewalks
const sidewalkGeometry = new THREE.PlaneGeometry(3, roadLength);
const sidewalkMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x808080,
    roughness: 0.9
});

const leftSidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
leftSidewalk.rotation.x = -Math.PI / 2;
leftSidewalk.position.set(-6.5, -0.05, 0);
scene.add(leftSidewalk);

const rightSidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
rightSidewalk.rotation.x = -Math.PI / 2;
rightSidewalk.position.set(6.5, -0.05, 0);
scene.add(rightSidewalk);

// Create grass areas
const grassGeometry = new THREE.PlaneGeometry(20, roadLength);
const grassMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2d5a27,
    roughness: 1
});

const grass = new THREE.Mesh(grassGeometry, grassMaterial);
grass.rotation.x = -Math.PI / 2;
grass.position.y = -0.15;
scene.add(grass);

// Add trees
function createTree(x, z) {
    const tree = new THREE.Group();
    
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 5);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4d2926 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    
    // Tree top
    const leavesGeometry = new THREE.ConeGeometry(1, 1, 12);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x0f5f13 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 1.;
    
    tree.add(trunk);
    tree.add(leaves);
    tree.position.set(x, 0.4    , z);
    scene.add(tree);
}

// Place trees along the road
for (let i = -10; i <= 10; i += 4) {
    createTree(-8, i);  // Left side
    createTree(8, i);   // Right side
}


// Add keyboard controls for the car
let carSpeed = 0.05;
let carModel = null;

// Store key states
const keyState = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false
};

// // Add event listeners for keydown and keyup
// window.addEventListener('keydown', (event) => {
//     if (Object.keys(keyState).includes(event.key)) {
//         keyState[event.key] = true;
//         updateCarPosition(carModel);
//     }
// });

// window.addEventListener('keyup', (event) => {
//     if (Object.keys(keyState).includes(event.key)) {
//         keyState[event.key] = false;
//         updateCarPosition(carModel);
//     }
// });

// // Function to update car position based on keyboard input
// function updateCarPosition(model) {
//     if (!model) return;
    
//     if (keyState.ArrowLeft) {
//         model.position.x -= carSpeed;
//         model.rotation.y = -Math.PI / 2;
//     }
//     if (keyState.ArrowRight) {
//         model.position.x += carSpeed;
//         model.rotation.y = Math.PI / 2;
//     }
//     if (keyState.ArrowUp) {
//         model.position.z -= carSpeed;
//         model.rotation.y = 0;
//     }
//     if (keyState.ArrowDown) {
//         model.position.z += carSpeed;
//         model.rotation.y = Math.PI;
//     }

//     // Keep car within road bounds
//     model.position.x = Math.max(-4, Math.min(4, model.position.x));
//     model.position.z = Math.max(-14, Math.min(14, model.position.z));
// }

// Add animation for the car model
let carDirection = 1;
function animateCar() {
    loader.load(CARMODEL, (gltf) => {
        const model = gltf.scene;
        scene.add(model);
        const scale = 50; // Modify this value to change model size
        model.scale.set(scale, scale, scale);
        if (model) {
            // Move car back and forth on the road
            model.position.z += 0.05 * carDirection;
            
            if (model.position.z > 12) carDirection = -1;
            if (model.position.z < -12) carDirection = 1;
            // Keep car on the road
            model.position.x = -1;
            model.position.y = 0;
            // Rotate car when changing direction
            model.rotation.y = carDirection > 0 ? Math.PI : 0;
            carModel = model;
        }
    },
        // Progress callback
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            if (xhr.loaded === xhr.total) {
                console.log('Model loaded');
                // carModel = model;
            }
        },
        // Error callback
        (error) => {
            console.error('An error occurred loading the model:', error);
        });
 
}

// Update animation loop to include car movemen
// function animate() {
//     requestAnimationFrame(animate);
//     controls.update();
//     renderer.render(scene, camera);

// };
// animate();
animateCar();
// Add keyboard controls for the car
let speed = 0;
const maxSpeed = 0.2;
const acceleration = 0.01;
const deceleration = 0.005;
const rotationSpeed = 0.05;
const turningSpeed = 0.03;

// Handle keyboard controls
document.addEventListener('keydown', (event) => {
    if (!carModel) return;
    
    switch(event.key) {
        case 'ArrowUp':
            speed = Math.min(speed + acceleration, maxSpeed);
            break;
        case 'ArrowDown':
            speed = Math.max(speed - acceleration, -maxSpeed);
            break;
        case 'ArrowLeft':
            // Turn left regardless of speed
            carModel.rotation.y += rotationSpeed;
            carModel.position.x += Math.sin(carModel.rotation.y - Math.PI/2) * turningSpeed;
            carModel.position.z += Math.cos(carModel.rotation.y - Math.PI/2) * turningSpeed;
            break;
        case 'ArrowRight':
            // Turn right regardless of speed
            carModel.rotation.y -= rotationSpeed;
            carModel.position.x += Math.sin(carModel.rotation.y + Math.PI/2) * turningSpeed;
            carModel.position.z += Math.cos(carModel.rotation.y + Math.PI/2) * turningSpeed;
            break;
    }
});

// Add smooth movement to animation loop
function moveCar() {
    if (!carModel) return;

    // Apply forward/backward movement in direction car is facing
    carModel.position.x += Math.sin(carModel.rotation.y) * speed;
    carModel.position.z += Math.cos(carModel.rotation.y) * speed;

    // Apply natural deceleration
    if (speed > 0) {
        speed = Math.max(0, speed - deceleration);
    } else if (speed < 0) {
        speed = Math.min(0, speed + deceleration);
    }

    // Keep car within bounds
    carModel.position.x = Math.max(-14, Math.min(14, carModel.position.x));
    carModel.position.z = Math.max(-14, Math.min(14, carModel.position.z));
}

// Update animation function to include car movement
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    moveCar();
    renderer.render(scene, camera);
}





// Animation loop
// function animate() {
// }

animate();

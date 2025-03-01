import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import CAR from './models/bmw1k.glb';
import TRACK from './models/racetrack.glb';

function viewTrack() {

    // Create scene, camera and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#draw2'),
        antialias: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Load track model first, then load car
    const loader = new GLTFLoader();
    let track;
    let car;

    loader.load(
        TRACK,
        function (gltf) {
            track = gltf.scene;
            track.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
            scene.add(track);

            // Load car only after track is loaded
            loader.load(
                CAR,
                function (gltf) {
                    car = gltf.scene;
                    car.traverse((node) => {
                        if (node.isMesh) {
                            node.castShadow = true;
                            node.receiveShadow = true;
                        }
                    });
                    // Position car relative to track
                    car.position.set(0, 1, 0); // Raised slightly above track
                    car.scale.set(0.5, 0.5, 0.5);
                    scene.add(car);
                },
                undefined,
                function (error) {
                    console.error('Error loading car:', error);
                }
            );
        },
        undefined,
        function (error) {
            console.error('Error loading track:', error);
        }
    );

    // Position camera
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    animate();

}

document.addEventListener('DOMContentLoaded', () => {
    viewTrack();
})


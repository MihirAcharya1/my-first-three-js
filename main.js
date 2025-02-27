console.log("Script Running..........")
import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00, } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;

function animate() {

	cube.rotation.x += 0.01;
	cube.rotation.y += 0.01;

	renderer.render( scene, camera );

}


if ( WebGL.isWebGL2Available() ) {

	// Initiate function or other initializations here
	animate();
    console.log("[WebGL.isWebGL2Available]")

} else {

	const warning = WebGL.getWebGL2ErrorMessage();
	document.getElementById( 'warning_message_div' ).appendChild( warning );
    document.getElementById( 'warning_message_div' ).style.display = 'block';

}
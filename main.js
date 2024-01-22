import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import openSimplexNoise from 'https://cdn.skypack.dev/open-simplex-noise';

// Layout-Management
let first = true;
let started = false;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
	canvas: document.querySelector('#canvas')
});

renderer.setSize( window.innerWidth, window.innerHeight );

// Camera
camera.position.set(0, 1.5, 0);

// TEXTURE
const textureLoader = new THREE.TextureLoader();

const baseColor = textureLoader.load("./textures/abstract/Abstract_004_COLOR.jpg");
const normalMap = textureLoader.load("./textures/abstract/Abstract_004_NRM.jpg");
const heightMap = textureLoader.load("./textures/abstract/Abstract_004_DISP.png");
const roughness = textureLoader.load("./textures/abstract/Abstract_004_SPEC.jpg");
const ambientOcclusion = textureLoader.load("./textures/abstract/Abstract_004_OCC.jpg");

const loadingManager = new THREE.LoadingManager();

// Blender Model
let modelOffset = 4.9 * (-1);
let model1;
let model2;
let models = [];
const loader = new GLTFLoader(loadingManager).setPath('./models/');
loader.load('subway-model-1-with-material-joined.glb', (glb) => {
	model1 = glb.scene;
});

loader.load('subway-model-2-with-material-joined.glb', (glb) => {
	model2 = glb.scene;
});

loadingManager.onLoad = function() {
	for (let x = 1; x <= 20; x++) {
		let newModel = Math.floor(Math.random() * 2) < 1 ? model1.clone() : model2.clone();
		newModel.position.set(0, 0, modelOffset * x);
		scene.add(newModel);

		models.push(newModel);
	}

	generateBackBox();
}


// Geometry
// Texture by Joao Paulo from https://3dtextures.me
const geometry = new THREE.SphereGeometry(0.55, 128, 128);
const sphere = new THREE.Mesh(geometry,
    new THREE.MeshStandardMaterial({
        map: baseColor,
        normalMap: normalMap,
        displacementMap: heightMap, displacementScale: 0.05,
        roughnessMap: roughness, roughness: 1,
        aoMap: ambientOcclusion
    }));

sphere.position.set(0, 1.5, -30);
scene.add( sphere );

const count = geometry.attributes.position.count;

geometry.positionData = [];
let v3 = new THREE.Vector3();
for (let i = 0; i < count; i++){
    v3.fromBufferAttribute(geometry.attributes.position, i);
    geometry.positionData.push(v3.clone());
}

//Dolly Zoom Stuff
let isZoomingIn = false;
let isZoomingOut = false;
const zoomSpeed = 0.1;
const initialDist = camera.position.z;

function updateCamera() {
    camera.updateProjectionMatrix();

	// Walking
	camera.position.y += Math.sin(Date.now() * 0.008) * 0.003;

	// Dolly-Effect - when the camera moves the fox has to change accordingly
    if (isZoomingIn && camera.position.z - initialDist < 1.5) {
		camera.position.z += ((window.innerWidth / window.innerHeight) / (0.5 * Math.tan(1 * ((Math.PI * 2) / 360)) * camera.fov)) / 1000;
		camera.fov -= zoomSpeed;
	} else if (isZoomingOut && camera.position.z - initialDist > 0) {
		camera.position.z -= ((window.innerWidth / window.innerHeight) / (0.5 * Math.tan(1 * ((Math.PI * 2) / 360)) * camera.fov)) / 1000;
		camera.fov += zoomSpeed;
	} else {
		return;
	}

}

// Audio
const listener = new THREE.AudioListener();
camera.add(listener);

// Sound Effects come from Pixabay
// https://pixabay.com/sound-effects/footsteps-on-wood-floor-14735/
const walking = new THREE.Audio( listener );
// https://pixabay.com/sound-effects/subway-passing-99262/
const train = new THREE.Audio( listener );
// https://pixabay.com/sound-effects/eerie-ambience-6836/ 
const eerie = new THREE.Audio ( listener );

const audioLoader = new THREE.AudioLoader();

// Event listeners for keyboard input for the dolly-zoom effect
document.addEventListener('keydown', (event) => {
    if (event.key === 'w') {
        isZoomingIn = true;
        isZoomingOut = false;
    } else if (event.key === 's') {
        isZoomingIn = false;
        isZoomingOut = true;
    } else if (event.keyCode === 13 && first === false) {
		document.querySelector('.loading-screen').style.display = 'none';
		started = true;

		audioLoader.load( './sounds/footsteps-on-wood-floor-14735.mp3', function( buffer ) {
			walking.setBuffer( buffer );
			walking.setLoop( true );
			walking.setVolume( 0.8 );
			walking.play();
		});
	
		audioLoader.load( './sounds/subway-passing-99262.mp3', function( buffer ) {
			train.setBuffer( buffer );
			train.setLoop( true );
			train.setVolume( 0.5 );
			train.play();
		});
	
		audioLoader.load( './sounds/eerie-ambience-6836.mp3', function( buffer ) {
			eerie.setBuffer( buffer );
			eerie.setLoop( true );
			eerie.setVolume( 0.25 );
			eerie.play();
		});
	}
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'w' || event.key === 's') {
        isZoomingIn = false;
        isZoomingOut = false;
    }
});


// Generates a box at the "end" of the train to build a budget-backdoor
function generateBackBox() {
	const bg = new THREE.BoxGeometry( 10, 10, 10 ); 
	const bm = new THREE.MeshBasicMaterial( {color: 0x2b2b2b} ); 
	const cube = new THREE.Mesh( bg, bm ); 
	cube.position.set(0, 0, models.length * modelOffset);
	scene.add( cube );
}

// Controll-Objects for the distortion of the object
const clock = new THREE.Clock();
let noise = openSimplexNoise.makeNoise4D(Date.now());

// For FPS measurement
let frames = 0;
let prevTime = performance.now();

// Limiting FPS
let delta = 0;
let interval = 1 / 90;

function animate() {
	requestAnimationFrame( animate );
	
	delta += clock.getDelta();

	if (delta > interval) {
		sphere.rotation.x += 0.003;
		sphere.rotation.z += 0.003;

		let elapsed = clock.getElapsedTime();

		for(let i = 0; i < geometry.positionData.length; i++) {
			const p = geometry.positionData[i];
			// Create noise for each point in the sphere
			let setNoise = noise(p.x, p.y, p.z, elapsed * 1.05);
			v3.copy(p).addScaledVector(p, setNoise);
			// Update the positions
			geometry.attributes.position.setXYZ(i, v3.x, v3.y, v3.z);
		}

		geometry.computeVertexNormals();
		geometry.attributes.position.needsUpdate = true;

		updateCamera();

		if (models.length) for(let i = 0; i < models.length; i++) {
			const model = models[i];
			if (Math.floor(model.position.z) > 2) { 
				model.position.setZ(modelOffset * models.length + model.position.z)
			} else {
				model.position.z += 0.02;
			};
		}


		// FPS counter
		frames ++;
		const time = performance.now();

		if ( time >= prevTime + 1000 ) {

			if (first) {
				first = false;
				document.querySelector('.lds-dual-ring').style.display = 'none';
				document.querySelector('.continue-container').style.opacity = '1';
			}
		
			console.log( Math.round( ( frames * 1000 ) / ( time - prevTime ) ) );
		
			frames = 0;
			prevTime = time;
		
		}

		renderer.render( scene, camera );

		delta = delta % interval;
	}

	// console.log(renderer.info.render.calls);
}

animate();
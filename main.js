import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
	canvas: document.querySelector('#canvas')
});

renderer.setSize( window.innerWidth, window.innerHeight );

camera.position.setZ(100);

// TEXTURE
const textureLoader = new THREE.TextureLoader();

const textureBaseColor = textureLoader.load('./texture-maps/metallic/Metal_006_basecolor.jpg');
const textureNormalMap = textureLoader.load('./texture-maps/metallic/Metal_006_normal.jpg');
const textureHeightMap = textureLoader.load('./texture-maps/metallic/Metal_006_height.png');
const textureRoughnessMap = textureLoader.load('./texture-maps/metallic/Metal_006_roughness.jpg');
const textureAmbientMap = textureLoader.load('./texture-maps/metallic/Metal_006_ambientOcclusion.jpg');
const textureMetallicMap = textureLoader.load('./texture-maps/metallic/Metal_006_metallic.jpg');


// MESH
const geometry = new THREE.TetrahedronGeometry(5, 2);
const material = new THREE.MeshStandardMaterial( {
	 map: textureBaseColor,
	 normalMap: textureNormalMap,
	 displacementMap: textureHeightMap,
	 displacementScale: 0.05,
	 roughnessMap: textureRoughnessMap,
	 roughness: 0.5,
	 aoMap: textureAmbientMap,
	 metalnessMap: textureMetallicMap,
	//  metalness: 1.0
	});
geometry.attributes.uv2 = geometry.attributes.uv;
const tetra = new THREE.Mesh( geometry, material );

scene.add( tetra );

// LIGHT
// const light = new THREE.PointLight(0xffffff, 300);
// light.position.set(20, 20, 20);

// const light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 0.5 );

const light = new THREE.DirectionalLight(0xffffff, 3);
light.target = tetra;
light.position.set(0, 10, 0);

scene.add(light);

const lightHelper = new THREE.DirectionalLightHelper(light, 5);
scene.add(lightHelper);

function animate() {
	requestAnimationFrame( animate );

	// camera.position.z -= 0.1;

	tetra.rotation.x += 0.01;
	tetra.rotation.y += 0.01;

	geometry.computeVertexNormals();
	geometry.attributes.position.needsUpdate = true;

	renderer.render( scene, camera );
}

animate();
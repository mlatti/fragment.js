import 'https://unpkg.com/html2canvas@1.0.0-rc.7/dist/html2canvas.js';
import * as THREE from 'https://unpkg.com/three@0.119.0/build/three.module.js';
import { ConvexBufferGeometry } from 'https://unpkg.com/three@0.119.0/examples/jsm/geometries/ConvexGeometry.js'
import { ConvexObjectBreaker } from 'https://unpkg.com/three@0.119.0/examples/jsm/misc/ConvexObjectBreaker.js'

// - Global variables -
var mainObject, mainObjectHeight, mainObjectWidth, mainCanvas;
var canvasImage;
html2canvas(document.querySelector("#capture")).then(canvas => {
	mainObjectHeight = canvas.style.height.split("px")[0]/100;
	mainObjectWidth = canvas.style.width.split("px")[0]/100;
	mainCanvas = canvas;
	Ammo().then( function ( AmmoLib ) {
		setTimeout(function(){
			Ammo = AmmoLib;

			init();
			animate();
		}, 100);

	} );
});
// Graphics variables
var container, captureContainer;
var shiftIsDown;
var camera, controls, scene, renderer;
var textureLoader;
var canvasTexture, preloadedMaterial;
var clock = new THREE.Clock();

var mouseCoords = new THREE.Vector2();
var raycaster = new THREE.Raycaster();
var ballMaterial = new THREE.MeshPhongMaterial( { color: 0x202020, transparent: true, opacity:0 } );

// Physics variables
var gravityConstant = 7.8;
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver;
var physicsWorld;
var margin = 0.05;

var convexBreaker = new ConvexObjectBreaker();

// Rigid bodies include all movable objects
var rigidBodies = [];

var pos = new THREE.Vector3();
var quat = new THREE.Quaternion();
var transformAux1;
var tempBtVec3_1;

var objectsToRemove = [];
for ( var i = 0; i < 500; i ++ ) {

	objectsToRemove[ i ] = null;

}
var numObjectsToRemove = 0;

var impactPoint = new THREE.Vector3();
var impactNormal = new THREE.Vector3();

// - Main code -




// - Functions -

function init() {
		initGraphics();

		initPhysics();

		createObjects();

		reSetCamera(camera, mainObject);

		initInput();
}

function initGraphics() {

	container = document.getElementById( 'container' );
	captureContainer = document.getElementById("capture");
	captureContainer.style.transition = "all 0.30s ease-in-out";
	captureContainer.style.boxShadow = "0 0 5px rgba(81, 203, 238, 0)";

	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 );

	scene = new THREE.Scene();

	camera.position.set( - 14, 8, 16 );

	renderer = new THREE.WebGLRenderer({alpha: true});
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( mainObjectWidth*100, mainObjectHeight*100  );
	renderer.setClearColor( 0x000000, 0 ); // the default
	renderer.shadowMap.enabled = true;
	container.appendChild( renderer.domElement );

	textureLoader = new THREE.TextureLoader();

	var ambientLight = new THREE.AmbientLight( 0x707070 );
	scene.add( ambientLight );

	var light = new THREE.DirectionalLight( 0xffffff, 1 );
	light.position.set( - 10, 18, 5 );
	light.castShadow = true;
	var d = 14;
	light.shadow.camera.left = - d;
	light.shadow.camera.right = d;
	light.shadow.camera.top = d;
	light.shadow.camera.bottom = - d;

	light.shadow.camera.near = 2;
	light.shadow.camera.far = 50;

	light.shadow.mapSize.x = 1024;
	light.shadow.mapSize.y = 1024;

	scene.add( light );

	/*stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild( stats.domElement );*/

	canvasTexture = new THREE.CanvasTexture(mainCanvas);
	console.log(mainCanvas)
	preloadedMaterial = new THREE.MeshBasicMaterial( {color:0xffffff, map:canvasTexture } );

	//

	window.addEventListener( 'resize', onWindowResize, false );

}

function initPhysics() {

	// Physics configuration

	collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
	dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
	broadphase = new Ammo.btDbvtBroadphase();
	solver = new Ammo.btSequentialImpulseConstraintSolver();
	physicsWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration );
	physicsWorld.setGravity( new Ammo.btVector3( 0, - gravityConstant, 0 ) );

	transformAux1 = new Ammo.btTransform();
	tempBtVec3_1 = new Ammo.btVector3( 0, 0, 0 );

}

function createObject( mass, halfExtents, pos, quat, material ) {
	var object = new THREE.Mesh( new THREE.BoxBufferGeometry( halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2 ), material );
	object.position.copy( pos );
	object.quaternion.copy( quat );
	object.geometry.computeBoundingBox();
	convexBreaker.prepareBreakableObject( object, mass, new THREE.Vector3(), new THREE.Vector3(), true );
	object = createDebrisFromBreakableObject( object );
	return object;

}

function createObjects() {

	// Ground
	pos.set( 0, - 0.5, 0 );
	quat.set( 0, 0, 0, 1 );
	var ground = createParalellepipedWithPhysics( 40, 1, 40, 0, pos, quat, new THREE.MeshPhongMaterial() );
	ground.receiveShadow = true;
	ground.material.transparent = true;
	ground.material.opacity = 0;
	ground.material.needsUpdate = true;

	// Tower 1
	var towerMass = 1000;
	var towerHalfExtents = new THREE.Vector3( mainObjectWidth/2, mainObjectHeight/2, mainObjectWidth/2 );
	pos.set( 0, mainObjectHeight/2+0.05, 0 );
	quat.set( 0, 0, 0, 1 );
	console.log(preloadedMaterial)
	mainObject = createObject( towerMass, towerHalfExtents, pos, quat, preloadedMaterial );
}

function createParalellepipedWithPhysics( sx, sy, sz, mass, pos, quat, material ) {

	var object = new THREE.Mesh( new THREE.BoxBufferGeometry( sx, sy, sz, 1, 1, 1 ), material );
	var shape = new Ammo.btBoxShape( new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
	shape.setMargin( margin );

	createRigidBody( object, shape, mass, pos, quat );

	return object;

}

function createDebrisFromBreakableObject( object ) {

	object.castShadow = true;
	object.receiveShadow = true;

	var shape = createConvexHullPhysicsShape( object.geometry.attributes.position.array );
	shape.setMargin( margin );

	var rigidObjects = createRigidBody( object, shape, object.userData.mass, null, null, object.userData.velocity, object.userData.angularVelocity );

	// Set pointer back to the three object only in the debris objects
	var btVecUserData = new Ammo.btVector3( 0, 0, 0 );
	btVecUserData.threeObject = object;
	rigidObjects.body.setUserPointer( btVecUserData );

	return rigidObjects.object

}

function removeDebris( object ) {

	scene.remove( object );

	physicsWorld.removeRigidBody( object.userData.physicsBody );

}

function createConvexHullPhysicsShape( coords ) {

	var shape = new Ammo.btConvexHullShape();

	for ( var i = 0, il = coords.length; i < il; i += 3 ) {

		tempBtVec3_1.setValue( coords[ i ], coords[ i + 1 ], coords[ i + 2 ] );
		var lastOne = ( i >= ( il - 3 ) );
		shape.addPoint( tempBtVec3_1, lastOne );

	}

	return shape;

}

function createRigidBody( object, physicsShape, mass, pos, quat, vel, angVel ) {

	if ( pos ) {

		object.position.copy( pos );

	} else {

		pos = object.position;

	}
	if ( quat ) {

		object.quaternion.copy( quat );

	} else {

		quat = object.quaternion;

	}

	var transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
	transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
	var motionState = new Ammo.btDefaultMotionState( transform );

	var localInertia = new Ammo.btVector3( 0, 0, 0 );
	physicsShape.calculateLocalInertia( mass, localInertia );

	var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
	var body = new Ammo.btRigidBody( rbInfo );

	body.setFriction( 0.5 );

	if ( vel ) {

		body.setLinearVelocity( new Ammo.btVector3( vel.x, vel.y, vel.z ) );

	}
	if ( angVel ) {

		body.setAngularVelocity( new Ammo.btVector3( angVel.x, angVel.y, angVel.z ) );

	}

	object.userData.physicsBody = body;
	object.userData.collided = false;

	scene.add( object );

	if ( mass > 0 ) {

		rigidBodies.push( object );

		// Disable deactivation
		body.setActivationState( 4 );

	}
	physicsWorld.addRigidBody( body );

	return {"body": body, "object": object};

}

function createRandomColor() {

	return Math.floor( Math.random() * ( 1 << 24 ) );

}

function createMaterial( color ) {

	color = color || createRandomColor();
	return new THREE.MeshPhongMaterial( { color: color} );

}

function initInput() {


	document.addEventListener( 'keydown', function ( event1 ) {
		console.log("shift pressed")
		captureContainer.style.boxShadow = "0 0 5px rgba(81, 203, 238, 1)";
  		if (event1.shiftKey) {
			captureContainer.addEventListener( 'mousedown', function ( event ) {
			mouseCoords.set(
				( event.clientX / window.innerWidth ) * 2 - 1,
				- ( event.clientY / window.innerHeight ) * 2 + 1
			);

			raycaster.setFromCamera( mouseCoords, camera );

			// Creates a ball and throws it
			var ballMass = 400;
			var ballRadius = 0.4;

			var ball = new THREE.Mesh( new THREE.SphereBufferGeometry( ballRadius, 14, 10 ), ballMaterial );
			ball.castShadow = true;
			ball.receiveShadow = true;
			var ballShape = new Ammo.btSphereShape( ballRadius );
			ballShape.setMargin( margin );
			pos.copy( raycaster.ray.direction );
			pos.add( raycaster.ray.origin );
			quat.set( 0, 0, 0, 1 );
			var ballBody = createRigidBody( ball, ballShape, ballMass, pos, quat ).body;

			pos.copy( raycaster.ray.direction );
			pos.multiplyScalar( 24 );
			ballBody.setLinearVelocity( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
		}, false );
  		}
	},false)
	document.addEventListener( 'keyup', function ( event1 ) {
		captureContainer.style.boxShadow = "0 0 15px rgba(81, 203, 238, 0)";
	},false)
}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

	requestAnimationFrame( animate );

	render();;

}

function render() {

	var deltaTime = clock.getDelta();

	updatePhysics( deltaTime );

	renderer.render( scene, camera );

}

function updatePhysics( deltaTime ) {

	// Step world
	physicsWorld.stepSimulation( deltaTime, 10 );

	// Update rigid bodies
	for ( var i = 0, il = rigidBodies.length; i < il; i ++ ) {

		var objThree = rigidBodies[ i ];
		var objPhys = objThree.userData.physicsBody;
		var ms = objPhys.getMotionState();

		if ( ms ) {

			ms.getWorldTransform( transformAux1 );
			var p = transformAux1.getOrigin();
			var q = transformAux1.getRotation();
			objThree.position.set( p.x(), p.y(), p.z() );
			objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );

			objThree.userData.collided = false;

		}

	}

	for ( var i = 0, il = dispatcher.getNumManifolds(); i < il; i ++ ) {

		var contactManifold = dispatcher.getManifoldByIndexInternal( i );
		var rb0 = Ammo.castObject( contactManifold.getBody0(), Ammo.btRigidBody );
		var rb1 = Ammo.castObject( contactManifold.getBody1(), Ammo.btRigidBody );

		var threeObject0 = Ammo.castObject( rb0.getUserPointer(), Ammo.btVector3 ).threeObject;
		var threeObject1 = Ammo.castObject( rb1.getUserPointer(), Ammo.btVector3 ).threeObject;

		if ( ! threeObject0 && ! threeObject1 ) {

			continue;

		}

		var userData0 = threeObject0 ? threeObject0.userData : null;
		var userData1 = threeObject1 ? threeObject1.userData : null;

		var breakable0 = userData0 ? userData0.breakable : false;
		var breakable1 = userData1 ? userData1.breakable : false;

		var collided0 = userData0 ? userData0.collided : false;
		var collided1 = userData1 ? userData1.collided : false;

		if ( ( ! breakable0 && ! breakable1 ) || ( collided0 && collided1 ) ) {

			continue;

		}

		var contact = false;
		var maxImpulse = 0;
		for ( var j = 0, jl = contactManifold.getNumContacts(); j < jl; j ++ ) {

			var contactPoint = contactManifold.getContactPoint( j );

			if ( contactPoint.getDistance() < 0 ) {

				contact = true;
				var impulse = contactPoint.getAppliedImpulse();

				if ( impulse > maxImpulse ) {

					maxImpulse = impulse;
					var pos = contactPoint.get_m_positionWorldOnB();
					var normal = contactPoint.get_m_normalWorldOnB();
					impactPoint.set( pos.x(), pos.y(), pos.z() );
					impactNormal.set( normal.x(), normal.y(), normal.z() );

				}

				break;

			}

		}

		// If no point has contact, abort
		if ( ! contact ) continue;

		// Subdivision

		var fractureImpulse = 250;
		container.style.opacity = 1;
		container.style.zIndex = 1;
		captureContainer.style.opacity = 0;

		if ( breakable0 && ! collided0 && maxImpulse > fractureImpulse ) {

			var debris = convexBreaker.subdivideByImpact( threeObject0, impactPoint, impactNormal, 1, 2, 1.5 );
			threeObject0.geometry.computeBoundingBox();

			var numObjects = debris.length;
			var allFaceUVs = [];	
			for ( var j = 0; j < numObjects; j ++ ) {
				var vel = rb0.getLinearVelocity();
				var angVel = rb0.getAngularVelocity();
				var fragment = debris[ j ];
				fragment.userData.velocity.set( vel.x(), vel.y(), vel.z() );
				fragment.userData.angularVelocity.set( angVel.x(), angVel.y(), angVel.z() );

				createDebrisFromBreakableObject( fragment );

				fragment.geometry  = new THREE.Geometry().fromBufferGeometry( fragment.geometry )
				fragment.material.map = canvasTexture;
				fragment.material.needsUpdate = true;
				fragment.material = preloadedMaterial;

				//fragment.material = [ new THREE.MeshBasicMaterial({color: "blue", transparent : true, opacity: 0.5}), fragment.material];
				for (var k = 0; k<fragment.geometry.faces.length;k++){
					var face = fragment.geometry.faces[k];
					var normalMatrix = new THREE.Matrix3().getNormalMatrix( fragment.matrixWorld );
					var normal = face.normal.clone().applyMatrix3( normalMatrix ).normalize();
					var a;
					var b;
					var c;
					if (normal.z == 1){
						//face.materialIndex = 0;
						var vector = fragment.geometry.vertices[face.b].clone();
						a = createTestBall(fragment.geometry.vertices[face.a], fragment.position, threeObject0.position, threeObject0.geometry.boundingBox);
						b = createTestBall(fragment.geometry.vertices[face.b], fragment.position, threeObject0.position, threeObject0.geometry.boundingBox);
						c = createTestBall(fragment.geometry.vertices[face.c], fragment.position, threeObject0.position, threeObject0.geometry.boundingBox);

						allFaceUVs.push(a);
						allFaceUVs.push(b);
						allFaceUVs.push(c);
						}else{
						a = {x:null, y:null}
						b = {x:null, y:null}
						c = {x:null, y:null}
						face.materialIndex = 1;
					}
			        fragment.geometry.faceVertexUvs[0].push([
			            new THREE.Vector2(a.x, a.y),
			            new THREE.Vector2(b.x, b.y),
			            new THREE.Vector2(c.x, c.y)
			        ]);							

				}

			}

			objectsToRemove[ numObjectsToRemove ++ ] = threeObject0;
			userData0.collided = true;

		}

	}

	for ( var i = 0; i < numObjectsToRemove; i ++ ) {

		removeDebris( objectsToRemove[ i ] );

	}
	numObjectsToRemove = 0;

}

function reSetCamera(camera, newObject){
	var height = mainObjectHeight;
	var dist = 10;
	var fov = 2 * Math.atan( height / ( 2 * dist ) ) * ( 180 / Math.PI );
	camera.fov = fov;
	camera.position.x = newObject.position.x
	camera.position.y = newObject.position.y
	camera.position.z = dist + (newObject.geometry.parameters.width/2);
	camera.lookAt(newObject.position);
	camera.aspect = mainObjectWidth / mainObjectHeight;
	camera.updateProjectionMatrix();
}
function assignUVs(geometry) {
    geometry.faceVertexUvs[0] = [];
    geometry.faces.forEach(function(face) {
        var components = ['x', 'y', 'z'].sort(function(a, b) {
            return Math.abs(face.normal[a]) > Math.abs(face.normal[b]);
        });

        var v1 = geometry.vertices[face.a];
        var v2 = geometry.vertices[face.b];
        var v3 = geometry.vertices[face.c];

        geometry.faceVertexUvs[0].push([
            new THREE.Vector2(0, 1),
            new THREE.Vector2(1, 0),
            new THREE.Vector2(1, 1)
        ]);

    });
    geometry.uvsNeedUpdate = true;
}
function createTestBall(position, fragmentPosition, intactObjectPositon, parentBoundingBox){
	var ball = new THREE.Mesh(new THREE.SphereBufferGeometry(0.1), new THREE.MeshBasicMaterial({color: "blue", transparent : true, opacity: 0.5}))
	ball.position.x = (position.x + fragmentPosition.x- intactObjectPositon.x-parentBoundingBox.min.x)/parentBoundingBox.max.x/2;
	ball.position.y = (position.y + fragmentPosition.y- intactObjectPositon.y-parentBoundingBox.min.y)/parentBoundingBox.max.y/2;
	ball.position.z = position.z + fragmentPosition.z- intactObjectPositon.z;
	return {x:ball.position.x, y:ball.position.y}
}

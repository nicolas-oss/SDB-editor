import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import * as CameraUtils from 'three/addons/utils/CameraUtils.js';
import { ScreenNode } from 'three/src/nodes/display/BlendModeNode.js';
import { mx_bilerp_0 } from 'three/src/nodes/materialx/lib/mx_noise.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

class configurationClass {
  constructor () {
    this.style = "style 1";
    meubles
  }
}

class blocClass {
  constructor () {
    this.largeur = 40;
    this.etageres = 3;
    this.type="Tiroirs";
    this.ouverturePorte="gauche";
    this.nombrePortes="1";
  }
}

class meubleClass {
  constructor (num) {
    this.name = "Meuble "+(num+1);
    this.id = num;
    this.hauteur = 50;
    this.largeur = 140;
    this.profondeur = 50;
    this.nbBlocs = 3;
    this.x = 0;
    this.y = 0;
    this.bloc = new Array;
    this.numero = num;
    for (var i=0; i<this.nbBlocs; i++) {this.bloc[i] = new blocClass()}
    this.calculLargeur();
  }

  calculLargeur () {
    this.largeur = this.calculSommeLargeurBlocs();
  }

  calculSommeLargeurBlocs () {
    var largeurTemp = 0;
    for (var i=0; i<this.nbBlocs; i++) {
      largeurTemp += this.bloc[i].largeur;
    }
    return(largeurTemp)
  }

  getMinX () {
    return (this.x-this.largeur/2);
  }

  getMaxX () {
    return (this.x+this.largeur/2);
  }

  getMaxY () {
    return (this.y+this.hauteur);
  }
}

var style="flat";

var indiceCurrentBloc = 0;
var indiceCurrentMeuble = 0;

const epaisseur = 1;
const maxBlocs = 9;
const maxEtageres = 20;
const cubeVisible = true;
const epsilon = 5;
const taillePoignees = 1.5;
const focale=60;
var focaleV;
var meubleRoot=[];  //Racine 3D de chaque meuble
var plancheBas;
var plancheHaut;
var plancheGauche;
var plancheDroite;
var poignee;
var geometry;
var cube;
var blocRoot=[];    //Racine 3D de chaque bloc
var etagere=[];
var meubles=new Array;
var boite=[];       //pour selection des blocs dans la vue 3D
var selectableBloc=[];  //liste des boites selectionnables par raycast
var selectableMeuble=[];
var raycastedBloc=-1;
var raycastedMeuble=-1;

//raycaster
let raycaster;
let IntersectedBloc;
let IntersectedMeuble;
const pointer = new THREE.Vector2();
pointer.x=-1;
pointer.y=-1;
const radius = 5;

const scene = new THREE.Scene();
var canvas = document.getElementById("canvas");
var canvasSize = canvas.getBoundingClientRect();
console.log (canvasSize);
const camera = new THREE.PerspectiveCamera( focale, canvasSize.width/window.innerHeight, 0.1, 1000 );
focaleV=getfocaleV(focale,canvasSize.width,window.innerHeight);
console.log("focaleV deg = ",focaleV/0.0174533);
var cameraTarget = new THREE.Object3D();
camera.position.z = 180; //overridden by orbit
camera.position.y = 100;
var boundingBoxCenter = new THREE.Vector3();
var boundingBoxHeight, boundingBoxWidth;

raycaster = new THREE.Raycaster();
canvas.addEventListener( 'mousemove', onPointerMove );
window.addEventListener( 'resize', onWindowResize );
canvas.addEventListener('click',onCanvasClick);

const renderer = new THREE.WebGLRenderer({antialias : true});
//renderer.setPixelRatio(2);
renderer.setSize( canvasSize.width, window.innerHeight);
canvas.appendChild( renderer.domElement );

// controls
let controls = new OrbitControls(camera, renderer.domElement);
controls.listenToKeyEvents(window); // optional
//controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 0.1;
controls.maxDistance = 1000;
controls.maxPolarAngle = Math.PI / 2;

function getfocaleV(focale,width,height) {
  if ((height/width)>1) return focale
  else return (2*(height/2)/((width/2)/Math.tan(0.0174533*(focale/2))));
}

function getfocaleH(focale,width,height) {
  return (2*(height/2)/((width/2)/Math.tan(0.0174533*(focale/2))));
}

function onWindowResize() {
  canvasSize = canvas.getBoundingClientRect();
  let width = canvas.offsetWidth;
  let height = window.innerHeight;
  camera.aspect = width  / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  focaleV=getfocaleV(focale,width,height);
  //ok
  console.log("focaleV deg = ",focaleV/0.0174533);
}

//calcul de la position du pointeur da la souris dans le canvas THREE
function onPointerMove( event ) {   
  canvasSize = canvas.getBoundingClientRect();
  let x = event.clientX - canvasSize.left; 
  let y = event.clientY - canvasSize.top;
  pointer.x = ( x / canvasSize.width ) * 2 - 1;
  pointer.y = - ( y / window.innerHeight ) * 2 + 1;
}

//Materials
const materialParams = {
  color: '#ffaa00',
  refractionRatio: 0.98,
  transparent: false,
  opacity: 1
};

const materialTiroirsParams = {
  color: '#ffffff',
  refractionRatio: 0.98,
  transparent: false,
  opacity: 1
};

const materialPoigneesParams = {
  color: '#101010',
  refractionRatio: 0.98,
  transparent: false,
  opacity: 1
};

const materialSelectionBlocParams = {
  color: '#00ffff',
  refractionRatio: 0.98,
  transparent: true,
  opacity: 0.5
};

const materialSelectionMeubleParams = {
  color: '#00ff00',
  refractionRatio: 0.98,
  transparent: true,
  opacity: 0.5
};

const material = new THREE.MeshPhongMaterial( materialParams);
const materialTiroirs = new THREE.MeshPhongMaterial( materialTiroirsParams);
const materialPoignees = new THREE.MeshPhongMaterial( materialPoigneesParams);
const materialSelectionBloc = new THREE.MeshPhongMaterial( materialSelectionBlocParams);
const materialSelectionMeuble = new THREE.MeshPhongMaterial( materialSelectionMeubleParams);
const wireframeMaterial = new THREE.MeshBasicMaterial( 0x00ff00 );
wireframeMaterial.wireframe = true;

//Lights
const lightA = new THREE.PointLight( 0xffffff, 120, 0, 1 );
lightA.position.set( -10, 100, 80 );
renderer.setClearColor( 0xAAAAAA, 1 );
scene.add( lightA );
const lightB = new THREE.PointLight( 0xddeeff, 80, 0, 1 );
lightB.position.set( 80, 100, 80 );
renderer.setClearColor( 0xAAAAAA, 1 );
scene.add( lightB );
const lightC = new THREE.PointLight( 0xddeeff, 80, 0, 1 );
lightB.position.set( -100, 100, 80 );
renderer.setClearColor( 0xAAAAAA, 1 );
scene.add( lightC );
const ambientLight = new THREE.AmbientLight( 0x404020,2 ); // soft white light
scene.add( ambientLight );

function checkRaycast() {
  raycaster.setFromCamera(pointer, camera, 0, 1000);
  //check intersect with blocs
  const intersects = raycaster.intersectObjects(selectableBloc, true);
  if (intersects.length > 0) {
    if (IntersectedBloc != intersects[0].object) {
      if (IntersectedBloc) IntersectedBloc.visible = false;
      IntersectedBloc = intersects[0].object;
      IntersectedBloc.visible = true;
      raycastedBloc = intersects[0].object.numero;
    }
  }
  else {
    if (IntersectedBloc) IntersectedBloc.visible = false;
    IntersectedBloc = null;
    raycastedBloc = -1;
  }
  //check intersect with meubles
  const intersectsMeuble = raycaster.intersectObjects(selectableMeuble, true);
  if (intersectsMeuble.length > 0  && intersectsMeuble[0].object.numero!=indiceCurrentMeuble) {
    if (IntersectedMeuble != intersectsMeuble[0].object) {
      if (IntersectedMeuble) IntersectedMeuble.visible = false;
      IntersectedMeuble = intersectsMeuble[0].object;
      IntersectedMeuble.visible = true;
      raycastedMeuble = intersectsMeuble[0].object.numero;
    }
  }
  else {
    if (IntersectedMeuble) IntersectedMeuble.visible = false;
    IntersectedMeuble = null;
    raycastedMeuble = -1;
  }
}

//raycast sur les objets 3d lors d'un changement de souris ou de camera
function onCanvasClick () {
  console.log("click");
  if (raycastedBloc>-1) changeCurrentBlocFromClick(raycastedBloc);
  if (raycastedMeuble>-1) changeCurrentMeubleFromClick(raycastedMeuble);
}

function listenToRaycast() {
  controls.addEventListener('change', checkRaycast);
  canvas.addEventListener('mouseout', clearRaycast);
}

function initializeRaycast() {
  canvas.addEventListener('mouseenter', listenToRaycast);
  canvas.addEventListener('mousemove', checkRaycast);
}

function clearRaycast() {
  controls.removeEventListener('change',checkRaycast);
  if (IntersectedBloc!=null) {IntersectedBloc.visible = false; IntersectedBloc = null;}
  if (IntersectedMeuble!=null) {IntersectedMeuble.visible = false; IntersectedMeuble = null;}
}

function getBoundingBoxCenter () {
  let l = meubles.length;
  let center = new THREE.Vector3();
  if (l==1) {
    center.x=meubles[0].x;
    center.y=(meubles[0].y+meubles[0].hauteur)/2;
    center.z=meubles[0].profondeur;
    boundingBoxWidth = meubles[0].largeur;
    boundingBoxHeight = meubles[0].hauteur;
    return (center);
  }
  else {
    var xMin=meubles[0].getMinX();
    var xMax=meubles[0].getMaxX();
    var yMax=meubles[0].getMaxY();
    var zMax=meubles[0].profondeur;
    let xm,xM,yM,zM;
    for (var i=1;i<meubles.length;i++) {
      xm=meubles[i].getMinX();
      xM=meubles[i].getMaxX();
      yM=meubles[i].getMaxY();
      zM=meubles[i].profondeur;
      xMin = (xMin<xm) ? xMin : xm;
      xMax = (xMax>xM) ? xMax : xM;
      yMax = (yMax>yM) ? yMax : yM;
      zMax = (zMax>zM) ? zMax : zM;
    }
    center.x=(xMax+xMin)/2;
    center.y=(yMax/2);
    center.z=zMax;
    boundingBoxWidth = xMax-xMin;
    boundingBoxHeight = yMax;
    return (center);
  }
  
}

function animate() {
  controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
  let distL = ((boundingBoxWidth/2)/Math.tan(0.0174533*(focale/2)));
  let distH = ((boundingBoxHeight/2)/Math.tan((focaleV/2)));
  let dist = Math.max(distL,distH);
  //camera.translateZ((dist-(controls.getDistance(cameraTarget)))/100);
  camera.updateMatrixWorld();
  renderer.render( scene, camera );
  
  var delta = clock.getDelta();
  
  if ( mixerMaterial ) {
  //console.log("anim mat");
    mixerMaterial.update( delta );
    //console.log("clock delta = ",delta);
    //console.log("material opacity = ",materialSelectionMeubleAnim.opacity);
  }
}

function updateCube (indiceMeuble) {
  if (cube) meubleRoot[indiceMeuble].remove(cube);
  scene.remove(cube);
  let delta = 0.1*indiceMeuble;
  //if (cubeVisible) {geometry = new THREE.BoxGeometry( meubles[indiceMeuble].largeur+delta, meubles[indiceMeuble].hauteur+delta, meubles[indiceMeuble].profondeur+delta );
  if (cubeVisible) {geometry = RoundEdgedBox( meubles[indiceMeuble].largeur+delta, meubles[indiceMeuble].hauteur+delta, meubles[indiceMeuble].profondeur+delta , 1 , 2,2,2,2);
  cube = new THREE.Mesh( geometry, materialSelectionMeuble );
  scene.add( cube );}
}

function placeMeuble (indiceMeuble) {
  meubleRoot[indiceMeuble].position.set(meubles[indiceMeuble].x,meubles[indiceMeuble].hauteur/2+meubles[indiceMeuble].y,meubles[indiceMeuble].profondeur/2);
}

function updateSelectableBlocs(indiceMeuble) {
  selectableBloc = [];
  for (var i = 0; i < meubles[indiceMeuble].nbBlocs; i++) {
    let root = meubleRoot[indiceMeuble].children[0].children[i];
    //console.log(root);
    for (var j = 0; j < root.children.length; j++) {
      //console.log(j);
      if (root.children[j].name == ("BoiteSelectionBloc" + i)) {
        selectableBloc.push(root.children[j]);
        //console.log(root.children[j]);
      }
    }
  }
}

function updateMeuble (indiceMeuble) {
  selectableBloc=[];
  meubleRoot[indiceMeuble].children[0].children=[];
  for (var i=0; i<meubles[indiceMeuble].nbBlocs; i++) {
    updateBloc(indiceMeuble,i);
    meubleRoot[indiceMeuble].children[0].add(blocRoot[i]); //children 0 = blocs
  }
if (meubleRoot[indiceMeuble].children[1])                  //children 1 = cubes de selection
    {
      meubleRoot[indiceMeuble].remove(cube);
      delete selectableMeuble[indiceMeuble];
    }
    let delta = 0.1*indiceMeuble;
    //geometry = new THREE.BoxGeometry(meubles[indiceMeuble].largeur + epsilon + delta, meubles[indiceMeuble].hauteur + epsilon + delta, meubles[indiceMeuble].profondeur + epsilon + delta);
    geometry = RoundEdgedBox( meubles[indiceMeuble].largeur+delta+ epsilon, meubles[indiceMeuble].hauteur+delta+ epsilon, meubles[indiceMeuble].profondeur+delta+ epsilon , 3 , 2,2,2,2)
    cube = new THREE.Mesh(geometry, materialSelectionMeuble);
    cube.numero=indiceMeuble;
    cube.name="cube"+indiceMeuble;
    console.log("cube.numero = ",cube.numero);
    cube.visible=false;
    //meubleRoot[indiceMeuble].add(cube);
  meubleRoot[indiceMeuble].add(cube);
  selectableMeuble[indiceMeuble]=cube;
  placeMeuble(indiceMeuble);
}

function changeBlocsQuantity (indiceMeuble) {
  for (var i=0; i<maxBlocs; i++) {
    if (((typeof meubles[indiceMeuble].bloc[i]))=="undefined") {meubles[indiceMeuble].bloc[i] = new blocClass()}
     else {if (i>(meubles[indiceMeuble].nbBlocs-1)) {destroyBloc(indiceMeuble,i)}}
  }
  if (indiceCurrentBloc>(meubles[indiceMeuble].nbBlocs-1)) {indiceCurrentBloc=meubles[indiceMeuble].nbBlocs-1;}
}

function updateCamera () {
  console.log(controls.getDistance(cube));
}

function frameCamera () {
  //return;
  boundingBoxCenter = getBoundingBoxCenter();
  controls.target = boundingBoxCenter;
  cameraTarget.position.set(boundingBoxCenter);
  console.log("boudingbox = ",boundingBoxCenter);
  console.log("bB width, Height = ",boundingBoxWidth,boundingBoxHeight);
}

function updateScene () {
  //check blocs validity
  //meubles[indiceCurrentMeuble].calculLargeur();
  //updateCube(indiceCurrentMeuble);
  //console.log(meubles[indiceCurrentMeuble]);
  updateMeuble(indiceCurrentMeuble);
  //updateCamera(Meubles[indiceCurrentMeuble]);
}

//Interface
var body;
var interfaceDiv;
var meubleDiv;
var divPortes;
var divNombrePortes;
var divOuverturePortes;
var buttonNewMeuble;
var buttonDeleteMeuble;
var listMeublesHTML;
var listMeublesPopup;
var listMeublesName;
var blocsDiv;
var listBlocs;
var listBlocsPopup;
var listBlocsName;
var listPoigneesPopup;
var listPoigneesName;
var meubleSliders;
var blocsSliders;
var large;
var styleMenu;

function buildEnvironnement () {
  geometry = new THREE.PlaneGeometry( 1000, 1000 );
  const materialSol = new THREE.MeshPhongMaterial( {color: 0xffffff} );
  const plane = new THREE.Mesh( geometry, materialSol );
  plane.rotateX(-Math.PI/2);
  plane.name = "sol";
  scene.add( plane );
  const murFond = new THREE.Mesh( geometry, materialSol );
  murFond.name = "murFond"
  scene.add( murFond );
  const murDroit = new THREE.Mesh( geometry, materialSol );
  murDroit.translateX(500);
  murDroit.rotateY(-Math.PI/2);
  murDroit.name="murDroit";
  scene.add( murDroit );
  const murGauche = new THREE.Mesh( geometry, materialSol );
  murGauche.translateX(-500);
  murGauche.rotateY(Math.PI/2);
  murGauche.name="murGauche";
  scene.add( murGauche );
}

function initializeScene() {
    buildEnvironnement ();
    initializeInterface();
    initializeListePoignees();
    initializeRaycast();
    initializePoignees();
    createNewMeuble();
    createInterfaceMeuble(indiceCurrentMeuble);
    updateInterfaceBlocs(indiceCurrentMeuble);
    frameCamera();
    renderer.setAnimationLoop( animate );
}

function initializeInterface() {
  body=document.getElementById("body");
  interfaceDiv = document.getElementById("interface");
  meubleDiv = document.getElementById("meuble");
  buttonNewMeuble = document.getElementById("buttonNewMeuble");
  buttonDeleteMeuble = document.getElementById("buttonDeleteMeuble");
  listMeublesHTML = document.getElementById("listMeubles");
  listMeublesPopup = document.getElementById("listMeublesPopup");
  blocsDiv = document.getElementById("blocs");
  listBlocs = document.getElementById("listBlocs");
  listBlocsPopup = document.getElementById("listBlocsPopup");
  meubleSliders = document.getElementById("meubleSliders");
  blocsSliders = document.getElementById("blocsSliders");
  listPoigneesPopup = document.getElementById("listPoigneesPopup");
  listPoigneesName = document.getElementById("listPoigneesName");
  styleMenu = document.getElementById("style");
  styleMenu.addEventListener("change",function changeStyle(event) {style = event.target.value; updateScene(); console.log(style)},true);
}

const poigneesFileList = new Map;
poigneesFileList.set("Poignee type 1","src/furniture_handle_1.glb");
poigneesFileList.set("Tulip Country","src/furniture_handle_2.glb");
poigneesFileList.set("Poignee type 3","src/furniture_handle_3.gltf");
poigneesFileList.set("Tulip Virella","src/furniture_handle_4.glb");
poigneesFileList.set("Square","src/furniture_handle_6.glb");

var poigneeRoot;
var poigneeTemp;
var poigneeGroup=new THREE.Group();

function changePoignee(name) {
  console.log(name);
  const loader = new GLTFLoader();
  poigneeGroup = new THREE.Group(); // revoir init
  loader.load(poigneesFileList.get(name), function (gltf) {
    let poigneeRoot = gltf.scene.getObjectByName('poignee');
    scene.add(poigneeRoot);
    console.log("poigneRoot = ", poigneeRoot);
    for (var i = poigneeRoot.children.length; i > 0; i--) {
      poigneeGroup.add(poigneeRoot.children[i - 1]);
    }
    console.log("poigneeGroup=", poigneeGroup);
    scene.add(poigneeGroup);
    poigneeGroup.scale.set(100, 100, 100);
    updateMeuble(indiceCurrentMeuble);
    listPoigneesName.value = name;
    refreshListPoigneesPopup();
  });
}

function refreshListPoigneesPopup() {
  listPoigneesPopup.remove();
  listPoigneesPopup = document.createElement("input");
  listPoigneesPopup.type = "text";
  listPoigneesPopup.setAttribute("list","listPoignees");
  listPoigneesPopup.id = "listPoigneesPopup";
  listPoigneesPopup.classList.add("popup");
  aspect.append(listPoigneesPopup);
  aspect.insertBefore(listPoigneesName,listPoigneesPopup);
  listPoigneesPopup.addEventListener("change",function eventChangePoignee(event) {changePoignee(event.target.value)},false);
}

function initializeListePoignees() {
  let listPoignees = document.getElementById("listPoignees");
  for (const [key,value] of poigneesFileList) {
    let o = document.createElement("option");
    o.value = key;
    listPoignees.append(o);
  }
  listPoigneesPopup.addEventListener("change",function eventChangePoignee(event) {changePoignee(event.target.value)},false);
}

function initializePoignees() {
  geometry = new THREE.SphereGeometry(taillePoignees,12,8);
  poignee = new THREE.Mesh( geometry, materialPoignees );
  poigneeGroup.add(poignee);
}

function recomputeMeublesId() {
  for (var i=0; i<meubles.length; i++)
  {
    meubles[i].id=i;
    selectableMeuble[i].numero=i;
  }
}

function deleteMeuble(num) {
  meubles.splice(num,1);
  console.log("meubles = ",meubles);
  scene.remove(meubleRoot[num]);
  selectableMeuble.splice(num,1);
  meubleRoot.splice(num,1);
  geometry.dispose();
  material.dispose();
  if (meubles.length < (indiceCurrentMeuble+1)) indiceCurrentMeuble-=1;
  console.log("new current meuble = ",indiceCurrentMeuble );
}

function createNewMeuble() {
  //console.log("create meuble");
  indiceCurrentMeuble=meubles.length;
  meubles[indiceCurrentMeuble] = new meubleClass(indiceCurrentMeuble);
  meubleRoot[indiceCurrentMeuble] = new THREE.Object3D();
  meubleRoot[indiceCurrentMeuble].name = "meuble "+indiceCurrentMeuble;
  meubleRoot[indiceCurrentMeuble].position.set(0,0,0);
  let blocs = new THREE.Object3D();
  blocs.name="blocs";
  meubleRoot[indiceCurrentMeuble].add(blocs);
  if (indiceCurrentMeuble>0) {
    let positionY=meubles[indiceCurrentMeuble-1].y+meubles[indiceCurrentMeuble-1].hauteur;
    meubles[indiceCurrentMeuble].y=positionY;
  }
  updateMeuble(indiceCurrentMeuble);
  scene.add(meubleRoot[indiceCurrentMeuble]);
  frameCamera();
}

function initializeMeuble(indiceMeuble) {
  meubles[indiceMeuble] = new meubleClass(indiceMeuble);
  meubleRoot[indiceMeuble] = new THREE.Object3D();
  meubleRoot[indiceMeuble].position.set(0,0,0);
}

function destroyBloc(indiceMeuble, numBloc) {
    meubleRoot[indiceMeuble].children[0].remove(blocRoot[numBloc]);
    geometry.dispose();
    material.dispose();
    blocRoot[numBloc]=undefined;
    scene.remove( blocRoot[numBloc] );
}

function getElementBase (x,y,z,styleParam) {
  let geo = new THREE.BufferGeometry;
  console.log(styleParam);
  if (styleParam == "rounded") {geo = RoundEdgedBox(x,y,z,0.5,1,1,1,1);console.log("la")}
  else {geo = new THREE.BoxGeometry( x,y,z );console.log("ici")}
  //if (styleParam = "flat") 
  
  return geo;
}

function initializeBloc(indiceMeuble, numBloc) {
  let meuble = meubles[indiceMeuble];
  blocRoot[numBloc] = new THREE.Object3D();
  blocRoot[numBloc].name = "Bloc "+numBloc;
  //cadre
  geometry = new THREE.BoxGeometry( meuble.bloc[numBloc].largeur, epaisseur, meuble.profondeur );
  plancheBas = new THREE.Mesh( geometry, material );
  plancheBas.name = "plancheBas";
  plancheHaut = new THREE.Mesh( geometry, material );
  plancheHaut.name = "plancheHaut";
  plancheBas.position.set(0,-meuble.hauteur/2+epaisseur/2,0);
  plancheHaut.position.set(0,meuble.hauteur/2-epaisseur/2,0);
  geometry = new THREE.BoxGeometry( epaisseur, meuble.hauteur-epaisseur*2, meuble.profondeur );
  plancheDroite = new THREE.Mesh( geometry, material );
  plancheDroite.name = "plancheDroite";
  plancheGauche = new THREE.Mesh( geometry, material );
  plancheGauche.name = "plancheGauche";
  plancheDroite.position.set(-meuble.bloc[numBloc].largeur/2 + epaisseur/2,0,0);
  plancheGauche.position.set(meuble.bloc[numBloc].largeur/2 - epaisseur/2,0,0);
  blocRoot[numBloc].add(plancheBas,plancheHaut,plancheDroite,plancheGauche);
  //boîte de sélection
  //geometry = new THREE.BoxGeometry( meuble.bloc[numBloc].largeur+epsilon, meuble.hauteur+epsilon, meuble.profondeur+epsilon );
  geometry = RoundEdgedBox(meuble.bloc[numBloc].largeur+epsilon, meuble.hauteur+epsilon, meuble.profondeur+epsilon,2,1,1,1,1);
  //geometry = getElementBase(meuble.bloc[numBloc].largeur+epsilon, meuble.hauteur+epsilon, meuble.profondeur+epsilon,style);
  boite[numBloc] = new THREE.Mesh( geometry, materialSelectionBloc );
  boite[numBloc].name = "BoiteSelectionBloc"+numBloc;
  blocRoot[numBloc].add(boite[numBloc]);
  selectableBloc.push(boite[numBloc]);
  boite[numBloc].visible=false;
  boite[numBloc].numero=numBloc;
 
  //portes
  if (meuble.bloc[numBloc].type == "Portes") {
    if (meuble.bloc[numBloc].nombrePortes == "1") {
      geometry = getElementBase(meuble.bloc[numBloc].largeur - 0.25 * epaisseur, meuble.hauteur-0.25*epaisseur, epaisseur,style);

      etagere[0] = new THREE.Mesh(geometry, materialTiroirs);
      etagere[0].name = "porte 0";
      //poignee
      let poigneeB = poigneeGroup.clone(true);
      
      poigneeB.name="poignee";
      etagere[0].add(poigneeB);
      let deltaX=meuble.bloc[numBloc].largeur/2 - 4*taillePoignees;
      if (deltaX<0) deltaX=0;
      if (meuble.bloc[numBloc].ouverturePorte=="droite") {deltaX*=-1; poigneeB.rotateZ(Math.PI/2);}
      else poigneeB.rotateZ(-Math.PI/2);  // a soumettre à option
      poigneeB.position.set(deltaX,0,epaisseur);
      etagere[0].position.set(0,0,meuble.profondeur/2);
      blocRoot[numBloc].add(etagere[0]);
    }
    else {
      //porte gauche
      geometry = getElementBase(meuble.bloc[numBloc].largeur/2 - 0.25 * epaisseur, meuble.hauteur-0.25*epaisseur, epaisseur,style);
      etagere[0] = new THREE.Mesh(geometry, materialTiroirs);
      etagere[0].name = "porte 0";
      //poignee gauche
      let poigneeB = poigneeGroup.clone(true);
      poigneeB.rotateZ(-Math.PI/2);  // a soumettre à option
      poigneeB.name="poignee";
      etagere[0].add(poigneeB);
      let deltaX=meuble.bloc[numBloc].largeur/4 - 4*taillePoignees;
      if (4*taillePoignees>meuble.bloc[numBloc].largeur/4) deltaX=0;
      poigneeB.position.set(deltaX,0,epaisseur);
      etagere[0].position.set(-meuble.bloc[numBloc].largeur/4,0,meuble.profondeur/2);
      blocRoot[numBloc].add(etagere[0]);

      //porte droite
      etagere[1] = new THREE.Mesh(geometry, materialTiroirs);
      etagere[1].name = "porte 1";
      //poignee droite
      let poigneeC = poigneeGroup.clone(true);
      poigneeC.rotateZ(Math.PI/2);  // a soumettre à option
      etagere[1].add(poigneeC);
      deltaX*=-1
      poigneeC.position.set(deltaX,0,epaisseur);
      poigneeC.name="poignee";
      etagere[1].position.set(meuble.bloc[numBloc].largeur/4,0,meuble.profondeur/2);
      blocRoot[numBloc].add(etagere[1]);
    }
  }
  
  //etageres
  if (meuble.bloc[numBloc].type == "Etageres") {
    var step = (meuble.hauteur-2*epaisseur)/(meuble.bloc[numBloc].etageres+1);
    for (var i = 0; i < meuble.bloc[numBloc].etageres; i++) {
      //geometry = getElementBase(meuble.bloc[numBloc].largeur - 2 * epaisseur, epaisseur, meuble.profondeur - epaisseur,style);
      geometry = new THREE.BoxGeometry(meuble.bloc[numBloc].largeur - 2 * epaisseur, epaisseur, meuble.profondeur - epaisseur);
      etagere[i] = new THREE.Mesh(geometry, material);
      etagere[i].name = "etagere "+i;
      var position = step * (0.5 + i - meuble.bloc[numBloc].etageres / 2);
      etagere[i].position.set(0, position, 0);
      blocRoot[numBloc].add(etagere[i]);
    }
  }

  //tiroirs
  if (meuble.bloc[numBloc].type == "Tiroirs") {
    var step = (meuble.hauteur-0.25*epaisseur)/(meuble.bloc[numBloc].etageres+1);
    for (var i = 0; i < meuble.bloc[numBloc].etageres+1; i++) {
      let xl = meuble.bloc[numBloc].largeur - 0.25 * epaisseur;
      let yl = (meuble.hauteur - epaisseur)/(meuble.bloc[numBloc].etageres+1);//-epaisseur/4;
      let zl = epaisseur;
      //geometry = new THREE.BoxGeometry(xl, yl, zl);
      geometry = getElementBase(xl,yl,zl,style);
      //console.log(geometry);
      etagere[i] = new THREE.Mesh(geometry, materialTiroirs);
      etagere[i].name = "tiroir "+i;
      //poignees
      let poigneeB = poigneeGroup.clone(true);
      poigneeB.name="poignee";
      etagere[i].add(poigneeB);
      poigneeB.position.set(0,0,epaisseur);//epaisseur+taillePoignees);
      var positionY = step * (i - meuble.bloc[numBloc].etageres / 2);
      var positionZ = meuble.profondeur/2;
      etagere[i].position.set(0, positionY, positionZ);
      blocRoot[numBloc].add(etagere[i]);
    }
  }
 
  //positionnement bloc dans meuble
  var blocPosition = -meuble.largeur/2;
  if (numBloc > 0) {
    for (var i = 0; i < numBloc; i++) {
      blocPosition += meuble.bloc[i].largeur;
    }
  }
  blocPosition += meuble.bloc[numBloc].largeur/2;
  blocRoot[numBloc].position.set(blocPosition,0,0);
}

function updateBloc (indiceMeuble, numBloc) {
  initializeBloc(indiceMeuble, numBloc);
}

function RoundEdgedBox(width, height, depth, radius, widthSegments, heightSegments, depthSegments, smoothness) {

  depth<smoothness ? smoothness : depth;
  console.log ('depth = ',depth);
  width = width || 1;
  height = height || 1;
  depth = depth || 1;
  radius = radius || (Math.min(Math.min(width, height), depth) * .25);
  widthSegments = Math.floor(widthSegments) || 1;
  heightSegments = Math.floor(heightSegments) || 1;
  depthSegments = Math.floor(depthSegments) || 1;
  smoothness = Math.max(3, Math.floor(smoothness) || 3);

  let halfWidth = width * .5 - radius;
  let halfHeight = height * .5 - radius;
  let halfDepth = depth * .5 - radius;

  var geometryRound = new THREE.BufferGeometry();

  // corners - 4 eighths of a sphere
  var corner1 = new THREE.SphereGeometry(radius, smoothness, smoothness, 0, Math.PI * .5, 0, Math.PI * .5);
  corner1.translate(-halfWidth, halfHeight, halfDepth);
  var corner2 = new THREE.SphereGeometry(radius, smoothness, smoothness, Math.PI * .5, Math.PI * .5, 0, Math.PI * .5);
  corner2.translate(halfWidth, halfHeight, halfDepth);
  var corner3 = new THREE.SphereGeometry(radius, smoothness, smoothness, 0, Math.PI * .5, Math.PI * .5, Math.PI * .5);
  corner3.translate(-halfWidth, -halfHeight, halfDepth);
  var corner4 = new THREE.SphereGeometry(radius, smoothness, smoothness, Math.PI * .5, Math.PI * .5, Math.PI * .5, Math.PI * .5);
  corner4.translate(halfWidth, -halfHeight, halfDepth);
  
  let geometries = [];
  let corners = [];
  corners.push(corner1,corner2,corner3,corner4);
  
  let cornerMerged = BufferGeometryUtils.mergeGeometries(corners);
  geometries.push(cornerMerged);

  // edges - 2 fourths for each dimension
  // width
  var edge = new THREE.CylinderGeometry(radius, radius, width - radius * 2, smoothness, widthSegments, true, 0, Math.PI * .5);
  edge.rotateZ(Math.PI * .5);
  edge.translate(0, halfHeight, halfDepth);
  var edge2 = new THREE.CylinderGeometry(radius, radius, width - radius * 2, smoothness, widthSegments, true, Math.PI * 1.5, Math.PI * .5);
  edge2.rotateZ(Math.PI * .5);
  edge2.translate(0, -halfHeight, halfDepth);

  // height
  var edge3 = new THREE.CylinderGeometry(radius, radius, height - radius * 2, smoothness, heightSegments, true, 0, Math.PI * .5);
  edge3.translate(halfWidth, 0, halfDepth);
  var edge4 = new THREE.CylinderGeometry(radius, radius, height - radius * 2, smoothness, heightSegments, true, Math.PI * 1.5, Math.PI * .5);
  edge4.translate(-halfWidth, 0, halfDepth);

  // depth
  var edge5 = new THREE.CylinderGeometry(radius, radius, depth - radius * 2, smoothness, depthSegments, true, 0, Math.PI * .5);
  edge5.rotateX(-Math.PI * .5);
  edge5.translate(halfWidth, halfHeight, 0);
  var edge6 = new THREE.CylinderGeometry(radius, radius, depth - radius * 2, smoothness, depthSegments, true, Math.PI * .5, Math.PI * .5);
  edge6.rotateX(-Math.PI * .5);
  edge6.translate(halfWidth, -halfHeight, 0);

  let edges = [];
  edges.push(edge,edge2,edge3,edge4,edge5,edge6);
  
  let edgeMerged = BufferGeometryUtils.mergeGeometries(edges);
  geometries.push(edgeMerged);

  // sides
  // front
  var side = new THREE.PlaneGeometry(width - radius * 2, height - radius * 2, widthSegments, heightSegments);
  side.translate(0, 0, depth * .5);

  // right
  var side2 = new THREE.PlaneGeometry(depth - radius * 2, height - radius * 2, depthSegments, heightSegments);
  side2.rotateY(Math.PI * .5);
  side2.translate(width * .5, 0, 0);

  let sides = [];
  sides.push(side,side2);
  
  let sideMerged = BufferGeometryUtils.mergeGeometries(sides);
  geometries.push(sideMerged);

  // duplicate and flip
  geometryRound = BufferGeometryUtils.mergeGeometries(geometries);
  var secondHalf = geometryRound.clone();
  secondHalf.rotateY(Math.PI);
  //secondHalf.translate(0,0,depth);
  geometries=[];

  geometries.push(geometryRound,secondHalf);
  geometryRound = BufferGeometryUtils.mergeGeometries(geometries);
  geometries=[];

  // top
  var top = new THREE.PlaneGeometry(width - radius * 2, depth - radius * 2, widthSegments, depthSegments);
  top.rotateX(-Math.PI * .5);
  top.translate(0, height * .5, 0);

  // bottom
  var bottom = new THREE.PlaneGeometry(width - radius * 2, depth - radius * 2, widthSegments, depthSegments);
  bottom.rotateX(Math.PI * .5);
  bottom.translate(0, -height * .5, 0);

  let topBottom=[];
  topBottom.push(top,bottom);
  let topBottomMerged = BufferGeometryUtils.mergeGeometries(topBottom);

  //geometries=[];
  geometries.push(topBottomMerged,geometryRound);

  geometryRound = BufferGeometryUtils.mergeGeometries(geometries);

  geometryRound=BufferGeometryUtils.mergeVertices(geometryRound);

  return geometryRound;
}

// Interface

function createSlider(objet,key,nom,value,type,min,max) {  
      let divParam = document.createElement("div");
      let divParamName = document.createElement("div");
      let l = document.createElement("label");
      l.innerHTML = nom;
      divParamName.append(l);
      divParam.append(divParamName);
      let s = document.createElement("input");
      s.type="range";
      s.value=value;
      s.min=min;
      s.max=max;
      s.classList.add("inputSlider");
      divParam.append(s);
      let b = document.createElement("input");
      b.type="number";
      b.value=value;
      b.min=min;
      b.max=max;
      b.classList.add("inputValue");
      divParam.append(b);
      s.addEventListener("input", function () {b.value = s.value; objet[key]=+s.value; }, false);
      b.addEventListener("change", function () {s.value = b.value; objet[key]=+s.value; }, false);
      return(divParam);
}

function computeBlocsSize(indiceMeuble) {
  console.log("indiceMeuble=",indiceMeuble);
  let meuble = meubles[indiceMeuble];  
  var largeurSommeBlocs = 0;
  for (var i=0; i<meuble.nbBlocs; i++) {
    largeurSommeBlocs += meuble.bloc[i].largeur;
  }
  var ratio = meuble.largeur/largeurSommeBlocs;
  for (var i=0; i<meuble.nbBlocs; i++) {
    meuble.bloc[i].largeur *= ratio;
  } 
}

function updateInterfaceMeuble() {
  clearInterfaceMeuble();
  rebuildInterfaceMeuble();                   // Rebuild HTML structure
  createInterfaceMeuble(indiceCurrentMeuble); // Rebuild HTML content
}

function clearInterfaceMeuble() {
  listMeublesName.remove();
  listMeublesPopup.remove();
  listMeublesHTML.remove();
  buttonNewMeuble.remove();
  buttonDeleteMeuble.remove();
  if (listMeublesName) {listMeublesName.remove();}
  meubleSliders.remove();
}

function rebuildInterfaceMeuble() { // Rebuild HTML structure
  listMeublesPopup = document.createElement("input");
  listMeublesPopup.type = "text";
  listMeublesPopup.setAttribute("list","listMeubles");
  listMeublesPopup.id = "listMeublesPopup";
  listMeublesPopup.classList.add("popup");
  meubleDiv.append(listMeublesPopup);
  listMeublesHTML = document.createElement("datalist");
  listMeublesHTML.id = "listMeubles";
  meubleDiv.append(listMeublesHTML);
  buttonNewMeuble=document.createElement("input");
  buttonNewMeuble.type="button";
  buttonNewMeuble.id="buttonNewMeuble";
  buttonNewMeuble.value="Nouveau";
  meubleDiv.append(buttonNewMeuble);
  buttonDeleteMeuble=document.createElement("input");
  buttonDeleteMeuble.type="button";
  buttonDeleteMeuble.id="buttonDeleteMeuble";
  buttonDeleteMeuble.value="Supprimer";
  meubleDiv.append(buttonDeleteMeuble);
  meubleSliders=document.createElement("div");
  meubleSliders.id="meubleSliders";
  meubleDiv.append(meubleSliders);
}

function changeCurrentMeuble(num) {
  console.log("new current meuble = ",num);
  console.log(meubles);
  let indicePreviousMeuble = indiceCurrentMeuble;
  indiceCurrentMeuble = num;
  if (meubleRoot[indicePreviousMeuble].cube) meubleRoot[indicePreviousMeuble].cube.visible=false;
  updateInterfaceMeuble();
  updateInterfaceBlocs(indiceCurrentMeuble);
  updateSelectableBlocs(indiceCurrentMeuble);
}

function changeCurrentMeubleFromClick(num) {
  changeCurrentMeuble(num);
  listMeublesName.classList.add("animationMeublesName");
  checkRaycast();
  checkRaycast();
}

function onMaterialAnimationFinish (num) {
  console.log("stop ",num);
  clipActionMaterial.stop();
  clipActionMaterial.reset();
  selectableMeuble[num].material = materialSelectionMeuble;
  selectableMeuble[num].visible = false;
  mixerMaterial.removeEventListener('finished', onMaterialAnimationFinish, false);
  mixerMaterial=undefined;
}

var materialSelectionMeubleAnim = new THREE.MeshPhongMaterial( materialSelectionMeubleParams );
var offset = new THREE.NumberKeyframeTrack( '.opacity', [ 0, 1 ], [ 0.5,0] )
var clipMaterial = new THREE.AnimationClip( 'opacity_animation', 1, [ offset ] );
var mixerMaterial;
var clipActionMaterial;

var clock = new THREE.Clock();

function startMaterialAnimationMeuble(num) {
  selectableMeuble[num].material = materialSelectionMeubleAnim;
  selectableMeuble[num].visible = true;
  mixerMaterial = new THREE.AnimationMixer( materialSelectionMeubleAnim );
  clipActionMaterial = mixerMaterial.clipAction( clipMaterial );
  clipActionMaterial.setLoop(0,1);
  clipActionMaterial.play();
  mixerMaterial.addEventListener( 'finished', function finishMaterialAnim() {onMaterialAnimationFinish(num)}, false )
}
  
function changeCurrentMeubleFromPopup(num) {
  //console.log(num);
  //console.log(event.target.key);
  //console.log(id);
  let indicePreviousMeuble = indiceCurrentMeuble;
  //for (var i=0; i<meubles.length; i++) {
    //if (meubles[i].name==event.target.value) {
      startMaterialAnimationMeuble(num);
      changeCurrentMeuble(num);
      checkRaycast();
      //}
   // }
  }

function createInterfaceMeuble(indiceMeuble) { // Rebuild HTML content
  let meuble = meubles[indiceMeuble];
  listMeublesPopup.addEventListener("change",function eventListMeublesPopup(event) {console.log(event); changeCurrentMeubleFromPopup(event.target.value)},false);
  buttonNewMeuble.addEventListener("click",function eventButtonNewMeuble() {createNewMeuble(); updateInterfaceMeuble(); indiceCurrentBloc=0; updateInterfaceBlocs(indiceCurrentMeuble)},false);
  if (meubles.length>1) {
    buttonDeleteMeuble.addEventListener("click",function eventButtonDeleteMeuble() {
      deleteMeuble(indiceMeuble);
      recomputeMeublesId();
      updateInterfaceMeuble();
      indiceCurrentBloc=0;
      updateInterfaceBlocs(indiceCurrentMeuble);
      updateSelectableBlocs(indiceCurrentMeuble);
      frameCamera();
    },false);
    buttonDeleteMeuble.disabled = false;
  }
  else {
    buttonDeleteMeuble.disabled = true;
  }
  listMeublesName = document.createElement("input");
  listMeublesName.type=("text");
  listMeublesName.id=("listMeublesName");
  //listMeublesName.value=meuble.name;
  listMeublesName.value=meuble.name;
  meubleDiv.insertBefore(listMeublesName,listMeublesPopup);
  for (var i=0;i<meubles.length;i++) {
    let o = document.createElement("option");
    o.value = i;
    o.innerHTML = meubles[i].name;
    //o.value = meubles[i].name;
    //o.key = i;
    listMeublesHTML.append(o);
  }
  console.log("meuble=",meuble);
  console.log("indicecurrentmeuble=",indiceCurrentMeuble);
  console.log("indicemeuble=",indiceMeuble);
  console.log("meubles = ",meubles);
  let elh=createSlider(meuble,"hauteur","Hauteur",meuble.hauteur,0,10,250);
  elh.childNodes[1].addEventListener("input",function eventElhInput() {updateScene();frameCamera();},false);
  elh.childNodes[2].addEventListener("change",function eventElhChange() {updateScene();frameCamera();},false);
  meubleSliders.append(elh);
  let elp=createSlider(meuble,"profondeur","Profondeur",meuble.profondeur,0,10,250);
  elp.childNodes[1].addEventListener("input",function eventElpInput() {updateScene();frameCamera();},false);
  elp.childNodes[2].addEventListener("change",function eventElpChange() {updateScene();frameCamera();},false);
  meubleSliders.append(elp);
  large=createSlider(meuble,"largeur","Largeur",meuble.largeur,0,10,500);
  large.childNodes[1].addEventListener("input",function eventLargeInput() {computeBlocsSize(indiceMeuble); updateInterfaceBlocs(indiceMeuble); updateScene();frameCamera();},false);
  large.childNodes[2].addEventListener("change",function eventLargeChange() {computeBlocsSize(indiceMeuble); updateInterfaceBlocs(indiceMeuble); updateScene();frameCamera();},false);
  meubleSliders.append(large);
  let elnbb = createSlider(meuble,"nbBlocs","Nombre de blocs",meuble.nbBlocs,0,1,maxBlocs);
  elnbb.childNodes[1].addEventListener("input",function eventElnbbInput() {onChangeBlocsQuantity(indiceMeuble)},false);
  elnbb.childNodes[2].addEventListener("change",function eventElnbbChange() {onChangeBlocsQuantity(indiceMeuble)},false);
  meubleSliders.append(elnbb);
  let elX = createSlider(meuble,"x","Placement horizontal",meuble.x,0,-300,300);
  elX.childNodes[1].addEventListener("input",function eventElxInput() {placeMeuble(indiceMeuble);frameCamera()},false);
  elX.childNodes[2].addEventListener("change",function eventElyChange() {placeMeuble(indiceMeuble);frameCamera()},false);
  meubleSliders.append(elX);
  let elY = createSlider(meuble,"y","Placement vertical",meuble.y,0,0,300);
  elY.childNodes[1].addEventListener("input",function eventElyInput() {placeMeuble(indiceMeuble);frameCamera()},false);
  elY.childNodes[2].addEventListener("change",function eventElyChange() {placeMeuble(indiceMeuble);frameCamera()},false);
  meubleSliders.append(elY);
  let cr = document.createElement("p");
  meubleDiv.append(cr);
}

function updateInterfaceLargeur(indiceMeuble) {
  large.childNodes[1].value = meubles[indiceMeuble].largeur;
  large.childNodes[2].value = meubles[indiceMeuble].largeur;
}

function changeCurrentBlocFromClick(num) {
  indiceCurrentBloc = num;
  updateInterfaceBlocs(indiceCurrentMeuble);
  listBlocsName.classList.add("animationBlocsName");
}

function onChangeBlocsQuantity(indiceMeuble) {
  changeBlocsQuantity(indiceMeuble);
  meubles[indiceMeuble].calculLargeur();
  updateInterfaceBlocs(indiceMeuble);
  updateInterfaceLargeur(indiceMeuble);
  updateScene();
  frameCamera();
}

function rebuildInterfaceBlocs(indiceMeuble) {
  listBlocsName = document.createElement("input");
  listBlocsName.type=("text");
  listBlocsName.id=("listBlocsName");
  listBlocsName.value="Bloc "+(indiceCurrentBloc+1);
  blocsDiv.append(listBlocsName);
  listBlocsPopup = document.createElement("input");
  listBlocsPopup.type = "text";
  listBlocsPopup.setAttribute("list","listBlocs");
  listBlocsPopup.id = "listBlocsPopup";
  listBlocsPopup.classList.add("popup");
  blocsDiv.append(listBlocsPopup);
  listBlocs = document.createElement("datalist");
  listBlocs.id = "listBlocs";
  for (var i=0;i<meubles[indiceMeuble].nbBlocs;i++) {
    let o = document.createElement("option");
    o.value = "Bloc "+(i+1);
    listBlocs.append(o);
  }
  blocsDiv.append(listBlocs);
  blocsSliders = document.createElement("div");
  blocsSliders.id="blocsSliders";
  blocsDiv.append(blocsSliders);
  listBlocsPopup.addEventListener("change",function changeCurrentBlocFromPopup() { startMaterialAnimationBloc(indiceCurrentBloc=listBlocsPopup.value.slice(-1)-1); updateInterfaceBlocs(indiceMeuble);},false);
}

function updateInterfaceBlocs(indiceMeuble) {
  clearInterfaceBlocs();
  rebuildInterfaceBlocs(indiceMeuble);
  createSlidersBlocs(indiceMeuble,indiceCurrentBloc);
}

function clearInterfaceBlocs() {
  listBlocsPopup.remove();
  listBlocs.remove();
  if (listBlocsName) {listBlocsName.remove();}
  blocsSliders.remove();
  divPortes=undefined;
  divNombrePortes=undefined;
  divOuverturePortes=undefined;
}

function onMaterialBlocAnimationFinish (num) {
  console.log("stop ",num);
  clipActionMaterial.stop();
  clipActionMaterial.reset();
  selectableBloc[num].material = materialSelectionBloc;
  selectableBloc[num].visible = false;
  mixerMaterial.removeEventListener('finished', onMaterialBlocAnimationFinish, false);
  mixerMaterial=undefined;
}

var materialSelectionBlocAnim = new THREE.MeshPhongMaterial( materialSelectionBlocParams );

function startMaterialAnimationBloc(num) {
  selectableBloc[num].material = materialSelectionBlocAnim;
  selectableBloc[num].visible = true;
  mixerMaterial = new THREE.AnimationMixer( materialSelectionBlocAnim );
  clipActionMaterial = mixerMaterial.clipAction( clipMaterial );
  clipActionMaterial.setLoop(0,1);
  clipActionMaterial.play();
  mixerMaterial.addEventListener( 'finished', function finishMaterialAnim() {onMaterialBlocAnimationFinish(num)}, false )
}

function onClickBlocButton (buttonSource,buttonB,buttonC,buttonD,indiceMeuble,numBloc) {
  buttonSource.classList.remove("buttonOff");
  buttonSource.classList.add("buttonOn");
  buttonB.classList.remove("buttonOn");
  buttonB.classList.add("buttonOff");
  buttonC.classList.remove("buttonOn");
  buttonC.classList.add("buttonOff");
  buttonD.classList.remove("buttonOn");
  buttonD.classList.add("buttonOff");
  meubles[indiceMeuble].bloc[numBloc].type=buttonSource.value;
  if (meubles[indiceMeuble].bloc[numBloc].type=="Portes") {createButtonsForPortes(indiceMeuble,numBloc)} else {if (divPortes) destroyButtonsForPortes()}
  updateScene();
  frameCamera();
}

function createSlidersBlocs(indiceMeuble,numBloc) {
  let meuble=meubles[indiceMeuble];
  let slideLargeurBloc = createSlider(meuble.bloc[numBloc],"largeur","Largeur bloc",meuble.bloc[numBloc].largeur,0,10,200);
  blocsSliders.append(slideLargeurBloc);
  slideLargeurBloc.childNodes[1].addEventListener("input",function (){meuble.calculLargeur(); updateInterfaceLargeur(indiceMeuble); updateScene();frameCamera();},false);
  slideLargeurBloc.childNodes[2].addEventListener("change",function (){meuble.calculLargeur(); updateInterfaceLargeur(indiceMeuble); updateScene();frameCamera();},false);
  let sliderEtageres = createSlider(meuble.bloc[numBloc],"etageres","Nombre d'étagères",meuble.bloc[numBloc].etageres,0,0,maxEtageres);
  sliderEtageres.childNodes[1].addEventListener("input",function () {updateScene();frameCamera();},false);
  sliderEtageres.childNodes[2].addEventListener("change",function () {updateScene();frameCamera();},false);
  blocsSliders.append(sliderEtageres);
  
  // buttons
  let cr = document.createElement("p");
  blocsSliders.append(cr);

  let buttonPorte = document.createElement("input");
  buttonPorte.type = "button";
  buttonPorte.value = "Portes";
  if (meuble.bloc[numBloc].type=="Portes") {buttonPorte.className="buttonOn"} else {buttonPorte.className="buttonOff"}
  buttonPorte.classList.add("button");
  blocsSliders.append(buttonPorte);

  let buttonTiroirs = document.createElement("input");
  buttonTiroirs.type = "button";
  buttonTiroirs.value = "Tiroirs";
  if (meuble.bloc[numBloc].type=="Tiroirs") {buttonTiroirs.className="buttonOn"} else {buttonTiroirs.className="buttonOff"}
  buttonTiroirs.classList.add("button");
  blocsSliders.append(buttonTiroirs);

  let buttonEtageres = document.createElement("input");
  buttonEtageres.type = "button";
  buttonEtageres.value = "Etageres";
  if (meuble.bloc[numBloc].type=="Etageres") {buttonEtageres.className="buttonOn"} else {buttonEtageres.className="buttonOff"}
  buttonEtageres.classList.add("button");
  blocsSliders.append(buttonEtageres);

  let buttonPlein = document.createElement("input");
  buttonPlein.type = "button";
  buttonPlein.value = "Panneau";
  if (meuble.bloc[numBloc].type=="Panneau") {buttonPlein.className="buttonOn"} else {buttonPlein.className="buttonOff"}
  buttonPlein.classList.add("button");
  blocsSliders.append(buttonPlein);

  buttonPorte.addEventListener("click",function () {onClickBlocButton(buttonPorte,buttonTiroirs,buttonEtageres,buttonPlein,indiceMeuble,numBloc)},false);
  buttonTiroirs.addEventListener("click",function () {onClickBlocButton(buttonTiroirs,buttonPorte,buttonEtageres,buttonPlein,indiceMeuble,numBloc)},false);
  buttonEtageres.addEventListener("click",function () {onClickBlocButton(buttonEtageres,buttonPorte,buttonTiroirs,buttonPlein,indiceMeuble,numBloc)},false);
  buttonPlein.addEventListener("click",function () {onClickBlocButton(buttonPlein,buttonPorte,buttonTiroirs,buttonEtageres,indiceMeuble,numBloc)},false);

  if (meuble.bloc[numBloc].type=="Portes") {createButtonsForPortes(indiceMeuble,numBloc)} else {if (divPortes) destroyButtonsForPortes()}
}

function createButtonsForPortes(indiceMeuble, numBloc) {
  if (!divPortes) {
    createButtonsForNombrePortes(indiceMeuble, numBloc);
    if (meubles[indiceMeuble].bloc[numBloc].nombrePortes == "1") createButtonsForOuverturePortes(indiceMeuble, numBloc);
  }
}

function createButtonsForNombrePortes(indiceMeuble, numBloc) {
  divPortes = document.createElement("div");
  blocsSliders.append(divPortes);

  divNombrePortes = document.createElement("div");
  divPortes.append(divNombrePortes);
  
  let crc = document.createElement("p");
  divNombrePortes.append(crc);
  divNombrePortes.append("Nombre de portes");
  let crd = document.createElement("p");
  divNombrePortes.append(crd);

  let buttonUnePorte = document.createElement("input");
  buttonUnePorte.type = "button";
  buttonUnePorte.value = "1";
  if (meubles[indiceMeuble].bloc[numBloc].nombrePortes == "1") { buttonUnePorte.className = "buttonOn" } else { buttonUnePorte.className = "buttonOff" }
  buttonUnePorte.classList.add("button");
  divNombrePortes.append(buttonUnePorte);

  let buttonDeuxPortes = document.createElement("input");
  buttonDeuxPortes.type = "button";
  buttonDeuxPortes.value = "2";
  if (meubles[indiceMeuble].bloc[numBloc].nombrePortes == "2") { buttonDeuxPortes.className = "buttonOn" } else { buttonDeuxPortes.className = "buttonOff" }
  buttonDeuxPortes.classList.add("button");
  divNombrePortes.append(buttonDeuxPortes);

  buttonUnePorte.addEventListener("click", function () { onClickNombrePortesButton(buttonUnePorte, buttonDeuxPortes, indiceMeuble, numBloc) }, false);
  buttonDeuxPortes.addEventListener("click", function () { onClickNombrePortesButton(buttonDeuxPortes, buttonUnePorte, indiceMeuble, numBloc) }, false);
}

function createButtonsForOuverturePortes (indiceMeuble,numBloc) {
  let meuble = meubles[indiceMeuble];
  divOuverturePortes = document.createElement("div");
  divPortes.append(divOuverturePortes);

  let cr = document.createElement("p");
  divOuverturePortes.append(cr);
  divOuverturePortes.append("Ouverture des portes");
  let crb = document.createElement("p");
  divOuverturePortes.append(crb);

  let buttonOuverturePorteGauche = document.createElement("input");
  buttonOuverturePorteGauche.type = "button";
  buttonOuverturePorteGauche.value = "Gauche";
  if (meuble.bloc[numBloc].ouverturePorte=="gauche") {buttonOuverturePorteGauche.className="buttonOn"} else {buttonOuverturePorteGauche.className="buttonOff"}
  buttonOuverturePorteGauche.classList.add("button");
  divOuverturePortes.append(buttonOuverturePorteGauche);

  let buttonOuverturePorteDroite = document.createElement("input");
  buttonOuverturePorteDroite.type = "button";
  buttonOuverturePorteDroite.value = "Droite";
  if (meuble.bloc[numBloc].ouverturePorte=="droite") {buttonOuverturePorteDroite.className="buttonOn"} else {buttonOuverturePorteDroite.className="buttonOff"}
  buttonOuverturePorteDroite.classList.add("button");
  divOuverturePortes.append(buttonOuverturePorteDroite);

  buttonOuverturePorteGauche.addEventListener("click",function () {onClickOuverturePorteButton(buttonOuverturePorteGauche,buttonOuverturePorteDroite,indiceMeuble,numBloc)},false);
  buttonOuverturePorteDroite.addEventListener("click",function () {onClickOuverturePorteButton(buttonOuverturePorteDroite,buttonOuverturePorteGauche,indiceMeuble,numBloc)},false);
}

function onClickNombrePortesButton (buttonSource,buttonB,indiceMeuble,numBloc) {
  console.log("click button Nombre Portes");
  buttonSource.classList.remove("buttonOff");
  buttonSource.classList.add("buttonOn");
  buttonB.classList.remove("buttonOn");
  buttonB.classList.add("buttonOff");
  if (meubles[indiceMeuble].bloc[numBloc].nombrePortes  == "1") {
    meubles[indiceMeuble].bloc[numBloc].nombrePortes = "2";
    destroyButtonsForOuverturePortes();
  }
  else {
    meubles[indiceMeuble].bloc[numBloc].nombrePortes = "1";
    createButtonsForOuverturePortes(indiceMeuble,numBloc);
  }
  updateScene();
  frameCamera();
}

function onClickOuverturePorteButton (buttonSource,buttonB,indiceMeuble,numBloc) {
  buttonSource.classList.remove("buttonOff");
  buttonSource.classList.add("buttonOn");
  buttonB.classList.remove("buttonOn");
  buttonB.classList.add("buttonOff");
  if (meubles[indiceMeuble].bloc[numBloc].ouverturePorte  == "gauche") {meubles[indiceMeuble].bloc[numBloc].ouverturePorte = "droite"}
  else {meubles[indiceMeuble].bloc[numBloc].ouverturePorte = "gauche"}
  updateScene();
  frameCamera();
}

function destroyButtonsForPortes () {
  divPortes.remove();
  divPortes=undefined;
  console.log(divPortes);
}

function destroyButtonsForOuverturePortes () {
  divOuverturePortes.remove();
  divOuverturePortes=undefined;
  console.log("removed ?");
}

window.addEventListener("DOMContentLoaded", initializeScene);
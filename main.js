import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as CameraUtils from 'three/addons/utils/CameraUtils.js';
import { ScreenNode } from 'three/src/nodes/display/BlendModeNode.js';
import { mx_bilerp_0 } from 'three/src/nodes/materialx/lib/mx_noise.js';

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

var indiceCurrentBloc = 0;
var indiceCurrentMeuble = 0;

const epaisseur = 1;
const maxBlocs = 9;
const maxEtageres = 20;
const cubeVisible = false;
const epsilon = 5;
const taillePoignees = 1.5;
const focale=60;
//const focaleH=focale;
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
var selectable=[];  //liste des boites selectionnables par raycast
var raycastedBloc=-1;

//raycaster
let raycaster;
let INTERSECTED;
const pointer = new THREE.Vector2();
pointer.x=-1;
pointer.y=-1;
const radius = 5;

const scene = new THREE.Scene();
var canvas = document.getElementById("canvas");
var canvasSize = canvas.getBoundingClientRect();
console.log (canvasSize);
const camera = new THREE.PerspectiveCamera( focale, canvasSize.width/window.innerHeight, 0.1, 1000 );
//focaleH=focale;
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

//raycast sur les objets 3d lors d'un changement de souris ou de camera
controls.addEventListener( 'change', checkRaycast );
canvas.addEventListener( 'mousemove', checkRaycast );

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

function onCanvasClick () {
  console.log("click");
  if (raycastedBloc>-1) changeCurrentBlocFromClick(raycastedBloc);
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

const materialSelectionParams = {
  color: '#00ff00',
  refractionRatio: 0.98,
  transparent: true,
  opacity: 0.5
};

const material = new THREE.MeshPhongMaterial( materialParams);
const materialTiroirs = new THREE.MeshPhongMaterial( materialTiroirsParams);
const materialPoignees = new THREE.MeshPhongMaterial( materialPoigneesParams);
const materialSelection = new THREE.MeshPhongMaterial( materialSelectionParams);
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
  const intersects = raycaster.intersectObjects(selectable, true);
  if (intersects.length > 0) {
    if (INTERSECTED != intersects[0].object) {
      if (INTERSECTED) INTERSECTED.visible = false;
      INTERSECTED = intersects[0].object;
      INTERSECTED.visible = true;
      raycastedBloc = intersects[0].object.numero;
    }
  }
  else {
    if (INTERSECTED) INTERSECTED.visible = false;
    INTERSECTED = null;
    raycastedBloc = -1;
  }
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
      //console.log("xm,xM,xMin,xMax = ",xm,xM,x)
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
  /*var dx = meubles[indiceCurrentMeuble].largeur;
  var dy = meubles[indiceCurrentMeuble].hauteur;
  dx *= 1.2;
  dy *= 2;*/
  let distL = ((boundingBoxWidth/2)/Math.tan(0.0174533*(focale/2)));
  let distH = ((boundingBoxHeight/2)/Math.tan((focaleV/2)));
  let dist = Math.max(distL,distH);
  console.log("dist=",distL,distH,dist);
  camera.translateZ((dist-(controls.getDistance(cameraTarget)))/100);
  //((-controls.getDistance(meubleRoot[indiceCurrentMeuble].cube)+Math.max(dx,dy))/100);
  //controls.target = meubleRoot[indiceCurrentMeuble].position;
  camera.updateMatrixWorld();
  renderer.render( scene, camera );
}

function updateCube (indiceMeuble) {
  meubleRoot[indiceMeuble].remove(cube);
  scene.remove(cube);
  if (cubeVisible) {geometry = new THREE.BoxGeometry( meubles[indiceMeuble].largeur, meubles[indiceMeuble].hauteur, meubles[indiceMeuble].profondeur );
  cube = new THREE.Mesh( geometry, wireframeMaterial );
  scene.add( cube );}
}

function placeMeuble (indiceMeuble) {
  meubleRoot[indiceMeuble].position.set(meubles[indiceMeuble].x,meubles[indiceMeuble].hauteur/2+meubles[indiceMeuble].y,meubles[indiceMeuble].profondeur/2);
}

function updateMeuble (indiceMeuble) {
  //console.log("indiceMeuble=",indiceMeuble);
  //console.log("update meuble");
  meubleRoot[indiceMeuble].position.set(0,0,0);
  selectable=[];
  for (var i=0; i<meubles[indiceMeuble].nbBlocs; i++) {
    updateBloc(indiceMeuble,i);
    meubleRoot[indiceMeuble].add(blocRoot[i]);
    //console.log("bloc added");
  }
  //scene.add(meubleRoot[indiceMeuble]);
  if (cube) meubleRoot[indiceMeuble].add(cube);
  placeMeuble(indiceMeuble);
  //console.log("All meuble apres update ", meubleRoot);
  //console.log("All meuble class apres update ", meubles);
}

function changeBlocsQuantity (indiceMeuble) {
  for (var i=0; i<maxBlocs; i++) {
    if (((typeof meubles[indiceMeuble].bloc[i]))=="undefined") {meubles[indiceMeuble].bloc[i] = new blocClass()}
     else {
      if (i>(meubles[indiceMeuble].nbBlocs-1)) {destroyBloc(indiceMeuble,i)}
     }
  }
  if (indiceCurrentBloc>(meubles[indiceMeuble].nbBlocs-1)) {indiceCurrentBloc=meubles[indiceMeuble].nbBlocs-1;}
}

function updateCamera () {
  console.log(controls.getDistance(cube));
}

function frameCamera () {
  boundingBoxCenter = getBoundingBoxCenter();
  controls.target = boundingBoxCenter;
  cameraTarget.position.set(boundingBoxCenter);
  console.log("boudingbox = ",boundingBoxCenter);
  console.log("bB width, Height = ",boundingBoxWidth,boundingBoxHeight);
}

function updateScene () {
  //check blocs validity
  //meubles[indiceCurrentMeuble].calculLargeur();
  //updateCube(meubles[indiceCurrentMeuble]);
  //console.log(meubles[indiceCurrentMeuble]);
  updateMeuble(indiceCurrentMeuble);
  //updateCamera(Meubles[indiceCurrentMeuble]);
}

//Interface

var interfaceDiv;
var meubleDiv;
var divPortes;
var divNombrePortes;
var divOuverturePortes;
var buttonNewMeuble;
var listMeublesHTML;
var listMeublesPopup;
var listMeublesName;
var blocsDiv;
var listBlocs;
var listBlocsPopup;
var listBlocsName;
var meubleSliders;
var blocsSliders;
var large;

function buildEnvironnement () {
  geometry = new THREE.PlaneGeometry( 1000, 1000 );
  const materialSol = new THREE.MeshPhongMaterial( {color: 0xffffff} );
  const plane = new THREE.Mesh( geometry, materialSol );
  plane.rotateX(-Math.PI/2);
  scene.add( plane );
  const murFond = new THREE.Mesh( geometry, materialSol );
  scene.add( murFond );
  const murDroit = new THREE.Mesh( geometry, materialSol );
  murDroit.translateX(500);
  murDroit.rotateY(-Math.PI/2);
  scene.add( murDroit );
  const murGauche = new THREE.Mesh( geometry, materialSol );
  murGauche.translateX(-500);
  murGauche.rotateY(Math.PI/2);
  scene.add( murGauche );
}

function initializeScene() {
    buildEnvironnement ();
    initializeInterface();
    initializePoignees();
    //indiceCurrentMeuble = 0;
    //initializeMeuble(indiceCurrentMeuble);
    createNewMeuble();
    createInterfaceMeuble(indiceCurrentMeuble);
    //updateInterfaceMeuble();
    updateInterfaceBlocs(indiceCurrentMeuble);
    frameCamera();
    renderer.setAnimationLoop( animate );
    //updateMeuble(indiceCurrentMeuble);
    //console.log("All meuble apres init ", meubleRoot);
}

function initializeInterface() {
  interfaceDiv = document.getElementById("interface");
  meubleDiv = document.getElementById("meuble");
  buttonNewMeuble = document.getElementById("buttonNewMeuble");
  //console.log(buttonNewMeuble);
  listMeublesHTML = document.getElementById("listMeubles");
  listMeublesPopup = document.getElementById("listMeublesPopup");
  blocsDiv = document.getElementById("blocs");
  listBlocs = document.getElementById("listBlocs");
  listBlocsPopup = document.getElementById("listBlocsPopup");
  meubleSliders = document.getElementById("meubleSliders");
  blocsSliders = document.getElementById("blocsSliders");
}

function initializePoignees() {
  geometry = new THREE.SphereGeometry(taillePoignees,12,8);
  poignee = new THREE.Mesh( geometry, materialPoignees );
}

function createNewMeuble() {
  //console.log("create meuble");
  indiceCurrentMeuble=meubles.length;
  //console.log(indiceCurrentMeuble);
  //initializeMeuble(indiceCurrentMeuble);
  meubles[indiceCurrentMeuble] = new meubleClass(indiceCurrentMeuble);
  meubleRoot[indiceCurrentMeuble] = new THREE.Object3D();
  meubleRoot[indiceCurrentMeuble].name = "meuble "+indiceCurrentMeuble;
  meubleRoot[indiceCurrentMeuble].position.set(0,0,0);
  if (indiceCurrentMeuble>0) {
    let positionY=meubles[indiceCurrentMeuble-1].y+meubles[indiceCurrentMeuble-1].hauteur;
    meubles[indiceCurrentMeuble].y=positionY;
  }
  updateMeuble(indiceCurrentMeuble);
  scene.add(meubleRoot[indiceCurrentMeuble]);
  frameCamera();
  //console.log("All meuble apres new meuble ", meubleRoot);
}

function initializeMeuble(indiceMeuble) {
  //console.log("initialize meuble ");
  meubles[indiceMeuble] = new meubleClass(indiceMeuble);
  meubleRoot[indiceMeuble] = new THREE.Object3D();
  meubleRoot[indiceMeuble].position.set(0,0,0);
  //scene.add( meubleRoot[indiceMeuble] );
  //for (var i=0; i<meubles[indiceMeuble].nbBlocs; i++) {initializeBloc(indiceMeuble,i)}
}

function destroyBloc(indiceMeuble, numBloc) {
  //console.log("destroy bloc ",numBloc," meuble ",indiceMeuble);
    meubleRoot[indiceMeuble].remove(blocRoot[numBloc]);
    blocRoot[numBloc]=undefined;
    scene.remove( blocRoot[numBloc] );
}

//function addSelectionBox

function initializeBloc(indiceMeuble, numBloc) {
  let meuble = meubles[indiceMeuble];
  blocRoot[numBloc] = new THREE.Object3D();
  blocRoot[numBloc].name = "Bloc "+numBloc;
  //console.log("initialize bloc ",numBloc," meuble ",indiceMeuble);
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
  geometry = new THREE.BoxGeometry( meuble.bloc[numBloc].largeur+epsilon, meuble.hauteur+epsilon, meuble.profondeur+epsilon );
  boite[numBloc] = new THREE.Mesh( geometry, materialSelection );
  boite[numBloc].name = "BoiteSelectionBloc"+numBloc;
  blocRoot[numBloc].add(boite[numBloc]);
  selectable.push(boite[numBloc]);
  boite[numBloc].visible=false;
  boite[numBloc].numero=numBloc;
  //console.log("num boite =",numBloc);
 
  //portes
  if (meuble.bloc[numBloc].type == "Portes") {
    if (meuble.bloc[numBloc].nombrePortes == "1") {
      geometry = new THREE.BoxGeometry(meuble.bloc[numBloc].largeur - 0.25 * epaisseur, meuble.hauteur-0.25*epaisseur, epaisseur);
      etagere[0] = new THREE.Mesh(geometry, materialTiroirs);
      etagere[0].name = "porte 0";
      //poignee
      let poigneeB = poignee.clone(false);
      poigneeB.name="poignee";
      etagere[0].add(poigneeB);
      let deltaX=meuble.bloc[numBloc].largeur/2 - 5*taillePoignees;
      if (deltaX<0) deltaX=0;
      if (meuble.bloc[numBloc].ouverturePorte=="droite") {deltaX*=-1}
      poigneeB.position.set(deltaX,0,epaisseur+taillePoignees);
      etagere[0].position.set(0,0,meuble.profondeur/2);
      blocRoot[numBloc].add(etagere[0]);
    }
    else {
      //porte gauche
      geometry = new THREE.BoxGeometry(meuble.bloc[numBloc].largeur/2 - 0.25 * epaisseur, meuble.hauteur-0.25*epaisseur, epaisseur);
      etagere[0] = new THREE.Mesh(geometry, materialTiroirs);
      etagere[0].name = "porte 0";
      //poignee gauche
      let poigneeB = poignee.clone(false);
      poigneeB.name="poignee";
      etagere[0].add(poigneeB);
      let deltaX=meuble.bloc[numBloc].largeur/4 - 5*taillePoignees;
      if (5*taillePoignees>meuble.bloc[numBloc].largeur/4) deltaX=meuble.bloc[numBloc].largeur/2;
      poigneeB.position.set(deltaX,0,epaisseur+taillePoignees);
      etagere[0].position.set(-meuble.bloc[numBloc].largeur/4,0,meuble.profondeur/2);
      blocRoot[numBloc].add(etagere[0]);

      //porte droite
      etagere[1] = new THREE.Mesh(geometry, materialTiroirs);
      etagere[1].name = "porte 1";
      //poignee droite
      let poigneeC = poignee.clone(false);
      etagere[1].add(poigneeC);
      deltaX*=-1
      poigneeC.position.set(deltaX,0,epaisseur+taillePoignees);
      poigneeC.name="poignee";
      etagere[1].position.set(meuble.bloc[numBloc].largeur/4,0,meuble.profondeur/2);
      blocRoot[numBloc].add(etagere[1]);
    }
  }
  
  //etageres
  if (meuble.bloc[numBloc].type == "Etageres") {
    var step = (meuble.hauteur-2*epaisseur)/(meuble.bloc[numBloc].etageres+1);
    for (var i = 0; i < meuble.bloc[numBloc].etageres; i++) {
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
      geometry = new THREE.BoxGeometry(xl, yl, zl);
      etagere[i] = new THREE.Mesh(geometry, materialTiroirs);
      etagere[i].name = "tiroir "+i;
      //poignees
      let poigneeB = poignee.clone(false);
      poigneeB.name="poignee";
      etagere[i].add(poigneeB);
      poigneeB.position.set(0,0,epaisseur+taillePoignees);
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
  //scene.add( blocRoot[numBloc] );
}

function updateBloc (indiceMeuble, numBloc) {
  destroyBloc(indiceMeuble, numBloc);
  initializeBloc(indiceMeuble, numBloc);
}

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
  rebuildInterfaceMeuble();
  createInterfaceMeuble(indiceCurrentMeuble);
}

function clearInterfaceMeuble() {
  listMeublesName.remove();
  listMeublesPopup.remove();
  listMeublesHTML.remove();
  buttonNewMeuble.remove();
  if (listMeublesName) {listMeublesName.remove();}
  meubleSliders.remove();
}

function rebuildInterfaceMeuble() {
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
  meubleSliders=document.createElement("div");
  meubleSliders.id="meubleSliders";
  meubleDiv.append(meubleSliders);
}

function changeCurrentMeubleFromPopup(event) {
  console.log(event.target.value);
  console.log("All meuble avant switch ", meubleRoot);
  for (var i=0; i<meubles.length; i++) {
    if (meubles[i].name==event.target.value) {
      indiceCurrentMeuble = i;
      updateInterfaceMeuble();
      updateInterfaceBlocs(indiceCurrentMeuble);
      console.log("indiceCurrentMeuble=",indiceCurrentMeuble);
      for (var j=0; j<meubleRoot[indiceCurrentMeuble].children.length; j++) {
        blocRoot[j]=meubleRoot[indiceCurrentMeuble].children[j];
        console.log("link child ",j);
      }
      updateMeuble(indiceCurrentMeuble);
    }
  }
  console.log("All meuble après switch ", meubleRoot);
}

function createInterfaceMeuble(indiceMeuble) {
  //console.log("indice create",indiceMeuble);
  let meuble = meubles[indiceMeuble];
  listMeublesPopup.addEventListener("change",function eventListMeublesPopup(event) {changeCurrentMeubleFromPopup(event)},false);
  buttonNewMeuble.addEventListener("click",function eventButtonNewMeuble() {createNewMeuble(); updateInterfaceMeuble()},false);

  listMeublesName = document.createElement("input");
  listMeublesName.type=("text");
  listMeublesName.id=("listMeublesName");
  listMeublesName.value=meuble.name;
  meubleDiv.insertBefore(listMeublesName,listMeublesPopup);
  for (var i=0;i<meubles.length;i++) {
    let o = document.createElement("option");
    o.value = meubles[i].name;
    listMeublesHTML.append(o);
  }
  let elh=createSlider(meuble,"hauteur","Hauteur",meuble.hauteur,0,10,250);
  elh.childNodes[1].addEventListener("input",function eventElhInput() {updateScene();frameCamera();},false);
  elh.childNodes[2].addEventListener("change",function eventElhChange() {updateScene();frameCamera();},false);
  meubleSliders.append(elh);
  let elp=createSlider(meuble,"profondeur","Profondeur",meuble.profondeur,0,10,250);
  elp.childNodes[1].addEventListener("input",function eventElpInput() {updateScene();frameCamera();},false);
  elp.childNodes[2].addEventListener("change",function eventElpChange() {updateScene();frameCamera();},false);
  meubleSliders.append(elp);
  large=createSlider(meuble,"largeur","Largeur",meuble.largeur,0,10,500);
  //console.log(large.childNodes[1]);
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
  listBlocsPopup.addEventListener("change",function changeCurrentBlocFromPopup() { indiceCurrentBloc=listBlocsPopup.value.slice(-1)-1; updateInterfaceBlocs(indiceMeuble)},false);
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
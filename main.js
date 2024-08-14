import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import * as CameraUtils from 'three/addons/utils/CameraUtils.js';
import { ScreenNode } from 'three/src/nodes/display/BlendModeNode.js';
import { mx_bilerp_0 } from 'three/src/nodes/materialx/lib/mx_noise.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { DragControls } from 'three/addons/controls/DragControls.js';

class configurationClass {
  constructor () {
    this.style = "style 1";
    meubles
  }
}

class blocClass {
  constructor () {
    this.taille = 40;
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
    this.disposition = "horizontal";
    for (var i=0; i<this.nbBlocs; i++) {this.bloc[i] = new blocClass()}
    this.calculTaille();
    //this.calculHauteur();
  }

  calculTaille () {
    this.calculLargeur();
    this.calculHauteur();
  }
  
  calculLargeur () {
    this.largeur = this.calculSommeLargeurBlocs();
  }

  calculHauteur () {
    this.hauteur = this.calculSommeHauteurBlocs();
  }

  calculSommeLargeurBlocs() {
    if (this.disposition == "vertical") return this.largeur;
    else {
      var largeurTemp = 0;
      for (var i = 0; i < this.nbBlocs; i++) {
        largeurTemp += this.bloc[i].taille;
      }
      return (largeurTemp);
    }
  }

  calculSommeHauteurBlocs() {
    if (this.disposition == "horizontal") return this.hauteur;
    else {
      var hauteurTemp = 0;
      for (var i = 0; i < this.nbBlocs; i++) {
        hauteurTemp += this.bloc[i].taille;
      }
      return (hauteurTemp);
    }
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

  getMinY () {
    return (this.y);
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
var rayCastEnabled=true;
var origine = new THREE.Object3D();

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
//console.log (canvasSize);
const camera = new THREE.PerspectiveCamera( focale, canvasSize.width/window.innerHeight, 0.1, 1000 );
focaleV=getfocaleV(focale,canvasSize.width,window.innerHeight);
//console.log("focaleV deg = ",focaleV/0.0174533);
var cameraTarget = new THREE.Object3D();
camera.position.z = 180; //overridden by orbit
camera.position.y = 100;
var boundingBoxCenter = new THREE.Vector3();
var boundingBoxHeight, boundingBoxWidth;

raycaster = new THREE.Raycaster();
canvas.addEventListener( 'mousemove', onPointerMove );
window.addEventListener( 'resize', onWindowResize );
canvas.addEventListener('click',onCanvasClick);
canvas.addEventListener('dragstart',onCanvasDrag,false);

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

//drag
var dragBlocControls;
var dragMeubleControls;
function initDrag() {
  var wA,hA;
  //var wA,wB,hA,hB;
  var aX,aY,bX,bY;
  //drag blocs
  dragBlocControls = new DragControls(selectableBloc, camera, renderer.domElement);
  dragBlocControls.addEventListener('dragstart', function (event) {
    controls.enabled=false;
    dragMeubleControls.enabled=false;
    event.object.material.emissive.set(0xaaaaaa);
  });
  dragBlocControls.addEventListener('dragend', function (event) {
    controls.enabled=true;
    dragMeubleControls.enabled=true;
    event.object.material.emissive.set(0x000000);
    var obj1=event.object;
    var num=event.object.numero;
    obj1.position.set(0,0,0);
    //console.log("raycastedBloc=",raycastedBloc);
    if ((raycastedBloc==-1) || (raycastedBloc==num)) {console.log("nothing happens")}
      else {
        //console.log("swap ",num," et ",raycastedBloc);
        let bloc=meubles[indiceCurrentMeuble].bloc;
        [bloc[num],bloc[raycastedBloc]]=[bloc[raycastedBloc],bloc[num]];
        updateMeuble(indiceCurrentMeuble);
      }
      //console.log("drag finished");
  });

  //drag meubles
  dragMeubleControls=new DragControls(selectableMeuble, camera, renderer.domElement);
  dragMeubleControls.addEventListener('dragstart', function (event) {
    controls.enabled=false;
    rayCastEnabled=false;
    dragBlocControls.enabled=false;
    event.object.material.emissive.set(0xaaaaaa);
    var obj1=event.object;
    var num=obj1.numero;
    changeCurrentMeubleFromClick(num);
    obj1.xMeubleInit=meubles[num].x;
    obj1.yMeubleInit=meubles[num].y;
    obj1.xOk=obj1.xMeubleInit;
    obj1.yOk=obj1.yMeubleInit;
    obj1.zOk=obj1.position.z;
    var posInitiale = new THREE.Vector3;
    posInitiale = [...obj1.position];
    obj1.posInitiale = posInitiale;
    let blocRoot=meubleRoot[num].children[0];
    //const parent=blocRoot.parent;
    //parent.remove(blocRoot);
    obj1.attach(blocRoot); //on détache pour éviter les references circulaires dans les calculs de coordonnées
    //if (meubles[num].disposition=="horizontal") {blocRoot.position.set(0,0,0)} else {blocRoot.position.set(0,-meubles[num].hauteur/2,0)}
    blocRoot.position.set(0,0,0);
    wA=meubles[num].largeur;//(meubles[num].getMaxX()-meubles[num].getMinX());
    hA=meubles[num].hauteur;//(meubles[num].getMaxY()-meubles[num].getMinY());
  });

  dragMeubleControls.addEventListener('drag', function (event) { 
    var obj1=event.object;
    var num=obj1.numero;
    let wpos = new THREE.Vector3();
    var pos=obj1.position;
    obj1.localToWorld(wpos);
    aX=wpos.x;
    aY=wpos.y;

    //console.log ("world x,y = ",aX,aY);

    adjustObjectPosition(obj1,num,aX,aY,wA,hA,pos,0);

    meubles[num].x=obj1.xMeubleInit+obj1.position.x;
    meubles[num].y=obj1.yMeubleInit+obj1.position.y;
    updateInterfaceX(num);
    updateInterfaceY(num);
    var worldPos = new THREE.Vector3();
    var posMeuble = new THREE.Vector3();
    var pos = new THREE.Vector3();
    worldPos = obj1.position;
    //frameCamera();
  });

  function intersectWithOneOfAll(obj,num,aaX,aaY,wwA,hhA) {
    //var worldPos = new THREE.Vector3();
    //var posMeuble = new THREE.Vector3();
    var pos = new THREE.Vector3();
    obj.localToWorld(pos);
    aaX=pos.x;
    aaY=pos.y;
    var intersectB = false;
    console.log("nb meubles=",meubles.length);
    for (var i = 0; i < meubles.length; i++) {
      //console.log(i);
      if (i != num) {
        var bbX = meubles[i].x;
        var bbY = meubles[i].y + meubles[i].hauteur / 2;
        var wwB = meubles[i].largeur;
        var hhB = meubles[i].hauteur;
        console.log("i=",i," aaX,aaY,bbX,bbY=",aaX,aaY,bbX,bbY); 
        if ((Math.abs(aaX-bbX)*2<(wwA+wwB)) && (Math.abs(aaY-bbY)*2<(hhA+hhB))) intersectB=true;
        if (intersectB) {console.log("intersect with ",i," num=",num)}
         }
  
} return intersectB;
  }
  
  function adjustObjectPosition(obj1,num,aX,aY,wA,hA,pos,count) {
    pos.z=obj1.zOk;
    if (count>meubles.length) {
      /*pos.x=obj1.xOk;
      pos.y=obj1.yOk;
      pos.z=obj1.zOk;*/
      return
    }
    var wB, hB;
    var bX, bY;
    var replace=false;
   
    if (aY < meubles[num].hauteur / 2) { pos.y += (meubles[num].hauteur / 2 - aY); aY=meubles[num].hauteur / 2; replace=true }
    var newX=pos.x;
    var newY=pos.y;
    for (var i = 0; i < meubles.length; i++) {
      if (i != num) {
        bX = meubles[i].x;
        bY = meubles[i].y + meubles[i].hauteur / 2;
        wB = meubles[i].largeur;
        hB = meubles[i].hauteur;
        var intersect = (Math.abs(aX-bX)*2<(wA+wB)) && (Math.abs(aY-bY)*2<(hA+hB));
        if (intersect) {
          //let deltaX = Math.abs(aX - bX )*2 - (wA + wB);
          if (aX > bX) { var decalX = (aX-wA/2) - (bX+wB/2) }
          else { var decalX = (aX+wA/2)-(bX-wB/2)}
          if (aY > bY) { var decalY = (aY-hA/2) - (bY+hB/2) }
          else { var decalY = (aY+hA/2)-(bY-hB/2)}
          if ((Math.abs(decalX) > Math.abs(decalY)) && (obj1.yMeubleInit + pos.y > 0)) { pos.y -= decalY; aY -= decalY; }
          else { pos.x -= decalX; aX -= decalX; }
        }
        if (aY < meubles[num].hauteur / 2) { pos.y += (meubles[num].hauteur / 2 - aY); aY=meubles[num].hauteur / 2; replace=true }
      }
    }
    if (intersectWithOneOfAll(obj1,num,pos.x,pos.y,wA,hA)==false) {console.log("pos ok");  obj1.xOk=pos.x; obj1.yOk=pos.y; console.log("xOk,yOk=",obj1.xOk,obj1.yOk)} else {pos.x=obj1.xOk; pos.y=obj1.yOk;}
    //if (intersect || replace) {adjustObjectPosition(obj1,num,aX,aY,wA,hA,pos,count+1)}
      //else {pos.x=obj1.xOk; pos.y=obj1.yOk; pos.z=obj1.zOk}
  }

  dragMeubleControls.addEventListener('dragend', function (event) {
    controls.enabled=true;
    dragBlocControls.enabled=true;
    rayCastEnabled=true;
    event.object.material.emissive.set(0x000000);
    var obj1=event.object;
    var num=event.object.numero;
    let blocRoot=obj1.children[0];
    //console.log("blocRoot=",blocRoot);
    let parent=obj1.parent
    //parent.remove(obj1);
    meubleRoot[num].attach(blocRoot); // on rattache une fois fini
    parent.attach(obj1);
    //blocRoot.position.set(0,0,0);
    //if (meubles[num].disposition=="horizontal") {blocRoot.position.set(0,0,0)} else {blocRoot.position.set(0,-meubles[num].hauteur/2,0)}
    blocRoot.position.set(0,0,0);
    obj1.position.set(0,0,0);
    
    //console.log(meubleRoot[num]);
    placeMeuble(num);
    //console.log("xfinal=",meubles[num].x);
    frameCamera();
  });
}

function getLimitTranslationX(num) {
  var bY;
  var aY = meubles[num].y + meubles[num].hauteur / 2;
  var minXGlobal=-10e34;
  var maxXGlobal=+10e34;
  var minX=-10e34;
  var maxX=10e34;
  for (var i = 0; i < meubles.length; i++) {
    if (i != num) {
      bY = meubles[i].y + meubles[i].hauteur / 2;
      var intersectY = (Math.abs(aY - bY) * 2 < (meubles[num].hauteur + meubles[i].hauteur));
      if (intersectY) {
          if (meubles[num].x > meubles[i].x) {
            minX = (meubles[i].x + meubles[i].largeur / 2) + (meubles[num].largeur / 2);
          }
          if (meubles[num].x < meubles[i].x) {
            maxX = (meubles[i].x - meubles[i].largeur / 2) - (meubles[num].largeur / 2);
          }
          console.log("minX,maxX=",minX,maxX);
          minXGlobal=Math.max(minX,minXGlobal);
          maxXGlobal=Math.min(maxX,maxXGlobal);
          console.log("minX,maxX=",minX,maxX);
      }
    }
  }
  return [minXGlobal,maxXGlobal];
}

function getLimitTranslationY(num) {
  var minYGlobal=0;
  var maxYGlobal=10e34;
  var minY=0;
  var maxY=10e34;
  for (var i = 0; i < meubles.length; i++) {
    if (i != num) {
      var intersectX = (Math.abs(meubles[num].x - meubles[i].x) * 2 < (meubles[num].largeur + meubles[i].largeur));
      if (intersectX) {
          if (meubles[num].y > meubles[i].y) {
            minY = (meubles[i].y + meubles[i].hauteur);
          }
          if (meubles[num].y < meubles[i].y) {
            maxY = meubles[i].y-meubles[num].hauteur;
          }
          minYGlobal=Math.max(minY,minYGlobal);
          maxYGlobal=Math.min(maxY,maxYGlobal);
      }
    }
  }
  return [minYGlobal,maxYGlobal];
}

function getMaxAllowedWidth(num) {
  var bY;
  var aY = meubles[num].y + meubles[num].hauteur / 2;
  var deltaX;
  var maxWidth = 10e34;
  for (var i = 0; i < meubles.length; i++) {
    if (i != num) {
      bY = meubles[i].y + meubles[i].hauteur / 2;
      var intersectY = (Math.abs(aY - bY) * 2 < (meubles[num].hauteur + meubles[i].hauteur));
      if (intersectY) {
        if (meubles[num].x > meubles[i].x) {
          deltaX = (meubles[num].x) - (meubles[i].x + meubles[i].largeur / 2);
        }
        else {
          deltaX = (meubles[i].x - meubles[i].largeur / 2) - (meubles[num].x);
        }
        maxWidth = Math.min(maxWidth, deltaX);
      }
    }
  }
  return 2 * maxWidth;
}

function getMaxAllowedHeight(num) {
  var deltaY=10e34;
  var maxHeight = 10e34;
  for (var i = 0; i < meubles.length; i++) {
    if (i != num) {
      var intersectX = (Math.abs(meubles[num].x - meubles[i].x) * 2 < (meubles[num].largeur + meubles[i].largeur));
      if (intersectX) {
        if (meubles[num].y < meubles[i].y) {
          deltaY = meubles[i].y-meubles[num].y;
        }
        maxHeight = Math.min(maxHeight, deltaY);
      }
    }
  }
  return maxHeight;
}

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
  if (!rayCastEnabled) return;
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
  if (raycastedBloc>-1) changeCurrentBlocFromClick(raycastedBloc);
  if (raycastedMeuble>-1) changeCurrentMeubleFromClick(raycastedMeuble);
}

function onCanvasDrag () {
  if (raycastedBloc>-1) console.log("pointer=",pointer);
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

function getGlobalBoundingBoxCenter () {
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
  camera.translateZ((dist-(controls.getDistance(cameraTarget)))/100);
  //let target=cameraTarget;
  controls.target.x-=((controls.target.x-(boundingBoxCenter.x))/100);
  controls.target.y-=((controls.target.y-(boundingBoxCenter.y))/100);
  controls.target.z-=((controls.target.z-(boundingBoxCenter.z))/100);
  camera.updateMatrixWorld();
  renderer.render( scene, camera );
  
  var delta = clock.getDelta();
  
  if ( mixerMaterial ) {
    mixerMaterial.update( delta );
  }
}

function placeMeuble(indiceMeuble) {
  meubleRoot[indiceMeuble].position.set(
    meubles[indiceMeuble].x,
    meubles[indiceMeuble].hauteur / 2 + meubles[indiceMeuble].y,
    meubles[indiceMeuble].profondeur / 2);
}

function updateSelectableBlocs(indiceMeuble) {
  selectableBloc = [];
  let root = meubleRoot[indiceMeuble].children[0];
  for (var i = 0; i < meubles[indiceMeuble].nbBlocs; i++) {
    var oneSelectableBloc = root.getObjectByName("BoiteSelectionBloc" + i);
    if (oneSelectableBloc) selectableBloc.push(oneSelectableBloc);
  }
  dragBlocControls.setObjects(selectableBloc);
}


function updateMeuble (indiceMeuble) {
  console.log(meubles[indiceMeuble].largeur);
  selectableBloc=[];
  meubleRoot[indiceMeuble].children[0].children=[];
  for (var i=0; i<meubles[indiceMeuble].nbBlocs; i++) {
    updateBloc(indiceMeuble,i);
    meubleRoot[indiceMeuble].children[0].add(blocRoot[i]);
  }
  var cubeTemp=meubleRoot[indiceMeuble].getObjectByName("cube"+indiceMeuble);
if (cubeTemp)                  //children 1 = cubes de selection
    {
      meubleRoot[indiceMeuble].remove(cubeTemp);
      geometry.dispose();
      material.dispose();
      delete selectableMeuble[indiceMeuble];
    }
    let delta = 0.1*indiceMeuble;
    //geometry = new THREE.BoxGeometry(meubles[indiceMeuble].largeur + epsilon + delta, meubles[indiceMeuble].hauteur + epsilon + delta, meubles[indiceMeuble].profondeur + epsilon + delta);
    geometry = RoundEdgedBox( meubles[indiceMeuble].largeur+delta+ epsilon, meubles[indiceMeuble].hauteur+delta+ epsilon, meubles[indiceMeuble].profondeur+delta+ epsilon , 3 , 2,2,2,2)
    cube = new THREE.Mesh(geometry, materialSelectionMeuble);
    cube.numero=indiceMeuble;
    cube.name="cube"+indiceMeuble;
    cube.visible=false;
  meubleRoot[indiceMeuble].add(cube);
  selectableMeuble[indiceMeuble]=cube;
  placeMeuble(indiceMeuble);
  dragBlocControls.setObjects(selectableBloc);
}

function changeBlocsQuantity (indiceMeuble) {
  for (var i=0; i<maxBlocs; i++) {
    if (((typeof meubles[indiceMeuble].bloc[i]))=="undefined") {meubles[indiceMeuble].bloc[i] = new blocClass()}
     else {if (i>(meubles[indiceMeuble].nbBlocs-1)) {destroyBloc(indiceMeuble,i)}}
  }
  if (indiceCurrentBloc>(meubles[indiceMeuble].nbBlocs-1)) {indiceCurrentBloc=meubles[indiceMeuble].nbBlocs-1;}
}

function frameCamera () {
  //return;
  boundingBoxCenter = getGlobalBoundingBoxCenter();
  //controls.target = boundingBoxCenter;
  cameraTarget.position.set(boundingBoxCenter);
  //console.log("boudingbox = ",boundingBoxCenter);
  //console.log("bB width, Height = ",boundingBoxWidth,boundingBoxHeight);
}

function updateScene () {
  for (var i=0; i<meubles.length; i++) {
    updateMeuble(i);
  }
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
var large,largeS,largeB;
var elh,hautS,hautB;
var elX,elXS,elXB;
var elY,elYS,elYB;
var styleMenu;
var checkboxVertical;
var divSwitchVertical;

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
    initDrag();
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
  divSwitchVertical = document.getElementById("divSwitchVertical");
  checkboxVertical = document.getElementById("checkboxVertical");
  checkboxVertical.addEventListener("click", function switchVertical() {
    console.log("checkbox clicked");
    if (meubles[indiceCurrentMeuble].disposition=="vertical") meubles[indiceCurrentMeuble].disposition="horizontal";
    else meubles[indiceCurrentMeuble].disposition="vertical";
    computeBlocsSize(indiceCurrentMeuble);
    updateMeuble(indiceCurrentMeuble);
    frameCamera()} , true);
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
    //scene.add(poigneeRoot);
    //console.log("poigneRoot = ", poigneeRoot);
    for (var i = poigneeRoot.children.length; i > 0; i--) {
      poigneeGroup.add(poigneeRoot.children[i - 1]);
    }
    //console.log("poigneeGroup=", poigneeGroup);
    //scene.add(poigneeGroup);
    poigneeGroup.scale.set(100, 100, 100);
    updateScene();
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
  scene.remove(meubleRoot[num]);
  geometry.dispose();
  material.dispose();
  selectableMeuble.splice(num,1);
  meubleRoot.splice(num,1);
  geometry.dispose();
  material.dispose();
  if (meubles.length < (indiceCurrentMeuble+1)) indiceCurrentMeuble-=1;
}

function createNewMeuble() {
  indiceCurrentMeuble=meubles.length;
  meubles[indiceCurrentMeuble] = new meubleClass(indiceCurrentMeuble);
  meubleRoot[indiceCurrentMeuble] = new THREE.Object3D();
  meubleRoot[indiceCurrentMeuble].name = "meuble "+indiceCurrentMeuble;
  meubleRoot[indiceCurrentMeuble].position.set(0,0,0);
  let blocs = new THREE.Object3D();
  blocs.name="blocs";
  meubleRoot[indiceCurrentMeuble].add(blocs);
  var minX = -10e34;
  console.log('icm=',indiceCurrentMeuble);
  console.log('meubles[icm]',meubles[indiceCurrentMeuble]);
  if (indiceCurrentMeuble>0) {
    console.log("largeur meuble 0=",meubles[0].largeur/2+meubles[0].x+ meubles[1].largeur/2)

    for (var i=0; i<indiceCurrentMeuble; i++) {
      let currentMinX = meubles[i].x+meubles[i].largeur/2+ meubles[indiceCurrentMeuble].largeur/2;
      console.log("i=",i);
      console.log("minX,cmx =",minX,currentMinX);
      minX= Math.max(currentMinX,minX)
    }
    //let positionY=meubles[indiceCurrentMeuble-1].y+meubles[indiceCurrentMeuble-1].hauteur;
    meubles[indiceCurrentMeuble].x=minX;
  }
  updateMeuble(indiceCurrentMeuble);
  scene.add(meubleRoot[indiceCurrentMeuble]);
  frameCamera();
}

function destroyBloc(indiceMeuble, numBloc) {
    meubleRoot[indiceMeuble].children[0].remove(blocRoot[numBloc]);
    geometry.dispose();
    material.dispose();
    blocRoot[numBloc]=undefined;
    scene.remove( blocRoot[numBloc] );
    geometry.dispose();
    material.dispose();
}

function getElementBase (x,y,z,styleParam) {
  let geo = new THREE.BufferGeometry;
  //console.log(styleParam);
  if (styleParam == "rounded") {geo = RoundEdgedBox(x,y,z,0.5,1,1,1,1)}
  else {geo = new THREE.BoxGeometry( x,y,z )}
  //if (styleParam = "flat") 
  
  return geo;
}

function initializeBloc(indiceMeuble, numBloc) {
  let meuble = meubles[indiceMeuble];
  blocRoot[numBloc] = new THREE.Object3D();
  blocRoot[numBloc].name = "Bloc "+numBloc;
  var h;
  var l;
  var p;
  if (meuble.disposition=="horizontal") {l=meuble.bloc[numBloc].taille; h=meuble.hauteur;}
  if (meuble.disposition=="vertical") {l=meuble.largeur; h=meuble.bloc[numBloc].taille ;} 
  p=meuble.profondeur;
  //cadre
  geometry = new THREE.BoxGeometry( l, epaisseur, p );
  plancheBas = new THREE.Mesh( geometry, material );
  plancheBas.name = "plancheBas";
  plancheHaut = new THREE.Mesh( geometry, material );
  plancheHaut.name = "plancheHaut";
  plancheBas.position.set(0,-h/2+epaisseur/2,0);
  plancheHaut.position.set(0,h/2-epaisseur/2,0);
  geometry = new THREE.BoxGeometry( epaisseur, h-epaisseur*2, p );
  plancheDroite = new THREE.Mesh( geometry, material );
  plancheDroite.name = "plancheDroite";
  plancheGauche = new THREE.Mesh( geometry, material );
  plancheGauche.name = "plancheGauche";
  plancheDroite.position.set(-l/2 + epaisseur/2,0,0);
  plancheGauche.position.set(l/2 - epaisseur/2,0,0);
  blocRoot[numBloc].add(plancheBas,plancheHaut,plancheDroite,plancheGauche);
  //boîte de sélection
  //geometry = new THREE.BoxGeometry( meuble.bloc[numBloc].largeur+epsilon, meuble.hauteur+epsilon, meuble.profondeur+epsilon );
  geometry = RoundEdgedBox(l+epsilon, h+epsilon, p+epsilon,2,1,1,1,1);
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
      geometry = getElementBase(l - 0.25 * epaisseur, h-0.25*epaisseur, epaisseur,style);
      etagere[0] = new THREE.Mesh(geometry, materialTiroirs);
      etagere[0].name = "porte 0";
      //poignee
      let poigneeB = poigneeGroup.clone(true);
      poigneeB.name="poignee";
      etagere[0].add(poigneeB);
      let deltaX=l/2 - 4*taillePoignees;
      if (deltaX<0) deltaX=0;
      if (meuble.bloc[numBloc].ouverturePorte=="droite") {deltaX*=-1; poigneeB.rotateZ(Math.PI/2);}
      else poigneeB.rotateZ(-Math.PI/2);  // a soumettre à option
      poigneeB.position.set(deltaX,0,epaisseur);
      etagere[0].position.set(0,0,meuble.profondeur/2);
      blocRoot[numBloc].add(etagere[0]);
    }
    else {
      //porte gauche
      geometry = getElementBase(l/2 - 0.25 * epaisseur, h-0.25*epaisseur, epaisseur,style);
      etagere[0] = new THREE.Mesh(geometry, materialTiroirs);
      etagere[0].name = "porte 0";
      //poignee gauche
      let poigneeB = poigneeGroup.clone(true);
      poigneeB.rotateZ(-Math.PI/2);  // a soumettre à option
      poigneeB.name="poignee";
      etagere[0].add(poigneeB);
      let deltaX=l/4 - 4*taillePoignees;
      if (4*taillePoignees>l/4) deltaX=0;
      poigneeB.position.set(deltaX,0,epaisseur);
      etagere[0].position.set(-l/4,0,p/2);
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
      etagere[1].position.set(l/4,0,p/2);
      blocRoot[numBloc].add(etagere[1]);
    }
  }
  
  //etageres
  if (meuble.bloc[numBloc].type == "Etageres") {
    var step = (h-2*epaisseur)/(meuble.bloc[numBloc].etageres+1);
    for (var i = 0; i < meuble.bloc[numBloc].etageres; i++) {
      //geometry = getElementBase(meuble.bloc[numBloc].largeur - 2 * epaisseur, epaisseur, meuble.profondeur - epaisseur,style);
      geometry = new THREE.BoxGeometry(l - 2 * epaisseur, epaisseur, p - epaisseur);
      etagere[i] = new THREE.Mesh(geometry, material);
      etagere[i].name = "etagere "+i;
      var position = step * (0.5 + i - meuble.bloc[numBloc].etageres / 2);
      etagere[i].position.set(0, position, 0);
      blocRoot[numBloc].add(etagere[i]);
    }
  }

  //tiroirs
  if (meuble.bloc[numBloc].type == "Tiroirs") {
    var step = (h-0.25*epaisseur)/(meuble.bloc[numBloc].etageres+1);
    for (var i = 0; i < meuble.bloc[numBloc].etageres+1; i++) {
      let xl = l - 0.25 * epaisseur;
      let yl = (h - epaisseur)/(meuble.bloc[numBloc].etageres+1);//-epaisseur/4;
      let zl = epaisseur;
      //geometry = new THREE.BoxGeometry(xl, yl, zl);
      geometry = getElementBase(xl,yl,zl,style);
      etagere[i] = new THREE.Mesh(geometry, materialTiroirs);
      etagere[i].name = "tiroir "+i;
      //poignees
      let poigneeB = poigneeGroup.clone(true);
      poigneeB.name="poignee";
      etagere[i].add(poigneeB);
      poigneeB.position.set(0,0,epaisseur);//epaisseur+taillePoignees);
      var positionY = step * (i - meuble.bloc[numBloc].etageres / 2);
      var positionZ = p/2;
      etagere[i].position.set(0, positionY, positionZ);
      blocRoot[numBloc].add(etagere[i]);
    }
  }
 
  //positionnement bloc dans meuble
  if (meuble.disposition=="horizontal") {
    var blocPosition = -meuble.largeur / 2;
  }
  else {var blocPosition = -meuble.hauteur / 2 ;}
    if (numBloc > 0) {
      for (var i = 0; i < numBloc; i++) {
        blocPosition += meuble.bloc[i].taille;
      }
    }
    blocPosition += meuble.bloc[numBloc].taille / 2;
    if (meuble.disposition=="horizontal") { 
      blocRoot[numBloc].position.set(blocPosition, 0, 0)
    } 
    else {
      blocRoot[numBloc].position.set(0, blocPosition, 0);
    }
}

function updateBloc (indiceMeuble, numBloc) {
  initializeBloc(indiceMeuble, numBloc);
}

function computeBlocsSize(indiceMeuble) {
  let meuble = meubles[indiceMeuble]; 
  if (meubles[indiceMeuble].disposition == "horizontal") {
    var largeurSommeBlocs = 0;
    for (var i=0; i<meuble.nbBlocs; i++) {
      largeurSommeBlocs += meuble.bloc[i].taille;
    }
    var ratio = meuble.largeur/largeurSommeBlocs;
    for (var i=0; i<meuble.nbBlocs; i++) {
      meuble.bloc[i].taille *= ratio;
    } 
  }
  if (meubles[indiceMeuble].disposition == "vertical") {
    let meuble = meubles[indiceMeuble];  
    var hauteurSommeBlocs = 0;
    for (var i=0; i<meuble.nbBlocs; i++) {
      hauteurSommeBlocs += meuble.bloc[i].taille;
    }
    var ratio = meuble.hauteur/hauteurSommeBlocs;
    for (var i=0; i<meuble.nbBlocs; i++) {
      meuble.bloc[i].taille *= ratio;
    } 
  }
}

function RoundEdgedBox(width, height, depth, radius, widthSegments, heightSegments, depthSegments, smoothness) {
  depth<smoothness ? smoothness : depth;
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
  let retour = createSliderWithoutListener(objet,key,nom,value,type,min,max);
      let divParam = retour[0];
      let s=retour[1];
      let b=retour[2];
      s.addEventListener("input", function () {b.value = s.value; objet[key]=+s.value; }, false);
      b.addEventListener("change", function () {s.value = b.value; objet[key]=+s.value; }, false);
      return(divParam);
}

function createSliderWithoutListener(objet,key,nom,value,type,min,max) {
  let divParam = document.createElement("div");
      let divParamName = document.createElement("div");
      let l = document.createElement("label");
      l.innerHTML = nom;
      divParamName.append(l);
      divParam.append(divParamName);
      let s = document.createElement("input");
      s.type="range";
      s.name="s."+nom;
      s.value=value;
      s.min=min;
      s.max=max;
      s.classList.add("inputSlider");
      divParam.append(s);
      let b = document.createElement("input");
      b.type="number";
      b.name="b."+nom;;
      b.value=value;
      b.min=min;
      b.max=max;
      b.classList.add("inputValue");
      divParam.append(b);
      //console.log("done");
      return([divParam,s,b]);
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
  buttonDeleteMeuble.after(divSwitchVertical);
  meubleSliders=document.createElement("div");
  meubleSliders.id="meubleSliders";
  meubleDiv.append(meubleSliders);
}

function changeCurrentMeuble(num) {
  let indicePreviousMeuble = indiceCurrentMeuble;
  indiceCurrentMeuble = num;
  if (meubleRoot[indicePreviousMeuble].cube) meubleRoot[indicePreviousMeuble].cube.visible=false;
  if (meubles[indiceCurrentMeuble].disposition=="vertical") {console.log("checked"); checkboxVertical.checked=true;} else {checkboxVertical.checked=false;}
  updateInterfaceMeuble();
  updateInterfaceBlocs(indiceCurrentMeuble);
  updateSelectableBlocs(indiceCurrentMeuble);
  console.log("meuble changed");
  console.log("meubles[num].x=",meubles[num].x);
  console.log("meubleRoot[num].position=",meubleRoot[num].position);
}

function changeCurrentMeubleFromClick(num) {
  changeCurrentMeuble(num);
  listMeublesName.classList.add("animationMeublesName");
  checkRaycast();
  checkRaycast();
}

function onMaterialAnimationFinish (num) {
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
  startMaterialAnimationMeuble(num);
  changeCurrentMeuble(num);
  checkRaycast();
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
  listMeublesName.value=meuble.name;
  meubleDiv.insertBefore(listMeublesName,listMeublesPopup);
  for (var i=0;i<meubles.length;i++) {
    let o = document.createElement("option");
    o.value = i;
    o.innerHTML = meubles[i].name;
    listMeublesHTML.append(o);
  }
  elh=createSlider(meuble,"hauteur","Hauteur",meuble.hauteur,0,10,250);
  //elh.childNodes[1].addEventListener("input",function eventElhInput() {computeBlocsSize(indiceMeuble); updateInterfaceBlocs(indiceMeuble); updateMeuble(indiceCurrentMeuble);frameCamera();},false);
  //elh.childNodes[2].addEventListener("change",function eventElhChange() {computeBlocsSize(indiceMeuble); updateInterfaceBlocs(indiceMeuble); updateMeuble(indiceCurrentMeuble);frameCamera();},false);
  meubleSliders.append(elh);

  hautS=elh.childNodes[1];
  hautB=elh.childNodes[2];
  hautS.addEventListener("input",function() {eventHauteurInput(indiceMeuble)},false);
  hautB.addEventListener("change",function() {eventHauteurInput(indiceMeuble)},false);

  function eventHauteurInput(indiceMeuble) {
    var hauteur=+hautS.value; //forçage de type
    var maxHeight = getMaxAllowedHeight(indiceMeuble);
    meubles[indiceMeuble].hauteur = (hauteur<maxHeight) ? hauteur : maxHeight;
    computeBlocsSize(indiceMeuble);
    updateInterfaceBlocs(indiceMeuble);
    updateMeuble(indiceCurrentMeuble);
    updateInterfaceHauteur(indiceMeuble);
    frameCamera();
  }

  let elp=createSlider(meuble,"profondeur","Profondeur",meuble.profondeur,0,10,250);
  elp.childNodes[1].addEventListener("input",function eventElpInput() {updateMeuble(indiceCurrentMeuble);frameCamera();},false);
  elp.childNodes[2].addEventListener("change",function eventElpChange() {updateMeuble(indiceCurrentMeuble);frameCamera();},false);
  meubleSliders.append(elp);

  large=createSlider(meuble,"largeur","Largeur",meuble.largeur,0,10,500);
  //large.childNodes[1].addEventListener("input",function eventLargeInput() {computeBlocsSize(indiceMeuble); updateInterfaceBlocs(indiceMeuble); updateMeuble(indiceCurrentMeuble);frameCamera();},false);
  //large.childNodes[2].addEventListener("change",function eventLargeChange() {computeBlocsSize(indiceMeuble); updateInterfaceBlocs(indiceMeuble); updateMeuble(indiceCurrentMeuble);frameCamera();},false);
  meubleSliders.append(large);

  largeS=large.childNodes[1];
  largeB=large.childNodes[2];
  largeS.addEventListener("input",function() {eventLargeInput(indiceMeuble)},false);
  largeB.addEventListener("change",function() {eventLargeInput(indiceMeuble)},false);

  function eventLargeInput(indiceMeuble) {
    var largeur=+largeS.value; //forçage de type
    var maxWidth = getMaxAllowedWidth(indiceMeuble);
    meubles[indiceMeuble].largeur = (largeur<maxWidth) ? largeur : maxWidth;
    computeBlocsSize(indiceMeuble);
    updateInterfaceBlocs(indiceMeuble);
    updateMeuble(indiceCurrentMeuble);
    updateInterfaceLargeur(indiceMeuble);
    frameCamera();
  }
  
  let elnbb = createSlider(meuble,"nbBlocs","Nombre de blocs",meuble.nbBlocs,0,1,maxBlocs);
  elnbb.childNodes[1].addEventListener("input",function eventElnbbInput() {onChangeBlocsQuantity(indiceMeuble)},false);
  elnbb.childNodes[2].addEventListener("change",function eventElnbbChange() {onChangeBlocsQuantity(indiceMeuble)},false);
  meubleSliders.append(elnbb);

  let retour = createSliderWithoutListener(meuble,"x","Placement horizontal",meuble.x,0,-300,300);
  elX=retour[0];
  elXS=retour[1];
  elXB=retour[2];
  elXS.addEventListener("input",function () {eventElxInputSlider(indiceMeuble)},false);
  elXB.addEventListener("change",function () {eventElxInputBox(indiceMeuble)},false);
  meubleSliders.append(elX);

  function eventElxInputSlider(indiceMeuble) {
    var x=+elXS.value; //forçage de type
    eventElxInput(indiceMeuble,x);
  }

  function eventElxInputBox(indiceMeuble) {
    var x=+elXB.value; //forçage de type
    eventElxInput(indiceMeuble,x);
  }

  function eventElxInput(indiceMeuble,x) {
    var translateX = getLimitTranslationX(indiceMeuble);
    console.log("translateX=",translateX);
    x = (x<translateX[0]) ? translateX[0] : x;
    x = (x>translateX[1]) ? translateX[1] : x;
    meubles[indiceMeuble].x = x;
    computeBlocsSize(indiceMeuble);
    updateInterfaceBlocs(indiceMeuble);
    updateMeuble(indiceCurrentMeuble);
    placeMeuble(indiceMeuble);
    elXS.value = meubles[indiceMeuble].x;
    elXB.value = elXS.value;
    frameCamera();
  }

  retour = createSliderWithoutListener(meuble,"y","Placement vertical",meuble.y,0,0,300);
  elY=retour[0];
  elYS=retour[1];
  elYB=retour[2];
  elYS.addEventListener("input",function () {eventElyInputSlider(indiceMeuble)},false);
  elYB.addEventListener("change",function () {eventElyInputBox(indiceMeuble)},false);
  meubleSliders.append(elY);

  function eventElyInputSlider(indiceMeuble) {
    var y=+elYS.value; //forçage de type
    eventElyInput(indiceMeuble,y);
  }

  function eventElyInputBox(indiceMeuble) {
    var y=+elYB.value; //forçage de type
    eventElyInput(indiceMeuble,y);
  }

  function eventElyInput(indiceMeuble,y) {
    var translateY = getLimitTranslationY(indiceMeuble);
    console.log("translateY=",translateY);
    y = (y<translateY[0]) ? translateY[0] : y;
    y = (y>translateY[1]) ? translateY[1] : y;
    meubles[indiceMeuble].y = y;
    computeBlocsSize(indiceMeuble);
    updateInterfaceBlocs(indiceMeuble);
    updateMeuble(indiceCurrentMeuble);
    placeMeuble(indiceMeuble);
    elYS.value = meubles[indiceMeuble].y;
    elYB.value = elYS.value;
    frameCamera();
  }


  let cr = document.createElement("p");
  meubleDiv.append(cr);
  if (meubles[indiceMeuble].disposition=="vertical") {checkboxVertical.checked=true} else {checkboxVertical.checked=false}
}

function updateInterfaceLargeur(indiceMeuble) {
  large.childNodes[1].value = meubles[indiceMeuble].largeur;
  large.childNodes[2].value = meubles[indiceMeuble].largeur;
}

function updateInterfaceHauteur(indiceMeuble) {
  elh.childNodes[1].value = meubles[indiceMeuble].hauteur;
  elh.childNodes[2].value = meubles[indiceMeuble].hauteur;
}

function updateInterfaceX(indiceMeuble) {
  elX.childNodes[1].value = meubles[indiceMeuble].x;
  elX.childNodes[2].value = meubles[indiceMeuble].x;
}

function updateInterfaceY(indiceMeuble) {
  elY.childNodes[1].value = meubles[indiceMeuble].y;
  elY.childNodes[2].value = meubles[indiceMeuble].y;
}

function changeCurrentBlocFromClick(num) {
  indiceCurrentBloc = num;
  updateInterfaceBlocs(indiceCurrentMeuble);
  listBlocsName.classList.add("animationBlocsName");
}

function onChangeBlocsQuantity(indiceMeuble) {
  changeBlocsQuantity(indiceMeuble);
  meubles[indiceMeuble].calculTaille();
  updateInterfaceBlocs(indiceMeuble);
  updateInterfaceLargeur(indiceMeuble);
  updateInterfaceHauteur(indiceMeuble);
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
  let slideLargeurBloc = createSlider(meuble.bloc[numBloc],"taille","Taille du bloc",meuble.bloc[numBloc].taille,0,10,200);
  blocsSliders.append(slideLargeurBloc);
  slideLargeurBloc.childNodes[1].addEventListener("input",function (){
    meuble.calculTaille(); 
    updateInterfaceLargeur(indiceMeuble); 
    updateInterfaceHauteur(indiceMeuble); 
    updateMeuble(indiceMeuble);
    frameCamera();}
    ,false);
  slideLargeurBloc.childNodes[2].addEventListener("change",function (){
    meuble.calculTaille();
    updateInterfaceLargeur(indiceMeuble);
    updateInterfaceHauteur(indiceMeuble); 
    updateMeuble(indiceMeuble);
    frameCamera();}
    ,false);
  let sliderEtageres = createSlider(meuble.bloc[numBloc],"etageres","Nombre d'étagères",meuble.bloc[numBloc].etageres,0,0,maxEtageres);
  sliderEtageres.childNodes[1].addEventListener("input",function () {updateMeuble(indiceCurrentMeuble);frameCamera();},false);
  sliderEtageres.childNodes[2].addEventListener("change",function () {updateMeuble(indiceCurrentMeuble);frameCamera();},false);
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
  updateMeuble(indiceCurrentMeuble);
  frameCamera();
}

function onClickOuverturePorteButton (buttonSource,buttonB,indiceMeuble,numBloc) {
  buttonSource.classList.remove("buttonOff");
  buttonSource.classList.add("buttonOn");
  buttonB.classList.remove("buttonOn");
  buttonB.classList.add("buttonOff");
  if (meubles[indiceMeuble].bloc[numBloc].ouverturePorte  == "gauche") {meubles[indiceMeuble].bloc[numBloc].ouverturePorte = "droite"}
  else {meubles[indiceMeuble].bloc[numBloc].ouverturePorte = "gauche"}
  updateMeuble(indiceCurrentMeuble);
  frameCamera();
}

function destroyButtonsForPortes () {
  divPortes.remove();
  divPortes=undefined;
}

function destroyButtonsForOuverturePortes () {
  divOuverturePortes.remove();
  divOuverturePortes=undefined;
}

window.addEventListener("DOMContentLoaded", initializeScene);
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
import { RoundedBoxGeometry } from 'three/examples/jsm/Addons.js';
import { poignees } from './poignees';
import { initPoigneesList } from "./poignees.js";
import { initListTexturesMeuble, imagesMeuble, image, imagesPath } from "./textures.js"

var imagesPlateau = new Array;

class configurationClass {
  constructor () {
    this.style = "style 1";
    meubles
  }
}

class Bloc {
  constructor (i) {
    this.taille = 40;
    this.etageres = 3;
    this.type="Tiroirs";
    this.ouverturePorte="gauche";
    this.nombrePortes="1";
    this.etageresVerticales=false;
    this.IsRentrant=false;
    this.numero=i;
    this.etagereY=[];
  }
}

class Meuble {
  constructor (num) {
    this.name = "Meuble "+(num+1);
    //this.id = num;
    this.hauteur = 50;
    this.largeur = 140;
    this.profondeur = 50;
    this.nbBlocs = 3;
    this.x = 0;
    this.y = 0;
    this.bloc = new Array;
    this.numero = num;
    this.disposition = "horizontal";
    for (var i=0; i<this.nbBlocs; i++) {this.bloc[i] = new Bloc(i)}
    this.calculTaille();
    this.hasPlateau=false;  //////////////////////////////initialiser bouton et menus couleurs
    this.hasCadre=false;
    this.hasSocle=false;
    this.hasPied=false;
    this.IsSuspendu=true;
    this.offsetPoignees=0;
    //this.blocRoot=[];    //Racine 3D de chaque bloc
    this.isSousMeuble=false;
    this.createGeometryRoot();
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

  getLargeurReelle() {
    return (this.largeur+this.hasCadre*epaisseurCadre*2);
  }

  getHauteurReelle() {
    var bordSup=Math.max(this.hasCadre*epaisseurCadre,this.hasPlateau*epaisseurPlateau);
    return (this.hauteur+this.hasCadre*epaisseurCadre+this.hasSocle*hauteurSocle+this.hasPied*hauteurPied+bordSup);
  }

  createGeometryRoot() {
    this.root = new THREE.Object3D();
    this.root.name = "meuble " + this.numero;
    this.root.position.set(0, 0, 0);
    var geometries = new THREE.Object3D();
    geometries.name = "geometries";
    this.root.add(geometries);
    var handlesMeuble = new THREE.Object3D();
    handlesMeuble.name = "handlesMeuble";
    this.root.add(handlesMeuble);
    scene.add(this.root);
  }

  placeMeuble() {
    let y=this.hauteur / 2 + this.y;
    if (this.hasCadre) y+=epaisseurCadre;
    if (this.hasSocle) y+=hauteurSocle;
    if (this.hasPied) y+=hauteurPied;
    this.root.position.set(
      this.x,
      y,
      this.profondeur / 2);
  }

  getNewPlateau() {
    //plateau
    //if (this.hasPlateau) {
      let sx = this.largeur + 2 * debordPlateau;
      let sy = epaisseurPlateau;
      let sz = this.profondeur + debordPlateau;
      if (style == "Basique" || isPreviewOn) {
        geometry = new THREE.BoxGeometry(sx, sy, sz);
        plateau = new THREE.Mesh(geometry, [materialPlateauCote, materialPlateauCote, materialPlateau, materialPlateau, materialPlateauAvant, materialPlateauAvant])
      }
      else {
        geometry = RoundEdgedBox(sx, sy, sz, 0.5, 1, 1, 1, 1);
        plateau = new THREE.Mesh(geometry, materialPlateau);
      }

      plateau.position.set(0, this.hauteur / 2 + epaisseurPlateau / 2, debordPlateau / 2);
      plateau.name = "plateau";
      plateau.sx = sx;
      plateau.sy = sy;
      plateau.sz = sz;
      return plateau;
    //}
  }

  getNewSocle() {
    //socle
    //if (this.hasSocle) {
      geometry = new THREE.BoxGeometry(
        this.largeur,
        hauteurSocle,
        this.profondeur - retraitSocle);
      socle = new THREE.Mesh(geometry, material);
      let cadre = this.hasCadre * epaisseurCadre;
      socle.position.set(0, -this.hauteur / 2 - hauteurSocle / 2 - cadre, -retraitSocle);
      socle.name = "socle";
      return socle;
    //}
  }
    
  getNewPieds() {
    //pieds
    //if (this.hasPied) {
      geometry = new THREE.BoxGeometry(
        largeurPied,
        hauteurPied,
        largeurPied);
      let cadre = this.hasCadre * epaisseurCadre;

      piedA = new THREE.Mesh(geometry, material);
      piedA.position.set(
        -this.largeur / 2 + largeurPied / 2,
        -this.hauteur / 2 - hauteurPied / 2 - cadre,
        this.profondeur / 2 - largeurPied / 2);
      piedA.name = "piedA";
      //blocs.add(piedA);

      piedB = new THREE.Mesh(geometry, material);
      piedB.position.set(
        this.largeur / 2 - largeurPied / 2,
        -this.hauteur / 2 - hauteurPied / 2 - cadre,
        this.profondeur / 2 - largeurPied / 2);
      piedB.name = "piedB";
      //blocs.add(piedB);

      piedC = new THREE.Mesh(geometry, material);
      piedC.position.set(
        this.largeur / 2 - largeurPied / 2,
        -this.hauteur / 2 - hauteurPied / 2 - cadre,
        -this.profondeur / 2 + largeurPied / 2);
      piedC.name = "piedC";
      //blocs.add(piedC);

      piedD = new THREE.Mesh(geometry, material);
      piedD.position.set(
        -this.largeur / 2 + largeurPied / 2,
        -this.hauteur / 2 - hauteurPied / 2 - cadre,
        -this.profondeur / 2 + largeurPied / 2);
      piedD.name = "piedD";
      //blocs.add(piedD);

    //}
    let pieds = new THREE.Group()
    pieds.add(piedA,piedB,piedC,piedD);
    return pieds
  }

  getNewCadre () {
    //cadre meuble
    //if (this.hasCadre) {

      geometry = new THREE.BoxGeometry(
        this.largeur + 2 * epaisseurCadre - 0.05,
        epaisseurCadre,
        this.profondeur + debordCadre + 0.05);

      let cadreHaut = new THREE.Mesh(geometry, materialCadreCote, materialCadreCote, materialCadre, materialCadre, materialCadreAvant, materialCadreAvant);
      cadreHaut.position.set(0, this.hauteur / 2 + epaisseurCadre / 2, debordCadre);
      cadreHaut.name = "cadreHaut";
      //blocs.add(cadreHaut);

      let cadreBas = new THREE.Mesh(geometry, materialCadreCote, materialCadreCote, materialCadre, materialCadre, materialCadreAvant, materialCadreAvant);
      cadreBas.position.set(0, -this.hauteur / 2 - epaisseurCadre / 2, debordCadre);
      cadreBas.name = "cadreBas";
      //blocs.add(cadreBas);

      geometry = new THREE.BoxGeometry(
        epaisseurCadre,
        this.hauteur + 2 * epaisseurCadre - 0.05,
        this.profondeur + debordCadre);

      let cadreGauche = new THREE.Mesh(geometry, materialCadreCote, materialCadreCote, materialCadre, materialCadre, materialCadreAvant, materialCadreAvant);
      cadreGauche.position.set(-this.largeur / 2 - epaisseurCadre / 2, 0, debordCadre);
      cadreGauche.name = "cadreGauche";
      //blocs.add(cadreGauche);

      let cadreDroit = new THREE.Mesh(geometry, materialCadreCote, materialCadreCote, materialCadre, materialCadre, materialCadreAvant, materialCadreAvant);
      cadreDroit.position.set(this.largeur / 2 + epaisseurCadre / 2, 0, debordCadre);
      cadreDroit.name = "cadreDroit";
      //blocs.add(cadreDroit);
    //}
    let cadres=new THREE.Group();
    cadres.add(cadreHaut,cadreBas,cadreDroit,cadreGauche);
    return cadres;
  }
  
  updateGeometry() {
    let geometries = this.root.getObjectByName("geometries");
    geometries.children = [];
    geometry.dispose();
    material.dispose();
    //plateau
    if (this.hasPlateau) { geometries.add(this.getNewPlateau()); }
    //socle
    if (this.hasSocle) { geometries.add(this.getNewSocle()); }
    //pieds
    if (this.hasPied) { geometries.add(this.getNewPieds()); }
    //cadre meuble
    if (this.hasCadre) { geometries.add(this.getNewCadre()); }
    // blocs
    var blocs = new THREE.Object3D();
    blocs.name = "blocs";
    geometries.add(blocs);
    for (var i = 0; i < this.nbBlocs; i++) {
      let blocRoot = this.initializeBloc(i);
      blocs.add(blocRoot);
    }
  }

  getNewBoiteSelectionMeuble() {
    let delta = 0.1 * this.numero;
    let x=this.largeur + delta + epsilon;
    let y=this.hauteur + delta + epsilon;
    let z=this.profondeur + delta + epsilon;
    geometry = RoundEdgedBox(x, y, z, 3, 2, 2, 2, 2)
    cube = new THREE.Mesh(geometry, materialSelectionMeuble);
    cube.numero = this.numero;
    cube.name = "boiteSelectionMeuble" + this.numero;
    cube.shortName = "boiteSelectionMeuble";
    cube.visible = false;

    let coneHautMain=new THREE.Mesh(geometryConeHelper, materialHelper);
    let coneBasMain=new THREE.Mesh(geometryConeHelper, materialHelper);
    coneHautMain.shortName="cone";
    coneBasMain.shortName="cone";
    coneHautMain.position.set(0,3*epaisseurHandleBlocs+y/2,0);
    coneBasMain.position.set(0,-3*epaisseurHandleBlocs-y/2,0);

    let coneDroitMain=new THREE.Mesh(geometryConeHelper, materialHelper);
    let coneGaucheMain=new THREE.Mesh(geometryConeHelper, materialHelper);
    coneDroitMain.shortName="cone";
    coneGaucheMain.shortName="cone";
    coneDroitMain.position.set(3*epaisseurHandleBlocs+x/2,0,0);
    coneGaucheMain.position.set(-3*epaisseurHandleBlocs-x/2,0,0);

    coneBasMain.rotateX(Math.PI);
    coneDroitMain.rotateZ(-Math.PI/2);
    coneGaucheMain.rotateZ(Math.PI/2);

    cube.add(coneHautMain,coneBasMain,coneGaucheMain,coneDroitMain);
    return cube;
  }

  getNewBoiteManipulationHandles () {
    let handleMeubleRoot=new THREE.Object3D();
    /* geometry = new THREE.BoxGeometry(
      this.largeur + epaisseur+0.05,
      epaisseurHandleBlocs,
      this.profondeur + epaisseur+0.05); */
    //geometry
   /*  geometry = RoundEdgedBox(
        this.largeur + 2*epaisseur+0.05,
        epaisseurHandleBlocs,
        this.profondeur + 2*epaisseur+0.05,
        2,1,1,1,1); */
    geometry = new THREE.BoxGeometry(
      this.largeur + 4*epaisseur+0.05,
        epaisseurHandleBlocs,
        this.profondeur + 4*epaisseur+0.05);
    let handleMeubleHaut = new THREE.Mesh(geometry, materialSelectionMeuble);
    handleMeubleHaut.position.set(0, this.hauteur / 2, 0);
    //console.log("here");
    handleMeubleHaut.visible=false;
    handleMeubleHaut.name = "handleMeubleHaut";
    handleMeubleHaut.shortName = "handleMeuble";
    let coneHaut=new THREE.Mesh(geometryConeHelper, materialHelper);
    let coneBas=new THREE.Mesh(geometryConeHelper, materialHelper);
    coneHaut.shortName="cone";
    coneBas.shortName="cone";
    handleMeubleHaut.add(coneHaut,coneBas);
    coneHaut.position.set(0,3*epaisseurHandleBlocs,0);
    coneBas.position.set(0,-3*epaisseurHandleBlocs,0);
    coneBas.rotateX(Math.PI);
    handleMeubleRoot.add(handleMeubleHaut);

    //to keep poignee inf
    /*let handleMeubleBas = new THREE.Mesh(geometry, materialSelectionMeuble);
    handleMeubleBas.position.set(0, -this.hauteur / 2 - epaisseurHandleBlocs / 2, 0);
    handleMeubleBas.visible=false;
    handleMeubleBas.name = "handleMeubleBas";
    handleMeubleBas.shortName = "handleMeuble";
    blocs.add(handleMeubleBas);*/

    geometry = new THREE.BoxGeometry(
      epaisseurHandleBlocs,
      this.hauteur + 4 * epaisseur - 0.05,
      this.profondeur+4*epaisseur);

    let handleMeubleGauche = new THREE.Mesh(geometry, materialSelectionMeuble);
    handleMeubleGauche.position.set(-this.largeur / 2, 0, 0);
    handleMeubleGauche.visible=false;
    handleMeubleGauche.name = "handleMeubleGauche";
    handleMeubleGauche.shortName = "handleMeuble";
    handleMeubleRoot.add(handleMeubleGauche);

    let coneGaucheGauche=new THREE.Mesh(geometryConeHelper, materialHelper);
    let coneDroitGauche=new THREE.Mesh(geometryConeHelper, materialHelper);
    coneGaucheGauche.shortName="cone";
    coneDroitGauche.shortName="cone";

    handleMeubleGauche.add(coneGaucheGauche,coneDroitGauche);
    coneGaucheGauche.position.set(-3*epaisseurHandleBlocs,0,0);
    coneDroitGauche.position.set(3*epaisseurHandleBlocs,0,0);
    coneGaucheGauche.rotateZ(Math.PI/2);
    coneDroitGauche.rotateZ(-Math.PI/2);

    let handleMeubleDroit = new THREE.Mesh(geometry, materialSelectionMeuble);
    handleMeubleDroit.position.set(this.largeur / 2, 0, 0);
    handleMeubleDroit.visible=false;
    handleMeubleDroit.name = "handleMeubleDroit";
    handleMeubleDroit.shortName = "handleMeuble";
    handleMeubleRoot.add(handleMeubleDroit);

    let coneGaucheDroit=new THREE.Mesh(geometryConeHelper, materialHelper);
    let coneDroitDroit=new THREE.Mesh(geometryConeHelper, materialHelper);
    coneGaucheDroit.shortName="cone";
    coneDroitDroit.shortName="cone";

    handleMeubleDroit.add(coneGaucheDroit,coneDroitDroit);
    coneGaucheDroit.position.set(-3*epaisseurHandleBlocs,0,0);
    coneDroitDroit.position.set(3*epaisseurHandleBlocs,0,0);
    coneGaucheDroit.rotateZ(Math.PI/2);
    coneDroitDroit.rotateZ(-Math.PI/2);

    return handleMeubleRoot;
  }

  updateMeuble() {
    this.updateGeometry();
    let blocs = this.root.getObjectByName("blocs");
    let geometries = this.root.getObjectByName("geometries");
    let handlesMeuble = this.root.getObjectByName("handlesMeuble");
    
    handlesMeuble.children=[];
    geometry.dispose();
    material.dispose();

    if (!isPreviewOn) {
    
    //boite de sélection
    handlesMeuble.add(this.getNewBoiteSelectionMeuble());

    selectableHandleMeuble = [];

    handlesMeuble.add(this.getNewBoiteManipulationHandles());
    
    updateAllSelectable();
  }
    this.placeMeuble();
    
  }

  initializeBloc(numBloc) {
    let blocRoot = new THREE.Object3D();
    blocRoot.name = "Bloc "+numBloc;
    blocRoot.numero=numBloc;
    var h;
    var l;
    var p;
    if (this.disposition=="horizontal") {l=this.bloc[numBloc].taille; h=this.hauteur;}
    if (this.disposition=="vertical") {l=this.largeur; h=this.bloc[numBloc].taille ;} 
    p=this.profondeur;

    //cadre bloc
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
    plancheDroite.numBloc = numBloc;
    plancheGauche = new THREE.Mesh( geometry, material );
    plancheGauche.name = "plancheGauche";
    plancheGauche.numBloc = numBloc;
    plancheDroite.position.set(-l/2 + epaisseur/2,0,0);
    plancheGauche.position.set(l/2 - epaisseur/2,0,0);
    blocRoot.add(plancheBas,plancheHaut,plancheDroite,plancheGauche);

    if (!isPreviewOn) {
      //cadre de sélection pour ajustement tailles
      geometry = new THREE.BoxGeometry( epaisseurHandleBlocs, h+2*epaisseur, p+2*epaisseur );
      let coneG = new THREE.Mesh( geometryConeHelper, materialSelectionMeuble);
      let coneD = new THREE.Mesh( geometryConeHelper, materialSelectionMeuble);
      coneG.scale.set(0.8,0.8,0.8);
      coneD.scale.set(0.8,0.8,0.8);

      if (this.disposition == "horizontal") {
        let handleBlocGauche = new THREE.Mesh(geometry, materialSelectionBloc);
        handleBlocGauche.name = "handleBlocGauche" + numBloc;
        handleBlocGauche.numBloc = numBloc;
        handleBlocGauche.shortName = "handleBloc";
        handleBlocGauche.position.set(-l / 2, 0, 0);

        //selectableHandleBloc.push(handleBlocGauche); // à verifier ça
        handleBlocGauche.add(coneG,coneD);
        coneG.rotateZ(Math.PI/2);
        coneG.position.set(-2*epaisseurHandleBlocs,0,0);
        coneD.rotateZ(-Math.PI/2);
        coneD.position.set(2*epaisseurHandleBlocs,0,0);
        handleBlocGauche.visible = false;
        blocRoot.add(handleBlocGauche);

        if (numBloc == this.nbBlocs - 1) {
          let handleBlocDroit = new THREE.Mesh(geometry, materialSelectionBloc);
          handleBlocDroit.name = "handleBlocDroit";
          handleBlocDroit.numBloc = numBloc;
          handleBlocDroit.shortName = "handleBloc";
          let coneGD = new THREE.Mesh(geometryConeHelper, materialSelectionMeuble);
          let coneDD = new THREE.Mesh(geometryConeHelper, materialSelectionMeuble);
          coneGD.scale.set(0.8, 0.8, 0.8);
          coneDD.scale.set(0.8, 0.8, 0.8);
          handleBlocDroit.add(coneGD, coneDD);
          coneGD.rotateZ(Math.PI / 2);
          coneGD.position.set(-2 * epaisseurHandleBlocs, 0, 0);
          coneDD.rotateZ(-Math.PI / 2);
          coneDD.position.set(2 * epaisseurHandleBlocs, 0, 0);
          handleBlocGauche.visible = false;
          blocRoot.add(handleBlocGauche);
          handleBlocDroit.position.set(l / 2, 0, 0);
          //selectableHandleBloc.push(handleBlocDroit); // à verifier si pas fait 2 fois
          handleBlocDroit.visible = false;
          blocRoot.add(handleBlocDroit);
        }
      }
      else { //vertical

        geometry = new THREE.BoxGeometry(l+epaisseur, epaisseurHandleBlocs, p+epaisseur);

        let handle = new THREE.Mesh(geometry, materialSelectionBloc);
        handle.name = "handleBloc" + numBloc;
        handle.numBloc = numBloc;
        handle.shortName = "handleBloc";
        handle.position.set(0, h / 2, 0);

        handle.add(coneG,coneD);
        //coneG.rotateZ(Math.PI/2);
        coneG.position.set(0,2*epaisseurHandleBlocs,0);
        coneD.rotateZ(Math.PI);
        coneD.position.set(0,-2*epaisseurHandleBlocs,0);

        //selectableHandleBloc.push(cadre);
        handle.visible = false;
        blocRoot.add(handle);
      }
    }

    //portes
    var porte=[];
    if (this.bloc[numBloc].type == "Portes") {
      var offset = this.bloc[numBloc].IsRentrant*epaisseur;
      if (this.bloc[numBloc].nombrePortes == "1") {
        geometry = getElementBase(l - 0.25 * epaisseur-2*offset, h-0.25*epaisseur-2*offset, epaisseur,style);
        porte[0] = new THREE.Mesh(geometry, materialTiroirs);
        porte[0].name = "porte 0";
        //poignee
        let poigneeB = poigneeGroup.clone(true);
        poigneeB.name="poignee";
        porte[0].add(poigneeB);
        let deltaX=l/2 - 4*taillePoignees;
        if (deltaX<0) deltaX=0;
        if (this.bloc[numBloc].ouverturePorte=="droite") {deltaX*=-1; poigneeB.rotateZ(Math.PI/2);}
        else poigneeB.rotateZ(-Math.PI/2);  // a soumettre à option
        poigneeB.position.set(deltaX,0,epaisseur/2);
        porte[0].position.set(0,0,this.profondeur/2-offset);
        blocRoot.add(porte[0]);
      }
      else {
        //porte gauche
        geometry = getElementBase(l/2 - 0.25 * epaisseur-offset/2, h-0.25*epaisseur-2*offset, epaisseur,style);
        porte[0] = new THREE.Mesh(geometry, materialTiroirs);
        porte[0].name = "porte 0";
        //poignee gauche
        let poigneeB = poigneeGroup.clone(true);
        poigneeB.rotateZ(-Math.PI/2);  // a soumettre à option
        poigneeB.name="poignee";
        porte[0].add(poigneeB);
        let deltaX=l/4 - 4*taillePoignees;
        if (4*taillePoignees>l/4) deltaX=0;
        poigneeB.position.set(deltaX,0,epaisseur/2);
        porte[0].position.set(-l/4+offset/2,0,p/2-offset);
        blocRoot.add(porte[0]);
  
        //porte droite
        porte[1] = new THREE.Mesh(geometry, materialTiroirs);
        porte[1].name = "porte 1";
        //poignee droite
        let poigneeC = poigneeGroup.clone(true);
        poigneeC.rotateZ(Math.PI/2);  // a soumettre à option
        porte[1].add(poigneeC);
        deltaX*=-1
        poigneeC.position.set(deltaX,0,epaisseur/2);
        poigneeC.name="poignee";
        porte[1].position.set(l/4-offset/2,0,p/2-offset);
        blocRoot.add(porte[1]);
      }
    }
    
    //etageres
    var etagere=[];
    if (this.bloc[numBloc].type == "Etageres" || (this.bloc[numBloc].type == "Tiroirs" && !isPreviewOn)) {
      if (this.bloc[numBloc].etageresVerticales) {
        var step = (l - 2 * epaisseur) / (this.bloc[numBloc].etageres + 1);
        for (var i = 0; i < this.bloc[numBloc].etageres; i++) {
          geometry = new THREE.BoxGeometry(epaisseur, h-2*epaisseur, p - epaisseur);
          etagere[i] = new THREE.Mesh(geometry, material);
          etagere[i].name = "etagere " + i;
          etagere[i].shortName = "etagere";
          etagere[i].numero = i;
          etagere[i].numeroBloc = numBloc;
          var yPredefini = this.bloc[numBloc].etagereY[i];
          if (!yPredefini) {
            var position = step * (0.5 + i - this.bloc[numBloc].etageres / 2);
          }
          else {position=yPredefini;}
          etagere[i].position.set(position, 0, 0);
          blocRoot.add(etagere[i]);
        }
      }
      else {
        var step = (h - 2 * epaisseur) / (this.bloc[numBloc].etageres + 1);
        for (var i = 0; i < this.bloc[numBloc].etageres; i++) {
          //geometry = getElementBase(this.bloc[numBloc].largeur - 2 * epaisseur, epaisseur, this.profondeur - epaisseur,style);
          geometry = new THREE.BoxGeometry(l - 2 * epaisseur, epaisseur, p - epaisseur);
          etagere[i] = new THREE.Mesh(geometry, material);
          etagere[i].name = "etagere " + i;
          etagere[i].shortName = "etagere";
          etagere[i].numero = i;
          etagere[i].numeroBloc = numBloc;

          var yPredefini = this.bloc[numBloc].etagereY[i];
          if (!yPredefini) {
            var position = step * (0.5 + i - this.bloc[numBloc].etageres / 2);
          }
          else {position=yPredefini;}

          etagere[i].position.set(0, position, 0);
          blocRoot.add(etagere[i]);
        }
      }
    }
  
    //tiroirs
    var tiroir = [];
    if (this.bloc[numBloc].type == "Tiroirs") {
      var offset = this.bloc[numBloc].IsRentrant * epaisseur;
      var step = (h - 0.25 * epaisseur - offset) / (this.bloc[numBloc].etageres + 1);
      for (var i = 0; i < this.bloc[numBloc].etageres + 1; i++) {
        var yPredefini = this.bloc[numBloc].etagereY[i];
        if (!yPredefini) { var positionYEtagere = step * (0.5 + i - this.bloc[numBloc].etageres / 2); }
        else { var positionYEtagere = yPredefini; }
        var yPredefiniEtagerePrecedent = this.bloc[numBloc].etagereY[i - 1];
        if (!yPredefiniEtagerePrecedent) { var yPredefiniEtagerePrecedent = step * (0.5 + (i - 1) - this.bloc[numBloc].etageres / 2); }
        var yPredefiniEtagereSuivant = this.bloc[numBloc].etagereY[i + 1];
        if (!yPredefiniEtagereSuivant) { var yPredefiniEtagereSuivant = step * (0.5 + (i + 1) - this.bloc[numBloc].etageres / 2); }

        let yl = positionYEtagere - yPredefiniEtagerePrecedent;
        let yPos = positionYEtagere - yl / 2;
        let xl = l - 0.25 * epaisseur - 2 * offset;
        let zl = epaisseur;
        //geometry = new THREE.BoxGeometry(xl, yl, zl);
        geometry = getElementBase(xl, yl, zl, style);
        tiroir[i] = new THREE.Mesh(geometry, materialTiroirs);
        tiroir[i].name = "tiroir " + i;
        tiroir[i].shortName = "tiroir";
        //poignees
        let poigneeB = poigneeGroup.clone(true);
        poigneeB.name = "poignee";
        tiroir[i].add(poigneeB);
        let posY = yl * (this.offsetPoignees / 250);
        poigneeB.position.set(0, posY, epaisseur / 2);
        var positionZ = p / 2;
        tiroir[i].position.set(0, yPos, positionZ - offset);
        blocRoot.add(tiroir[i]);
      }
    }
   
    //sous-meuble
    if (this.bloc[numBloc].type == "SousMeuble") {
      var sousMeuble = new Meuble(0);
      if (this.disposition == "horizontal") {
        sousMeuble.largeur = 0 + this.bloc[numBloc].taille;
        sousMeuble.computeBlocsSize();
        sousMeuble.hauteur = 0 + this.hauteur;
        sousMeuble.x = 0;
        sousMeuble.y = -this.hauteur / 2;
      }
      if (this.disposition == "vertical") {
        sousMeuble.hauteur = 0 + this.bloc[numBloc].taille;
        sousMeuble.largeur = 0 + this.largeur;
        sousMeuble.computeBlocsSize();
        sousMeuble.x = 0;
        sousMeuble.y = -this.bloc[numBloc].taille / 2;
      }
      sousMeuble.isSousMeuble = true;
      //sousMeuble.createGeometryRoot();
      sousMeuble.updateMeuble();
      sousMeuble.root.translateZ(-this.profondeur / 2);
      blocRoot.add(sousMeuble.root);
    }

    //positionnement bloc dans meuble
    if (this.disposition=="horizontal") {
      var blocPosition = -this.largeur / 2;
    }
    else {var blocPosition = -this.hauteur / 2 ;}
      if (numBloc > 0) {
        for (var i = 0; i < numBloc; i++) {
          blocPosition += this.bloc[i].taille;
        }
      }
      blocPosition += this.bloc[numBloc].taille / 2;
      if (this.disposition=="horizontal") { 
        blocRoot.position.set(blocPosition, 0, 0)
      } 
      else {
        blocRoot.position.set(0, blocPosition, 0);
      }
  
      //shadows
      blocRoot.traverse(function (child) {
        child.receiveShadow = true;
        child.castShadow = true;
      }) 
  
    //boîte de sélection
    //geometry = new THREE.BoxGeometry( this.bloc[numBloc].largeur+epsilon, this.hauteur+epsilon, this.profondeur+epsilon );
    geometry = RoundEdgedBox(l+epsilon, h+epsilon, p+epsilon,2,1,1,1,1);
    boiteSelectionBloc[numBloc] = new THREE.Mesh( geometry, materialSelectionBloc );
    boiteSelectionBloc[numBloc].name = "boiteSelectionBloc"+numBloc;
    boiteSelectionBloc[numBloc].shortName="boiteSelectionBloc";
    boiteSelectionBloc[numBloc].numeroMeuble = this.numero;
    boiteSelectionBloc[numBloc].bloc = this.bloc[numBloc];
    blocRoot.add(boiteSelectionBloc[numBloc]);
    boiteSelectionBloc[numBloc].visible=false;
    boiteSelectionBloc[numBloc].numero=numBloc;

    return blocRoot;
  }

  destroyBloc(numBloc) {
    this.root.getObjectByName("blocs").remove(this.blocRoot[numBloc]);
    geometry.dispose();
    material.dispose();
    this.blocRoot[numBloc]=undefined;
    scene.remove( this.blocRoot[numBloc] );
    geometry.dispose();
    material.dispose();
}

/*   updateBloc (numBloc) {
    this.initializeBloc(numBloc);
  } */

  computeBlocsSize() {
    if (this.disposition == "horizontal") {
      var largeurSommeBlocs = 0;
      for (var i=0; i<this.nbBlocs; i++) {
        largeurSommeBlocs += this.bloc[i].taille;
      }
      var ratio = this.largeur/largeurSommeBlocs;
      for (var i=0; i<this.nbBlocs; i++) {
        this.bloc[i].taille *= ratio;
      } 
    }
    if (this.disposition == "vertical") {
      var hauteurSommeBlocs = 0;
      for (var i=0; i<this.nbBlocs; i++) {
        hauteurSommeBlocs += this.bloc[i].taille;
      }
      var ratio = this.hauteur/hauteurSommeBlocs;
      for (var i=0; i<this.nbBlocs; i++) {
        this.bloc[i].taille *= ratio;
      } 
    }
  }
  
  changeBlocsQuantity () {
    for (var i=0; i<maxBlocs; i++) {
      if (((typeof this.bloc[i]))=="undefined") {this.bloc[i] = new Bloc(i)}
       else {if (i>(this.nbBlocs-1)) {this.destroyBloc(i)}}
    }
    if (indiceCurrentBloc>(this.nbBlocs-1)) {indiceCurrentBloc=this.nbBlocs-1;}
  }

  changeTexture(event) {
    let i=event.target.value;
    let piece=event.target.piece;
    if (piece=="plateau") {
      let obj=this.root.getObjectByName("plateau");
      loadTexture(imagesMeuble,i,materialPlateau,materialPlateauAvant,materialPlateauCote,obj.sx,obj.sy,obj.sz);
      //materialPlateau.
    }
    if (piece=="cadre") loadTexture(
      imagesMeuble,
      i,
      materialCadre,
      materialCadreAvant,
      materialCadreCote,
      this.largeur,
      this.hauteur,
      this.profondeur
    );
    if (piece=="meuble") loadTexture(
      imagesMeuble,
      i,
      material,
      materialAvant,
      materialCote,
      this.largeur,
      this.hauteur,
      this.profondeur
    );
    if (piece=="tiroirs") loadTexture(
      imagesMeuble,
      i,
      materialTiroirs,
      materialTiroirsAvant,
      materialTiroirsCote,
      this.largeur,
      this.hauteur,
      this.profondeur
    );
  }  
}

var style="Basique";
var selectionMode="meubles";
var isPreviewOn = false;

var indiceCurrentBloc = 0;
var indiceCurrentMeuble = 0;

const epaisseurHandleBlocs = 6;
const epaisseur = 1;
const epaisseurPlateau = 3;
const debordPlateau = 2;
const epaisseurCadre = 1.5;
const debordCadre = 0.5;
const retraitSocle = 2;
const hauteurSocle = 8;
const hauteurPied = 6;
const largeurPied= 4;
const epaisseurSuedois = 2;
const largeurSuedois = 4;
const maxBlocs = 9;
const maxEtageres = 20;
const epsilon = 5;
const taillePoignees = 1.5;
const focale=60;
const decalagePoignee=0.4;

var geometryConeHelper=new THREE.ConeGeometry(2*epaisseurHandleBlocs,4*epaisseurHandleBlocs);

var focaleV;
var plancheBas;
var plancheHaut;
var plancheGauche;
var plancheDroite;
var plateau;
var socle;
var piedA,piedB,piedC,piedD;
var poignee;
var geometry;
var cube;
var meubles=new Array;
var boiteSelectionBloc=[];        //pour selection des blocs dans la vue 3D
var selectableBloc=[];            //liste des boiteSelectionBlocs selectionnables par raycast
var selectableMeuble=[];
var selectableEtagere=[];
var selectableHandleBloc=[];
var selectableHandleMeuble=[];

//pointer raycast
const pointer = new THREE.Vector2(); //coordonées three normalisées
pointer.x=-1;
pointer.y=-1;
const pointerScreen = new THREE.Vector2(); // coordonées screenspace
pointerScreen.x=-1;
pointerScreen.y=-1;
const radius = 5;

//new scene and camera
const scene = new THREE.Scene();
var canvas = document.getElementById("canvas");
var canvasSize = canvas.getBoundingClientRect();
const camera = new THREE.PerspectiveCamera( focale, canvasSize.width/window.innerHeight, 0.1, 1000 );
focaleV=getfocaleV(focale,canvasSize.width,window.innerHeight);
var cameraTarget = new THREE.Object3D();
camera.position.z = 180; //overridden by orbit
camera.position.y = 100;
const renderer = new THREE.WebGLRenderer({antialias : true});
renderer.setSize( canvasSize.width, window.innerHeight);
canvas.appendChild( renderer.domElement );
var boundingBoxCenter = new THREE.Vector3();
var boundingBoxHeight, boundingBoxWidth;

// camera controls
let controls = new OrbitControls(camera, renderer.domElement);
controls.listenToKeyEvents(window); // optional
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 0.1;
controls.maxDistance = 1000;
controls.maxPolarAngle = Math.PI / 2;

//raycaster
let raycaster;
let intersectedBloc;
let intersectedMeuble;
let intersectedEtagere;
let intersectedHandleBloc;
let intersectedHandleMeuble;
var raycastedBloc=-1;
var raycastedMeuble=-1;
var raycastedEtagere=-1;
var raycastedHandleBloc=-1;
var raycastedHandleMeuble=-1;
var rayCastEnabled=true;
raycaster = new THREE.Raycaster();

//listener espace 3D
canvas.addEventListener('mousemove', onPointerMove);
window.addEventListener('resize', onWindowResize);
canvas.addEventListener('click', onCanvasClick);
//canvas.addEventListener('dragstart', onCanvasDrag, false);
canvas.addEventListener('contextmenu', onOpenContextMenu);

window.addEventListener('keydown',onKeyDown);

function checkRaycastBlocs() {
  if (!rayCastEnabled) return;
  raycaster.setFromCamera(pointer, camera, 0, 1000);
  //check intersect with blocs
  const intersects = raycaster.intersectObjects(selectableBloc, true);
  if (intersects.length > 0) {
    if (intersectedBloc != intersects[0].object) {
      if (intersectedBloc && selectionMode == "blocs") intersectedBloc.visible = false;
      intersectedBloc = intersects[0].object;
      if (selectionMode == "blocs") intersectedBloc.visible = true;
      raycastedBloc = intersects[0].object.numero;
    }
  }
  else {
    if (intersectedBloc) intersectedBloc.visible = false;
    intersectedBloc = null;
    raycastedBloc = -1;
  }
}

function checkRaycastMeubles() {
  //check intersect with meubles
  if (!rayCastEnabled) return;

  const intersectsMeuble = raycaster.intersectObjects(selectableMeuble, true);
  //console.log(selectableMeuble);
  if (intersectsMeuble.length > 0) { 
    if (intersectedMeuble != intersectsMeuble[0].object) {
      if (intersectedMeuble && selectionMode == "meubles" && intersectedMeuble.shortName=="boiteSelectionMeuble") intersectedMeuble.visible = false;
      intersectedMeuble = intersectsMeuble[0].object;
      if (selectionMode == "meubles") {intersectedMeuble.visible = true;} //showChildren(intersectedMeuble);}
      raycastedMeuble = intersectsMeuble[0].object.numero;
    }
  }
  else {
    if (intersectedMeuble && intersectedMeuble.shortName=="boiteSelectionMeuble") intersectedMeuble.visible = false;
    intersectedMeuble = null;
    raycastedMeuble = -1;
  }
}

function checkRaycastEtageres() {
  if (!rayCastEnabled) return;

  //check intersect with etageres
  const intersectsEtagere = raycaster.intersectObjects(selectableEtagere, true);
  if (intersectsEtagere.length > 0) {
    if (intersectedEtagere != intersectsEtagere[0].object) {
      if (intersectedEtagere && selectionMode == "etageres") {
        intersectedEtagere.material.depthTest = false;
        intersectedEtagere.material = material;
        intersectedEtagere.renderOrder = 1;
      }
      intersectedEtagere = intersectsEtagere[0].object;
      if (selectionMode == "etageres") intersectedEtagere.material = materialSelectionEtagere;
      raycastedEtagere = intersectsEtagere[0].object.numero;
    }
  }
  else {
    if (intersectedEtagere) {
      intersectedEtagere.material = material;
      intersectedEtagere.material.depthTest = true;
      intersectedEtagere.renderOrder = 0;
    }
    intersectedEtagere = null;
    raycastedEtagere = -1;
  }
}

function checkRaycastHandleBlocs() {
  if (!rayCastEnabled) return;

  //check intersect with handle bloc
  const intersectsHandleBloc = raycaster.intersectObjects(selectableHandleBloc, true);

  if (intersectsHandleBloc.length > 0 && selectionMode == "ajusteBlocs") {
    if (intersectedHandleBloc != intersectsHandleBloc[0].object) {
      if (intersectedHandleBloc && (intersectedHandleBloc.shortName=="handleBloc" || intersectedHandleBloc.shortName=="handleMeuble")) {
        intersectedHandleBloc.material.depthTest = true;
        intersectedHandleBloc.visible = false;
        intersectedHandleBloc.renderOrder = 1;
      }
      intersectedHandleBloc = intersectsHandleBloc[0].object;
      console.log(intersectedHandleBloc.shortName);
      intersectedHandleBloc.visible = true;
      intersectedHandleBloc.material.depthTest = false;
      intersectedHandleBloc.renderOrder = 1;
      raycastedHandleBloc = intersectsHandleBloc[0].object.numero;
    }
  }
  else {
    if (intersectedHandleBloc && (intersectedHandleBloc.shortName=="handleBloc" || intersectedHandleBloc.shortName=="handleMeuble")) {
      intersectedHandleBloc.visible = false;
      intersectedHandleBloc.material.depthTest = true;
      intersectedHandleBloc.renderOrder = 0;
    }
    intersectedHandleBloc = null;
    raycastedHandleBloc = -1;
  }
}

function checkRaycastHandleMeubles() {
  if (!rayCastEnabled) return;

  //check intersect with handle meuble
  const intersectsHandleMeuble = raycaster.intersectObjects(selectableHandleMeuble, true);
  if (intersectsHandleMeuble.length > 0 && selectionMode == "ajusteMeubles") {
    if (intersectedHandleMeuble != intersectsHandleMeuble[0].object) {
      if (intersectedHandleMeuble) {
        //intersectedHandleMeuble.material.depthTest = true;
        var test = intersectedHandleMeuble.hasOwnProperty("shortName");
        if (test && intersectedHandleMeuble.shortName=="handleMeuble") intersectedHandleMeuble.visible = false;
        intersectedHandleMeuble.renderOrder = 1;
      }
      intersectedHandleMeuble = intersectsHandleMeuble[0].object;
      intersectedHandleMeuble.visible = true;
      //intersectedHandleMeuble.material.depthTest = false;
      intersectedHandleMeuble.renderOrder = 1;
      raycastedHandleMeuble = intersectsHandleMeuble[0].object.numero;
    }
  }
  else {
    if (intersectedHandleMeuble) {
      let test = intersectedHandleMeuble.hasOwnProperty("shortName");
      if (test) {
        if (intersectedHandleMeuble.shortName=="handleMeuble") intersectedHandleMeuble.visible = false;
        //intersectedHandleMeuble.material.depthTest = true;
        intersectedHandleMeuble.renderOrder = 0;
        console.log("here");
      } 
    }
    intersectedHandleMeuble = null;
    raycastedHandleMeuble = -1;
  }
}

function checkRaycast() {
  checkRaycastMeubles();
  checkRaycastBlocs();
  checkRaycastEtageres();
  checkRaycastHandleBlocs();
  checkRaycastHandleMeubles();
}

//raycast sur les objets 3d lors d'un changement de souris ou de camera
function onCanvasClick () {
  //console.log("raycastedbloc=",raycastedBloc);
  //if ((selectionMode=="blocs") && (raycastedBloc>-1)) changeCurrentBlocFromClick(raycastedBloc);
  //if ((selectionMode=="meubles") && (raycastedMeuble>-1)) changeCurrentMeubleFromClick(raycastedMeuble);
  hideAllContextMenu();
}

function hideAllContextMenu() {
  contextMenuGeneral.style.display="none";
  contextMenuMeuble.style.display="none";
  contextMenuBloc.style.display="none";
  contextMenuEtagere.style.display="none";
}

function onKeyDown(event) {
if (event.key=="Escape") {
  hideAllContextMenu();
}
}

function onOpenContextMenu() {
  let iCM = indiceCurrentMeuble;
  let iCB = indiceCurrentBloc;
  contextMenuGeneral.style.display = "block";
  contextMenuGeneral.style.left = pointerScreen.x + "px";
  contextMenuGeneral.style.top = pointerScreen.y + "px";
  if (raycastedMeuble > -1) {
    changeCurrentMeubleFromClick(raycastedMeuble);
    updateAllSelectable();
  }
  contextMenuMeuble.style.display = "block";

  if (raycastedBloc > -1) {
    indiceCurrentBloc = raycastedBloc;
    changeCurrentBlocFromClick(raycastedBloc);
    updateAllSelectable();
    contextMenuBloc.style.display = "block";
  }
  if (raycastedEtagere > -1) {
    contextMenuEtagere.style.display = "block";
  }
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

function resetRaycast() {
  clearRaycast();
  initializeRaycast();
}

function clearRaycast() {
  controls.removeEventListener('change',checkRaycast);
  if (intersectedBloc!=null) {intersectedBloc.visible = false; intersectedBloc = null;}
  if (intersectedMeuble!=null) {intersectedMeuble.visible = false; intersectedMeuble = null;}
  if (intersectedHandleBloc!=null) {intersectedHandleBloc.visible = false; intersectedHandleBloc = null;}
  if (intersectedHandleMeuble!=null) {intersectedHandleMeuble.visible = false; intersectedHandleMeuble = null;}
  if (intersectedEtagere!=null) {intersectedEtagere.visible = false; intersectedEtagere = null;}
}

 function showChildren(obj) {
  let listChildren = obj.children;
  for (let item of listChildren) {
    item.visible=true;
  }
}

function hideChildren(obj) {
  let listChildren = obj.children;
  for (let item of listChildren) {
    if (item.visible) item.visible=false;
  }
} 

var newHelper;
//drag
var dragHandleBlocControls;
function initDragHandleBloc() {
  //drag handle bloc
  dragHandleBlocControls = new DragControls(selectableHandleBloc, camera, renderer.domElement);
  
  dragHandleBlocControls.addEventListener('dragstart', function (event) {
    if (selectionMode!="ajusteBlocs") return;
    controls.enabled = false;
    rayCastEnabled = false;
    //event.object.material.emissive.set(0xaaaaaa);
    let blocId = event.object.numBloc;
    let parent = event.object.parent.parent;
    let blocPrecedent = parent.getObjectByName("Bloc " + (blocId - 1));
    let blocSuivant = parent.getObjectByName("Bloc " + (blocId + 1));
    if (meubles[indiceCurrentMeuble].disposition=="horizontal") {
    if (blocPrecedent) {var xMin = event.object.position.x - meubles[indiceCurrentMeuble].bloc[blocId - 1].taille / 2;}
    else {var xMin = -10e35;}
    if (blocSuivant) { var xMax = event.object.position.x + meubles[indiceCurrentMeuble].bloc[blocId + 1].taille / 2 }
    else {
      if (event.object.name == "handleBlocDroit") {var xMax = 10e35;}
      else { xMax = 0 }
    }
    event.object.xMin = xMin;
    event.object.xMax = xMax;
    event.object.xInitial = event.object.position.x;
    event.object.xMeubleInitial = meubles[indiceCurrentMeuble].x;
    isPreviewOn=true;
  }

  else { //vertical
    if (blocSuivant) { var yMax = event.object.position.y + meubles[indiceCurrentMeuble].bloc[blocId + 1].taille / 2 }
    else {var yMax = 10e35;}
    event.object.yMax = yMax;
    event.object.yInitial = event.object.position.y;
    event.object.yMeubleInitial = meubles[indiceCurrentMeuble].y;
  }
    if (blocId > 0) event.object.tailleBlocPrecedent = meubles[indiceCurrentMeuble].bloc[blocId - 1].taille;
    if (blocId < meubles[indiceCurrentMeuble].nbBlocs-1) event.object.tailleBlocSuivant = meubles[indiceCurrentMeuble].bloc[blocId + 1].taille;
    event.object.blocId = blocId;

    newHelper=event.object.clone(true);
    event.object.attach(newHelper);
    newHelper.position.set(0,0,0);
    //newHelper.visible=false;
    scene.attach(newHelper);
    event.object.visible=false;
    event.object.newHelperYInit=newHelper.position.y;
  });

  dragHandleBlocControls.addEventListener('drag', function (event) {
    if (selectionMode!="ajusteBlocs") return;
    //event.object.material.emissive.set(0xaaaaaa);
    var obj1 = event.object;
    var blocId = obj1.blocId;
    scene.add(newHelper);

    if (meubles[indiceCurrentMeuble].disposition == "horizontal") {
      let x = obj1.position.x;
      x = x > event.object.xMax ? event.object.xMax : x;
      x = x < event.object.xMin ? event.object.xMin : x;
      obj1.position.set(x, 0, 0);
      var delta = x - obj1.xInitial;
      //poignee située entre 2 blocs :
      if (blocId > 0 && obj1.name != "handleBlocDroit") {
        meubles[indiceCurrentMeuble].bloc[blocId - 1].taille = obj1.tailleBlocPrecedent + delta;
      }
      var fact = -1;
      //poignee située à gauche du meuble :
      if (blocId == 0) {
        meubles[indiceCurrentMeuble].x = obj1.xMeubleInitial + delta / 2;
        fact = -1;
      }
      //poignée située à droite :
      if (obj1.name == "handleBlocDroit") {
        fact = 1;
        meubles[indiceCurrentMeuble].x = obj1.xMeubleInitial + delta / 2;
      }
      meubles[indiceCurrentMeuble].bloc[blocId].taille = fact * (x + obj1.xInitial);
      newHelper.position.x=obj1.newHelperXInit+delta;
    }

    else { //vertical
      let y = obj1.position.y;
      obj1.position.set(0, y, 0);
      var delta = y - obj1.yInitial;
      //console.log("delta=", delta, obj1.position.y, obj1.yInitial);
        meubles[indiceCurrentMeuble].bloc[blocId].taille = 2*obj1.yInitial + delta;
        if (blocId<meubles[indiceCurrentMeuble].nbBlocs-1) 
          {meubles[indiceCurrentMeuble].bloc[blocId+1].taille = obj1.tailleBlocSuivant - delta}
        newHelper.position.y=obj1.newHelperYInit+delta;
    }

  //}
    meubles[indiceCurrentMeuble].calculTaille();
    meubles[indiceCurrentMeuble].updateMeuble();
    //meubles[indiceCurrentMeuble].placeMeuble();
    updateInterfaceMeuble();
    updateInterfaceBlocs(indiceCurrentMeuble);
  });

  dragHandleBlocControls.addEventListener('dragend', function (event) {
    //updateSelectableHandleBloc();
    //console.log(selectableHandleBloc);
    scene.remove(newHelper);
    //updateAllSelectable();
    //geometry.dispose();
    //material.dispose();
    if (selectionMode!="ajusteBlocs") return;
    isPreviewOn=false;

    //event.object.material.emissive.set(0x000000);
    
    meubles[indiceCurrentMeuble].updateMeuble();
    //console.log(meubles[indiceCurrentMeuble]);
    resetRaycast();
    updateAllSelectable();
    controls.enabled = true;
    rayCastEnabled = true;
    
    //();

    //for (item in selectableHandleBloc) item.visible=false;
    //scene.remove(newHelper);
    //geometry.dispose();
    //material.dispose();
  });

}

var dragHandleMeubleControls;
function initDragHandleMeuble() {
  //drag handle bloc
  dragHandleMeubleControls = new DragControls(selectableHandleMeuble, camera, renderer.domElement);
  
  dragHandleMeubleControls.addEventListener('dragstart', function (event) {
    if (selectionMode!="ajusteMeubles") return;
    controls.enabled = false;
    rayCastEnabled = false;
    //event.object.material.emissive.set(0xaaaaaa);
    let meubleId = event.object.indiceMeuble;
    event.object.meubleId = meubleId;
    //event.object.xMax = xMax;
    event.object.xInitial = event.object.position.x;
    event.object.xMeubleInitial = meubles[indiceCurrentMeuble].x;
    event.object.yInitial = event.object.position.y;
    event.object.yMeubleInitial = meubles[indiceCurrentMeuble].y;
    event.object.largeurInitiale = meubles[indiceCurrentMeuble].largeur;
    isPreviewOn=true;
  });

  dragHandleMeubleControls.addEventListener('drag', function (event) {
    if (selectionMode!="ajusteMeubles") return;
    //event.object.material.emissive.set(0xaaaaaa);
    var obj1 = event.object;
    var meubleId = obj1.meubleId;
    console.log(obj1.visible);

    if (obj1.name == "handleMeubleHaut") {
      let y = obj1.position.y;
      //y = x > event.object.xMax ? event.object.xMax : x;
      //x = x < event.object.xMin ? event.object.xMin : x;
      obj1.position.set(0, y, 0);
      meubles[indiceCurrentMeuble].hauteur = y*2;
    }
    if (obj1.name == "handleMeubleDroit") {var fact=-1} else {var fact=1}
    if (obj1.name == "handleMeubleGauche" || obj1.name == "handleMeubleDroit") {
      let x = obj1.position.x;
      //y = x > event.object.xMax ? event.object.xMax : x;
      //x = x < event.object.xMin ? event.object.xMin : x;
      obj1.position.set(x, 0, 0);
      var delta = x - obj1.xInitial;
      meubles[indiceCurrentMeuble].largeur = obj1.largeurInitiale-fact*delta*2;
      meubles[indiceCurrentMeuble].computeBlocsSize();
      meubles[indiceCurrentMeuble].x = obj1.xMeubleInitial+delta;
      let geo=meubles[indiceCurrentMeuble].root.getObjectByName("geometries");
    }
    meubles[indiceCurrentMeuble].computeBlocsSize();
    meubles[indiceCurrentMeuble].updateGeometry();
    meubles[indiceCurrentMeuble].placeMeuble();
    updateInterfaceMeuble();
    updateInterfaceBlocs(indiceCurrentMeuble);
    //console.log(rayCastEnabled);
  });

  dragHandleMeubleControls.addEventListener('dragend', function (event) {
    if (selectionMode!="ajusteMeubles") return;
    //event.object.material.emissive.set(0x000000);
    resetRaycast();
    controls.enabled = true;
    rayCastEnabled = true;
    isPreviewOn=false;
    meubles[indiceCurrentMeuble].updateMeuble();
  });
}

var dragBlocControls;
var wA,hA;
var aX,aY;
function initDragBloc() {
  
  //drag blocs
  dragBlocControls = new DragControls(selectableBloc, camera, renderer.domElement);

  dragBlocControls.addEventListener('dragstart', function (event) {
    if (raycastedBloc>-1) changeCurrentBlocFromClick(raycastedBloc);
    if (selectionMode!="blocs") return;
    controls.enabled=false;
    //event.object.material.emissive.set(0xaaaaaa);
  });

  dragBlocControls.addEventListener('dragend', function (event) {
    resetRaycast();

    if (selectionMode!="blocs") return;

    if (selectionMode!="blocs") return;
    controls.enabled=true;
    //event.object.material.emissive.set(0x000000);
    var obj1=event.object;
    var num=event.object.numero;
    obj1.position.set(0,0,0);
    if ((raycastedBloc==-1) || (raycastedBloc==num) || (selectableBloc[raycastedBloc].numeroMeuble!=selectableBloc[num].numeroMeuble)) {console.log("nothing happens")}
      else {
        let bloc=meubles[selectableBloc[raycastedBloc].numeroMeuble].bloc;
        [bloc[num],bloc[raycastedBloc]]=[bloc[raycastedBloc],bloc[num]];
        updateScene();
      }
  });

}

var dragEtagereControls;
function initDragEtagere() {
  //drag etageres
  dragEtagereControls = new DragControls(selectableEtagere, camera, renderer.domElement);

  dragEtagereControls.addEventListener('dragstart', function (event) {
    controls.enabled=false;
    rayCastEnabled=false;
    let id=event.object.numero;
    let blocId=event.object.numeroBloc;
    //console.log("etager id=",id);
    //console.log("bloc id=",blocId);
    let parent=event.object.parent;
    //console.log("parent=",parent);
    let hasEtagerePrecedente = parent.getObjectByName("etagere "+(id-1));
    let hasEtagereSuivante = parent.getObjectByName("etagere "+(id+1));
    //console.log(hasEtagerePrecedente);
    //console.log(hasEtagereSuivante);

    if (!meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].etageresVerticales) {
      if (hasEtagerePrecedente) { var yMin = hasEtagerePrecedente.position.y }
      else { var yMin = -meubles[indiceCurrentMeuble].hauteur / 2 + epaisseur / 2 }
      if (hasEtagereSuivante) { var yMax = hasEtagereSuivante.position.y }
      else { var yMax = meubles[indiceCurrentMeuble].hauteur / 2 - epaisseur / 2 }

    }
    else {
      if (hasEtagerePrecedente) { var xMin = hasEtagerePrecedente.position.x }
      else { var xMin = -meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].taille / 2 + epaisseur / 2 }
      if (hasEtagereSuivante) { var xMax = hasEtagereSuivante.position.x }
      else { var xMax = meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].hauteur / 2 - epaisseur / 2 }
    }

      //console.log("yMin, yMax = ",yMin,yMax);
      event.object.yMin=yMin+epaisseur;
      event.object.yMax=yMax-epaisseur;
      event.object.xMin=xMin+epaisseur;
      event.object.xMax=xMax-epaisseur;
      event.object.blocId=blocId;
  });

  dragEtagereControls.addEventListener('drag', function (event) {
    var obj1=event.object;
    var num=obj1.numero;
    var blocId=obj1.blocId;
    if (!meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].etageresVerticales) {
    let y=obj1.position.y;
    y= y>event.object.yMax ? event.object.yMax : y;
    y= y<event.object.yMin ? event.object.yMin : y;
    obj1.position.set(0,y,0);
    meubles[indiceCurrentMeuble].bloc[blocId].etagereY[event.object.numero] = event.object.position.y;
  }
  else {
    //console.log("test");
    let x=obj1.position.x;
    x= x>event.object.xMax ? event.object.xMax : x;
    x= x<event.object.xMin ? event.object.xMin : x;
    obj1.position.set(x,0,0);
    meubles[indiceCurrentMeuble].bloc[blocId].etagereY[event.object.numero] = event.object.position.x;
  }
    meubles[indiceCurrentMeuble].updateMeuble();
  });

  dragEtagereControls.addEventListener('dragend', function (event) {
    //event.object.material.emissive.set(0x000000);
    resetRaycast();

    controls.enabled=true;
    rayCastEnabled=true;
  });
}

var dragMeubleControls;
function initDragMeuble() {
  //drag meubles
  dragMeubleControls=new DragControls(selectableMeuble, camera, renderer.domElement);
  dragMeubleControls.addEventListener('dragstart', function (event) {
    if (selectionMode!="meubles") return;
    controls.enabled=false;
    rayCastEnabled=false;
    //event.object.material.emissive.set(0xaaaaaa);
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
    let geometries=meubles[num].root.getObjectByName("geometries");
    console.log(geometries);
    obj1.attach(geometries);  //on détache pour éviter les references circulaires dans les calculs de coordonnées
    geometries.position.set(0,0,0);
    let cadreA = meubles[num].hasCadre*epaisseurCadre;
    let plateauA = meubles[num].hasPlateau*epaisseurPlateau;
    let piedA = meubles[num].hasPied*hauteurPied;
    let socleA = meubles[num].hasSocle*hauteurSocle;
    let offsetHautA = Math.max(cadreA,plateauA);
    let offsetBasA = cadreA + piedA + socleA;
    wA=meubles[num].largeur+cadreA*2;
    hA=meubles[num].hauteur+offsetHautA+offsetBasA;
    obj1.offsetHautA=offsetHautA;
    obj1.offsetBasA=offsetBasA;
  });

  dragMeubleControls.addEventListener('drag', function (event) { 
    var obj1=event.object;
    var num=obj1.numero;
    let wpos = new THREE.Vector3();
    var pos=obj1.position;
    obj1.localToWorld(wpos);
    aX=wpos.x;
    aY=wpos.y-obj1.offsetBasA/2+obj1.offsetHautA/2; // centre du bloc complet
    adjustObjectPosition(obj1,num,aX,aY,wA,hA,pos,0);
    meubles[num].x=obj1.xMeubleInit+obj1.position.x;
    meubles[num].y=obj1.yMeubleInit+obj1.position.y;
    updateInterfaceX(num);
    updateInterfaceY(num);
  });

  function intersectWithOneOfAll(obj, num, aaX, aaY, wwA, hhA) {
    var pos = new THREE.Vector3();
    obj.localToWorld(pos);
    aaX = pos.x;
    aaY = pos.y-obj.offsetBasA/2+obj.offsetHautA/2;
    var intersectB = false;
    for (var i = 0; i < meubles.length; i++) {
      if (i != num) {
        var cadreB =meubles[i].hasCadre*epaisseurCadre;
        var plateauB = meubles[i].hasPlateau*epaisseurPlateau;
        var piedB = meubles[i].hasPied*hauteurPied;
        var socleB = meubles[i].hasSocle*hauteurSocle;
        var offsetHautB=Math.max(cadreB,plateauB);
        var offsetBasB=socleB + piedB + cadreB;
        var wwB = meubles[i].largeur+cadreB*2;
        var hhB = offsetBasB+meubles[i].hauteur+offsetHautB;
        var bbY = meubles[i].y + meubles[i].hauteur / 2 + offsetBasB/2 + offsetHautB/2;
        var bbX = meubles[i].x;
        if ((Math.abs(aaX - bbX) * 2 < (wwA + wwB)) && (Math.abs(aaY - bbY) * 2 < (hhA + hhB))) intersectB = true;
        if (intersectB) { console.log("intersect with ", i, " num=", num) }
      }
    } return intersectB;
  }
  
  function adjustObjectPosition(obj1, num, aX, aY, wA, hA, pos, count) {
    pos.z = obj1.zOk;
    if (count > meubles.length) return;
    var wB, hB;
    var bX, bY, cadreB, plateauB, piedB, socleB;
    var offsetHautB, offsetBasB;
    var replace = false;
    //correction en y si on rentre dans le sol
    if (aY < hA / 2) { pos.y += (hA / 2 - aY); aY = hA / 2; replace = true }
    for (var i = 0; i < meubles.length; i++) {
      if (i != num) {
        cadreB = meubles[i].hasCadre * epaisseurCadre;
        plateauB = meubles[i].hasPlateau * epaisseurPlateau;
        piedB = meubles[i].hasPied * hauteurPied;
        socleB = meubles[i].hasSocle * hauteurSocle;
        offsetHautB = Math.max(cadreB, plateauB);
        offsetBasB = socleB + piedB + cadreB;
        bX = meubles[i].x;
        wB = meubles[i].largeur + cadreB * 2;
        hB = offsetBasB + meubles[i].hauteur + offsetHautB;
        bY = meubles[i].y + meubles[i].hauteur / 2 + offsetBasB / 2 + offsetHautB / 2;  // centre du bloc B
        var intersect = (Math.abs(aX - bX) * 2 < (wA + wB)) && (Math.abs(aY - bY) * 2 < (hA + hB));
        if (intersect) {
          if (aX > bX) { var decalX = (aX - wA / 2) - (bX + wB / 2) }
          else { var decalX = (aX + wA / 2) - (bX - wB / 2) }
          if (aY > bY) { var decalY = (aY - hA / 2) - (bY + hB / 2) }
          else { var decalY = (aY + hA / 2) - (bY - hB / 2) }
          if ((Math.abs(decalX) > Math.abs(decalY)) && (obj1.yMeubleInit + pos.y > 0)) { pos.y -= decalY; aY -= decalY; }
          else { pos.x -= decalX; aX -= decalX; }
          replace = true;
        }
        //correction en y si on rentre dans le sol, après ajustement
        if (aY < hA / 2) { pos.y += (hA / 2 - aY); aY = hA / 2; replace = true }
      }
    }
    if (replace) {
      if (intersectWithOneOfAll(obj1, num, pos.x, pos.y, wA, hA) == false) {
        obj1.xOk = pos.x; obj1.yOk = pos.y;
      }
      else { pos.x = obj1.xOk; pos.y = obj1.yOk; }
    }
  }

  dragMeubleControls.addEventListener('dragend', function (event) {
    resetRaycast();

    if (selectionMode!="meubles") return;
    controls.enabled = true;
    rayCastEnabled = true;
    //event.object.material.emissive.set(0x000000);
    var obj1 = event.object;
    var num = event.object.numero;
    let geometries = obj1.getObjectByName("geometries");
    let parent = obj1.parent.parent;
    parent.attach(geometries); // on rattache une fois fini
    geometries.position.set(0, 0, 0);
    obj1.position.set(0, 0, 0);
    meubles[num].updateMeuble();
    meubles[num].placeMeuble();
    frameCamera();
  });
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
  //camera.translateZ((dist-(controls.getDistance(cameraTarget)))/100);
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

function frameCamera () {
  boundingBoxCenter = getGlobalBoundingBoxCenter();
  cameraTarget.position.set(boundingBoxCenter);
}

function updateScene () {
  for (var i=0; i<meubles.length; i++) {
    meubles[i].updateMeuble();
  }
}

//boites de selection et manipulation
function updateSelectableBlocs() {
  selectableBloc = [];
  scene.getObjectsByProperty("shortName", "boiteSelectionBloc", selectableBloc);
  for (var i = 0; i < selectableBloc.length; i++) { selectableBloc[i].numero = i }
  dragBlocControls.setObjects(selectableBloc);
}

function updateSelectableMeubles() {
  selectableMeuble = [];
  scene.getObjectsByProperty("shortName", "boiteSelectionMeuble", selectableMeuble);
  dragMeubleControls.setObjects(selectableMeuble);
}

function updateSelectableEtagere() {
  selectableEtagere = [];
  let blocsRoot = meubles[indiceCurrentMeuble].root.getObjectByName("blocs");
  blocsRoot.getObjectsByProperty("shortName","etagere",selectableEtagere);
  dragEtagereControls.setObjects(selectableEtagere);
}

function updateSelectableHandleBloc() {
  selectableHandleBloc = [];
  meubles[indiceCurrentMeuble].root.getObjectsByProperty("shortName", "handleBloc", selectableHandleBloc);
  //let handleMeubleHaut =  meubles[indiceCurrentMeuble].root.getObjectByName("handleMeubleHaut");
  //selectableHandleBloc.push(handleMeubleHaut);
  if (dragHandleBlocControls) dragHandleBlocControls.setObjects(selectableHandleBloc);
}

function updateSelectableHandleMeuble() {
  selectableHandleMeuble = [];
  meubles[indiceCurrentMeuble].root.getObjectsByProperty("shortName", "handleMeuble", selectableHandleMeuble);
  if (dragHandleMeubleControls) dragHandleMeubleControls.setObjects(selectableHandleMeuble);
}

function updateAllSelectable() {
  updateSelectableBlocs();
  updateSelectableMeubles();
  updateSelectableHandleMeuble();
  updateSelectableEtagere();
  updateSelectableHandleBloc();
}

//collisions
function intersectY(indiceMeubleA,indiceMeubleB) {
  var cadreA = meubles[indiceMeubleA].hasCadre*epaisseurCadre;
  var cadreB = meubles[indiceMeubleB].hasCadre*epaisseurCadre;
  var socleA = meubles[indiceMeubleA].hasSocle*hauteurSocle;
  var socleB = meubles[indiceMeubleB].hasSocle*hauteurSocle;
  var piedA = meubles[indiceMeubleA].hasPied*hauteurPied;
  var piedB = meubles[indiceMeubleB].hasPied*hauteurPied;
  var aY = meubles[indiceMeubleA].y + meubles[indiceMeubleA].hauteur / 2 + cadreA + socleA/2 + piedA/2;
  var bY = meubles[indiceMeubleB].y + meubles[indiceMeubleB].hauteur / 2 + cadreB + socleB/2 + piedB/2;
  var hA = meubles[indiceMeubleA].hauteur+cadreA+socleA+piedA;
  var hB = meubles[indiceMeubleB].hauteur+cadreB+socleB+piedB;
  var intersectY = (Math.abs(aY - bY) * 2 < (hA + hB));
  return intersectY;
}

function intersectX(indiceMeubleA,indiceMeubleB) {
  var cadreA = meubles[indiceMeubleA].hasCadre*epaisseurCadre;
  var cadreB = meubles[indiceMeubleB].hasCadre*epaisseurCadre;
  var xA=meubles[indiceMeubleA].x;
  var xB=meubles[indiceMeubleB].x;
  var lA=meubles[indiceMeubleA].largeur;
  var lB=meubles[indiceMeubleB].largeur;
  var intersectX = (Math.abs(xA - xB - cadreB) * 2 < (lA + lB + cadreA + cadreB));
  return intersectX;
}

function getLimitTranslationX(num) {
  var bY;
  var minXGlobal=-10e34;
  var maxXGlobal=+10e34;
  var minX=-10e34;
  var maxX=10e34;
  for (var i = 0; i < meubles.length; i++) {
    if (i != num) {
      bY = meubles[i].y + meubles[i].hauteur / 2 + meubles[i].hasCadre*epaisseurCadre;
      if (intersectY(num,i)) {
          if (meubles[num].x > meubles[i].x) {
            minX = (meubles[i].x + meubles[i].largeur / 2 + meubles[i].hasCadre*epaisseurCadre) + (meubles[num].largeur / 2+meubles[num].hasCadre*epaisseurCadre);
          }
          if (meubles[num].x < meubles[i].x) {
            maxX = (meubles[i].x - meubles[i].largeur / 2 - meubles[i].hasCadre*epaisseurCadre) - (meubles[num].largeur / 2 + meubles[num].hasCadre*epaisseurCadre);
          }
          minXGlobal=Math.max(minX,minXGlobal);
          maxXGlobal=Math.min(maxX,maxXGlobal);
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
  var hAReelle=meubles[num].getHauteurReelle();
  for (var i = 0; i < meubles.length; i++) {
    if (i != num) {
      var yB=meubles[i].y
      if (intersectX(num,i)) {
          if (meubles[num].y > meubles[i].y) {
            minY = meubles[i].getHauteurReelle();
          }
          if (meubles[num].y < meubles[i].y) {
            maxY = yB-hAReelle;
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
      if (intersectY(num,i)) {
        if (meubles[num].x > meubles[i].x) {
          deltaX = (meubles[num].x) - (meubles[i].x + meubles[i].largeur / 2 + meubles[i].hasCadre*epaisseurCadre + meubles[num].hasCadre*epaisseurCadre);
        }
        else {
          deltaX = (meubles[i].x - meubles[i].largeur / 2 - meubles[i].hasCadre*epaisseurCadre - meubles[num].hasCadre*epaisseurCadre) - (meubles[num].x);
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
  var yA=meubles[num].y;
  var cadreA = meubles[num].hasCadre*epaisseurCadre;
  var piedA = meubles[num].hasPied*hauteurPied;
  var socleA = meubles[num].hasSocle*hauteurSocle;
  var plateauA = meubles[num].hasPlateau*epaisseurPlateau;
  //var hAReelle=meubles[num].getHauteurReelle();
  for (var i = 0; i < meubles.length; i++) {
    if (i != num) {
      if (intersectX(num,i)) {
        var yB=meubles[i].y;
        if (meubles[num].y < meubles[i].y) {
          deltaY = yB-yA-cadreA-socleA-piedA-plateauA;
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
  pointerScreen.x=x;
  pointerScreen.y=y;
  pointer.x = ( x / canvasSize.width ) * 2 - 1;
  pointer.y = - ( y / window.innerHeight ) * 2 + 1;
}

//Materials
let loader2 = new THREE.TextureLoader();
let textureBois = loader2.load('src/plywood_diff_4k.jpg');
textureBois.wrapS = THREE.RepeatWrapping;
textureBois.wrapT = THREE.RepeatWrapping;
textureBois.repeat.set(2, 2);

const materialBaseParams = {
  color: '#ffffff',
  map: textureBois
}

const materialParams = materialBaseParams;
const materialTiroirsParams = materialBaseParams;
const materialPoigneesParams = {color: '#bbbbbb'}
const materialPlateauParams = materialBaseParams;
const materialPlateauAvantParams = materialBaseParams;
const materialPlateauCoteParams = materialBaseParams;
const materialCadreParams = materialBaseParams;

const materialSelection = {
  color: '#00ffff',
  refractionRatio: 0.98,
  transparent: true,
  opacity: 0.35
};

const materialSelectionBlocParams = structuredClone(materialSelection);
materialSelectionBlocParams.color='#00ffff';

const materialSelectionEtagereParams = structuredClone(materialSelection);
materialSelectionEtagereParams.color='#0000ff';

const materialSelectionMeubleParams = structuredClone(materialSelection);
materialSelectionMeubleParams.color='#00ff00';

const materialHelperParams = structuredClone(materialSelection);
materialHelperParams.color='#00ffff';
materialHelperParams.opacity=0.5;

const material = new THREE.MeshStandardMaterial( materialParams );
const materialAvant = new THREE.MeshStandardMaterial( materialParams );
const materialCote = new THREE.MeshStandardMaterial( materialParams );
const materialTiroirs = new THREE.MeshStandardMaterial( materialTiroirsParams);
const materialTiroirsAvant = new THREE.MeshStandardMaterial( materialTiroirsParams);
const materialTiroirsCote = new THREE.MeshStandardMaterial( materialTiroirsParams);
const materialPoignees = new THREE.MeshStandardMaterial( materialPoigneesParams);
const materialPlateau = new THREE.MeshStandardMaterial( materialPlateauParams);
const materialPlateauAvant = new THREE.MeshStandardMaterial( materialPlateauAvantParams);
const materialPlateauCote = new THREE.MeshStandardMaterial( materialPlateauCoteParams);
const materialCadre = new THREE.MeshStandardMaterial( materialCadreParams);
const materialCadreAvant = new THREE.MeshStandardMaterial( materialCadreParams);
const materialCadreCote = new THREE.MeshStandardMaterial( materialCadreParams);
const materialSelectionBloc = new THREE.MeshBasicMaterial( materialSelectionBlocParams);
const materialSelectionEtagere = new THREE.MeshBasicMaterial( materialSelectionEtagereParams);
const materialSelectionMeuble = new THREE.MeshBasicMaterial( materialSelectionMeubleParams);
const materialHelper = new THREE.MeshBasicMaterial(materialHelperParams);
materialSelectionMeuble.depthTest=false;
materialHelper.depthTest=false;
//const wireframeMaterial = new THREE.MeshBasicMaterial( 0x00ff00 );
//wireframeMaterial.wireframe = true;

//Lights
const light = new THREE.DirectionalLight( 0xffffff, 1 );
light.position.set( 0.5, 1, 0.5 );
scene.add( light );

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;
light.shadow.camera.near = 0.01;
light.shadow.camera.far = 1000;

const lightA = new THREE.PointLight( 0xffffff, 120, 0, 1 );
lightA.position.set( -10, 150, 140 );
lightA.castShadow = true;
lightA.shadow.radius = 4;
renderer.setClearColor( 0xAAAAAA, 1 );
scene.add( lightA );
const lightB = new THREE.PointLight( 0xddeeff, 80, 0, 1 );
lightB.position.set( 160, 150, 160 );
lightB.castShadow = true;
lightB.shadow.radius = 4;
renderer.setClearColor( 0xAAAAAA, 1 );
scene.add( lightB );
const lightC = new THREE.PointLight( 0xddeeff, 80, 0, 1 );
lightC.position.set( -200, 150, 160 );
renderer.setClearColor( 0xAAAAAA, 1 );
scene.add( lightC );
const ambientLight = new THREE.AmbientLight( 0x404020,0.5 );
scene.add( ambientLight );

function buildEnvironnement () {
  let loader = new THREE.TextureLoader();
  let textureSol = loader.load('src/TCom_TilesPlain0118_1_seamless_S.jpg');
  textureSol.wrapS = THREE.RepeatWrapping;
  textureSol.wrapT = THREE.RepeatWrapping;
  textureSol.repeat.set( 10, 10 );

  geometry = new THREE.PlaneGeometry( 1000, 1000 );
  const materialSol = new THREE.MeshStandardMaterial( {color: 0xffffff, map:textureSol} );
  materialSol.roughness = 1;
  materialSol.metalness = 1;
  materialSol.bumpMap = textureSol;
  materialSol.bumpScale=5;
  const plane = new THREE.Mesh( geometry, materialSol );
  plane.rotateX(-Math.PI/2);
  plane.name = "sol";
  plane.receiveShadow = true;
  scene.add( plane );
  const materialMur = new THREE.MeshStandardMaterial( {color: 0xffffff} );
  const murFond = new THREE.Mesh( geometry, materialMur );
  murFond.name = "murFond"
  murFond.receiveShadow = true;
  scene.add( murFond );
  const murDroit = new THREE.Mesh( geometry, materialMur );
  murDroit.translateX(500);
  murDroit.rotateY(-Math.PI/2);
  murDroit.name="murDroit";
  scene.add( murDroit );
  const murGauche = new THREE.Mesh( geometry, materialMur );
  murGauche.translateX(-500);
  murGauche.rotateY(Math.PI/2);
  murGauche.name="murGauche";
  scene.add( murGauche );
}

//Interface
var body;
var interfaceDiv;
var meubleDiv;
var divEtageres;
var buttonNewMeuble;
var buttonDupliquerMeuble;
var buttonDeleteMeuble;
var listMeublesPopup;
var listMeublesName;
var buttonPlateau;
var buttonCadre;
var buttonSocle;
var buttonPied;
var buttonSuspendu;
var selectListMeubles;
var selectListBlocs;
var blocsDiv;
var listBlocs;
var buttonPorte,buttonEtageres,buttonTiroirs,buttonPlein;
var buttonDeuxPortes,buttonUnePorte,buttonOuverturePorteDroite,buttonOuverturePorteGauche;
var nbPortes,sensOuverture;
var buttonEtageresVerticales;
var divPortes,divEtageres;
var checkboxRentrant;
var listPoigneesPopup;
var listPoigneesName;
var meubleSliders;
var blocsSliders;
var large,largeS,largeB;
var elh,hautS,hautB;
var elX,elXS,elXB;
var elY,elYS,elYB;
var styleMenu;
var slidersAspect;
var checkboxVertical;
var divSwitchVertical;
var colorDrawer,colorMeuble,colorPlateau,colorCadre;
var menuPoignees;
var menuTexturesPlateau,menuTexturesCadre,menuTexturesMeuble,menuTexturesTiroirs;
var dropDownPoignees, dropDownMeuble, dropDownTiroirs, dropDownPlateau, dropDownCadre;
var buttonSelectMeuble,buttonSelectBloc,buttonSelectEtagere;
var buttonAdjustBloc,buttonAdjustMeuble;
var buttonSousMeuble;
var titleMeuble, titleBloc;
var contextMenuGeneral,contextMenuMeuble,contextMenuBloc,contextMenuEtagere;

function initializeScene() {
    buildEnvironnement ();
    initDragMeuble();
    initDragBloc();
    initDragEtagere();
    initializeInterface();
    initializeRaycast();
    initializePoignees();
    
    createNewMeuble();
    createInterfaceMeuble(indiceCurrentMeuble);
    updateInterfaceBlocs(indiceCurrentMeuble);
    updateInterfaceAspect(indiceCurrentMeuble);
    initPoigneesList();
    initListTexturesMeuble();
    createDropDownMenu(menuTexturesMeuble,imagesMeuble,"meuble");
    addListenerMenuTexture(menuTexturesMeuble);
    createDropDownMenu(menuTexturesTiroirs,imagesMeuble,"tiroirs");
    addListenerMenuTexture(menuTexturesTiroirs);
    createDropDownMenu(menuTexturesPlateau,imagesMeuble,"plateau");
    addListenerMenuTexture(menuTexturesPlateau);
    createDropDownMenu(menuTexturesCadre,imagesMeuble,"cadre");
    addListenerMenuTexture(menuTexturesCadre);
    createDropDownMenu(menuPoignees,poignees,"poignees");
    addListenerMenuPoignees(menuPoignees);
    frameCamera();
    renderer.setAnimationLoop( animate );

    initDragHandleBloc();
    initDragHandleMeuble();
}

function getHTMLElements () {
  body=document.getElementById("body");
  interfaceDiv = document.getElementById("interface");
  meubleDiv = document.getElementById("meuble");
  buttonNewMeuble = document.getElementById("buttonNewMeuble");
  buttonDupliquerMeuble = document.getElementById("buttonDupliquerMeuble");
  buttonDeleteMeuble = document.getElementById("buttonDeleteMeuble");
  selectListMeubles =document.getElementById("selectListMeubles");
  buttonSocle = document.getElementById("buttonSocle");
  buttonPied = document.getElementById("buttonPied");
  buttonSuspendu = document.getElementById("buttonSuspendu");
  buttonPlateau = document.getElementById("buttonPlateau");
  buttonCadre = document.getElementById("buttonCadre");
  blocsDiv = document.getElementById("blocs");
  selectListBlocs=document.getElementById("selectListBlocs");
  buttonPorte = document.getElementById("buttonPorte");
  buttonTiroirs = document.getElementById("buttonTiroirs");
  buttonEtageres = document.getElementById("buttonEtageres");
  buttonPlein = document.getElementById("buttonPlein");
  divPortes = document.getElementById("divPortes");
  divEtageres = document.getElementById("divEtageres");
  buttonUnePorte = document.getElementById("buttonUnePorte");
  buttonDeuxPortes = document.getElementById("buttonDeuxPortes");
  buttonOuverturePorteDroite = document.getElementById("buttonOuverturePorteDroite");
  buttonOuverturePorteGauche = document.getElementById("buttonOuverturePorteGauche");
  nbPortes = document.getElementById("nbPortes");
  sensOuverture = document.getElementById("sensOuverture");
  buttonEtageresVerticales = document.getElementById("checkBoxEtageresVerticales");
  meubleSliders = document.getElementById("meubleSliders");
  blocsSliders = document.getElementById("blocsSliders");
  checkboxRentrant = document.getElementById("checkboxRentrant");
  listPoigneesPopup = document.getElementById("listPoigneesPopup");
  listPoigneesName = document.getElementById("listPoigneesName");
  styleMenu = document.getElementById("style");
  slidersAspect = document.getElementById("slidersAspect");
  divSwitchVertical = document.getElementById("divSwitchVertical");
  checkboxVertical = document.getElementById("checkboxVertical");
  colorDrawer = document.getElementById("colorDrawer");
  colorMeuble = document.getElementById("colorMeuble");
  colorPlateau = document.getElementById("colorPlateau");
  colorCadre = document.getElementById("colorCadre");
  menuPoignees = document.getElementById("menuPoignees");
  menuTexturesPlateau = document.getElementById("menuTexturesPlateau");
  menuTexturesCadre = document.getElementById("menuTexturesCadre");
  menuTexturesMeuble = document.getElementById("menuTexturesMeuble");
  menuTexturesTiroirs = document.getElementById("menuTexturesTiroirs");
  dropDownPoignees = document.getElementById("dropDownPoignees");
  dropDownMeuble = document.getElementById("dropDownMeuble");
  dropDownTiroirs = document.getElementById("dropDownTiroirs");
  dropDownPlateau = document.getElementById("dropDownPlateau");
  dropDownCadre = document.getElementById("dropDownCadre");
  buttonSelectMeuble = document.getElementById("buttonSelectMeuble");
  buttonAdjustMeuble = document.getElementById("buttonAdjustMeuble");
  buttonSelectBloc = document.getElementById("buttonSelectBloc");
  buttonAdjustBloc = document.getElementById("buttonAdjustBloc");
  buttonSelectEtagere = document.getElementById("buttonSelectEtagere");
  buttonSousMeuble = document.getElementById("buttonSousMeuble");
  titleMeuble=document.getElementById("titleMeuble");
  titleBloc=document.getElementById("titleBloc");
  contextMenuGeneral = document.getElementById("contextMenuGeneral");
  contextMenuMeuble = document.getElementById("contextMenuMeuble");
  contextMenuBloc= document.getElementById("contextMenuBloc");
  contextMenuEtagere= document.getElementById("contextMenuEtagere");
}

function initializeInterface() {
  getHTMLElements();

  // listeners
  //buttons meuble
  checkboxVertical.addEventListener("click", switchVertical);
  buttonSocle.addEventListener("click",function() {switchSocle(indiceCurrentMeuble)});
  buttonPied.addEventListener("click",function() {switchPied(indiceCurrentMeuble)});
  buttonSuspendu.addEventListener("click",function() {switchSuspendu(indiceCurrentMeuble)});  //à virer
  buttonPlateau.addEventListener("click",function() {switchPlateau(indiceCurrentMeuble)});
  buttonCadre.addEventListener("click",function() {switchCadre(indiceCurrentMeuble)});
  //context menu meuble
  document.getElementById("switchVertical").addEventListener("click",function() {switchVertical(indiceCurrentMeuble)});
  document.getElementById("switchPlateau").addEventListener("click",function() {switchPlateau(indiceCurrentMeuble)});
  document.getElementById("switchCadre").addEventListener("click",function() {switchCadre(indiceCurrentMeuble)});
  document.getElementById("switchSocle").addEventListener("click",function() {switchSocle(indiceCurrentMeuble)});
  document.getElementById("switchPied").addEventListener("click",function() {switchPied(indiceCurrentMeuble)});

  //functions meubles
  function switchVertical() {
    if (meubles[indiceCurrentMeuble].disposition == "vertical") meubles[indiceCurrentMeuble].disposition = "horizontal";
    else meubles[indiceCurrentMeuble].disposition = "vertical";
    meubles[indiceCurrentMeuble].computeBlocsSize();
    meubles[indiceCurrentMeuble].updateMeuble();
    frameCamera()
  }

  function switchSocle(num) {
    meubles[num].hasSocle=!meubles[num].hasSocle;
    if (meubles[num].hasSocle) {
      meubles[num].hasPied=false;
      meubles[num].IsSuspendu=false;
    }
    updateButtonFixationGroup(num);
    meubles[num].updateMeuble();
  }

  function switchPied(num) { meubles[num].hasPied=!meubles[num].hasPied;
    if (meubles[num].hasPied) {
      meubles[num].hasSocle=false;
      meubles[num].IsSuspendu=false;
    }
    updateButtonFixationGroup(num);
    meubles[num].updateMeuble();
  }

  function switchSuspendu(num) {
    meubles[num].IsSuspendu=!meubles[num].IsSuspendu;
    if (meubles[num].IsSuspendu) {
      meubles[num].hasPied=false;
      meubles[num].hasSocle=false;
    }
    updateButtonFixationGroup(num);
    meubles[num].updateMeuble();
  }

  function switchPlateau(num) {
    meubles[num].hasPlateau=!meubles[num].hasPlateau;
    updateButtonPlateau(num);
    meubles[num].updateMeuble();
  }

  function switchCadre(num) {
    meubles[num].hasCadre=!meubles[num].hasCadre;
    updateButtonCadre(num);
    meubles[num].updateMeuble();
  }

  // buttons blocs
  buttonPorte.addEventListener("click", switchPorte);
  buttonTiroirs.addEventListener("click", switchTiroirs);
  buttonEtageres.addEventListener("click", switchEtageres);
  buttonPlein.addEventListener("click", switchPanneau);
  buttonSousMeuble.addEventListener("click", switchSousMeuble);

  //contexte menu blocs
  document.getElementById("switchPorte").addEventListener("click", switchPorte);
  document.getElementById("switchTiroirs").addEventListener("click", switchTiroirs);
  document.getElementById("switchEtageres").addEventListener("click", switchEtageres);
  document.getElementById("switchPanneau").addEventListener("click", switchPanneau);
  document.getElementById("switchSousMeuble").addEventListener("click", switchSousMeuble);

//functions blocs
  function switchPorte() { 
    meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].type="Portes";
    refreshInterfaceBlocs(indiceCurrentMeuble);
    meubles[indiceCurrentMeuble].updateMeuble();
  }

  function switchTiroirs() { 
    meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].type="Tiroirs"; 
    refreshInterfaceBlocs(indiceCurrentMeuble);
    meubles[indiceCurrentMeuble].updateMeuble();
  }
  
  function switchEtageres() { 
    meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].type="Etageres"; 
    refreshInterfaceBlocs(indiceCurrentMeuble);
    meubles[indiceCurrentMeuble].updateMeuble();
  }

  function switchPanneau() { 
    meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].type="Panneau"; 
    refreshInterfaceBlocs(indiceCurrentMeuble);
    meubles[indiceCurrentMeuble].updateMeuble();
  }

  function switchSousMeuble() {
    meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].type="SousMeuble"; 
    refreshInterfaceBlocs(indiceCurrentMeuble);
    meubles[indiceCurrentMeuble].updateMeuble();
  }

  buttonUnePorte.addEventListener("click", function () {
    meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].nombrePortes="1";
    refreshInterfaceBlocs(indiceCurrentMeuble);
    meubles[indiceCurrentMeuble].updateMeuble();
    }, false);
  buttonDeuxPortes.addEventListener("click", function () {
    meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].nombrePortes="2";
    refreshInterfaceBlocs(indiceCurrentMeuble);
    meubles[indiceCurrentMeuble].updateMeuble();
  }, false);
  buttonOuverturePorteGauche.addEventListener("click", function () {
    meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].ouverturePorte="gauche";
    refreshInterfaceBlocs(indiceCurrentMeuble);
    meubles[indiceCurrentMeuble].updateMeuble();
  }, false);
  buttonOuverturePorteDroite.addEventListener("click", function () {
    meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].ouverturePorte="droite";
    refreshInterfaceBlocs(indiceCurrentMeuble);
    meubles[indiceCurrentMeuble].updateMeuble();
  }, false);

  buttonEtageresVerticales.addEventListener("click", function () {switchEtagereVerticale(indiceCurrentBloc)});
  checkboxRentrant.addEventListener("click", function () {switchRentrant(indiceCurrentBloc)});

  function switchEtagereVerticale() {
    meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].etageresVerticales=!meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].etageresVerticales;
    meubles[indiceCurrentMeuble].updateMeuble();
  }

  function switchRentrant() {
    meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].IsRentrant=!meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].IsRentrant;
    meubles[indiceCurrentMeuble].updateMeuble();
  } 

  selectListMeubles.addEventListener("change", function eventListMeublesPopup(event) { 
    changeCurrentMeubleFromPopup(event.target.value);
  }, false);
  selectListBlocs.addEventListener("change",function changeCurrentBlocFromPopup(event) { 
    startMaterialAnimationBloc(event.target.value);
    indiceCurrentBloc=event.target.value;
    updateInterfaceBlocs(indiceCurrentMeuble);
    updateSelectableEtagere();
    updateSelectableHandleBloc();
  },false);
  buttonNewMeuble.addEventListener("click", function eventButtonNewMeuble() {
    createNewMeuble();
    updateInterfaceMeuble();
    indiceCurrentBloc = 0;
    updateInterfaceBlocs(indiceCurrentMeuble)
  }, false);
  buttonDupliquerMeuble.addEventListener("click", function eventButtonDupliquerMeuble() {
    duplicateMeuble(indiceCurrentMeuble);
    updateInterfaceMeuble();
    indiceCurrentBloc = 0;
    updateInterfaceBlocs(indiceCurrentMeuble)
  }, false);
  buttonDeleteMeuble.addEventListener("click", function eventButtonDeleteMeuble() {
    deleteMeuble(indiceCurrentMeuble);
    //recomputeMeublesId();
    updateInterfaceMeuble();
    indiceCurrentBloc = 0;
    updateInterfaceBlocs(indiceCurrentMeuble);
    updateSelectableBlocs();
    frameCamera();
  }, false);
  styleMenu.addEventListener("change", function changeStyle(event) { 
    style = event.target.value;
    updateScene(); 
  }, false);
  colorMeuble.addEventListener("input", function eventColorMeubleChange(event) {
    material.color=new THREE.Color(event.target.value);
  }, false);
  colorDrawer.addEventListener("input", function eventColorDrawerChange(event) {
    materialTiroirs.color=new THREE.Color(event.target.value);
  }, false);
  colorPlateau.addEventListener("input", function eventColorPlateauChange(event) {
    materialPlateau.color=new THREE.Color(event.target.value);
    materialPlateauAvant.color=new THREE.Color(event.target.value);
    materialPlateauCote.color=new THREE.Color(event.target.value);
  }, false);
  colorCadre.addEventListener("input", function eventColorCadreChange(event) {
    materialCadre.color=new THREE.Color(event.target.value);
    materialCadreCote.color=new THREE.Color(event.target.value);
    materialCadreAvant.color=new THREE.Color(event.target.value);
  }, false);
  
  buttonSelectMeuble.addEventListener("click", function clickSelectMeubles(event) {
    selectionMode = "meubles";
    dragMeubleControls.activate();
    dragBlocControls.deactivate();
    dragHandleBlocControls.deactivate();
    dragHandleMeubleControls.deactivate();
    dragEtagereControls.deactivate();
    updateAllSelectable();
    refreshSelectButtons();
  },false);

  buttonAdjustMeuble.addEventListener("click", function clickAjusteMeubles(event) {
    selectionMode = "ajusteMeubles";
    dragHandleMeubleControls.activate();
    dragMeubleControls.deactivate();
    dragBlocControls.deactivate();
    dragHandleBlocControls.deactivate();
    dragEtagereControls.deactivate();
    updateAllSelectable();
    refreshSelectButtons();
  },false);

  buttonSelectBloc.addEventListener("click", function clickSelectBlocs(event) {
    selectionMode = "blocs";
    dragMeubleControls.deactivate();
    dragHandleMeubleControls.deactivate();
    dragBlocControls.activate();
    dragHandleBlocControls.deactivate();
    dragEtagereControls.deactivate();
    updateAllSelectable();
    refreshSelectButtons();
  },false);

  buttonAdjustBloc.addEventListener("click", function clickAjusteBlocs(event) {
    selectionMode = "ajusteBlocs";
    dragMeubleControls.deactivate();
    dragHandleMeubleControls.deactivate();
    dragBlocControls.deactivate();
    dragHandleBlocControls.activate();
    dragEtagereControls.deactivate();
    updateAllSelectable();
    refreshSelectButtons();
  },false);

  buttonSelectEtagere.addEventListener("click", function clickSelectEtageres(event) {
    selectionMode = "etageres";
    dragMeubleControls.deactivate();
    dragHandleMeubleControls.deactivate();
    dragBlocControls.deactivate();
    dragHandleBlocControls.deactivate();
    dragEtagereControls.activate();
    updateAllSelectable();
    refreshSelectButtons();
  },false);

  let listOptionsContextMenu = document.getElementsByClassName("contextMenuOption");
  for (let item of listOptionsContextMenu) {
    item.addEventListener('click',onClickOptionMenu);
  }

  function onClickOptionMenu(event) {
    //console.log(event);
    selectionMode=event.target.type;
    //console.log (selectionMode);
    contextMenuGeneral.style.display="none";
    updateAllSelectable();
    refreshSelectButtons();
  }
  
  refreshSelectButtons();

  //refresh colors
  colorMeuble.value=materialParams.color;
  colorDrawer.value=materialTiroirsParams.color;
  colorPlateau.value=materialPlateauParams.color;
  colorCadre.value=materialCadreParams.color;

  //dropdown menus
  dropDownPoignees.addEventListener("click",function (event) {dropMenu(event)},false);
  dropDownMeuble.addEventListener("click",function (event) {dropMenu(event)},false);
  dropDownTiroirs.addEventListener("click",function (event) {dropMenu(event)},false);
  dropDownPlateau.addEventListener("click",function (event) {dropMenu(event)},false);
  dropDownCadre.addEventListener("click",function (event) {dropMenu(event)},false);

  meubleSliders.style.display="none";
  titleMeuble.addEventListener("click",function expandInterfaceMeuble(event) {
    if (meubleSliders.style.display=="none") {meubleSliders.style.display="block"}
      else {meubleSliders.style.display="none"}
  },false);

  blocsSliders.style.display="none";
  titleBloc.addEventListener("click",function expandInterfaceBlocs(event) {
    if (blocsSliders.style.display=="none") {blocsSliders.style.display="block"}
      else {blocsSliders.style.display="none"}
  },false);
}

function refreshSelectButtons() {
  if (selectionMode=="meubles") {
    buttonSelectMeuble.className="buttonOn";
    dragMeubleControls.activate();
    dragBlocControls.deactivate();
    dragEtagereControls.deactivate();
    if (dragHandleBlocControls) dragHandleBlocControls.deactivate();
    if (dragHandleMeubleControls) dragHandleMeubleControls.deactivate();
  }
  else {buttonSelectMeuble.className="buttonOff"}

  if (selectionMode=="ajusteMeubles") {
    buttonAdjustMeuble.className="buttonOn";
    dragMeubleControls.deactivate();
    dragBlocControls.deactivate();
    dragEtagereControls.deactivate();
    if (dragHandleBlocControls) dragHandleBlocControls.deactivate();
    if (dragHandleMeubleControls) dragHandleMeubleControls.activate();

  }
  else {buttonAdjustMeuble.className="buttonOff"}

  if (selectionMode=="blocs") {
    buttonSelectBloc.className="buttonOn";
    dragMeubleControls.deactivate();
    dragBlocControls.activate();
    dragEtagereControls.deactivate();
    if (dragHandleBlocControls) dragHandleBlocControls.deactivate();
    if (dragHandleMeubleControls) dragHandleMeubleControls.deactivate();
  }
  else {buttonSelectBloc.className="buttonOff"}

  if (selectionMode=="ajusteBlocs") {
    buttonAdjustBloc.className="buttonOn";
    dragMeubleControls.deactivate();
    dragBlocControls.deactivate();
    dragEtagereControls.deactivate();
    if (dragHandleBlocControls) dragHandleBlocControls.activate();
    if (dragHandleMeubleControls) dragHandleMeubleControls.deactivate();
  }
  else {buttonAdjustBloc.className="buttonOff"
    
  if (selectionMode=="etageres") {
    buttonSelectEtagere.className="buttonOn";
    dragMeubleControls.deactivate();
    dragBlocControls.deactivate();
    dragEtagereControls.activate();
    if (dragHandleBlocControls) dragHandleBlocControls.deactivate();
    if (dragHandleMeubleControls) dragHandleMeubleControls.deactivate();
  }
  else {buttonSelectEtagere.className="buttonOff"}
}
}

function dropMenu(event) {
 let elt=document.getElementById(event.target.attributes["cible"].value);
 elt.addEventListener("mouseleave",function (event) {closeMenu(event)},false);
  if (elt.style.display=="block") elt.style.display="none"
  else elt.style.display="block";
  if (elt.id=="menuPoignees") {
    menuTexturesMeuble.style.display="none";
    menuTexturesCadre.style.display="none";
    menuTexturesPlateau.style.display="none";
    menuTexturesTiroirs.style.display="none";
  }
  if (elt.id=="menuTexturesMeuble") {
    menuTexturesCadre.style.display="none";
    menuTexturesPlateau.style.display="none";
    menuTexturesTiroirs.style.display="none";
    menuPoignees.style.display="none";
  }
  if (elt.id=="menuTexturesTiroirs") {
    menuTexturesCadre.style.display="none";
    menuTexturesPlateau.style.display="none";
    menuTexturesMeuble.style.display="none";
    menuPoignees.style.display="none";
  }
  if (elt.id=="menuTexturesPlateau") {
    menuTexturesCadre.style.display="none";
    menuTexturesMeuble.style.display="none";
    menuTexturesTiroirs.style.display="none";
    menuPoignees.style.display="none";
  }
  if (elt.id=="menuTexturesCadre") {
    menuTexturesMeuble.style.display="none";
    menuTexturesPlateau.style.display="none";
    menuTexturesTiroirs.style.display="none";
    menuPoignees.style.display="none";
  }
}

function closeMenu(event) {
  event.target.style="none";
}

function loadTexture(textures,i,material,materialAvant,materialCote,sx,sy,sz) {
  var file=textures[i].fileName;
  let loader = new THREE.TextureLoader();

  if (sx && sy && sz) {
    var sMax = Math.max(sx,sy,sz);
  }
  else {
    sx=1;
    sy=1;
    sz=1;
  }

  var texture = loader.load(file);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set( 1, sx/sMax );
  material.map=texture;
  material.bumpMap = texture;
  material.bumpScale=5;

  if (materialAvant) {
    var textureAvant = texture.clone();
    textureAvant.repeat.set( 1, sy/sMax );
    materialAvant.map=textureAvant;
    materialAvant.bumpMap = textureAvant;
    materialAvant.bumpScale=5;
  }

  if (materialCote) {
    var textureCote = texture.clone();
    textureCote.repeat.set( 1, sz/sMax );
    materialCote.map=textureCote;
    materialCote.bumpMap = textureCote;
    materialCote.bumpScale=5;
  }
	//texture1.dispose();
}

function createDropDownMenu(menu,textures,piece) {
  menu.innerHTML="";
  for (var i=0;i<textures.length;i++) {
    let divLineMenu=document.createElement("div");
    divLineMenu.className="lineMenuImage";
    divLineMenu.value=i;
    divLineMenu.piece=piece;
    let im=document.createElement("img");
    im.className="image";
    im.src=textures[i].thumbnail;
    im.value=i;
    im.piece=piece;
    let caption=document.createElement("div");
    caption.className="caption";
    caption.innerHTML=textures[i].titre;
    caption.value=i;
    caption.piece=piece;
    divLineMenu.append(im);
    divLineMenu.append(caption);
    menu.append(divLineMenu);
  }
}

function addListenerMenuTexture(menu) {
  for (var divLineMenu of menu.children) {
    divLineMenu.addEventListener("click",function eventChangeTexture(event){
      meubles[indiceCurrentMeuble].changeTexture(event)}
      ,false);
  }
}

function addListenerMenuPoignees(menu) {
  for (var divLineMenu of menu.children) {
    divLineMenu.addEventListener("click",function eventChangePoignee(event) {changePoignee(event.target.value)},false);
  }
}

//var poigneeRoot;
var poigneeGroup=new THREE.Group();

function changePoignee(i) {
  let name=poignees[i].filename;
  const loader = new GLTFLoader();
  poigneeGroup = new THREE.Group(); // revoir init
  loader.load(name, function (gltf) {
    let poigneeRoot = gltf.scene.getObjectByName('poignee');
    for (var i = poigneeRoot.children.length; i > 0; i--) {
      poigneeGroup.add(poigneeRoot.children[i - 1]);
    }
    poigneeGroup.scale.set(100, 100, 100);
    updateScene();
    //refreshListPoigneesPopup();
  });
}

/* function refreshListPoigneesPopup() {
  listPoigneesPopup.id = "listPoigneesSelect";
  listPoigneesSelect.addEventListener("change",function eventChangePoignee(event) {changePoignee(event.target.value)},false);
} */

/* function initializeListePoignees() {
  var listPoigneesSelect = document.getElementById("listPoigneesSelect");
  listPoigneesSelect.innerHTML="";
  for (const [key,value] of poigneesFileList) {
    let o = document.createElement("option");
    o.innerHTML = key;
    listPoigneesSelect.append(o);
  }
  listPoigneesSelect.addEventListener("change",function eventChangePoignee(event) {changePoignee(event.target.value)},false);
} */

function initializePoignees() {
  geometry = new THREE.SphereGeometry(taillePoignees,12,8);
  poignee = new THREE.Mesh( geometry, materialPoignees );
  poigneeGroup.add(poignee);
}

function recomputeMeublesId() {
  for (var i=0; i<meubles.length; i++)
  {
    meubles[i].numero=i;
    updateAllSelectable();
  }
}

function deleteMeuble(num) {
  scene.remove(meubles[num].root);
  meubles.splice(num,1);
  geometry.dispose();
  material.dispose();
  //selectableMeuble.splice(num,1);
  //meubleRoot.splice(num,1);
  geometry.dispose();
  material.dispose();
  if (meubles.length < (indiceCurrentMeuble+1)) indiceCurrentMeuble-=1;
  recomputeMeublesId();
  updateScene();
  updateAllSelectable();
}

function placeNewMeuble(num) {
  var minX = -10e34;
  if (num>0) {
    for (var i=0; i<num; i++) {
      let currentMinX = meubles[i].x+meubles[i].getLargeurReelle()/2+ meubles[num].getLargeurReelle()/2;
      minX = Math.max(currentMinX,minX)
    }
    meubles[num].x=minX;
    meubles[num].y=0;
  }
}

function createNewMeuble() {
  indiceCurrentMeuble=meubles.length;
  meubles[indiceCurrentMeuble] = new Meuble(indiceCurrentMeuble);
  //meubles[indiceCurrentMeuble].createGeometryRoot();
  placeNewMeuble(indiceCurrentMeuble);
  meubles[indiceCurrentMeuble].updateMeuble();
  //updateScene();
  frameCamera();
}

function duplicatePropertiesValues(fromObj,toObj) {
  Object.keys(fromObj,toObj).forEach(key => {
    if (typeof toObj[key]=="object") {
      duplicatePropertiesValues(fromObj[key],toObj[key]);
    }
    else {toObj[key]=fromObj[key]}
  });
}

function duplicateMeuble(num) {
  var indiceNewMeuble=meubles.length;
  meubles[indiceNewMeuble] = new Meuble(indiceNewMeuble);
  for (var i=0; i<meubles[num].nbBlocs; i++) {
    meubles[indiceNewMeuble].bloc[i]=new Bloc(i);
    duplicatePropertiesValues(meubles[num].bloc[i],meubles[indiceNewMeuble].bloc[i])
  }
  duplicatePropertiesValues(meubles[num],meubles[indiceNewMeuble])
  meubles[indiceNewMeuble].numero = indiceNewMeuble;
  meubles[indiceNewMeuble].name = "Meuble "+(indiceNewMeuble+1);
  //meubles[indiceNewMeuble].createGeometryRoot();
  //indiceCurrentMeuble = indiceNewMeuble;
  meubles[indiceNewMeuble].updateMeuble();
  placeNewMeuble(indiceNewMeuble);
  scene.add(meubles[indiceNewMeuble].root);
  changeCurrentMeuble(indiceNewMeuble);
  updateScene();
  frameCamera();
}

function getElementSuedois(x, y, z, largeur, epaisseurS) {
  let geo = new THREE.BufferGeometry;
  let pieceA = new THREE.BufferGeometry;
  pieceA = RoundEdgedBox(largeur, y, epaisseurS, 0.5, 1, 1, 1, 1);
  let pieceB = pieceA.clone(true);
  pieceA.translate(largeur / 2 - x / 2, 0, 0);
  pieceB.translate(-largeur / 2 + x / 2, 0, 0);
  let pieceC = new THREE.BufferGeometry;
  //let offset=0.7;
  let offset = -0.70;
  pieceC = RoundEdgedBox(x - 2 * largeur - offset, largeur, epaisseurS, 0.5, 1, 1, 1, 1);
  let pieceD = pieceC.clone(true);
  pieceC.translate(0, -y / 2 + largeur/2, 0);
  pieceD.translate(0, y / 2 - largeur/2, 0);
  let cadre = new THREE.BoxGeometry(x - 2 * largeur, y - largeur, z);
  let geometries = [];
  geometries.push(pieceA, pieceB, pieceC, pieceD, cadre);
  geo = BufferGeometryUtils.mergeGeometries(geometries);
  pieceA.dispose();
  pieceB.dispose();
  pieceC.dispose();
  pieceD.dispose();
  return geo;
}

function getElementBase (x,y,z,styleParam) {
  let geo = new THREE.BufferGeometry;
  if (isPreviewOn || styleParam=="Basique") {
    geo = new THREE.BoxGeometry( x,y,z );
    return geo;
  }
  if (styleParam == "Arrondi") {geo = RoundEdgedBox(x,y,z,0.5,1,1,1,1)}
  if (styleParam=="Suédois 1") { 
    geo = getElementSuedois (x,y,z,largeurSuedois,epaisseurSuedois);
  }
  if (styleParam=="Suédois 2") { 
    let geoTemp = getElementSuedois (x,y,z,largeurSuedois/2,epaisseurSuedois);
    let pieceCentre = new THREE.BufferGeometry;
    pieceCentre = RoundEdgedBox(x-2*largeurSuedois, y-2*largeurSuedois, epaisseurSuedois, 0.5, 1, 1, 1, 1);
    let geometries=[];
    geometries.push(geoTemp,pieceCentre);
    geo = BufferGeometryUtils.mergeGeometries(geometries);
  }
  return geo;
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
      let sl = document.createElement("div");
      sl.className = "lineSlider";
      let s = document.createElement("input");
      s.type="range";
      s.name="s."+nom;
      s.id="slider";
      s.value=value;
      s.min=min;
      s.max=max;
      s.classList.add("inputSlider");
      sl.append(s);
      let b = document.createElement("input");
      b.type="number";
      b.name="b."+nom;;
      b.id="number";
      b.value=value;
      b.min=min;
      b.max=max;
      b.classList.add("inputValue");
      sl.append(b);
      divParam.append(sl);
      return([divParam,s,b,sl]);
}

function updateInterfaceMeuble() {
  clearInterfaceMeuble();
  createInterfaceMeuble(indiceCurrentMeuble); // Rebuild HTML content
}

function clearInterfaceMeuble() {
  meubleSliders.innerHTML="";
  selectListMeubles.innerHTML="";
  selectListMeubles.classList.remove("animationMeublesName");
}

function changeCurrentMeuble(num) {
  let indicePreviousMeuble = indiceCurrentMeuble;
  indiceCurrentMeuble = num;
  if (meubles[indicePreviousMeuble].root.cube) meubles[indicePreviousMeuble].root.cube.visible=false;
  if (meubles[indiceCurrentMeuble].disposition=="vertical") {checkboxVertical.checked=true;} else {checkboxVertical.checked=false;}
  updateInterfaceMeuble();
  updateInterfaceBlocs(indiceCurrentMeuble);
  //meubles[indiceCurrentMeuble].updateSelectableBlocs();
  updateInterfaceAspect(indiceCurrentMeuble);  
  updateAllSelectable();
}

function changeCurrentMeubleFromClick(num) {
  changeCurrentMeuble(num);
  selectListMeubles.classList.remove("animationMeublesName");
  selectListMeubles.offsetWidth; //pour temporisation
  selectListMeubles.classList.add("animationMeublesName");
  checkRaycast();
}

function onMaterialAnimationFinish (num) {
  clipActionMaterial.stop();
  clipActionMaterial.reset();
  let boiteSelectionMeuble = selectableMeuble.find(boite => boite.numero == num)
  boiteSelectionMeuble.visible = false;

  boiteSelectionMeuble.material = materialSelectionMeuble;
  mixerMaterial.removeEventListener('finished', onMaterialAnimationFinish, false);
  mixerMaterial=undefined;
//console.log("show children boite");
//console.log(boiteSelectionMeuble);
  showChildren(boiteSelectionMeuble);
}

var materialSelectionMeubleAnim = new THREE.MeshStandardMaterial( materialSelectionMeubleParams );
var offset = new THREE.NumberKeyframeTrack( '.opacity', [ 0, 1 ], [ 0.5,0] )
var clipMaterial = new THREE.AnimationClip( 'opacity_animation', 1, [ offset ] );
var mixerMaterial;
var clipActionMaterial;

var clock = new THREE.Clock();

function startMaterialAnimationMeuble(num) {
  let boiteSelectionMeuble = selectableMeuble.find(boite => boite.numero == num)
  meubles[num].root.getObjectsByProperty("shortName","boiteSelectionMeuble");

  boiteSelectionMeuble.material = materialSelectionMeubleAnim;
  hideChildren(boiteSelectionMeuble);
  boiteSelectionMeuble.visible = true;
  //console.log("boiteSelectionMeuble=",boiteSelectionMeuble);

  mixerMaterial = new THREE.AnimationMixer( materialSelectionMeubleAnim );
  clipActionMaterial = mixerMaterial.clipAction( clipMaterial );
  clipActionMaterial.setLoop(0,1);
  clipActionMaterial.play();
  mixerMaterial.addEventListener( 'finished', function finishMaterialAnim() {onMaterialAnimationFinish(num)}, false )
}
  
function changeCurrentMeubleFromPopup(num) {
  startMaterialAnimationMeuble(num);
  changeCurrentMeuble(num);
  //meubles[num].highlightOn();
  //checkRaycast();
}

function createInterfaceMeuble(indiceMeuble) { // Rebuild HTML content for list meubles
  let meuble = meubles[indiceMeuble];
  for (var i=0;i<meubles.length;i++) {
    let o = document.createElement("option");
    o.value = i;
    o.innerHTML = meubles[i].name;
    if (i==indiceCurrentMeuble) o.selected="selected";
    selectListMeubles.append(o);
  }
//listMeublesName.value=meuble.name;  // keep
  elh=createSlider(meuble,"hauteur","Hauteur",meuble.hauteur,0,10,250);
  meubleSliders.append(elh);
  // hautS=elh.childNodes[1].childNodes[1];
  // hautB=elh.childNodes[1].childNodes[2];
  hautS=elh.querySelector("#slider");
  hautB=elh.querySelector("#number");

  hautS.addEventListener("input",function() {eventHauteurInput(indiceMeuble)},false);
  hautB.addEventListener("change",function() {eventHauteurInput(indiceMeuble)},false);

  function eventHauteurInput(indiceMeuble) {
    var hauteur=+hautS.value; //forçage de type
    var maxHeight = getMaxAllowedHeight(indiceMeuble);
    meubles[indiceMeuble].hauteur = (hauteur<maxHeight) ? hauteur : maxHeight;
    meubles[indiceMeuble].computeBlocsSize();
    updateInterfaceBlocs(indiceMeuble);
    meubles[indiceCurrentMeuble].updateMeuble();
    updateInterfaceHauteur(indiceMeuble);
    frameCamera();
  }

  let elp=createSlider(meuble,"profondeur","Profondeur",meuble.profondeur,0,10,250);
  elp.querySelector("#slider").addEventListener("input",function eventElpInput() {meubles[indiceCurrentMeuble].updateMeuble();frameCamera();},false);
  elp.querySelector("#number").addEventListener("change",function eventElpChange() {meubles[indiceCurrentMeuble].updateMeuble();frameCamera();},false);
  meubleSliders.append(elp);

  large=createSlider(meuble,"largeur","Largeur",meuble.largeur,0,10,500);
  meubleSliders.append(large);

  largeS=large.querySelector("#slider");
  largeB=large.querySelector("#number");
  largeS.addEventListener("input",function() {eventLargeInput(indiceMeuble)},false);
  largeB.addEventListener("change",function() {eventLargeInput(indiceMeuble)},false);

  function eventLargeInput(indiceMeuble) {
    var largeur=+largeS.value; //forçage de type
    var maxWidth = getMaxAllowedWidth(indiceMeuble);
    meubles[indiceMeuble].largeur = (largeur<maxWidth) ? largeur : maxWidth;
    meubles[indiceMeuble].computeBlocsSize();
    updateInterfaceBlocs(indiceMeuble);
    meubles[indiceCurrentMeuble].updateMeuble();
    updateInterfaceLargeur(indiceMeuble);
    frameCamera();
  }
  
  let elnbb = createSlider(meuble,"nbBlocs","Nombre de blocs",meuble.nbBlocs,0,1,maxBlocs);
  elnbb.querySelector("#slider").addEventListener("input",function eventElnbbInput() {onChangeBlocsQuantity(indiceMeuble)},false);
  elnbb.querySelector("#number").addEventListener("change",function eventElnbbChange() {onChangeBlocsQuantity(indiceMeuble)},false);
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
    x = (x<translateX[0]) ? translateX[0] : x;
    x = (x>translateX[1]) ? translateX[1] : x;
    meubles[indiceMeuble].x = x;
    meubles[indiceMeuble].computeBlocsSize();
    updateInterfaceBlocs(indiceMeuble);
    meubles[indiceCurrentMeuble].updateMeuble();
    meubles[indiceMeuble].placeMeuble();
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
    y = (y<translateY[0]) ? translateY[0] : y;
    y = (y>translateY[1]) ? translateY[1] : y;
    meubles[indiceMeuble].y = y;
    meubles[indiceMeuble].computeBlocsSize();
    updateInterfaceBlocs(indiceMeuble);
    meubles[indiceCurrentMeuble].updateMeuble();
    //meubles[num].placeMeuble();
    elYS.value = meubles[indiceMeuble].y;
    elYB.value = elYS.value;
    frameCamera();
  }

  if (meubles[indiceMeuble].disposition=="vertical") {checkboxVertical.checked=true} else {checkboxVertical.checked=false}
  updateButtonPlateau(indiceMeuble);
  updateButtonCadre(indiceMeuble);
  updateButtonFixationGroup(indiceMeuble);
  updateButtonDelete();
}

function updateButtonDelete() {
  if (meubles.length>1) {
    buttonDeleteMeuble.disabled = false;
  }
  else {
    buttonDeleteMeuble.disabled = true;
  }
}
function updateButtonPlateau(indiceMeuble) { if (meubles[indiceMeuble].hasPlateau) {buttonPlateau.className="buttonOn"} else {buttonPlateau.className="buttonOff"}}
function updateButtonCadre(indiceMeuble) {if (meubles[indiceMeuble].hasCadre) {buttonCadre.className="buttonOn"} else {buttonCadre.className="buttonOff"}}

function updateButtonSocle(indiceMeuble) { if (meubles[indiceMeuble].hasSocle) {buttonSocle.className="buttonOn"} else {buttonSocle.className="buttonOff"}}
function updateButtonPied(indiceMeuble) { if (meubles[indiceMeuble].hasPied) {buttonPied.className="buttonOn"} else {buttonPied.className="buttonOff"} }
function updateButtonSuspendu(indiceMeuble) {  if (meubles[indiceMeuble].IsSuspendu) {buttonSuspendu.className="buttonOn"} else {buttonSuspendu.className="buttonOff"}}

function updateButtonFixationGroup(indiceMeuble) {
  updateButtonSocle(indiceMeuble);
  updateButtonPied(indiceMeuble);
  updateButtonSuspendu(indiceMeuble);
}

function updateInterfaceLargeur(indiceMeuble) {
  large.querySelector("#slider").value = meubles[indiceMeuble].largeur;
  large.querySelector("#number").value = meubles[indiceMeuble].largeur;
}

function updateInterfaceHauteur(indiceMeuble) {
  elh.querySelector("#slider").value = meubles[indiceMeuble].hauteur;
  elh.querySelector("#number").value = meubles[indiceMeuble].hauteur;
}

function updateInterfaceX(indiceMeuble) {
  elX.querySelector("#slider").value = meubles[indiceMeuble].x;
  elX.querySelector("#number").value = meubles[indiceMeuble].x;
}

function updateInterfaceY(indiceMeuble) {
  elY.querySelector("#slider").value = meubles[indiceMeuble].y;
  elY.querySelector("#number").value = meubles[indiceMeuble].y;
}

function changeCurrentBlocFromClick(num) {
  changeCurrentMeubleFromClick(selectableBloc[num].numeroMeuble);
  indiceCurrentBloc = selectableBloc[num].bloc.numero;
  updateInterfaceBlocs(indiceCurrentMeuble);
  selectListBlocs.classList.remove("animationBlocsName");
  selectListBlocs.offsetWidth; // pour temporisation
  selectListBlocs.classList.add("animationBlocsName");
  updateSelectableEtagere();
  updateSelectableHandleBloc();

}

function onChangeBlocsQuantity(indiceMeuble) {
  meubles[indiceMeuble].changeBlocsQuantity();
  meubles[indiceMeuble].calculTaille();
  updateInterfaceBlocs(indiceMeuble);
  updateInterfaceLargeur(indiceMeuble);
  updateInterfaceHauteur(indiceMeuble);
  updateScene();
  frameCamera();
}

function rebuildInterfaceBlocs(indiceMeuble) {
  for (var i=0;i<meubles[indiceMeuble].nbBlocs;i++) {
    let o = document.createElement("option");
    o.value = i;
    o.innerHTML="Bloc "+(i+1);
    if (i==indiceCurrentBloc) o.selected="selected";
    selectListBlocs.append(o);
  }
}

function refreshInterfaceBlocs(indiceMeuble) {
  if (meubles[indiceMeuble].bloc[indiceCurrentBloc].type == "Portes") {
    buttonPorte.className = "buttonOn";
    divPortes.style.display = "inline";
  }
  else {
    buttonPorte.className = "buttonOff";
    divPortes.style.display = "none";
  }
  if (meubles[indiceMeuble].bloc[indiceCurrentBloc].type == "Tiroirs") { buttonTiroirs.className = "buttonOn" } else { buttonTiroirs.className = "buttonOff" }
  if (meubles[indiceMeuble].bloc[indiceCurrentBloc].type == "Etageres") {
    buttonEtageres.className = "buttonOn";
    divEtageres.style.display = "inline";
  }
  else {
    buttonEtageres.className = "buttonOff"
    divEtageres.style.display = "none";
  }
  if (meubles[indiceMeuble].bloc[indiceCurrentBloc].type == "Panneau") { buttonPlein.className = "buttonOn" } else { buttonPlein.className = "buttonOff" }
  if (meubles[indiceMeuble].bloc[indiceCurrentBloc].nombrePortes == "1") {
    buttonUnePorte.className = "buttonOn";
    sensOuverture.style.display="inline";
    if (meubles[indiceMeuble].bloc[indiceCurrentBloc].ouverturePorte == "gauche") { buttonOuverturePorteGauche.className = "buttonOn" } else { buttonOuverturePorteGauche.className = "buttonOff" }
    if (meubles[indiceMeuble].bloc[indiceCurrentBloc].ouverturePorte == "droite") { buttonOuverturePorteDroite.className = "buttonOn" } else { buttonOuverturePorteDroite.className = "buttonOff" }
  } else { buttonUnePorte.className = "buttonOff" }
  if (meubles[indiceMeuble].bloc[indiceCurrentBloc].nombrePortes == "2") {
    buttonDeuxPortes.className = "buttonOn";
    buttonOuverturePorteGauche.className = "buttonOff";
    buttonOuverturePorteDroite.className = "buttonOff";
    sensOuverture.style.display="none";
  } else { buttonDeuxPortes.className = "buttonOff" }

  if (meubles[indiceMeuble].bloc[indiceCurrentBloc].etageresVerticales) {buttonEtageresVerticales.checked=true;} else {buttonEtageresVerticales.checked=false;}
  if (meubles[indiceMeuble].bloc[indiceCurrentBloc].IsRentrant) {checkboxRentrant.checked=true;} else {checkboxRentrant.checked=false;}
}

function updateInterfaceBlocs(indiceMeuble) {
  clearInterfaceBlocs();
  rebuildInterfaceBlocs(indiceMeuble);
  createSlidersBlocs(indiceMeuble,indiceCurrentBloc);
  refreshInterfaceBlocs(indiceMeuble);
}

function clearInterfaceBlocs() {
  blocsSliders.innerHTML="";
  selectListBlocs.innerHTML="";
}

function onMaterialBlocAnimationFinish (num) {
  clipActionMaterial.stop();
  clipActionMaterial.reset();
  let bloc=meubles[indiceCurrentMeuble].root.getObjectByName("boiteSelectionBloc"+num);
  bloc.material = materialSelectionBloc;
  bloc.visible = false;
  mixerMaterial.removeEventListener('finished', onMaterialBlocAnimationFinish, false);
  mixerMaterial=undefined;
}

var materialSelectionBlocAnim = new THREE.MeshStandardMaterial( materialSelectionBlocParams );

function startMaterialAnimationBloc(num) {
  let bloc=meubles[indiceCurrentMeuble].root.getObjectByName("boiteSelectionBloc"+num);
  //meubles[indiceCurrentMeuble].bloc[num]
  bloc.material = materialSelectionBlocAnim;
  bloc.visible = true;
  mixerMaterial = new THREE.AnimationMixer( materialSelectionBlocAnim );
  clipActionMaterial = mixerMaterial.clipAction( clipMaterial );
  clipActionMaterial.setLoop(0,1);
  clipActionMaterial.play();
  mixerMaterial.addEventListener( 'finished', function finishMaterialAnim() {onMaterialBlocAnimationFinish(num)}, false )
}

function createSlidersBlocs(indiceMeuble, numBloc) {
  let meuble = meubles[indiceMeuble];
  let slideLargeurBloc = createSlider(meuble.bloc[numBloc], "taille", "Taille du bloc", meuble.bloc[numBloc].taille, 0, 10, 200);
  blocsSliders.append(slideLargeurBloc);
  slideLargeurBloc.querySelector("#slider").addEventListener("input", function () {
    meuble.calculTaille();
    updateInterfaceLargeur(indiceMeuble);
    updateInterfaceHauteur(indiceMeuble);
    meubles[indiceMeuble].updateMeuble();
    frameCamera();
  }
    , false);
  slideLargeurBloc.querySelector("#number").addEventListener("change", function () {
    meuble.calculTaille();
    updateInterfaceLargeur(indiceMeuble);
    updateInterfaceHauteur(indiceMeuble);
    meubles[indiceMeuble].updateMeuble();
    frameCamera();
  }
    , false);
  let sliderEtageres = createSlider(meuble.bloc[numBloc], "etageres", "Nombre d'étagères", meuble.bloc[numBloc].etageres, 0, 0, maxEtageres);
  sliderEtageres.querySelector("#slider").addEventListener("input", function () {
    meuble.bloc[numBloc].etagereY=[]; //raz des positions prédéfinies si changement de nb d'étageres;
    meubles[indiceCurrentMeuble].updateMeuble();
    frameCamera();
  }, false);
  sliderEtageres.querySelector("#number").addEventListener("change", function () {
    meubles[indiceCurrentMeuble].updateMeuble();
    frameCamera();
  }, false);
  blocsSliders.append(sliderEtageres);
}

function updateInterfaceAspect(indiceMeuble) {
  slidersAspect.innerHTML="";
  let sliderOffsetPoignees=createSlider(meubles[indiceMeuble],"offsetPoignees","Décalage",meubles[indiceMeuble].offsetPoignees,0,-100,100);
  slidersAspect.append(sliderOffsetPoignees);
  sliderOffsetPoignees.addEventListener("input", function () {meubles[indiceMeuble].updateMeuble()}, false);
}

window.addEventListener("DOMContentLoaded", initializeScene);
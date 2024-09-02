import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { poignees } from './poignees';
import { initPoigneesList } from "./poignees.js";
import { initListTexturesMeuble, imagesMeuble, image, imagesPath } from "./textures.js"

class Element {
  constructor(bloc,i) {
    this.numero = i;
    this.unherited = true;
    this.bloc=bloc;
    this.meuble=this.bloc.meuble;
    //this.numeroBloc=bloc.numero;
    this.xPredefini=undefined;
    this.yPredefini=undefined;
    this.yTiroirPredefini=undefined;
    this.offsetTiroir=0;
    this.updateOffsetTiroir();

    //commun aux autres classes
    this.localType=undefined;
    this.localStyle=undefined;
    this.isSelected=false;
    this.selectionBox=undefined;
    this.isRentrantLocal = undefined;
    this.isRentrant=false;
    console.log("element n°",this.numero,"created");
  }

  get style() {if (this.localStyle) {return this.meuble.localStyle}
    else return this.bloc.style;}

  set style(value) {this.localStyle=value;}
  set type(value) {this.localType=value;}
  set y(value) {this.yPredefini = value;}
  set x(value) {this.xPredefini = value;}

  get type() {if (this.localType) return this.localType;
    else return this.bloc.type;}

  get y() {
    //console.log("yPredefini : ",this.yPredefini);
    if (this.yPredefini) return this.yPredefini;
    var step = (this.bloc.h ) / (this.bloc.etageres + 1);
    //return -1;
    return step * (-0.5 + this.numero - this.bloc.etageres / 2);}

  get x() {if (this.xPredefini) return this.bloc.xPredefini;
    var step = (this.bloc.l - 2 * epaisseur) / (this.bloc.etageres + 1);
    return step * (0.5 + this.numero - this.bloc.etageres / 2);}

  get yTiroir() {if (this.numero<this.bloc.etageres) {
      if (this.bloc.elements[this.numero-1].yPredefini) return this.bloc.elements[this.numero-1].yPredefini}
    var step = (this.bloc.h - 0.25 * epaisseur - this.offsetTiroir) / (this.bloc.etageres + 1);
    return step * (0.5 + this.numero  - this.bloc.etageres / 2);}

  set isRentrant(value) {this.isRentrantLocal = value;}

  get isRentrant() {return this.isRentrantLocal;
    /* if (this.isRentrantLocal) {return this.isRentrantLocal}
    else return this.bloc.isRentrant; */
  }

 /*  set yTiroir(value) {
    this.yTiroirPredefini = value;
  } */

  reset() {
    this.unherited = true;
    this.xPredefini = undefined;
    this.yPredefini = undefined;
    this.yTiroirPredefini = undefined;
    this.isRentrantLocal = undefined;
    this.localType = undefined;
    this.localStyle = undefined;
  }

  updateOffsetTiroir() {
    console.log(this.isRentrantLocal);
    console.log(this.isRentrant);
    if (this.isRentrant) {this.offsetTiroir=epaisseur}
    else {this.offsetTiroir=0}
    console.log(this.offsetTiroir);
  }

  getEtagere() {
    if (this.numero<1 || this.numero>this.bloc.etageres) return;
    let geometry;
    if (this.etageresVerticales) {
      geometry = new THREE.BoxGeometry(epaisseur, this.bloc.h - 2 * epaisseur, this.bloc.p - epaisseur);
    }
    else {
      geometry = new THREE.BoxGeometry(this.bloc.l - 2 * epaisseur, epaisseur, this.bloc.p - epaisseur);
    }
    let etagere = new THREE.Mesh(geometry, material);
  
    if (this.bloc.etageresVerticales) { etagere.position.set(this.x, 0, 0) }
    else { etagere.position.set(0, this.y, 0) }
  
    etagere.name = "etagere " + this.numero;
    etagere.shortName = "etagere";
    etagere.element=this;
  
    return etagere;
  }

  getTiroir() {
    this.updateOffsetTiroir;
    console.log("bloc n°",this.bloc.numero);
    console.log(this.bloc.elements[this.numero+1].y);
    let ySuivant = this.bloc.elements[this.numero+1].y;
    let yl = ySuivant-this.y;
    let yTiroir = this.y + yl / 2;
    let xl = this.bloc.l - 0.25 * epaisseur - 2 * this.offsetTiroir;
    let zl = epaisseur;

    let tiroirRoot=new THREE.Object3D();

    //boite de selection element
    geometry = new THREE.BoxGeometry(xl+0.05, yl+0.05, this.bloc.meuble.profondeur + this.offsetTiroir + offsetSuedois + 0.1 + epaisseur);
    let boiteSelectionElement = new THREE.Mesh(geometry, materialSelectionEtagere);
    boiteSelectionElement.name = "boiteSelectionElement " + this.numero;
    boiteSelectionElement.shortName = "boiteSelectionElement";
    boiteSelectionElement.category = "boiteSelection";
    tiroirRoot.add(boiteSelectionElement);
    boiteSelectionElement.position.set(0, 0, -this.bloc.meuble.profondeur / 2);
    if (!this.isSelected) boiteSelectionElement.visible = false;
    boiteSelectionElement.element = this;
    this.selectionBox=boiteSelectionElement;

    if (this.type == "Tiroirs") {
      //tiroir
      geometry = createPlanche(xl, yl, zl, this.style);
      let tiroir = new THREE.Mesh(geometry, materialTiroirs);
      tiroir.name = "tiroir " + this.numero;
      tiroir.shortName = "tiroir";
      tiroirRoot.add(tiroir);

     /*  //etagere pour manipulation
      if (this.numero==1) tiroirRoot.add(this.getEtagere()); */

      //poignees
      let poigneeB = poigneeGroup.clone(true);
      poigneeB.name = "poignee";
      tiroir.add(poigneeB);
      let yPoignee = yl * (this.bloc.meuble.offsetPoignees / 250);
      poigneeB.position.set(0, yPoignee, epaisseur / 2 + offsetSuedois);
      //console.log("getTiroir tiroir created");

    }
    let zTiroir = this.bloc.p / 2;

    tiroirRoot.position.set(0, yTiroir, zTiroir - this.offsetTiroir);
    return tiroirRoot;
  }
  
  getElement() {
    //console.log("get Element",this.type);
    //if (this.type=="Tiroirs")
    var elementRoot = new THREE.Object3D();
    elementRoot.name="elementRoot";
    elementRoot.attach(this.getTiroir());
    console.log("getEtagere");
    if (this.type=="Etageres" || this.type=="Tiroirs") {
      let etagere=this.getEtagere();
      if (etagere) elementRoot.attach(etagere); }
    return elementRoot;
    //if (this.type=="Etageres")
    //  return this.getEtagere();
  }
}

class Bloc {
  constructor(meuble, i) {
    this.numero = i;
    this.taille = 40;
    this.createBlocRoot();
    this.p = meuble.profondeur;
    this.meuble = meuble;
    this.updateLHP();
    this.unherited = true;
    this.elements = [];
    this.etageresLocal = 3;
    for (var i=0; i<this.etageres+2; i++) {this.elements[i] = new Element(this,i)} // -1/+1 pour étageres 0 et n+1
    this.selectionBox = undefined;
    //commun autres autres classes
    this.localType = undefined;
    this.localStyle = undefined;
    this.isSelected = false;
    this.isRentrantLocal = false;
    //this.isRentrant=false;
    //commun à la classe meuble
    //this.etageres=3;
    
    this.ouverturePorteLocal = undefined;
    this.nombrePortesLocal = undefined;
    this.etageresVerticalesLocal = undefined;
  }

   get etageres() {
    //console.log(this.etageresLocal);
    //return 3;
    if (this.etageresLocal) {return this.etageresLocal}
    else return this.meuble.etageres;
  }

  get ouverturePorte() {
    if (this.ouverturePorteLocal) {return this.ouverturePorteLocal}
    else return this.meuble.ouverturePorte;
  }

  get nombrePortes() {
    if (this.nombrePortesLocal) {return this.nombrePortesLocal}
    else return this.meuble.nombrePortes;
  }

/*   get etageresVerticales() {
    if (this.etageresVerticalesLocal) {return this.etageresVerticalesLocal}
    else return this.meuble.etageresVerticales;
  } */

  //set etageres(value) { this.etageresLocal=value }
  set ouverturePorte(value) { this.ouverturePorteLocal=value }
  set nombrePortes(value) { this.nombrePortesLocal=value }
  //set etageresVerticales(value) { this.etageresVerticalesLocal=value }

  get style() {
    if (this.localStyle) {return this.meuble.localStyle}
    else return this.meuble.style;
  }

  get type() { 
    if (this.localType) {
      return this.localType;}
    else {
      //console.log("this.meuble.type",this.meuble.type);
      return this.meuble.type;}
  }

  set type(value) { this.localType = value; }
  set isRentrant(value) { this.isRentrantLocal = value; }
  set style(value) { this.localStyle = value; } 

  get isRentrant() {
    if (this.isRentrantLocal) {return this.isRentrantLocal}
    else return this.meuble.isRentrant;
  }

  reset () {
    this.unherited=true;
    this.localType=undefined;
  }

createBlocRoot() {
  this.blocRoot = new THREE.Object3D();
  this.blocRoot.name = "Bloc "+this.numero;
  this.blocRoot.shortName = "Bloc";
  this.blocRoot.numero=this.numero;
}

  updateLHP() {
    if (this.meuble.disposition=="horizontal") {this.l=this.taille; this.h=this.meuble.hauteur;}
    if (this.meuble.disposition=="vertical") {this.l=this.meuble.largeur; this.h=this.taille ;} 
  }

  getCadre() {
    geometry = new THREE.BoxGeometry( this.l, epaisseur, this.p );
    plancheBas = new THREE.Mesh( geometry, material );
    plancheBas.name = "plancheBas";
    plancheHaut = new THREE.Mesh( geometry, material );
    plancheHaut.name = "plancheHaut";
    plancheBas.position.set(0,-this.h/2+epaisseur/2,0);
    plancheHaut.position.set(0,this.h/2-epaisseur/2,0);
    geometry = new THREE.BoxGeometry( epaisseur, this.h-epaisseur*2, this.p );
    plancheDroite = new THREE.Mesh( geometry, material );
    plancheDroite.name = "plancheDroite";
    plancheDroite.numBloc = this.numero;
    plancheGauche = new THREE.Mesh( geometry, material );
    plancheGauche.name = "plancheGauche";
    plancheGauche.numBloc = this.numero;
    plancheDroite.position.set(-this.l/2 + epaisseur/2,0,0);
    plancheGauche.position.set(this.l/2 - epaisseur/2,0,0);
    let cadreBlocRoot=new THREE.Group();
    cadreBlocRoot.name="cadreBlocRoot"+this.numero;
    cadreBlocRoot.shortName="cadreBlocRoot";
    cadreBlocRoot.add(plancheBas,plancheHaut,plancheDroite,plancheGauche);
    //scene.add(cadreBlocRoot);
    //this.blocRoot.add(plancheBas,plancheHaut,plancheDroite,plancheGauche);
    return cadreBlocRoot;
  }

  getPortes() {
    var porte = [];
      var offset = this.isRentrant * epaisseur;
      if (this.nombrePortes == "1") {
        geometry = createPlanche(this.l - 0.25 * epaisseur - 2 * offset, this.h - 0.25 * epaisseur - 2 * offset, epaisseur, this.style);
        porte[0] = new THREE.Mesh(geometry, materialTiroirs);
        porte[0].name = "porte 0";
        //poignee
        let poigneeB = poigneeGroup.clone(true);
        poigneeB.name = "poignee";
        porte[0].add(poigneeB);
        let deltaX = this.l / 2 - 4 * taillePoignees;
        if (deltaX < 0) deltaX = 0;
        if (this.ouverturePorte == "droite") { deltaX *= -1; poigneeB.rotateZ(Math.PI / 2); }
        else poigneeB.rotateZ(-Math.PI / 2);  // a soumettre à option
        poigneeB.position.set(deltaX, 0, epaisseur / 2 + offsetSuedois);
        porte[0].position.set(0, 0, this.p / 2 - offset);
        return porte[0]
      }
      else {
        //porte gauche
        geometry = createPlanche(this.l / 2 - 0.25 * epaisseur - offset / 2, this.h - 0.25 * epaisseur - 2 * offset, epaisseur, this.style);
        porte[0] = new THREE.Mesh(geometry, materialTiroirs);
        porte[0].name = "porte 0";

        //poignee gauche
        let poigneeB = poigneeGroup.clone(true);
        poigneeB.rotateZ(-Math.PI / 2);  // a soumettre à option
        poigneeB.name = "poignee";
        porte[0].add(poigneeB);
        let deltaX = this.l / 4 - 4 * taillePoignees;
        if (4 * taillePoignees > this.l / 4) deltaX = 0;
        poigneeB.position.set(deltaX, 0, epaisseur / 2 + offsetSuedois);
        porte[0].position.set(-this.l / 4 + offset / 2, 0, this.p / 2 - offset);

        //porte droite
        porte[1] = new THREE.Mesh(geometry, materialTiroirs);
        porte[1].name = "porte 1";
        //poignee droite
        let poigneeC = poigneeGroup.clone(true);
        poigneeC.rotateZ(Math.PI / 2);  // a soumettre à option
        porte[1].add(poigneeC);
        deltaX *= -1
        poigneeC.position.set(deltaX, 0, epaisseur / 2 + offsetSuedois);
        poigneeC.name = "poignee";
        porte[1].position.set(this.l / 4 - offset / 2, 0, this.p / 2 - offset);
        let porteDoubleRoot=new THREE.Object3D();
        porteDoubleRoot.name="porteDoubleRoot"+this.numero;
        porteDoubleRoot.shortName="porteDoubleRoot";
        porteDoubleRoot.add(porte[0],porte[1]);
        return porteDoubleRoot;
      }
  }

  createElementBloc(i) {
    if (!this.elements[i]) this.elements[i] = new Element(this, i);
  }

  createElementsBloc() {
    for (var i = 0; i < this.etageres+1; i++) this.createElementBloc(i);
  }

  getEtageres() {
    var etagere = [];
    var etageresRoot = new THREE.Object3D();
    etageresRoot.name = "etageresRoot" + this.numero + "_bloc"+this.numero+"_meuble"+this.meuble.numero;
    etageresRoot.shortName = "etageresRoot";
    for (var i = 1; i < this.etageres+1; i++) {
      etagere = this.elements[i].getEtagere();
      if (etagere) {
        etagere.bloc = this;
        etageresRoot.add(etagere);
      }
    }
    return etageresRoot;
  }

  getTiroirs() {
    var tiroirsRoot = new THREE.Object3D();
    tiroirsRoot.name = "tiroirsRoot" + this.numero;
    tiroirsRoot.shortName = "tiroirsRoot";
    for (var i = 0; i < this.etageres+1; i++) {
      //console.log("tiroir n°",i);
      tiroirsRoot.add(this.elements[i].getTiroir());
    }
    return tiroirsRoot;
  }

  getElements() {
    //console.log('getElements');
    var elementsRoot = new THREE.Object3D();
    elementsRoot.name = "elementsRoot" + this.numero;
    elementsRoot.shortName = "elementsRoot";
    for (var i = 0; i < this.etageres+1; i++) {
      console.log("etagere ",i);
      console.log("etagere ",this.elements[i]);
      let element = this.elements[i].getElement();
      if (element) elementsRoot.add(element);
    }
    //console.log("ELEMENT ROOT");

    return elementsRoot;
  }

  getHandleBlocs() {
    geometry = new THREE.BoxGeometry( epaisseurHandleBlocs, this.h+2*epaisseur, this.p+2*epaisseur );
    let coneG = new THREE.Mesh( geometryConeHelper, materialSelectionMeuble);
    let coneD = new THREE.Mesh( geometryConeHelper, materialSelectionMeuble);
    coneG.scale.set(0.8,0.8,0.8);
    coneD.scale.set(0.8,0.8,0.8);
    var handleBlocRoot=new THREE.Object3D();
    handleBlocRoot.name="handleBlocRoot"+this.numero;
    handleBlocRoot.shortName="handleBlocRoot";
    
    if (this.meuble.disposition == "horizontal") {
      let handleBlocGauche = new THREE.Mesh(geometry, materialSelectionBloc);
      handleBlocGauche.name = "handleBlocGauche" + this.numero;
      handleBlocGauche.numBloc = this.numero;
      handleBlocGauche.shortName = "handleBloc";
      handleBlocGauche.bloc=this;
      handleBlocGauche.position.set(-this.l / 2, 0, 0);
      handleBlocGauche.add(coneG,coneD);
      coneG.rotateZ(Math.PI/2);
      coneG.position.set(-2*epaisseurHandleBlocs,0,0);
      coneD.rotateZ(-Math.PI/2);
      coneD.position.set(2*epaisseurHandleBlocs,0,0);
      handleBlocGauche.visible = false;
      handleBlocRoot.add(handleBlocGauche);

      if (this.numero == this.meuble.nbBlocs - 1) {
        let handleBlocDroit = new THREE.Mesh(geometry, materialSelectionBloc);
        handleBlocDroit.name = "handleBlocDroit";
        handleBlocDroit.numBloc = this.numero;
        handleBlocDroit.shortName = "handleBloc";
        handleBlocDroit.bloc=this;
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
        handleBlocRoot.add(handleBlocGauche);
        handleBlocDroit.position.set(this.l / 2, 0, 0);
        handleBlocDroit.visible = false;
        handleBlocRoot.add(handleBlocDroit);
      }
    }
    else { //vertical
      geometry = new THREE.BoxGeometry(this.l+epaisseur, epaisseurHandleBlocs, this.p+epaisseur);
      let handle = new THREE.Mesh(geometry, materialSelectionBloc);
      handle.name = "handleBloc" + this.numero;
      handle.numBloc = this.numero;
      handle.bloc=this;
      handle.shortName = "handleBloc";
      handle.position.set(0, this.h / 2, 0);
      handle.add(coneG,coneD);
      coneG.position.set(0,2*epaisseurHandleBlocs,0);
      coneD.rotateZ(Math.PI);
      coneD.position.set(0,-2*epaisseurHandleBlocs,0);
      handle.visible = false;
      handleBlocRoot.add(handle);
    }
    return handleBlocRoot;
  }

  initializeBloc() {
    //console.log("initializeBloc n°",this.numero);
    if (!this.blocRoot) this.createBlocRoot();
    this.updateLHP();
    this.createElementsBloc();
    //cadre bloc
    this.blocRoot.add(this.getCadre());
    offsetSuedois=((this.style=="Suédois 2")*epaisseurSuedois/4);

    //cadre de sélection pour ajustement tailles (handleBlocs)
    if (!isPreviewOn) { this.blocRoot.add(this.getHandleBlocs()) }

    //portes
    if (this.type == "Portes") {this.blocRoot.add(this.getPortes())}

    /* //etageres
    if (this.type == "Etageres" || (this.type == "Tiroirs" && !isPreviewOn)) {
      this.blocRoot.add(this.getEtageres()); 
      //console.log("blocRoot after etager add",this.blocRoot);
    } */

     /*//tiroirs
    if (this.type == "Tiroirs") {
      this.blocRoot.add(this.getTiroirs());
    } */

     //elements
     if (this.type == "Tiroirs" || this.type == "Etageres") {
      this.blocRoot.add(this.getElements());
    } 

    //sous-meuble
    if (this.type == "SousMeuble") {
      var sousMeuble = new Meuble(0);
      if (this.meuble.disposition == "horizontal") {
        sousMeuble.largeur = 0 + this.taille;
        sousMeuble.computeBlocsSize();
        sousMeuble.hauteur = 0 + this.hauteur;
        sousMeuble.x = 0;
        sousMeuble.y = -this.hauteur / 2;
      }
      if (this.meuble.disposition == "vertical") {
        sousMeuble.hauteur = 0 + this.taille;
        sousMeuble.largeur = 0 + this.largeur;
        sousMeuble.computeBlocsSize();
        sousMeuble.x = 0;
        sousMeuble.y = -this.taille / 2;
      }
      sousMeuble.isSousMeuble = true;
      //sousMeuble.createGeometryRoot();
      sousMeuble.updateMeuble();
      sousMeuble.root.translateZ(-this.profondeur / 2);
      this.blocRoot.add(sousMeuble.root);
    }

    //shadows
    this.blocRoot.traverse(function (child) {
      child.receiveShadow = true;
      child.castShadow = true;
    })

    //boite de sélection
    //geometry = new THREE.BoxGeometry( this.largeur+epsilon, this.hauteur+epsilon, this.profondeur+epsilon );
    geometry = RoundEdgedBox(this.l + epsilon, this.h + epsilon, this.p + epsilon, 2, 1, 1, 1, 1);
    boiteSelectionBloc = new THREE.Mesh(geometry, materialSelectionBloc);
    boiteSelectionBloc.name = "boiteSelectionBloc" + this.numero;
    boiteSelectionBloc.shortName="boiteSelectionBloc";
    boiteSelectionBloc.category = "boiteSelection";
    boiteSelectionBloc.bloc = this;
    this.selectionBox=boiteSelectionBloc;
    boiteSelectionBloc.meuble = this.meuble;
    this.blocRoot.add(boiteSelectionBloc);
    boiteSelectionBloc.visible=this.isSelected;
    return this.blocRoot;
  }

  disposeGeometry() {
    this.blocRoot=[];
    scene.remove(this.blocRoot);
    geometry.dispose;
    material.dispose;
    delete this.blocRoot;
  }
}

class Meuble {
  constructor (num) {
    this.numero = num;
    this.rename();
    this.hauteur = 50;
    this.largeur = 140;
    this.profondeur = 50;
    this.nbBlocs = 3;
    this.x = 0;
    this.y = 0;
    this.bloc = new Array;
    this.disposition = "horizontal";
    for (var i=0; i<this.nbBlocs; i++) {this.bloc[i] = new Bloc(this,i)}
    this.updateTaille();
    this.hasPlateau=false;  //////////////////////////////initialiser bouton et menus couleurs
    this.hasCadre=false;
    this.hasSocle=false;
    this.hasPied=false;
    this.IsSuspendu=true;
    this.offsetPoignees=0;
    this.isSousMeuble=false;
    this.createGeometryRoot();
    //this.style="Basique";
    this.meuble=this;
    this.type="Tiroirs";

    this.isRentrant = false;

    //commun aux autres classes
    this.localStyle = "Arrondi";
    this.isSelected = false;
    this.selectionBox = undefined;

    //commun à la classe bloc
    //this.etageres = 3;
    this.ouverturePorte = "gauche";
    this.nombrePortes = "1";
    this.etageresVerticales = false;
  }

  get style() {
    if (this.localStyle) {return this.localStyle}
    else return globalStyle;
  }

  set style(value) {
    this.localStyle=value;
  } 

  updateTaille () {
    this.updateLargeur();
    this.updateHauteur();
  }
  
  updateLargeur () {
    this.largeur = this.calculSommeLargeurBlocs();
  }

  updateHauteur () {
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

  //collisions
  getMaxAllowedHeight() {
    var deltaY=10e34;
    var maxHeight = 10e34;
    var yA=this.y;
    var cadreA = this.hasCadre*epaisseurCadre;
    var piedA = this.hasPied*hauteurPied;
    var socleA = this.hasSocle*hauteurSocle;
    var plateauA = this.hasPlateau*epaisseurPlateau;
    //var hAReelle=meubles[num].getHauteurReelle();
    for (var i = 0; i < meubles.length; i++) {
      if (i != this.numero) {
        if (this.intersectX(i)) {
          var yB=meubles[i].y;
          if (this.y < meubles[i].y) {
            deltaY = yB-yA-cadreA-socleA-piedA-plateauA;
          }
          maxHeight = Math.min(maxHeight, deltaY);
        }
      }
    }
    return maxHeight;
  }

  getMaxAllowedSpaceOnSides() {
    //var bY;
    //var aY = this.y + this.hauteur / 2;
    var deltaLeft,deltaRight;
    var maxLeft = 10e34;
    var maxRight = 10e34;
    for (var i = 0; i < meubles.length; i++) {
      if (i != this.numero) {
        //bY = meubles[i].y + meubles[i].hauteur / 2;
        if (this.intersectY(i)) {
          if (this.x > meubles[i].x) {
            deltaLeft = (this.x-this.largeur/2 - this.hasCadre*epaisseurCadre) - (meubles[i].x + meubles[i].largeur / 2 + meubles[i].hasCadre*epaisseurCadre);
          }
          else {
            deltaRight = -(this.x + this.largeur / 2 + this.hasCadre*epaisseurCadre) + (meubles[i].x - meubles[i].largeur / 2 - meubles[i].hasCadre*epaisseurCadre);
          }
          maxLeft = Math.min(maxLeft, deltaLeft);
          maxRight = Math.min(maxRight, deltaRight);
        }
      }
    }
    let spaceArray=[];
    spaceArray[0]=maxLeft;
    spaceArray[1]=maxRight;
    return spaceArray;
  }

  getMaxAllowedWidth() {
    var bY;
    //var aY = meubles[num].y + meubles[num].hauteur / 2;
    var deltaX;
    var maxWidth = 10e34;
    for (var i = 0; i < meubles.length; i++) {
      if (i != this.numero) {
        bY = meubles[i].y + meubles[i].hauteur / 2;
        if (this.intersectY(i)) {
          if (this.x > meubles[i].x) {
            deltaX = (this.x) - (meubles[i].x + meubles[i].largeur / 2 + meubles[i].hasCadre*epaisseurCadre + this.hasCadre*epaisseurCadre);
          }
          else {
            deltaX = (meubles[i].x - meubles[i].largeur / 2 - meubles[i].hasCadre*epaisseurCadre - this.hasCadre*epaisseurCadre) - (this.x);
          }
          maxWidth = Math.min(maxWidth, deltaX);
        }
      }
    }
    return 2 * maxWidth;
  }

  getLimitTranslationX(num) {
    var bY;
    var minXGlobal=-10e34;
    var maxXGlobal=+10e34;
    var minX=-10e34;
    var maxX=10e34;
    for (var i = 0; i < meubles.length; i++) {
      if (i != this.numero) {
        bY = meubles[i].y + meubles[i].hauteur / 2 + meubles[i].hasCadre*epaisseurCadre;
        if (this.intersectY(i)) {
            if (this.x > meubles[i].x) {
              minX = (meubles[i].x + meubles[i].largeur / 2 + meubles[i].hasCadre*epaisseurCadre) + (this.largeur / 2+this.hasCadre*epaisseurCadre);
            }
            if (this.x < meubles[i].x) {
              maxX = (meubles[i].x - meubles[i].largeur / 2 - meubles[i].hasCadre*epaisseurCadre) - (this.largeur / 2 + this.hasCadre*epaisseurCadre);
            }
            minXGlobal=Math.max(minX,minXGlobal);
            maxXGlobal=Math.min(maxX,maxXGlobal);
        }
      }
    }
    return [minXGlobal,maxXGlobal];
  }

  getLimitTranslationY() {
    var minYGlobal=0;
    var maxYGlobal=10e34;
    var minY=0;
    var maxY=10e34;
    var hAReelle=this.getHauteurReelle();
    for (var i = 0; i < meubles.length; i++) {
      if (i != this.numero) {
        var yB=meubles[i].y
        if (this.intersectX(i)) {
            if (this.y > meubles[i].y) {
              minY = meubles[i].getHauteurReelle();
            }
            if (this.y < meubles[i].y) {
              maxY = yB-hAReelle;
            }
            minYGlobal=Math.max(minY,minYGlobal);
            maxYGlobal=Math.min(maxY,maxYGlobal);
        }
      }
    }
    return [minYGlobal,maxYGlobal];
  }

intersectY(indiceMeubleB) {
  var cadreA = this.hasCadre*epaisseurCadre;
  var cadreB = meubles[indiceMeubleB].hasCadre*epaisseurCadre;
  var socleA = this.hasSocle*hauteurSocle;
  var socleB = meubles[indiceMeubleB].hasSocle*hauteurSocle;
  var piedA = this.hasPied*hauteurPied;
  var piedB = meubles[indiceMeubleB].hasPied*hauteurPied;
  var aY = this.y + this.hauteur / 2 + cadreA + socleA/2 + piedA/2;
  var bY = meubles[indiceMeubleB].y + meubles[indiceMeubleB].hauteur / 2 + cadreB + socleB/2 + piedB/2;
  var hA = this.hauteur+cadreA+socleA+piedA;
  var hB = meubles[indiceMeubleB].hauteur+cadreB+socleB+piedB;
  var intersectY = (Math.abs(aY - bY) * 2 < (hA + hB));
  return intersectY;
}

intersectX(indiceMeubleB) {
  var cadreA = this.hasCadre*epaisseurCadre;
  var cadreB = meubles[indiceMeubleB].hasCadre*epaisseurCadre;
  var xA=this.x;
  var xB=meubles[indiceMeubleB].x;
  var lA=this.largeur;
  var lB=meubles[indiceMeubleB].largeur;
  var intersectX = (Math.abs(xA - xB - cadreB) * 2 < (lA + lB + cadreA + cadreB));
  return intersectX;
}

  createGeometryRoot() {
    this.root = new THREE.Object3D();
    this.root.name = "meuble " + this.numero;
    this.root.shortName="root";
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
      if (this.style == "Basique" || isPreviewOn) {
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
    scene.remove(geometries);

    //renderer.render( scene, camera );
    renderer.renderLists.dispose();
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
      let blocRoot = this.bloc[i].initializeBloc();
      blocs.add(blocRoot);
      this.bloc[i].disposeGeometry();
     //positionnement bloc dans meuble
    if (this.disposition=="horizontal") {
      var blocPosition = -this.largeur / 2;
    }
    else {var blocPosition = -this.hauteur / 2 ;}
      if (i > 0) {
        for (var j = 0; j < i; j++) {
          blocPosition += this.bloc[j].taille;
        }
      }
      blocPosition += this.bloc[i].taille / 2;
      if (this.disposition=="horizontal") { 
        blocRoot.position.set(blocPosition, 0, 0)
      } 
      else {
        blocRoot.position.set(0, blocPosition, 0);
      }
    }
  }

  getNewBoiteSelectionMeuble() {
    let delta = 0.1 * this.numero;
    let x=this.largeur + delta + epsilon;
    let y=this.hauteur + delta + epsilon;
    let z=this.profondeur + delta + epsilon;
    geometry = RoundEdgedBox(x, y, z, 3, 2, 2, 2, 2)
    cube = new THREE.Mesh(geometry, materialSelectionMeuble);
    //cube.numero = this.numero;
    cube.name = "boiteSelectionMeuble" + this.numero;
    cube.shortName = "boiteSelectionMeuble";
    cube.category = "boiteSelection";
    cube.meuble = this;
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
    handleMeubleRoot.name="handleMeubleRoot";
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
    handleMeubleHaut.meuble = this;
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
    handleMeubleGauche.meuble = this;
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
    handleMeubleDroit.meuble = this;
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
    //console.log("updateMeuble");
    this.updateGeometry();
    //let blocs = this.root.getObjectByName("blocs");
    //let geometries = this.root.getObjectByName("geometries");
    let handlesMeuble = this.root.getObjectByName("handlesMeuble");
    
    handlesMeuble.children=[];
    geometry.dispose();
    material.dispose();

    if (!isPreviewOn) {
      //boite de sélection
      let boiteSelectionMeuble = this.getNewBoiteSelectionMeuble();
      handlesMeuble.add(boiteSelectionMeuble);
      this.selectionBox = boiteSelectionMeuble;
      boiteSelectionMeuble.meuble=this;
      selectableHandleMeuble = [];
      handlesMeuble.add(this.getNewBoiteManipulationHandles());
      updateAllSelectable();
    }
    this.placeMeuble();
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

  rename() {
    this.name="Meuble "+(this.numero+1);
  }
}

var globalStyle="Basique";

var selectionMode="meubles";
var selectedMeuble;
//var selectedElement;
var selectedObjects=[];

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
var offsetSuedois=0;

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
var selectableElements=[];

var pressedKey=undefined;

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
let intersectedElement;
var intersectedBox;
var raycastedBloc=undefined;
var raycastedMeuble=undefined;
var raycastedEtagere=undefined;
var raycastedHandleBloc=undefined;
var raycastedHandleMeuble=undefined;
var raycastedElement=undefined;
var raycastedObject=undefined;
var rayCastEnabled=true;
raycaster = new THREE.Raycaster();

//listener espace 3D
canvas.addEventListener('mousemove', onPointerMove);
window.addEventListener('resize', onWindowResize);
canvas.addEventListener('click', onCanvasClick);
//canvas.addEventListener('dragstart', onCanvasDrag, false);
canvas.addEventListener('contextmenu', onOpenContextMenu);
canvas.addEventListener('mouseleave', function leaving() {
  //console.log("leaving canvas"); resetRaycast();
});

window.addEventListener('keydown',onKeyDown);
window.addEventListener('keyup',onKeyUp);

function checkRaycastObject(selectableList,objectName) {
if (!rayCastEnabled) return;
//var raycastedObject;
  raycaster.setFromCamera(pointer, camera, 0, 1000);
  const intersects = raycaster.intersectObjects(selectableList, true);
  //if (intersects.length > 0 && selectionMode=="elements") {
  if (intersects.length > 0) {
    //console.log(intersects[0].object);
    if (intersectedBox != intersects[0].object) {
      if (intersectedBox && intersectedBox[objectName] && !intersectedBox[objectName].isSelected) {
        intersectedBox.visible = false;
      }
      intersectedBox = intersects[0].object;
      intersectedBox.visible = true;
      raycastedObject = intersectedBox[objectName];
      //console.log(raycastedObject);
    }
  }
  else {
    //if (intersectedBox) console.log(intersectedBox,intersectedBox[objectName]);
    if (intersectedBox) {
      if (intersectedBox[objectName] && !intersectedBox[objectName].isSelected) {
        intersectedBox.visible = false; 
        }
    intersectedBox = null;
    raycastedObject = undefined;
    //console.log(raycastedObject);
   }
  }
  if (intersectedBox && intersectedBox[objectName] && intersectedBox[objectName].isSelected) {
    intersectedBox.visible = true;
    raycastedObject = intersectedBox[objectName];
    //console.log(raycastedObject);
  }
  //if (intersectedBox) console.log(intersectedBox);//,intersectedBloc[objectName])}
  return raycastedObject;
}


function checkRaycastElements() {
  //if (!rayCastEnabled) return;
  //raycaster.setFromCamera(pointer, camera, 0, 1000);
  
  //check intersect with elements
  //const intersects = raycaster.intersectObjects(selectableElements, true);

  if (selectionMode=="elements") raycastedElement=checkRaycastObject(selectableElements,"element");
  /* if (intersects.length > 0 && selectionMode=="elements") {
    if (intersectedElement != intersects[0].object) {
      if (intersectedElement && !intersectedElement.element.selected) intersectedElement.visible = false;
      intersectedElement = intersects[0].object;
      intersectedElement.visible = true;
      raycastedElement = intersects[0].object.element;
    }
  }
  else {
    if (intersectedElement && !intersectedElement.element.selected) intersectedElement.visible = false;
    intersectedElement = null;
    raycastedElement = undefined;
  } */
}







function checkRaycastBlocs() {
/*   if (!rayCastEnabled) return;
  raycaster.setFromCamera(pointer, camera, 0, 1000);
  //check intersect with blocs
  const intersects = raycaster.intersectObjects(selectableBloc, true);
  if (intersects.length > 0) {
    if (intersectedBloc != intersects[0].object) {
      if (intersectedBloc && selectionMode == "blocs") intersectedBloc.visible = false;
      intersectedBloc = intersects[0].object;
      if (selectionMode == "blocs") intersectedBloc.visible = true;
      raycastedBloc = intersects[0].object.bloc;
    }
  }
  else {
    if (intersectedBloc) intersectedBloc.visible = false;
    intersectedBloc = null;
    raycastedBloc = undefined;
  } */
    if (selectionMode=="blocs") raycastedElement=checkRaycastObject(selectableBloc,"bloc");

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
      raycastedMeuble = intersectsMeuble[0].object;
    }
  }
  else {
    if (intersectedMeuble && intersectedMeuble.shortName=="boiteSelectionMeuble") intersectedMeuble.visible = false;
    intersectedMeuble = null;
    raycastedMeuble = undefined;
  }
}

function checkRaycastEtageres() {
  if (!rayCastEnabled) return;
  //console.log(selectableEtagere);

  //check intersect with etageres
  const intersectsEtagere = raycaster.intersectObjects(selectableEtagere, false);
  if (intersectsEtagere[0]) console.log(intersectsEtagere[0].name);

  if (intersectsEtagere.length > 0) {
    //console.log(intersectedEtagere);

    if (intersectedEtagere != intersectsEtagere[0].object) {
      if (intersectedEtagere && selectionMode == "etageres") {
        intersectedEtagere.material.depthTest = false;
        intersectedEtagere.material = material;
        intersectedEtagere.renderOrder = 1;
      }
      intersectedEtagere = intersectsEtagere[0].object;
      //console.log("etagere raycasted");

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
      //console.log(intersectedHandleBloc.shortName);
      intersectedHandleBloc.visible = true;
      intersectedHandleBloc.material.depthTest = false;
      intersectedHandleBloc.renderOrder = 1;
      raycastedHandleBloc = intersectsHandleBloc[0].object.bloc;
    }
  }
  else {
    if (intersectedHandleBloc && (intersectedHandleBloc.shortName=="handleBloc" || intersectedHandleBloc.shortName=="handleMeuble")) {
      intersectedHandleBloc.visible = false;
      intersectedHandleBloc.material.depthTest = true;
      intersectedHandleBloc.renderOrder = 0;
    }
    intersectedHandleBloc = null;
    raycastedHandleBloc = undefined;
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
      raycastedHandleMeuble = intersectsHandleMeuble[0].object;
    }
  }
  else {
    if (intersectedHandleMeuble) {
      let test = intersectedHandleMeuble.hasOwnProperty("shortName");
      if (test) {
        if (intersectedHandleMeuble.shortName=="handleMeuble") intersectedHandleMeuble.visible = false;
        //intersectedHandleMeuble.material.depthTest = true;
        intersectedHandleMeuble.renderOrder = 0;
        //console.log("here");
      } 
    }
    intersectedHandleMeuble = null;
    raycastedHandleMeuble = undefined;
  }
}

function checkRaycast() {
  if (!rayCastEnabled) return;
  if (selectionMode=="elements") { raycastedElement=checkRaycastObject(selectableElements,"element");
  }
  if (selectionMode=="blocs") raycastedBloc=checkRaycastObject(selectableBloc,"bloc");
  if (selectionMode=="meubles") {
    raycastedMeuble=checkRaycastObject(selectableMeuble,"meuble");
    //console.log(checkRaycastObject(selectableMeuble,"meuble"));
  }
/*   if (selectionMode=="etageres") {
    raycastedEtagere=checkRaycastObject(selectableEtagere,"element");
    if (raycastedEtagere) {raycastedEtagere

    }
  } */

  //checkRaycastElements();
  //checkRaycastMeubles();
  //checkRaycastBlocs();
  if (selectionMode=="etageres") checkRaycastEtageres();
  //checkRaycastHandleBlocs();
  //checkRaycastHandleMeubles();
}

//raycast sur les objets 3d lors d'un changement de souris ou de camera
function onCanvasClick () {
  //console.log("raycastedbloc=",raycastedBloc);
  //if ((selectionMode=="blocs") && (raycastedBloc>-1)) changeCurrentBlocFromClick(raycastedBloc);
  //if ((selectionMode=="meubles") && (raycastedMeuble>-1)) changeCurrentMeubleFromClick(raycastedMeuble);
  /* let raycasted=checkRaycastObject(selectableMeuble,"meuble");
    if (!raycasted) clearSelectionList();
  hideAllContextMenu(); */
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
  clearSelectionList();
}
pressedKey=event.key;
//console.log((pressedKey));
}

function onKeyUp(event) {
 pressedKey=undefined;
}

function onOpenContextMenu() {
  contextMenuGeneral.style.display = "block";
  contextMenuGeneral.style.left = pointerScreen.x + "px";
  contextMenuGeneral.style.top = pointerScreen.y + "px";
  if (raycastedMeuble) {
    changeCurrentMeubleFromClick(raycastedMeuble.meuble);
    updateAllSelectable();
  }
  contextMenuMeuble.style.display = "block";

  if (raycastedBloc) {
    indiceCurrentBloc = raycastedBloc.bloc.numero;
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

function hideRaycastedBox(raycastedBox) {
  if (raycastedBox) {
    if (!raycastedBox.isSelected) {
      raycastedBox.selectionBox.visible = false
      raycastedBox = undefined
    }
  }
}


function hideAllRaycastedBoxes() {
  hideRaycastedBox(raycastedMeuble);
  hideRaycastedBox(raycastedElement);
  hideRaycastedBox(raycastedBloc);
  hideRaycastedBox(raycastedHandleBloc);
  hideRaycastedBox(raycastedHandleMeuble);
  hideRaycastedBox(raycastedMeuble);
  //hideRaycastedBox(raycastedEtagere);
}

function clearRaycast() {
  //console.log("clearRaycast");
  //console.log("intersectedElement, raycastedElement", intersectedElement, raycastedElement);
  //console.log("intersectedMeuble, raycastedMeuble", intersectedMeuble, raycastedMeuble);

  controls.removeEventListener('change', checkRaycast);
  intersectedBox = undefined;

  hideAllRaycastedBoxes();
 // if (intersectedBloc != null) { intersectedBloc.visible = false; intersectedBloc = null; }
/*   if (raycastedMeuble) {
    if (!raycastedMeuble.isSelected) {
      raycastedMeuble.selectionBox.visible = false
      raycastedMeuble = undefined
    }
  } */
 
 /*  if (intersectedHandleBloc != null) { intersectedHandleBloc.visible = false; intersectedHandleBloc = null; }
  if (intersectedHandleMeuble != null) { intersectedHandleMeuble.visible = false; intersectedHandleMeuble = null; }
  if (intersectedEtagere != null) { intersectedEtagere.visible = false; intersectedEtagere = null; }
  if (intersectedElement != null) { intersectedElement.visible = false; intersectedElement = null; } */
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

function hideAllBoxes() {
  let allBoxes=[];
  scene.getObjectsByProperty("category","boiteSelection",allBoxes);
  //console.log(allBoxes);
  for (var i=0; i<allBoxes.length;i++) {
    //console.log(allBoxes[i]);
    allBoxes[i].visible=false;
  }
}

//selection functions
function clearSelectionList() {
  for (var i=selectedObjects.length; i>0; i--)
  {
    //console.log("clear selection :");
    let object=selectedObjects[0];
    //console.log(selectedObjects[0].name);
    object.isSelected=false;
    if (object.selectionBox) {
      //console.log(object.selectionBox);
      object.selectionBox.visible=false;}
      selectedObjects.splice(0,1);
  }
  hideAllRaycastedBoxes();
  //hideAllBoxes();
}

function addToSelection(object) {
  //console.log(object);
  object.isSelected=true;
  //console.log(object);
  object.selectionBox.visible=true;
  const isInSelectedObjects = (objectInList) => objectInList==object;
  let index=selectedObjects.findIndex(isInSelectedObjects);
  if (index>-1) {console.log("object already in list !!!")}
  else {
    selectedObjects.push(object);
    //console.log("object ",object,"added");
  }
}

function removeFromSelection(object) {
  object.isSelected=false;
  object.selectionBox.visible=false;
  //console.log("remove from selection");
  const isInSelectedObjects = (objectInList) => objectInList==object;
  let index=selectedObjects.findIndex(isInSelectedObjects);
  if (index<0) {console.log("object not in list !!!")}
  else {
    selectedObjects.splice(index,1);
  }
}

function select(object) {
  if (!pressedKey || pressedKey != "Shift") {clearSelectionList()}

    object.isSelected = !object.isSelected;
    if (object.isSelected) { addToSelection(object) }
    else { removeFromSelection(object) }
}

//drag
var newHelper;
var dragElementControls;
function initDragElements() {
  //drag elements
  dragElementControls = new DragControls(selectableElements, camera, renderer.domElement);
  //console.log("drag element init");
  dragElementControls.addEventListener('dragstart',function (event) {
    if (selectionMode!="elements") return;
    //controls.enabled = false;
    //rayCastEnabled = false;
    //console.log("drag element");
    let clickedElement=event.object.element;//.bloc.element;
    
    select(clickedElement);
    //console.log(clickedElement.isSelected);

    event.object.xInitial = event.object.position.x;
    event.object.yInitial = event.object.position.y;
    event.object.zInitial = event.object.position.z;
  });

  dragElementControls.addEventListener('drag',function (event) {
    //console.log("raycast end");
    event.object.position.x=event.object.xInitial;
    event.object.position.y=event.object.yInitial;
    event.object.position.z=event.object.zInitial;
    rayCastEnabled = true;
    controls.enabled = true;
  });

  dragElementControls.addEventListener('dragEnd',function (event) {
    //console.log("raycast end");
    rayCastEnabled = true;
    controls.enabled = true;
  });
}


var dragHandleBlocControls;
function initDragHandleBloc() {
  //drag handle bloc
  dragHandleBlocControls = new DragControls(selectableHandleBloc, camera, renderer.domElement);
  
  dragHandleBlocControls.addEventListener('dragstart', function (event) {

    if (selectionMode!="ajusteBlocs") return;
    controls.enabled = false;
    rayCastEnabled = false;
    //event.object.material.emissive.set(0xaaaaaa);

    let clickedMeuble=event.object.bloc.meuble;
    //console.log(clickedMeuble.name);
    if (selectedMeuble!=clickedMeuble) changeCurrentMeubleFromClick(clickedMeuble);

    let blocId = event.object.bloc.numero;
    let parent = event.object.parent.parent;
    let blocPrecedent = parent.getObjectByName("Bloc " + (blocId - 1));
    let blocSuivant = parent.getObjectByName("Bloc " + (blocId + 1));

    var dragLimit=selectedMeuble.getMaxAllowedSpaceOnSides();
    event.object.deltaMaxGauche=dragLimit[0];
    event.object.deltaMaxDroite=dragLimit[1];

    if (selectedMeuble.disposition=="horizontal") {
    if (blocPrecedent) {
      var xMin = event.object.position.x - selectedMeuble.bloc[blocId - 1].taille / 2;}
    else {var xMin = event.object.x-dragLimit[0]}
    if (blocSuivant) { var xMax = event.object.position.x + selectedMeuble.bloc[blocId + 1].taille / 2 }
    else { if (event.object.name == "handleBlocDroit") { xMax = event.object.x+dragLimit[1] } }

    event.object.xMin = xMin;
    event.object.xMax = xMax;
    event.object.xInitial = event.object.position.x;
    event.object.xMeubleInitial = selectedMeuble.x;
    isPreviewOn=true;
  }

  else { //vertical
    if (blocSuivant) { var yMax = event.object.position.y + selectedMeuble.bloc[blocId + 1].taille / 2 }
    else {var yMax = 10e35;}
    event.object.yMax = yMax;
    event.object.yInitial = event.object.position.y;
    event.object.yMeubleInitial = selectedMeuble.y;
    event.object.hauteurMeubleInitial = selectedMeuble.hauteur;

    event.object.maxDeltaY=selectedMeuble.getMaxAllowedHeight()-selectedMeuble.hauteur;
  }
    if (blocId > 0) event.object.tailleBlocPrecedent = selectedMeuble.bloc[blocId - 1].taille;
    if (blocId < selectedMeuble.nbBlocs-1) event.object.tailleBlocSuivant = selectedMeuble.bloc[blocId + 1].taille;
    event.object.blocId = blocId;

    //copie du helper
    newHelper=event.object.clone(true);
    event.object.attach(newHelper);
    newHelper.position.set(0,0,0);
    scene.attach(newHelper);
    event.object.visible=false;
    newHelper.visible=true;
    event.object.newHelperXInit=newHelper.position.x;
    event.object.newHelperYInit=newHelper.position.y;
  });

  dragHandleBlocControls.addEventListener('drag', function (event) {
    if (selectionMode!="ajusteBlocs") return;
    //event.object.material.emissive.set(0xaaaaaa);
    var obj1 = event.object;
    var blocId = obj1.bloc.numero;
    scene.add(newHelper);

    if (selectedMeuble.disposition == "horizontal") {
      let x = obj1.position.x;
      x = x > event.object.xMax ? event.object.xMax : x;
      x = x < event.object.xMin ? event.object.xMin : x;
      var delta = x - obj1.xInitial;

      //poignee située entre 2 blocs :
      if (blocId > 0 && obj1.name != "handleBlocDroit") {
        selectedMeuble.bloc[blocId - 1].taille = obj1.tailleBlocPrecedent + delta;
      }
      var fact = -1;
      //poignee située à gauche du meuble :
      if (blocId == 0) {
        //test collision
        if (-delta > (obj1.deltaMaxGauche)) {
          delta = -obj1.deltaMaxGauche;
          x = obj1.xInitial + delta;
        }
        selectedMeuble.x = obj1.xMeubleInitial + delta / 2;
        fact = -1;
      }
      //poignée située à droite :
      if (obj1.name == "handleBlocDroit") {
        // test collision
        if (delta > (obj1.deltaMaxDroite)) {
          delta = obj1.deltaMaxDroite;
          x = obj1.xInitial + delta;
        }
        fact = 1;
        selectedMeuble.x = obj1.xMeubleInitial + delta / 2;
      }
      selectedMeuble.bloc[blocId].taille = fact * (x + obj1.xInitial);
      obj1.position.set(x, 0, 0);

      newHelper.position.x=obj1.newHelperXInit+delta;
      //console.log(newHelper.visible);
    }

    else { //vertical
      let y = obj1.position.y;
      delta=y-obj1.yInitial;
      delta = delta>obj1.maxDeltaY ? obj1.maxDeltaY : delta;
        selectedMeuble.bloc[blocId].taille = 2*obj1.yInitial + delta;
        if (blocId<selectedMeuble.nbBlocs-1) 
          {selectedMeuble.bloc[blocId+1].taille = obj1.tailleBlocSuivant - delta}
        newHelper.position.y=obj1.newHelperYInit+delta;
    }
    selectedMeuble.updateTaille();
    selectedMeuble.updateMeuble();
    //selectedMeuble.placeMeuble();
    updateInterfaceMeuble();
    updateInterfaceBlocs();
  });

  dragHandleBlocControls.addEventListener('dragend', function (event) {
    scene.remove(newHelper);
    geometry.dispose();
    material.dispose();
    if (selectionMode!="ajusteBlocs") return;
    isPreviewOn=false;

    //event.object.material.emissive.set(0x000000);
    
    selectedMeuble.updateMeuble();
    resetRaycast();
    updateAllSelectable();
    controls.enabled = true;
    rayCastEnabled = true;
  });

}

var dragHandleMeubleControls;
function initDragHandleMeuble() {
  //drag handle bloc
  dragHandleMeubleControls = new DragControls(selectableHandleMeuble, camera, renderer.domElement);
  
  dragHandleMeubleControls.addEventListener('dragstart', function (event) {
    if (selectionMode!="ajusteMeubles") {
      //console.log("abort");
      return;
    }
    controls.enabled = false;
    rayCastEnabled = false;
    changeCurrentMeubleFromClick(event.object.meuble);
    //event.object.material.emissive.set(0xaaaaaa);
    let meubleId = event.object.indiceMeuble;
    event.object.meubleId = meubleId;
    var dragLimit=selectedMeuble.getMaxAllowedSpaceOnSides();
    event.object.deltaMaxGauche=dragLimit[0];
    event.object.deltaMaxDroite=dragLimit[1];
    event.object.xInitial = event.object.position.x;
    event.object.xMeubleInitial = selectedMeuble.x;
    event.object.yInitial = event.object.position.y;
    event.object.yMeubleInitial = selectedMeuble.y;
    event.object.largeurInitiale = selectedMeuble.largeur;
    event.object.maxH=selectedMeuble.getMaxAllowedHeight();
    isPreviewOn=true;
  });

  dragHandleMeubleControls.addEventListener('drag', function (event) {
    if (selectionMode!="ajusteMeubles") return;
    //event.object.material.emissive.set(0xaaaaaa);
    var obj1 = event.object;
    //var meubleId = obj1.meubleId;

    //ajuste sur max size si collision
    if (obj1.name == "handleMeubleHaut") {
      let y = obj1.position.y;
      y = y > obj1.maxH/2 ? obj1.maxH/2 : y;
      obj1.position.set(0, y, 0);
      selectedMeuble.hauteur=y*2;
    }
    if (obj1.name == "handleMeubleDroit") {var fact=-1} else {var fact=1}
    if (obj1.name == "handleMeubleGauche" || obj1.name == "handleMeubleDroit") {
      let x = obj1.position.x;
      var delta = x - obj1.xInitial;
      if (obj1.name == "handleMeubleGauche") {
        if (-delta > (obj1.deltaMaxGauche / 2)) {
          delta = -obj1.deltaMaxGauche / 2;
          x = obj1.xInitial + delta;
        }
      }
      if (obj1.name == "handleMeubleDroit") {
        if (delta > (obj1.deltaMaxDroite / 2)) {
          delta = obj1.deltaMaxDroite / 2;
          x = obj1.xInitial + delta;
        }
      }
      obj1.position.set(x, 0, 0);
      selectedMeuble.largeur = obj1.largeurInitiale-fact*delta*2;
      selectedMeuble.computeBlocsSize();
      selectedMeuble.x = obj1.xMeubleInitial+delta;
      let geo=selectedMeuble.root.getObjectByName("geometries");
    }
    selectedMeuble.computeBlocsSize();
    selectedMeuble.updateGeometry();
    selectedMeuble.placeMeuble();
    updateInterfaceMeuble();
    updateInterfaceBlocs();
  });

  dragHandleMeubleControls.addEventListener('dragend', function (event) {
    if (selectionMode!="ajusteMeubles") return;
    //event.object.material.emissive.set(0x000000);
    resetRaycast();
    controls.enabled = true;
    rayCastEnabled = true;
    isPreviewOn=false;
    selectedMeuble.updateMeuble();
  });
}

var dragBlocControls;
function initDragBloc() {
  
  //drag blocs
  dragBlocControls = new DragControls(selectableBloc, camera, renderer.domElement);

  dragBlocControls.addEventListener('dragstart', function (event) {
    if (selectionMode!="blocs") return;

    let clickedBloc = event.object.bloc;
    
    select(clickedBloc);
    updateInterfaceBlocs();
    controls.enabled=false;
    //event.object.material.emissive.set(0xaaaaaa);
  });

  dragBlocControls.addEventListener('dragend', function (event) {
    resetRaycast();
    if (selectionMode!="blocs") return;
    controls.enabled=true;
    //event.object.material.emissive.set(0x000000);
    //on permute les blocs si ils sont différents
    var raycastedBlocBox=event.object;
    var num=event.object.numero;
    event.object.position.set(0,0,0);
    if ((!raycastedBloc) || (raycastedBloc.bloc==raycastedBlocBox.bloc)) {console.log("nothing happens")}
     /*  else {
        //let bloc=meubles[selectableBloc[raycastedBloc].numeroMeuble].bloc;
        let bloc=meubles[selectableBloc[raycastedBloc].numeroMeuble].bloc;
        [bloc[num],bloc[raycastedBloc]]=[bloc[raycastedBloc],bloc[num]];
        updateScene();
      } */
  });

}

var dragEtagereControls;
function initDragEtagere() {
  //drag etageres
  dragEtagereControls = new DragControls(selectableEtagere, camera, renderer.domElement);

  dragEtagereControls.addEventListener('dragstart', function (event) {
    if (selectionMode!="etageres") return;
    controls.enabled=false;
    rayCastEnabled=false;
    let clickedEtagereBox = event.object;
    let clickedEtagereElement = event.object.element;
    let id=clickedEtagereElement.numero;
    let blocId=clickedEtagereElement.bloc.numero;
    let parent=event.object.parent;
    let hasEtagerePrecedente = parent.getObjectByName("etagere "+(id-1));   //marche pas
    //console.log(hasEtagerePrecedente);
    let hasEtagereSuivante = parent.getObjectByName("etagere "+(id+1));

    if (!selectedMeuble.bloc[indiceCurrentBloc].etageresVerticales) {
      if (hasEtagerePrecedente) { var yMin = hasEtagerePrecedente.position.y }
      else { var yMin = -selectedMeuble.hauteur / 2 + epaisseur / 2 }
      if (hasEtagereSuivante) { var yMax = hasEtagereSuivante.position.y }
      else { var yMax = selectedMeuble.hauteur / 2 - epaisseur / 2 }

    }
    else {
      if (hasEtagerePrecedente) { var xMin = hasEtagerePrecedente.position.x }
      else { var xMin = -selectedMeuble.bloc[indiceCurrentBloc].taille / 2 + epaisseur / 2 }
      if (hasEtagereSuivante) { var xMax = hasEtagereSuivante.position.x }
      else { var xMax = selectedMeuble.bloc[indiceCurrentBloc].hauteur / 2 - epaisseur / 2 }
    }

    event.object.yMin = yMin + epaisseur;
    event.object.yMax = yMax - epaisseur;
    event.object.xMin = xMin + epaisseur;
    event.object.xMax = xMax - epaisseur;
    event.object.blocId = blocId;
  });

  dragEtagereControls.addEventListener('drag', function (event) {
    if (selectionMode!="etageres") return;

    var selectedEtagere = event.object;
    //console.log("etagere selectionnée ",selectedEtagere.element.numero);
    //console.log("bloc n°",selectedEtagere.bloc.numero);

    if (!selectedMeuble.bloc[indiceCurrentBloc].etageresVerticales) {
      let y = selectedEtagere.position.y;
      y = y > event.object.yMax ? event.object.yMax : y;
      y = y < event.object.yMin ? event.object.yMin : y;
      selectedEtagere.position.set(0, y, 0);
      selectedEtagere.element.y = y;
    }
    else {
      let x = selectedEtagere.position.x;
      x = x > event.object.xMax ? event.object.xMax : x;
      x = x < event.object.xMin ? event.object.xMin : x;
      selectedEtagere.position.set(x, 0, 0);
      selectedEtagere.element.x = x;
      //console.log(selectedEtagere.element);
    }
    selectedMeuble.updateMeuble();
  });

  dragEtagereControls.addEventListener('dragend', function (event) {
    //event.object.material.emissive.set(0x000000);
    var selectedEtagere = event.object;
    let y = selectedEtagere.position.y;
    selectedEtagere.element.y = y;
    let x = selectedEtagere.position.x;
    selectedEtagere.element.x = x;
    resetRaycast();
    selectedMeuble.updateMeuble();
    controls.enabled = true;
    rayCastEnabled = true;
  });
}

//drag meubles
var dragMeubleControls;
function initDragMeuble() {
  var wA,hA;
  var aX,aY;
  dragMeubleControls=new DragControls(selectableMeuble, camera, renderer.domElement);

  dragMeubleControls.addEventListener('dragstart', function (event) {
    if (selectionMode!="meubles") return;
    controls.enabled=false;
    rayCastEnabled=false;
    //event.object.material.emissive.set(0xaaaaaa);
    var boxMeuble=event.object;
    var meuble = boxMeuble.meuble;
    //select(selectedMeuble);
    var num=boxMeuble.meuble.numero;
    changeCurrentMeubleFromClick(meuble);
    boxMeuble.xMeubleInit=meuble.x;
    boxMeuble.yMeubleInit=meuble.y;
    boxMeuble.xOk=boxMeuble.xMeubleInit;
    boxMeuble.yOk=boxMeuble.yMeubleInit;
    boxMeuble.zOk=boxMeuble.position.z;
    var posInitiale = new THREE.Vector3;
    posInitiale = [...boxMeuble.position];
    boxMeuble.posInitiale = posInitiale;
    let geometries=meuble.root.getObjectByName("geometries");
    console.log("geometries.visible",geometries.visible);
    boxMeuble.attach(geometries);  //on détache pour éviter les references circulaires dans les calculs de coordonnées
    geometries.position.set(0,0,0);
    let cadreA = meuble.hasCadre*epaisseurCadre;
    let plateauA = meuble.hasPlateau*epaisseurPlateau;
    let piedA = meuble.hasPied*hauteurPied;
    let socleA = meuble.hasSocle*hauteurSocle;
    let offsetHautA = Math.max(cadreA,plateauA);
    let offsetBasA = cadreA + piedA + socleA;
    wA=meuble.largeur+cadreA*2;
    hA=meuble.hauteur+offsetHautA+offsetBasA;
    boxMeuble.offsetHautA=offsetHautA;
    boxMeuble.offsetBasA=offsetBasA;
  });

  dragMeubleControls.addEventListener('drag', function (event) { 
    var boxMeuble=event.object;
    var meuble = boxMeuble.meuble;
    var num=meuble.numero;
    let wpos = new THREE.Vector3();
    var pos=boxMeuble.position;
    boxMeuble.localToWorld(wpos);
    aX=wpos.x;
    aY=wpos.y-boxMeuble.offsetBasA/2+boxMeuble.offsetHautA/2; // centre du bloc complet
    adjustObjectPosition(boxMeuble,num,aX,aY,wA,hA,pos,0);
    meuble.x=boxMeuble.xMeubleInit+boxMeuble.position.x;
    meuble.y=boxMeuble.yMeubleInit+boxMeuble.position.y;
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
    //if (selectionMode!="meubles") return;
    controls.enabled = true;
    rayCastEnabled = true;
    //event.object.material.emissive.set(0x000000);
    var boxMeuble = event.object;
    var meuble = boxMeuble.meuble;
    //var num = meuble.numero;
    let geometries = boxMeuble.getObjectByName("geometries");
    let root=meuble.root;
    //let root=[];
    //meuble.getObjectsByProperty("shortName","root",root);
    console.log("root=",root.name);
    console.log("root visible=",root.visible);
    //let parent = boxMeuble.parent.parent;
    root.attach(geometries); // on rattache une fois fini
    geometries.position.set(0, 0, 0);
    boxMeuble.position.set(0, 0, 0);
    meuble.updateMeuble();
    meuble.placeMeuble();
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
  controls.update();
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
  dragBlocControls.setObjects(selectableBloc);
}

function updateSelectableMeubles() {
  selectableMeuble = [];
  scene.getObjectsByProperty("shortName", "boiteSelectionMeuble", selectableMeuble);
  dragMeubleControls.setObjects(selectableMeuble);
}

function updateSelectableEtagere() {
  selectableEtagere = [];
  let blocsRoot = selectedMeuble.root.getObjectByName("blocs");
  blocsRoot.getObjectsByProperty("shortName","etagere",selectableEtagere);
  dragEtagereControls.setObjects(selectableEtagere);
}

function updateSelectableElements() {
  selectableElements = [];
  scene.getObjectsByProperty("shortName","boiteSelectionElement",selectableElements);
  dragElementControls.setObjects(selectableElements);
}

function updateSelectableHandleBloc() {
  selectableHandleBloc = [];
  scene.getObjectsByProperty("shortName", "handleBloc", selectableHandleBloc);
  //let handleMeubleHaut =  selectedMeuble.root.getObjectByName("handleMeubleHaut");
  //selectableHandleBloc.push(handleMeubleHaut);
  if (dragHandleBlocControls) dragHandleBlocControls.setObjects(selectableHandleBloc);
}

function updateSelectableHandleMeuble() {
  selectableHandleMeuble = [];
  scene.getObjectsByProperty("shortName", "handleMeuble", selectableHandleMeuble);
  if (dragHandleMeubleControls) dragHandleMeubleControls.setObjects(selectableHandleMeuble);
}

function updateAllSelectable() {
  updateSelectableElements();
  updateSelectableBlocs();
  updateSelectableMeubles();
  updateSelectableHandleMeuble();
  updateSelectableEtagere();
  updateSelectableHandleBloc();
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

//Lights
function addLights() {
  let lights = new THREE.Group();
  lights.name = "lights";
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(0.5, 1, 0.5);
  lights.add(light);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  light.shadow.camera.near = 0.01;
  light.shadow.camera.far = 1000;
  const lightA = new THREE.PointLight(0xffffff, 120, 0, 1);
  lightA.position.set(-10, 150, 140);
  lightA.castShadow = true;
  lightA.shadow.radius = 4;
  renderer.setClearColor( 0xAAAAAA, 1 );
  lights.add( lightA );
  const lightB = new THREE.PointLight( 0xddeeff, 80, 0, 1 );
  lightB.position.set( 160, 150, 160 );
  lightB.castShadow = true;
  lightB.shadow.radius = 4;
  renderer.setClearColor( 0xAAAAAA, 1 );
  lights.add( lightB );
  const lightC = new THREE.PointLight( 0xddeeff, 80, 0, 1 );
  lightC.position.set( -200, 150, 160 );
  renderer.setClearColor( 0xAAAAAA, 1 );
  lights.add( lightC );
  const ambientLight = new THREE.AmbientLight( 0x404020,0.5 );
  lights.add( ambientLight );
  scene.add(lights);
}

function buildEnvironnement () {
  let environnement=new THREE.Object3D();
  environnement.name="environnement";
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
  environnement.add( plane );
  const materialMur = new THREE.MeshStandardMaterial( {color: 0xffffff} );
  const murFond = new THREE.Mesh( geometry, materialMur );
  murFond.name = "murFond"
  murFond.receiveShadow = true;
  environnement.add( murFond );
  const murDroit = new THREE.Mesh( geometry, materialMur );
  murDroit.translateX(500);
  murDroit.rotateY(-Math.PI/2);
  murDroit.name="murDroit";
  environnement.add( murDroit );
  const murGauche = new THREE.Mesh( geometry, materialMur );
  murGauche.translateX(-500);
  murGauche.rotateY(Math.PI/2);
  murGauche.name="murGauche";
  environnement.add( murGauche );
  scene.add(environnement);
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
var largeurDiv,largeurSlider,largeurDivInput;
var hauteurDiv,hauteurDivSlider,hauteurDivInput;
var XDiv,XDivSlider,XDivInput;
var YDiv,YDivSlider,YDivInput;
var styleMenu;
var slidersAspect;
var checkboxVertical;
//var divSwitchVertical;
var colorDrawer,colorMeuble,colorPlateau,colorCadre;
var menuPoignees;
var menuTexturesPlateau,menuTexturesCadre,menuTexturesMeuble,menuTexturesTiroirs;
var dropDownPoignees, dropDownMeuble, dropDownTiroirs, dropDownPlateau, dropDownCadre;
var buttonSelectMeuble,buttonSelectBloc,buttonSelectElement;
var buttonAdjustBloc,buttonAdjustMeuble,buttonAdjustEtagere;
var buttonSousMeuble;
var titleMeuble, titleBloc;
var contextMenuGeneral,contextMenuMeuble,contextMenuBloc,contextMenuEtagere;

function initializeScene() {
    buildEnvironnement();
    addLights();
    initDragMeuble();
    initDragBloc();
    initDragEtagere();
    initDragElements();
    initializeInterface();
    initializeRaycast();
    initializePoignees();
    createNewMeuble();
    selectedMeuble=meubles[0];
    indiceCurrentMeuble=0;
    createInterfaceMeuble();
    updateInterfaceBlocs();
    updateInterfaceAspect();
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
    setSelectionMode("meubles");   
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
  //divSwitchVertical = document.getElementById("divSwitchVertical");
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
  buttonAdjustEtagere = document.getElementById("buttonAdjustEtagere");
  buttonSelectElement = document.getElementById("buttonSelectElement");
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
  buttonSuspendu.addEventListener("click",function() {switchSuspendu()});  //à virer
  buttonPlateau.addEventListener("click",function() {switchPlateau(indiceCurrentMeuble)});
  buttonCadre.addEventListener("click",function() {switchCadre(indiceCurrentMeuble)});
  //context menu meuble
  document.getElementById("switchVertical").addEventListener("click",function() {switchVertical()});
  document.getElementById("switchPlateau").addEventListener("click",function() {switchPlateau(indiceCurrentMeuble)});
  document.getElementById("switchCadre").addEventListener("click",function() {switchCadre()});
  document.getElementById("switchSocle").addEventListener("click",function() {switchSocle()});
  document.getElementById("switchPied").addEventListener("click",function() {switchPied()});

  //functions meubles
  function switchVertical() {
    if (selectedMeuble.disposition == "vertical") selectedMeuble.disposition = "horizontal";
    else selectedMeuble.disposition = "vertical";
    selectedMeuble.computeBlocsSize();
    selectedMeuble.updateMeuble();
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
    setSelectionType("Portes");
   /*  selectedMeuble.bloc[indiceCurrentBloc].type = "Portes";
    refreshInterfaceBlocs();
    selectedMeuble.updateMeuble(); */
  }

function setSelectionType(value) {
  for (var i=selectedObjects.length; i>0; i--)
    {
      let object=selectedObjects[i-1];
      object.type=value;
      object.meuble.updateMeuble();
      console.log(object.type);
    }
    updateInterfaceBlocs();
}

function setNombreDePortes(value) {
  for (var i=selectedObjects.length; i>0; i--)
    {
      let object=selectedObjects[i-1];
      object.nombrePortes=value;
      object.meuble.updateMeuble();
    }
    updateInterfaceBlocs();
    updateSelection();
}

function setTypeDePortes(value) {
  for (var i=selectedObjects.length; i>0; i--)
    {
      let object=selectedObjects[i-1];
      object.ouverturePorte=value;
      object.meuble.updateMeuble();
    }
    updateInterfaceBlocs();
    updateSelection();
}

function setValueOnSelection(key,value) {
  for (var i=selectedObjects.length; i>0; i--)
    {
      let object=selectedObjects[i-1];
      object[key]=value;
      object.meuble.updateMeuble();
    }
    updateInterfaceBlocs();
    updateSelection();
}

function updateSelection() {
  for (var i=selectedObjects.length; i>0; i--)
    {
      console.log("updateSelection");
      let object=selectedObjects[i-1];
      object.meuble.updateMeuble();
    }
}

  function switchTiroirs() { 
    setSelectionType("Tiroirs");
    refreshInterfaceBlocs();
    console.log("tiroirs");
    updateSelection();
  }
  
  function switchEtageres() { 
    setSelectionType("Etageres");
    refreshInterfaceBlocs();
    selectedMeuble.updateMeuble();
  }

  function switchPanneau() { 
    setSelectionType("Panneau");
    refreshInterfaceBlocs();
    selectedMeuble.updateMeuble();
  }

  function switchSousMeuble() {
    selectedMeuble.bloc[indiceCurrentBloc].type="SousMeuble"; 
    refreshInterfaceBlocs();
    selectedMeuble.updateMeuble();
  }

  function switchUnePorte() {
    setValueOnSelection("nombrePortes","1");
  }

  function switchDeuxPortes() {
    setValueOnSelection("nombrePortes","2");
  }

  function switchPorteGauche() {
    setValueOnSelection("ouverturePorte","gauche");
  }

  function switchPorteDroite() {
    setValueOnSelection("ouverturePorte","droite");
  }

  buttonUnePorte.addEventListener("click", switchUnePorte, false);
  buttonDeuxPortes.addEventListener("click", switchDeuxPortes, false);
  buttonOuverturePorteGauche.addEventListener("click", switchPorteGauche, false);
  buttonOuverturePorteDroite.addEventListener("click", switchPorteDroite, false);
  buttonEtageresVerticales.addEventListener("click", function () {switchEtagereVerticale(indiceCurrentBloc)});
  checkboxRentrant.addEventListener("click", function () {switchRentrant(indiceCurrentBloc)});

  function switchEtagereVerticale() {
    selectedMeuble.bloc[indiceCurrentBloc].etageresVerticales=!selectedMeuble.bloc[indiceCurrentBloc].etageresVerticales;
    selectedMeuble.updateMeuble();
  }

  function switchRentrant() {
    selectedMeuble.bloc[indiceCurrentBloc].isRentrant=!selectedMeuble.bloc[indiceCurrentBloc].isRentrant;
    selectedMeuble.updateMeuble();
  } 

  selectListMeubles.addEventListener("change", function eventListMeublesPopup(event) { 
    changeCurrentMeubleFromPopup(event.target.value);
  }, false);
  selectListBlocs.addEventListener("change",function changeCurrentBlocFromPopup(event) { 
    startMaterialAnimationBloc(event.target.value);
    indiceCurrentBloc=event.target.value;
    updateInterfaceBlocs();
    updateSelectableEtagere();
    updateSelectableHandleBloc();
  },false);
  buttonNewMeuble.addEventListener("click", function eventButtonNewMeuble() {
    createNewMeuble();
    updateInterfaceMeuble();
    indiceCurrentBloc = 0;
    updateInterfaceBlocs()
  }, false);
  buttonDupliquerMeuble.addEventListener("click", function eventButtonDupliquerMeuble() {
    duplicateMeuble();
    updateInterfaceMeuble();
    indiceCurrentBloc = 0;
    updateInterfaceBlocs()
  }, false);
  buttonDeleteMeuble.addEventListener("click", function eventButtonDeleteMeuble() {
    deleteMeuble();
    //recomputeMeublesId();
    updateInterfaceMeuble();
    indiceCurrentBloc = 0;
    updateInterfaceBlocs();
    updateSelectableBlocs();
    frameCamera();
  }, false);
  styleMenu.addEventListener("change", function changeStyle(event) { 
    globalStyle = event.target.value;
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
    setSelectionMode("meubles");
  },false);

  buttonAdjustMeuble.addEventListener("click", function clickAjusteMeubles(event) {
    setSelectionMode("ajusteMeubles");
  },false);

  buttonSelectBloc.addEventListener("click", function clickSelectBlocs(event) {
    setSelectionMode("blocs");
  },false);

  buttonAdjustBloc.addEventListener("click", function clickAjusteBlocs(event) {
    setSelectionMode("ajusteBlocs");
  },false);

  buttonAdjustEtagere.addEventListener("click", function clickAdjustEtageres(event) {
    setSelectionMode("etageres");
  },false);

  buttonSelectElement.addEventListener("click", function clickSelectElements(event) {
    setSelectionMode("elements");
  },false);


  let listOptionsContextMenu = document.getElementsByClassName("contextMenuOption");
  for (let item of listOptionsContextMenu) {
    item.addEventListener('click',onClickOptionMenu);
  }

  function onClickOptionMenu(event) {
    selectionMode=event.target.type;
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

function setSelectionMode(value) {
  if (value=="meubles") {dragMeubleControls.activate()} else {dragMeubleControls.deactivate()}
  if (value=="blocs") {dragBlocControls.activate()} else {dragBlocControls.deactivate()}
  if (value=="elements") {dragElementControls.activate()} else {dragElementControls.deactivate()}
  if (value=="etageres") {dragEtagereControls.activate()} else {dragEtagereControls.deactivate()}
  if (value=="ajusteBlocs") {dragHandleBlocControls.activate()} else {dragHandleBlocControls.deactivate()}
  if (value=="ajusteMeubles") {dragHandleMeubleControls.activate()} else {dragHandleMeubleControls.deactivate()}
  selectionMode=value;
  clearSelectionList();
  updateAllSelectable();
  refreshSelectButtons();
  //clearRaycast();
}

function refreshSelectButtons() {
  if (selectionMode=="meubles") {
    buttonSelectMeuble.className="buttonOn";
    /* dragMeubleControls.activate();
    dragBlocControls.deactivate();
    dragEtagereControls.deactivate();
    dragElementControls.deactivate();

    if (dragHandleBlocControls) dragHandleBlocControls.deactivate();
    if (dragHandleMeubleControls) dragHandleMeubleControls.deactivate(); */
  }
  else {buttonSelectMeuble.className="buttonOff"}

  if (selectionMode=="ajusteMeubles") {
    buttonAdjustMeuble.className="buttonOn";
    /* dragMeubleControls.deactivate();
    dragBlocControls.deactivate();
    dragEtagereControls.deactivate();
    dragElementControls.deactivate();

    if (dragHandleBlocControls) dragHandleBlocControls.deactivate();
    if (dragHandleMeubleControls) dragHandleMeubleControls.activate(); */

  }
  else {buttonAdjustMeuble.className="buttonOff"}

  if (selectionMode=="blocs") {
    buttonSelectBloc.className="buttonOn";
    /* dragMeubleControls.deactivate();
    dragBlocControls.activate();
    dragEtagereControls.deactivate();
    dragElementControls.deactivate();

    if (dragHandleBlocControls) dragHandleBlocControls.deactivate();
    if (dragHandleMeubleControls) dragHandleMeubleControls.deactivate(); */
  }
  else {buttonSelectBloc.className="buttonOff"}

  if (selectionMode=="ajusteBlocs") {
    buttonAdjustBloc.className="buttonOn";
    /* dragMeubleControls.deactivate();
    dragBlocControls.deactivate();
    dragEtagereControls.deactivate();
    dragElementControls.deactivate();

    if (dragHandleBlocControls) dragHandleBlocControls.activate();
    if (dragHandleMeubleControls) dragHandleMeubleControls.deactivate(); */
  }
  else {buttonAdjustBloc.className="buttonOff"
    
  if (selectionMode=="etageres") {
    buttonAdjustEtagere.className="buttonOn";
   /*  dragMeubleControls.deactivate();
    dragBlocControls.deactivate();
    dragEtagereControls.activate()
    dragElementControls.deactivate();

    if (dragHandleBlocControls) dragHandleBlocControls.deactivate();
    if (dragHandleMeubleControls) dragHandleMeubleControls.deactivate(); */
  }
  else {buttonAdjustEtagere.className="buttonOff"}


  if (selectionMode=="elements") {
    buttonSelectElement.className="buttonOn";
   /*  dragMeubleControls.deactivate();
    dragBlocControls.deactivate();
    dragEtagereControls.deactivate();
    dragElementControls.activate();
    if (dragHandleBlocControls) dragHandleBlocControls.deactivate();
    if (dragHandleMeubleControls) dragHandleMeubleControls.deactivate(); */
  }
  else {buttonSelectElement.className="buttonOff"}
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
      selectedMeuble.changeTexture(event)}
      ,false);
  }
}

function addListenerMenuPoignees(menu) {
  for (var divLineMenu of menu.children) {
    divLineMenu.addEventListener("click",function eventChangePoignee(event) {changePoignee(event.target.value)},false);
  }
}

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
  renameAllMeubles();
  updateScene();
  updateAllSelectable();
}

function renameAllMeubles() {
  for (var i=0;i<meubles.length;i++) {
    meubles[i].rename();
  }
}

function placeNewMeuble(num) {
  var minX = -10e34;
  if (num>0) {
    for (var i=0; i<num; i++) {
      let currentMinX = meubles[i].x+meubles[i].getLargeurReelle()/2+ meubles[num].getLargeurReelle()/2;
      minX = Math.max(currentMinX,minX)
    }
    meubles[num].x=minX;
    //meubles[num].y=0;
  }
}

function createNewMeuble() {
  indiceCurrentMeuble=meubles.length;
  meubles[indiceCurrentMeuble] = new Meuble(indiceCurrentMeuble);
  selectedMeuble=meubles[indiceCurrentMeuble];
  placeNewMeuble(indiceCurrentMeuble);
  selectedMeuble.updateMeuble();
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

function getPlancheSuedoise(x, y, z, largeur, epaisseurS) {
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

function createPlanche (x,y,z,styleParam) {
  let geo = new THREE.BufferGeometry;
  if (isPreviewOn || styleParam=="Basique") {
    geo = new THREE.BoxGeometry( x,y,z );
    return geo;
  }
  if (styleParam == "Arrondi") {geo = RoundEdgedBox(x,y,z,0.5,1,1,1,1)}
  if (styleParam=="Suédois 1") { 
    geo = getPlancheSuedoise (x,y,z,largeurSuedois,epaisseurSuedois);
  }
  if (styleParam=="Suédois 2") { 
    let geoTemp = getPlancheSuedoise (x,y,z,largeurSuedois/2,epaisseurSuedois);
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
  createInterfaceMeuble(); // Rebuild HTML content
}

function clearInterfaceMeuble() {
  meubleSliders.innerHTML="";
  selectListMeubles.innerHTML="";
  selectListMeubles.classList.remove("animationMeublesName");
}

function changeCurrentMeuble(meuble) {
  indiceCurrentMeuble = meuble.numero;
  selectedMeuble=meuble;
  selectedObjects=[];
  selectedObjects.push(selectedMeuble);
  updateCheckboxVertical();
  updateInterfaceMeuble();
  updateInterfaceBlocs();
  updateInterfaceAspect();  
  updateAllSelectable();
  console.log(selectedObjects);
}

function changeCurrentMeubleFromClick(meuble) {
  changeCurrentMeuble(meuble);
  selectListMeubles.classList.remove("animationMeublesName");
  selectListMeubles.offsetWidth; //pour temporisation
  selectListMeubles.classList.add("animationMeublesName");
  //select(meuble);
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

function createInterfaceMeuble() { // Rebuild HTML content for list meubles
  let meuble = selectedMeuble;
  for (var i=0;i<meubles.length;i++) {
    let o = document.createElement("option");
    o.value = i;
    o.innerHTML = meubles[i].name;
    if (i==indiceCurrentMeuble) o.selected="selected";
    selectListMeubles.append(o);
  }
//listMeublesName.value=meuble.name;  // keep
  hauteurDiv=createSlider(meuble,"hauteur","Hauteur",meuble.hauteur,0,10,250);
  meubleSliders.append(hauteurDiv);
  hauteurDivSlider=hauteurDiv.querySelector("#slider");
  hauteurDivInput=hauteurDiv.querySelector("#number");

  hauteurDivSlider.addEventListener("input",function() {eventHauteurInput()},false);
  hauteurDivInput.addEventListener("change",function() {eventHauteurInput()},false);

  function eventHauteurInput() {
    var hauteur=+hauteurDivSlider.value; //forçage de type
    var maxHeight = selectedMeuble.getMaxAllowedHeight();
    selectedMeuble.hauteur = (hauteur<maxHeight) ? hauteur : maxHeight;
    selectedMeuble.computeBlocsSize();
    updateInterfaceBlocs();
    selectedMeuble.updateMeuble();
    updateInterfaceHauteur();
    frameCamera();
  }

  let elp=createSlider(meuble,"profondeur","Profondeur",meuble.profondeur,0,10,250);
  elp.querySelector("#slider").addEventListener("input",function eventElpInput() {selectedMeuble.updateMeuble();frameCamera();},false);
  elp.querySelector("#number").addEventListener("change",function eventElpChange() {selectedMeuble.updateMeuble();frameCamera();},false);
  meubleSliders.append(elp);

  largeurDiv=createSlider(meuble,"largeur","Largeur",meuble.largeur,0,10,500);
  meubleSliders.append(largeurDiv);

  largeurSlider=largeurDiv.querySelector("#slider");
  largeurDivInput=largeurDiv.querySelector("#number");
  largeurSlider.addEventListener("input",function() {eventLargeurInput()},false);
  largeurDivInput.addEventListener("change",function() {eventLargeurInput()},false);

  function eventLargeurInput() {
    var largeur=+largeurSlider.value; //forçage de type
    var maxWidth = selectedMeuble.getMaxAllowedWidth();  //calcul collision sur input
    selectedMeuble.largeur = (largeur<maxWidth) ? largeur : maxWidth;
    selectedMeuble.computeBlocsSize();
    updateInterfaceBlocs();
    selectedMeuble.updateMeuble();
    updateInterfaceLargeur();
    frameCamera();
  }
  
  let nbBlocsDiv = createSlider(meuble,"nbBlocs","Nombre de blocs",meuble.nbBlocs,0,1,maxBlocs);
  nbBlocsDiv.querySelector("#slider").addEventListener("input",function eventnbBlocsDivInput() {onChangeBlocsQuantity()},false);
  nbBlocsDiv.querySelector("#number").addEventListener("change",function eventnbBlocsDivChange() {onChangeBlocsQuantity()},false);
  meubleSliders.append(nbBlocsDiv);

  let retour = createSliderWithoutListener(meuble,"x","Placement horizontal",meuble.x,0,-300,300);
  XDiv=retour[0];
  XDivSlider=retour[1];
  XDivInput=retour[2];
  XDivSlider.addEventListener("input",function () {eventXDivInputSlider()},false);
  XDivInput.addEventListener("change",function () {eventXDivInputBox()},false);
  meubleSliders.append(XDiv);

  function eventXDivInputSlider() {
    var x=+XDivSlider.value; //forçage de type
    eventXDivInput(x);
  }

  function eventXDivInputBox() {
    var x=+XDivInput.value; //forçage de type
    eventXDivInput(x);
  }

  function eventXDivInput(x) {
    var translateX = selectedMeuble.getLimitTranslationX();
    x = (x<translateX[0]) ? translateX[0] : x;
    x = (x>translateX[1]) ? translateX[1] : x;
    selectedMeuble.x = x;
    selectedMeuble.computeBlocsSize();
    updateInterfaceBlocs();
    selectedMeuble.updateMeuble();
    selectedMeuble.placeMeuble();
    XDivSlider.value = selectedMeuble.x;
    XDivInput.value = XDivSlider.value;
    frameCamera();
  }

  retour = createSliderWithoutListener(meuble,"y","Placement vertical",meuble.y,0,0,300);
  YDiv=retour[0];
  YDivSlider=retour[1];
  YDivInput=retour[2];
  YDivSlider.addEventListener("input",function () {eventYDivInputSlider()},false);
  YDivInput.addEventListener("change",function () {eventYDivInputBox()},false);
  meubleSliders.append(YDiv);

  function eventYDivInputSlider() {
    var y=+YDivSlider.value; //forçage de type
    eventYDivInput(y);
  }

  function eventYDivInputBox() {
    var y=+YDivInput.value; //forçage de type
    eventYDivInput(y);
  }

  function eventYDivInput(y) {
    var translateY = selectedMeuble.getLimitTranslationY(); //collision
    y = (y<translateY[0]) ? translateY[0] : y;
    y = (y>translateY[1]) ? translateY[1] : y;
    selectedMeuble.y = y;
    selectedMeuble.computeBlocsSize();
    updateInterfaceBlocs();
    selectedMeuble.updateMeuble();
    //meubles[num].placeMeuble();
    YDivSlider.value = selectedMeuble.y;
    YDivInput.value = YDivSlider.value;
    frameCamera();
  }

  updateCheckboxVertical();
  updateButtonPlateau();
  updateButtonCadre();
  updateButtonFixationGroup();
  updateButtonDelete();
}

function updateCheckboxVertical() {
  if (selectedMeuble.disposition=="vertical") {checkboxVertical.checked=true} else {checkboxVertical.checked=false}
}

function updateButtonDelete() {
  if (meubles.length>1) {
    buttonDeleteMeuble.disabled = false;
  }
  else {
    buttonDeleteMeuble.disabled = true;
  }
}
function updateButtonPlateau() { if (selectedMeuble.hasPlateau) {buttonPlateau.className="buttonOn"} else {buttonPlateau.className="buttonOff"}}
function updateButtonCadre() {if (selectedMeuble.hasCadre) {buttonCadre.className="buttonOn"} else {buttonCadre.className="buttonOff"}}

function updateButtonSocle() { if (selectedMeuble.hasSocle) {buttonSocle.className="buttonOn"} else {buttonSocle.className="buttonOff"}}
function updateButtonPied() { if (selectedMeuble.hasPied) {buttonPied.className="buttonOn"} else {buttonPied.className="buttonOff"} }
function updateButtonSuspendu() {  if (selectedMeuble.IsSuspendu) {buttonSuspendu.className="buttonOn"} else {buttonSuspendu.className="buttonOff"}}

function updateButtonFixationGroup() {
  updateButtonSocle();
  updateButtonPied();
  updateButtonSuspendu();
}

function updateInterfaceLargeur() {
  largeurDiv.querySelector("#slider").value = selectedMeuble.largeur;
  largeurDiv.querySelector("#number").value = selectedMeuble.largeur;
}

function updateInterfaceHauteur() {
  hauteurDiv.querySelector("#slider").value = selectedMeuble.hauteur;
  hauteurDiv.querySelector("#number").value = selectedMeuble.hauteur;
}

function updateInterfaceX() {
  XDiv.querySelector("#slider").value = selectedMeuble.x;
  XDiv.querySelector("#number").value = selectedMeuble.x;
}

function updateInterfaceY() {
  YDiv.querySelector("#slider").value = selectedMeuble.y;
  YDiv.querySelector("#number").value = selectedMeuble.y;
}

function changeCurrentBlocFromClick(bloc) {
  indiceCurrentBloc = bloc.numero;
  selectedObjects.push(bloc);
  updateInterfaceBlocs();
  //flash input box
  selectListBlocs.classList.remove("animationBlocsName");
  selectListBlocs.offsetWidth; // pour temporisation
  selectListBlocs.classList.add("animationBlocsName");
  updateSelectableEtagere();
  updateSelectableHandleBloc();
}

function onChangeBlocsQuantity() {
  selectedMeuble.changeBlocsQuantity();
  selectedMeuble.updateTaille();
  updateInterfaceBlocs();
  updateInterfaceLargeur();
  updateInterfaceHauteur();
  updateScene();
  frameCamera();
}

function rebuildInterfaceBlocs() {
  for (var i=0;i<selectedMeuble.nbBlocs;i++) {
    let o = document.createElement("option");
    o.value = i;
    o.innerHTML="Bloc "+(i+1);
    if (i==indiceCurrentBloc) o.selected="selected";
    selectListBlocs.append(o);
  }
}

function refreshInterfaceBlocs() {
  if (selectedObjects.length==0) return;
  var object=selectedObjects[selectedObjects.length-1];
  console.log(object.type);
  if (object.type == "Portes") {
    buttonPorte.className = "buttonOn";
    divPortes.style.display = "inline";
    console.log("type porte");
  }
  else {
    buttonPorte.className = "buttonOff";
    divPortes.style.display = "none";
  }
  if (object.type == "Tiroirs") { buttonTiroirs.className = "buttonOn" } else { buttonTiroirs.className = "buttonOff" }
  if (object.type == "Etageres") {
    buttonEtageres.className = "buttonOn";
    divEtageres.style.display = "inline";
  }
  else {
    buttonEtageres.className = "buttonOff"
    divEtageres.style.display = "none";
  }
  if (object.type == "Panneau") { buttonPlein.className = "buttonOn" } else { buttonPlein.className = "buttonOff" }
  if (object.nombrePortes == "1") {
    buttonUnePorte.className = "buttonOn";
    sensOuverture.style.display="inline";
    if (object.ouverturePorte == "gauche") { buttonOuverturePorteGauche.className = "buttonOn" } else { buttonOuverturePorteGauche.className = "buttonOff" }
    if (object.ouverturePorte == "droite") { buttonOuverturePorteDroite.className = "buttonOn" } else { buttonOuverturePorteDroite.className = "buttonOff" }
  } else { buttonUnePorte.className = "buttonOff" }
  if (object.nombrePortes == "2") {
    buttonDeuxPortes.className = "buttonOn";
    buttonOuverturePorteGauche.className = "buttonOff";
    buttonOuverturePorteDroite.className = "buttonOff";
    sensOuverture.style.display="none";
  } else { buttonDeuxPortes.className = "buttonOff" }

  if (object.etageresVerticales) {buttonEtageresVerticales.checked=true;} else {buttonEtageresVerticales.checked=false;}
  if (object.isRentrant) {checkboxRentrant.checked=true;} else {checkboxRentrant.checked=false;}
}

function updateInterfaceBlocs() {
  clearInterfaceBlocs();
  rebuildInterfaceBlocs();
  createSlidersBlocs();
  refreshInterfaceBlocs();
}

function clearInterfaceBlocs() {
  blocsSliders.innerHTML="";
  selectListBlocs.innerHTML="";
}

function onMaterialBlocAnimationFinish (num) {
  clipActionMaterial.stop();
  clipActionMaterial.reset();
  let bloc=selectedMeuble.root.getObjectByName("boiteSelectionBloc"+num);
  bloc.material = materialSelectionBloc;
  bloc.visible = false;
  mixerMaterial.removeEventListener('finished', onMaterialBlocAnimationFinish, false);
  mixerMaterial=undefined;
}

var materialSelectionBlocAnim = new THREE.MeshStandardMaterial( materialSelectionBlocParams );

function startMaterialAnimationBloc(num) {
  let bloc=selectedMeuble.root.getObjectByName("boiteSelectionBloc"+num);
  bloc.material = materialSelectionBlocAnim;
  bloc.visible = true;
  mixerMaterial = new THREE.AnimationMixer( materialSelectionBlocAnim );
  clipActionMaterial = mixerMaterial.clipAction( clipMaterial );
  clipActionMaterial.setLoop(0,1);
  clipActionMaterial.play();
  mixerMaterial.addEventListener( 'finished', function finishMaterialAnim() {onMaterialBlocAnimationFinish(num)}, false )
}

function createSlidersBlocs() {
  let numBloc=indiceCurrentBloc;
  let meuble = selectedMeuble;
  let slideLargeurBloc = createSlider(meuble.bloc[numBloc], "taille", "Taille du bloc", meuble.bloc[numBloc].taille, 0, 10, 200);
  blocsSliders.append(slideLargeurBloc);
  slideLargeurBloc.querySelector("#slider").addEventListener("input", function () {
    meuble.updateTaille();
    updateInterfaceLargeur();
    updateInterfaceHauteur();
    selectedMeuble.updateMeuble();
    frameCamera();
  }, false);
  slideLargeurBloc.querySelector("#number").addEventListener("change", function () {
    meuble.updateTaille();
    updateInterfaceLargeur();
    updateInterfaceHauteur();
    selectedMeuble.updateMeuble();
    frameCamera();
  }
    , false);
  let sliderEtageres = createSlider(meuble.bloc[numBloc], "etageres", "Nombre d'étagères", meuble.bloc[numBloc].etageres, 0, 0, maxEtageres);
  sliderEtageres.querySelector("#slider").addEventListener("input", function () {
    meuble.bloc[numBloc].etagereY=[]; //raz des positions prédéfinies si changement de nb d'étageres;
    selectedMeuble.updateMeuble();
    frameCamera();
  }, false);
  sliderEtageres.querySelector("#number").addEventListener("change", function () {
    selectedMeuble.updateMeuble();
    frameCamera();
  }, false);
  blocsSliders.append(sliderEtageres);
}

function updateInterfaceAspect() {
  slidersAspect.innerHTML="";
  let sliderOffsetPoignees=createSlider(selectedMeuble,"offsetPoignees","Décalage",selectedMeuble.offsetPoignees,0,-100,100);
  slidersAspect.append(sliderOffsetPoignees);
  sliderOffsetPoignees.addEventListener("input", function () {selectedMeuble.updateMeuble()}, false);
}

window.addEventListener("DOMContentLoaded", initializeScene);
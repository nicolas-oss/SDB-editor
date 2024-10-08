import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { poignees } from './poignees';
import { initPoigneesList } from "./poignees.js";
import { initListTexturesMeuble, imagesMeuble, image, imagesPath } from "./textures.js"
import {roundEdgedBox} from "./roundEdgedBox.js";
//import e from 'cors';


import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';
import { MeshStandardMaterial, Mesh, SphereGeometry, BoxGeometry } from 'three';


//pb planches intermediaires sur cadre double !!!!

class Element {
  constructor(bloc,i) {

    this.numero = i;
    this.unherited = true;
    this.bloc=bloc;
    this.meuble=this.bloc.meuble;
    this.initialMeuble=this.bloc.initialMeuble;
    this.initialBloc=this.bloc.initialBloc;
    
    this._x=undefined;
    this._y=undefined;
    this.yRelative=undefined;
    this._yTiroir=undefined;

    //commun aux autres classes
    this._type=undefined;
    this._style=undefined;
    this.isSelected=false;
    this.selectionBox=undefined;
    this._isRentrant = undefined;
    this._arrondi = undefined;
    this.ouverturePorteLocal = undefined;
    this.nombrePortesLocal = undefined;

    this.sousMeuble=undefined;
  }

  get epaisseur() {
    return this.meuble.epaisseur;
  }

  get epaisseurCadre() {
    return this.meuble.epaisseurCadre;
  }

  get epaisseurTiroirs() {
    return epaisseurTiroirs;
  }

  set style(value) {this._style=value;}

  get style() {if (this._style) {return this._style}
    else return this.bloc.style;}

  set arrondi(value) {this._arrondi=value}

  get arrondi() {if (this._arrondi!=undefined) {return this._arrondi}
  else return this.bloc.arrondi;}

  set type(value) {this._type=value;}

  get type() {if (this._type) return this._type;
    else return this.bloc.type;}

  get ySousMeuble() {
    if (this.meuble.hasEtagereUnique && this.meuble.blocs[0].numero!=0) return this.meuble.blocs[0].elements[this.numero].ySousMeuble;
    let y;
    if (this.bloc.isRentrant) {
      let h = this.bloc.h - 2 * this.epaisseur + this.epaisseur;
      let yStart = this.epaisseur - this.epaisseur / 2 - this.bloc.h / 2;
      y = (h / (this.bloc.nbEtageres + 1)) * (this.numero) + yStart;
    }
    else {
      let step = (this.bloc.h) / (this.bloc.nbEtageres + 1);
      y = step * (-0.5 + this.numero - this.bloc.nbEtageres / 2);
    }
    return y;
  }

  set y(value) {
    this._y = value;
    //this.yRelative = this.bloc
  }

  get y() {
    //console.log (this.meuble.blocs[0].numero);
    if (this.meuble.hasEtagereUnique && this.bloc.numero!=0) {
      return this.meuble.blocs[0].elements[this.numero].y;
    }
    if (this._y!=undefined) return this._y;
    if (this.meuble.isSousMeuble) return this.ySousMeuble;
    let y;
    if (this.bloc.isRentrant) {
      let h = this.bloc.h- 2 * this.epaisseurCadre + this.epaisseur;
      let yStart = this.epaisseurCadre - this.epaisseur / 2 - this.bloc.h/ 2;
      y = (h/(this.bloc.nbEtageres+1))* (this.numero) + yStart;
    }
    else {
      let step = (this.bloc.h) / (this.bloc.nbEtageres + 1);
      y = step * (-0.5 + this.numero - this.bloc.nbEtageres / 2);
    }
    return y;}

  set x(value) {this._x = value;}

  get x() {if (this._x) return this.bloc._x;
    var step = (this.bloc.l - 2 * this.epaisseur) / (this.bloc.nbEtageres + 1);
    return step * (0.5 + this.numero - this.bloc.nbEtageres / 2);}

  get yTiroir() {
    if (this.meuble.hasEtagereUnique && this.bloc.numero!=0) return this.meuble.blocs[0].elements[this.numero].yTiroir;
    return (this.y + this.bloc.elements[this.numero+1].y) / 2;
  }

  get xTiroir() {
    if (this.meuble.isSousMeuble) return 0;
    if (this.bloc.meuble.isSimple && this.isRentrant) {
      if (this.bloc.numero == 0) return (this.epaisseurCadre / 4);
      if (this.bloc.numero == this.bloc.meuble.nbBlocs - 1) return (-this.epaisseurCadre / 4);
    }
    return 0;
  }

  set isRentrant(value) {this._isRentrant = value;}

  get isRentrant() {
     if (this._isRentrant!=undefined) {return this._isRentrant}
    else return this.bloc.isRentrant; 
  }

  get ouverturePorte() {
    if (this.ouverturePorteLocal) {return this.ouverturePorteLocal}
    else return this.bloc.ouverturePorte;
  }

  get nombrePortes() {
    if (this.nombrePortesLocal) {return this.nombrePortesLocal}
    else return this.bloc.nombrePortes;
  }
  set ouverturePorte(value) { this.ouverturePorteLocal=value }
  set nombrePortes(value) { this.nombrePortesLocal=value }

  get ySuivant() {
    if (this.numero < this.bloc.nbEtageres+1) {
      return this.bloc.elements[this.numero + 1].y;
    }
  }

  get yl() {
    if (this.meuble.isSousMeuble) return this.ySuivant - this.y;
    return this.ySuivant - this.y - this.epaisseur * this.isRentrant;
  }

  get xl() {
    if (!this.isRentrant || this.meuble.isSousMeuble) return this.bloc.taille;
    if (this.meuble.isSimple && !this.meuble.isSousMeuble) {
      if (this.bloc.numero == 0) { return (this.bloc.taille - 1.5*this.epaisseurCadre); }
      if (this.bloc.numero == (this.meuble.nbBlocs - 1)) { return (this.bloc.taille - 1.5*this.epaisseurCadre); }
      return (this.bloc.taille - this.epaisseurCadre); }
    return this.bloc.taille - 2 * this.epaisseurCadre;
  }

  get zl() {
    return this.epaisseur;
  }

  fixYValue() {
    this._y = this.y;
  }

  reset() {
    this.unherited = true;
    this._x = undefined;
    this._y = undefined;
    this._yTiroir = undefined;
    this._isRentrant = undefined;
    this._type = undefined;
    this._style = undefined;
    this._arrondi=undefined;
  }

  offsetTiroir() {
    if (this.isRentrant) { var offsetTiroir = this.epaisseurCadre }
    else { var offsetTiroir = 0 }
    return offsetTiroir;
  }

getPorte(isPorteBloc) {
    var porte = [];
    let hauteurPorte;
    if (isPorteBloc) hauteurPorte=this.bloc.h
    else hauteurPorte=this.yl;
    var offset = this.epaisseurTiroirs * this.isRentrant ;
    if (this.nombrePortes == "1") {
      geometry = createPlanche(this.xl, hauteurPorte, this.epaisseurTiroirs, this.style, this.arrondi);
      porte[0] = new THREE.Mesh(geometry, materialTiroirs);
      porte[0].name = "porte 0";
      //poignee
      let poigneeB = poigneeGroup.clone(true);
      poigneeB.name = "poignee";
      porte[0].add(poigneeB);
      let deltaX = this.xl / 2 - 4 * taillePoignees;
      if (deltaX < 0) deltaX = 0;
      if (this.ouverturePorte == "droite") { deltaX *= -1; poigneeB.rotateZ(Math.PI / 2); }
      else poigneeB.rotateZ(-Math.PI / 2);  // a soumettre à option
      poigneeB.position.set(deltaX, 0, this.epaisseurTiroirs / 2 + offsetSuedois);
      porte[0].position.set(0, 0, this.bloc.p / 2 - offset);
      return porte[0];
    }
    else {
      //porte gauche
      geometry = createPlanche(this.xl/2, hauteurPorte, this.epaisseurTiroirs, this.style, this.arrondi);
      porte[0] = new THREE.Mesh(geometry, materialTiroirs);
      porte[0].name = "porte 0";

      //poignee gauche
      let poigneeB = poigneeGroup.clone(true);
      poigneeB.rotateZ(-Math.PI / 2);  // a soumettre à option
      poigneeB.name = "poignee";
      porte[0].add(poigneeB);
      let deltaX = this.xl / 4 - 4 * taillePoignees;
      if (4 * taillePoignees > this.xl / 4) deltaX = 0;
      poigneeB.position.set(deltaX, 0, this.epaisseurTiroirs / 2 + offsetSuedois);
      porte[0].position.set(-this.xl / 4, 0, this.bloc.p / 2 - offset);

      //porte droite
      porte[1] = new THREE.Mesh(geometry, materialTiroirs);
      porte[1].name = "porte 1";
      //poignee droite
      let poigneeC = poigneeGroup.clone(true);
      poigneeC.rotateZ(Math.PI / 2);  // a soumettre à option
      porte[1].add(poigneeC);
      deltaX *= -1
      poigneeC.position.set(deltaX, 0, this.epaisseurTiroirs / 2 + offsetSuedois);
      poigneeC.name = "poignee";
      porte[1].position.set(this.xl / 4, 0, this.bloc.p / 2 - offset);
      let porteDoubleRoot=new THREE.Object3D();
      porteDoubleRoot.name="porteDoubleRoot"+this.numero;
      porteDoubleRoot.shortName="porteDoubleRoot";
      porteDoubleRoot.add(porte[0],porte[1]);
      return porteDoubleRoot;
    }
}

  getEtagere() {
    if (this.numero < 0) return;
    if (this.numero == 0 && !this.meuble.hasEtagereZero) return;
    if (this.numero > this.bloc.nbEtageres+1) return;
    if (this.numero == this.bloc.nbEtageres+1 && (!this.meuble.hasEtagereFinale || this.type!="etageres")) return;
    if (this.meuble.hasEtagereUnique && this.bloc.numero>0) return;
    
    let offsetSimple;
    let etagere;
    if (this.bloc.meuble.isSimple) {offsetSimple=this.epaisseurCadre;}
    else {offsetSimple = this.epaisseurCadre;}
    let geometry;
    if (this.etageresVerticales) {
      geometry = new THREE.BoxGeometry(this.epaisseur, this.bloc.h - 2 * this.epaisseur, this.bloc.p - this.epaisseur);
      etagere.position.set(this.x, 0, 0);
      etagere = new THREE.Mesh(geometry, material);
    }
    else {
      if (!this.meuble.hasEtagereUnique) {
        geometry = new THREE.BoxGeometry(this.bloc.l - offsetSimple, this.epaisseur, this.bloc.p - this.epaisseur);
        etagere = new THREE.Mesh(geometry, material);
        etagere.position.set(0, this.y, 0);
      }
      else {
        geometry = new THREE.BoxGeometry(this.meuble.largeur - offsetSimple, this.epaisseur, this.bloc.p - this.epaisseur);
        etagere = new THREE.Mesh(geometry, material);
        etagere.position.set(this.meuble.largeur/2-this.bloc.taille/2, this.y, 0);
      }
    }

    etagere.name = "etagere " + this.numero;
    etagere.shortName = "etagere";
    etagere.element = this;

    return etagere;
  }

  getSelectionBox() {
    let selectionBoxRoot = new THREE.Object3D();
    selectionBoxRoot.name = "selectionBoxRoot";
    geometry = new THREE.BoxGeometry(this.xl + 0.05, this.yl + 0.05, this.bloc.meuble.profondeur + this.offsetTiroir() + offsetSuedois + 0.1 + this.epaisseur);
    let boiteSelectionElement = new THREE.Mesh(geometry, materialSelectionEtagere);
    boiteSelectionElement.name = "boiteSelectionElement " + this.numero;
    boiteSelectionElement.shortName = "boiteSelectionElement";
    boiteSelectionElement.category = "boiteSelection";
    selectionBoxRoot.add(boiteSelectionElement);
    boiteSelectionElement.position.set(0, 0, -this.bloc.meuble.profondeur / 2);
    if (!this.isSelected) boiteSelectionElement.visible = false;
    boiteSelectionElement.element = this;
    this.selectionBox = boiteSelectionElement;
    let yTiroir = this.y + this.yl / 2 + this.offsetTiroir()/2;
    let zTiroir = this.bloc.p / 2;
    selectionBoxRoot.position.set(0, yTiroir, zTiroir - this.offsetTiroir());
    return selectionBoxRoot;
  }

  getTiroir() {
    let tiroirRoot = new THREE.Object3D();
    tiroirRoot.name = "tiroirRoot";

    let offsetSimple;
    if (this.bloc.isRentrant && this.bloc.isSimple) offsetSimple=this.epaisseurCadre;
    if (this.bloc.meuble.isSimple) {offsetSimple=this.epaisseur;}
    else {offsetSimple = 2*this.epaisseur;}

    if (this.type == "tiroirs") {
      //tiroir
      geometry = createPlanche(this.xl, this.yl, this.epaisseurTiroirs, this.style, this.arrondi);
      console.log("this.zl=",this.zl);
      let tiroir = new THREE.Mesh(geometry, materialTiroirs);
      tiroir.name = "tiroir " + this.numero;
      tiroir.shortName = "tiroir";
      tiroirRoot.add(tiroir);

      //poignees
      let poigneeB = poigneeGroup.clone(true);
      poigneeB.name = "poignee";
      tiroir.add(poigneeB);
      let yPoignee = this.yl * (this.bloc.meuble.offsetPoignees / 250);
      poigneeB.position.set(0, yPoignee, this.epaisseur / 2 + offsetSuedois);
    }
    let zTiroir = this.bloc.p / 2;

    tiroirRoot.position.set(this.xTiroir, this.yTiroir, zTiroir - this.epaisseur*this.isRentrant);
    return tiroirRoot;
  }
  
  getElement() {
    var elementRoot = new THREE.Object3D();
    elementRoot.name = "elementRoot";
    elementRoot.attach(this.getSelectionBox());
    if (this.type == "tiroirs" && this.numero<this.bloc.nbEtageres+1) elementRoot.attach(this.getTiroir());
    if (this.type !="panneau") {
      let etagere = this.getEtagere();
      if (etagere) elementRoot.attach(etagere);
    }
    if (this.type == "sousMeuble") {
      let sousMeuble = this.getSousMeuble();
      if (sousMeuble) elementRoot.attach(sousMeuble);
    }
    if (this.type == "portes") {
      let porte=this.getPorte(false);
      let porteRoot=new THREE.Object3D();
      porteRoot.attach(porte);
      porteRoot.position.set(this.xTiroir,this.yTiroir,0);
      elementRoot.attach(porteRoot);
    }
    if (this.type == "four") {
      let four=this.bloc.getFour();
      four.position.set(0,this.yTiroir,this.bloc.p/2);
      if (four) elementRoot.attach(four);
    }
    return elementRoot;
  }

  getSousMeuble() {
    if (!this.sousMeuble) {
      this.sousMeuble=new SousMeuble(this.initialMeuble,this.bloc.initialBloc,this,this.numero);
    this.sousMeuble.nbEtageres=1;
    this.sousMeuble.type="etageres";
    this.sousMeuble.nbBlocs=3;
    this.sousMeuble.isSimple=true;
    this.sousMeuble.isSousMeuble=true;
    this.sousMeuble.meubleRoot=this.bloc.meuble;
    this.sousMeuble.name="sousMeuble";
    this.sousMeuble.largeur=this.xl;
    this.sousMeuble.hauteur=this.yl;
    //this.sousMeuble.profondeur=this.zl;
    this.sousMeuble.calculTailleBlocs();
  }

    this.sousMeuble.largeur = this.xl;
    this.sousMeuble.hauteur = this.yl;
    //this.sousMeuble.profondeur=this.zl;
    this.sousMeuble.computeBlocsSize();
    this.sousMeuble.createGeometryRoot();
    this.sousMeuble.update();
    this.sousMeuble.element = this;
    this.sousMeuble.placeMeuble();
    let root = this.sousMeuble.root;
    return root;
  }

  duplicate(bloc,j) {
    let listKeysElement = ["numero", "unherited", "_x", "_y", "_yTiroir", "_type", "_style", "_arrondi", "isSelected", "selectionBox", "_isRentrant", "ouverturePorteLocal", "nombrePortesLocal"];
    let newElement = new Element(bloc, j);
    newElement.bloc = bloc;
    newElement.meuble = bloc.meuble;
    newElement.initialMeuble = bloc.initialMeuble;
    newElement.initialBloc = bloc.initialBloc;
    //newElement.parentElement = 
    listKeysElement.forEach(key => {
      //console.log()
        if (this[key]!=undefined) newElement[key] = this[key];
      });

     if (this.type=="sousMeuble" && this.sousMeuble!=undefined) {
      console.log ("sousMeuble depart=",this.sousMeuble);

      //newElement.getSousMeuble();
      newElement.sousMeuble=this.sousMeuble.duplicate(newElement.initialMeuble,newElement.initialBloc,this);
      console.log ("sousMeuble copie=",newElement.sousMeuble);
      newElement.sousMeuble.isSousMeuble=true;
    }
    
    return newElement;
  }
}

class Bloc {
  constructor(meuble, i) {
    this.numero = i;
    this.taille = tailleBlocDefaut;
    this.createBlocRoot();
    this.meuble = meuble;
    if (!this.meuble.isSousMeuble) {
        this.initialBloc=this;
        this.initialMeuble=this.meuble;
      }
    else {
      this.initialBloc=this.meuble.intialBloc;
      this.initialMeuble=this.meuble.initialMeuble;
    }
    
    this.bloc=this;
    //this.p = this.meuble.profondeur;
    //this.updateLHP();
    this.unherited = true;
    this.elements = [];
    this._nbEtageres = undefined;
    for (var i=0; i<this.nbEtageres+4; i++)
      {this.elements[i] = new Element(this,i);
      } // -1/+1 pour étageres 0 et n+1
    this.selectionBox = undefined;
    
    //commun aux autres classes
    this._type = undefined;
    this._style = undefined;
    this._arrondi = undefined;
    this.isSelected = false;
    this._isRentrant = undefined;
    this.ouverturePorteLocal = undefined;
    this.nombrePortesLocal = undefined;
    this.etageresVerticalesLocal = undefined;

    //this.type = "four";
  }

  get epaisseur() {
    return this.meuble.epaisseur;
  }

  get epaisseurCadre() {
    return this.meuble.epaisseurCadre;
  }

  get l() {
    if (this.meuble.disposition == "horizontal") return this.taille;
    if (this.meuble.disposition == "vertical") return this.meuble.largeur;
  }

  get h() {
    if (this.meuble.disposition == "horizontal") return this.meuble.hauteur - this.meuble.elevation;
    if (this.meuble.disposition == "vertical") return this.taille;
  }

  get p() {
    return this.meuble.profondeur;
  }

  get hauteurInterieure() {
    return this.meuble.hauteur - 2 * this.epaisseurCadre;
  }

  get nbEtageres() {
    if (this.meuble.hasEtagereUnique && this.numero>0) return (this.meuble.blocs[0].nbEtageres)
    if (this._nbEtageres != undefined) {
      return this._nbEtageres;
    }
    else {
      return this.meuble.nbEtageres;
    }
  }

  get ouverturePorte() {
    if (this.ouverturePorteLocal) { return this.ouverturePorteLocal }
    else return this.meuble.ouverturePorte;
  }

  get nombrePortes() {
    if (this.nombrePortesLocal) { return this.nombrePortesLocal }
    else return this.meuble.nombrePortes;
  }

/*   get nbEtageresVerticales() {
    if (this.nbEtageresVerticalesLocal) {return this.nbEtageresVerticalesLocal}
    else return this.meuble.nbEtageresVerticales;
  } */

  set nbEtageres(value) { this._nbEtageres=value }
  set ouverturePorte(value) { this.ouverturePorteLocal=value }
  set nombrePortes(value) { this.nombrePortesLocal=value }
  //set nbEtageresVerticales(value) { this.nbEtageresVerticalesLocal=value }

  get style() { if (this._style) {return this._style;}
    else return this.meuble.style;}

  set arrondi(value) {this._arrondi=value}

  get arrondi() {if (this._arrondi!=undefined) {return this._arrondi}
  else return this.meuble.arrondi;}

  get type() { if (this._type) {return this._type;}
    else { return this.meuble.type;}}

  set type(value) { this._type = value; }
  set isRentrant(value) { this._isRentrant = value; }
  set style(value) { this._style = value; } 

  get isRentrant() { if (this._isRentrant!=undefined) {return this._isRentrant}
    else return this.meuble.isRentrant;}

  get hauteur() {
    if (!this.isRentrant) return this.meuble.hauteur
    else return this.meuble.hauteur-2*this.epaisseurCadre;
  }

  reset() {
    this.unherited = true;
    this._type = undefined;
    this._arrondi=undefined;
  }

  createBlocRoot() {
    this.blocRoot = new THREE.Object3D();
    this.blocRoot.name = "Bloc " + this.numero;
    this.blocRoot.shortName = "Bloc";
    this.blocRoot.numero = this.numero;
  }

/*   updateLHP() {
    if (this.meuble.disposition == "horizontal") { this.l = this.taille; this.h = this.meuble.hauteur; }
    if (this.meuble.disposition == "vertical") { this.l = this.meuble.largeur; this.h = this.taille; }
    this.p = this.meuble.profondeur;
    var epaisseurRelle;
    this.hauteurInterieure = this.meuble.hauteur - 2 * this.epaisseurCadre;    // ??????
  } */

getFour() {
  let four = fourGroup.clone(true);
  return four;
}

  getCadre() {
    let offsetG=0;
    let offsetD=0;
    let offsetFond=this.meuble.hasCotesEleves*this.meuble.elevation;
    let offsetRetraitFond = this.meuble.hasMontants*retraitCotes;
    let offsetRetraitCoteGauche = 0;
    let offsetRetraitCoteDroit = 0;
    if (this.numero==0) offsetRetraitCoteGauche = retraitCotes*this.meuble.hasMontants*this.meuble.hasCotesEleves;
    if (this.numero==this.meuble.nbBlocs-1) offsetRetraitCoteDroit = retraitCotes*this.meuble.hasMontants*this.meuble.hasCotesEleves;
    if (this.numero==0 && !this.meuble.hasMontants) offsetG = this.meuble.elevation;
    if (this.numero==0 && this.meuble.hasMontants && !this.meuble.hasCotesEleves) offsetG = this.meuble.elevation;
    if (this.numero==this.meuble.nbBlocs-1 && !this.meuble.hasMontants) offsetD = this.meuble.elevation;
    if (this.numero==this.meuble.nbBlocs-1 && this.meuble.hasMontants && !this.meuble.hasCotesEleves) offsetD = this.meuble.elevation;

    geometry = new THREE.BoxGeometry( this.l, this.epaisseurCadre, this.p );
    plancheHaut = new THREE.Mesh( geometry, material );
    plancheHaut.name = "plancheHaut";
    geometry = new THREE.BoxGeometry( this.l-2*this.epaisseurCadre, this.epaisseurCadre, this.p );
    plancheBas = new THREE.Mesh( geometry, material );
    plancheBas.name = "plancheBas";
    plancheBas.position.set(0,-this.h/2+this.epaisseurCadre/2,0);
    plancheHaut.position.set(0,this.h/2-this.epaisseurCadre/2,0);
    geometry = new THREE.BoxGeometry( this.epaisseurCadre, this.h-this.epaisseurCadre+offsetD, this.p );
    plancheDroite = new THREE.Mesh( geometry, material );
    plancheDroite.name = "plancheDroite";
    plancheDroite.numBloc = this.numero;
    geometry = new THREE.BoxGeometry( this.epaisseurCadre, this.h-this.epaisseurCadre+offsetG, this.p );
    plancheGauche = new THREE.Mesh( geometry, material );
    plancheGauche.name = "plancheGauche";
    plancheGauche.numBloc = this.numero;
    plancheDroite.position.set(this.l/2 - this.epaisseurCadre/2 - offsetRetraitCoteDroit,-this.epaisseurCadre/2-offsetD/2,0);
    plancheGauche.position.set(-this.l/2 + this.epaisseurCadre/2 + offsetRetraitCoteGauche,-this.epaisseurCadre/2-offsetG/2,0);
    
    let cadreBlocRoot=new THREE.Group();
    cadreBlocRoot.name="cadreBlocRoot"+this.numero;
    cadreBlocRoot.shortName="cadreBlocRoot";
    if (this.meuble.hasPlancheBas) cadreBlocRoot.add(plancheBas);
    if (this.meuble.hasPlancheHaut) cadreBlocRoot.add(plancheHaut);
    if (this.meuble.hasPlancheDroite) cadreBlocRoot.add(plancheDroite);
    if (this.meuble.hasPlancheGauche) cadreBlocRoot.add(plancheGauche);
    if (this.meuble.hasPlancheFond) {
  
      geometry = new THREE.BoxGeometry( this.l, this.h-this.epaisseurCadre+offsetG/2, this.epaisseurCadre );
      let plancheFond = new THREE.Mesh(geometry, material);
      plancheFond.name = "plancheFond";
      plancheFond.numBloc = this.numero;
      let offsetFond = retraitCotes*this.meuble.hasMontants*this.meuble.hasCotesEleves;
      plancheFond.position.set(0, offsetFond, -this.p / 2 + this.epaisseurCadre / 2 + offsetRetraitFond);
      cadreBlocRoot.add(plancheFond);
    }
    return cadreBlocRoot;
  }

  createElementBloc(i) {
    if (!this.elements[i]) this.elements[i] = new Element(this, i);
  }

  createElementsBloc() {
    for (var i = 0; i < this.nbEtageres+2; i++) this.createElementBloc(i);
  }

  getElements() {
    var elementsRoot = new THREE.Object3D();
    elementsRoot.name = "elementsRoot" + this.numero;
    elementsRoot.shortName = "elementsRoot";
    for (var i = 0; i < this.nbEtageres+2; i++) {
      let element = this.elements[i].getElement();
      if (element) elementsRoot.add(element);
    }
    return elementsRoot;
  }

  getHandleBlocs() {

    let coneG = new THREE.Mesh( geometryConeHelper, materialSelectionMeuble);
    let coneD = new THREE.Mesh( geometryConeHelper, materialSelectionMeuble);
    let fact=1;
    if (this.meuble.isSousMeuble) {
      fact=0.6666666;
    }
    geometry = new THREE.BoxGeometry( this.epaisseurCadre, this.h, this.p );

    /* else {
      geometry = new THREE.BoxGeometry( epaisseurHandleBlocs, this.h+this.epaisseur, this.p+this.epaisseur );
    } */

    let scale=0.8*fact;
    coneG.scale.set(scale,scale,scale);
    coneD.scale.set(scale,scale,scale);

    coneG.shortName="cone";
    coneD.shortName="cone";
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
      coneG.position.set(-2*epaisseurHandleBlocs*fact,0,0);
      coneD.rotateZ(-Math.PI/2);
      coneD.position.set(2*epaisseurHandleBlocs*fact,0,0);
      handleBlocGauche.visible = false;
      //if (!this.meuble.isSousMeuble && this.numero!=0)
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
        if (!this.meuble.isSousMeuble)
          handleBlocRoot.add(handleBlocDroit);
      }
    }
    else { //vertical
      geometry = new THREE.BoxGeometry(this.l+this.epaisseur, epaisseurHandleBlocs, this.p+this.epaisseur);
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
    if (!this.blocRoot) this.createBlocRoot();
    //this.updateLHP();
    this.createElementsBloc();

    //cadre bloc
    if (!this.meuble.isSimple) {this.blocRoot.add(this.getCadre());}
    offsetSuedois=((this.style=="Suédois 2")*epaisseurSuedois/4);

    //cadre de sélection pour ajustement tailles (handleBlocs)
    if (!isPreviewOn) { this.blocRoot.add(this.getHandleBlocs()) }

    //four
    if (this.type=="four") {
      let four=this.getFour();
      four.position.set(0,0,this.p/2);
      this.blocRoot.add(four);
/*       this.taille=60.1;
      this.meuble.hauteur=59.5;
      this.meuble.elevation=0;
      this.meuble.computeBlocsSize(); */
    }

    //portes
    if (this.type == "portes") {
      
      let portes=this.elements[this.nbEtageres].getPorte(true);
      portes.translateX(this.elements[this.nbEtageres].xTiroir);
      this.blocRoot.add(portes);}

    //elements
    if (this.type == "tiroirs" || this.type == "etageres") {
      this.blocRoot.add(this.getElements());
    }

    //sous-meuble
    if (this.type == "sousMeuble") {
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
      sousMeuble.update();
      sousMeuble.root.translateZ(-this.profondeur / 2);
      this.blocRoot.add(sousMeuble.root);
    }

    //shadows
    this.blocRoot.traverse(function (child) {
      child.receiveShadow = true;
      child.castShadow = true;
    })

    //boite de sélection
    geometry = roundEdgedBox(this.l + epsilon, this.h + epsilon, this.p + epsilon, 2, 1, 1, 1, 1);
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

  setEtageresNumber(num) {
    for (var i = this.nbEtageres+1; i < num+2; i++) {
      if (!this.elements[i]) {
        this.elements[i] = new Element(this, i);
      }
    }
    this.nbEtageres=num;
    this._nbEtageres = num;
    console.log("etagere number",this._nbEtageres,this.nbEtageres);
  }

  recomputeElementsId() {
    for (var i=0; i<this.elements.length; i++)
    {
      this.elements[i].numero=i;
    }
  }

  duplicate(meuble, i) {
    let listKeysBloc = ["numero", "taille", "unherited", "_nbEtageres", "_type", "_style","_arrondi","isSelected", "_isRentrant", "ouverturePorteLocal", "nombrePortesLocal", "etageresVerticalesLocal"];

    let newBloc = new Bloc(meuble, i);
    listKeysBloc.forEach(key => {
      newBloc[key] = this[key];
    });
    newBloc.elements = [];

    //copie des elements
    for (var j = 0; j < this.nbEtageres + 4; j++) {
      //console.log("copie elements,i,j=", i, j);
      //console.log(meuble.bloc[i].elements[j]);
      newBloc.isSelected = false;
      newBloc.meuble = meuble;
      if (!newBloc.meuble.isSousMeuble) {
        newBloc.initialBloc = newBloc;
        newBloc.initialMeuble = newBloc.meuble;
      }
      else {
        newBloc.initialBloc = newBloc.meuble.intialBloc;
        newBloc.initialMeuble = newBloc.meuble.initialMeuble;
      }
      if (this.elements[j] != undefined) {
        newBloc.elements[j] = this.elements[j].duplicate(newBloc, j);
      }
      console.log("bloc",newBloc.numero," duplicated");
    }


    return newBloc;
  }
}

class Meuble {
  constructor (num) {
    this.numero = num;
    this.meuble=this;
    this.initialMeuble=this;
    
    this.baseName="Meuble";
    this.rename();
    this.hauteur = 70;
    this.largeur = 140;
    this.profondeur = 60;

    this.elevation = 10;

    this.hasPlancheBas = true;
    this.hasPlancheHaut = true;
    this.hasPlancheGauche = true;
    this.hasPlancheDroite = true;
    this.hasPlancheFond = true;
    this.hasPlanchesIntermediaires = true;
    this.hasCotesEleves = true;
    this.hasMontants = false;
    this.epaisseurMontants = 3;
    this.hasMontantsExterieurs = true;
    this.hasMontantsIntermediaires = true;
    this.hasMontantsInterieurs = true;
    this.largeurMontants=2.5;
    this.hasEtagereUnique=false;
    this.hasEtagereZero=false;
    this.hasEtagereFinale=false;
    this.hasRoundedMontants=true;   ////to add to list

    this.nbBlocs = 3;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.blocs = new Array;
    this.disposition = "horizontal";
    //valeurs possibles "horizontal" ou "vertical"
    this.epaisseur=epaisseur;
    this.epaisseurCadre=epaisseurCadre;
    for (var i=0; i<this.nbBlocs; i++) {this.blocs[i] = new Bloc(this.initialMeuble,i)}
    //this.blocs[1].type="four";
    this.calculTailleBlocs();
    //setTailleOnBloc(this.blocs[2],60.1);
    this.hasPlateau=true;
    this.hasCadre=false;
    this.hasSocle=false;
    this.hasPied=false;

    this.hasEvier=true;     ////to add to list
    this.xEvier=0;          ////
    this.yEvier=0;          ////
    this.zEvier=0;          ////
    this.evier=undefined;

    this.IsSuspendu=true;
    this.offsetPoignees=0;
    this.isSousMeuble=false;
    this.meubleRoot=undefined;
    this.createGeometryRoot();

    this.type="etageres";
    //valeurs possibles : "etageres", "tiroirs", "portes", "panneau", "sousMeuble"

    this.isRentrant = false;
    this.isSimple = true;

    this.onMurFond = true;
    this.onMurGauche = false;
    this.onMurDroit = false;
    this.surSol = false;

    this.orientation = 0;
    //valeurs possibles : 0, 1 (rotation PI/2), 2 (rotation PI), 3 (rotation -PI/2)

    //commun aux autres classes
    this._style = undefined;
    this._arrondi=undefined;
    this.isSelected = false;
    this.selectionBox = undefined;
    this.nbEtageres=1;
    
    //commun à la classe bloc
    this.ouverturePorte = "gauche";
    this.nombrePortes = "1";
    this.etageresVerticales = false;
  }

  get style() {
    if (this._style) {return this._style}
    else return globalStyle;
  }

  set style(value) {
    this._style=value;
  } 

  set arrondi(value) {this._arrondi=value}

  get arrondi() {if (this._arrondi!=undefined) {return this._arrondi}
  else return arrondi;}

  //fixe une taille identique pour chaque bloc en fonction de la largeur du meuble
  calculTailleBlocs() {
    for (var i = 0; i < this.nbBlocs; i++) {
      this.blocs[i].taille = this.largeur / this.nbBlocs;
    }
  }

  updateTaille() {
    this.updateLargeur();
    this.updateHauteur();
  }

  updateLargeur() {
    this.largeur = this.calculSommeLargeurBlocs();
  }

  updateHauteur() {
    this.hauteur = this.calculSommeHauteurBlocs();
  }

  calculSommeLargeurBlocs() {
    if (this.disposition == "vertical") return this.largeur;
    else {
      var largeurTemp = 0;
      for (var i = 0; i < this.nbBlocs; i++) {
        largeurTemp += this.blocs[i].taille;
      }
      return (largeurTemp);
    }
  }

  calculSommeHauteurBlocs() {
    if (this.disposition == "horizontal") return this.hauteur;
    else {
      var hauteurTemp = 0;
      for (var i = 0; i < this.nbBlocs; i++) {
        hauteurTemp += this.blocs[i].taille;
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
    return (this.largeur+this.hasCadre*this.epaisseurCadre*2);
  }

  getHauteurReelle() {
    var bordSup=Math.max(this.hasCadre*this.epaisseurCadre,this.hasPlateau*epaisseurPlateau);
    bordSup+=this.hasEvier*hauteurEvier;
    return (this.hauteur+this.hasCadre*this.epaisseurCadre+this.hasSocle*hauteurSocle+this.hasPied*hauteurPied+bordSup);
  }

  getProfondeurReelle() {
    return (this.profondeur+this.hasCadre*this.epaisseurCadre);
  }

  //collisions
  getMaxAllowedHeight() {
    let translateLimit=this.getLimitTranslationY();
    let delta = translateLimit[1]-this.y+this.hauteur;
    console.log(delta,this.getHauteurReelle());
    return (delta);
  }

  getMaxAllowedSpaceOnSides() {
    let translateLimit,deltaLeft,deltaRight;
    if (this.orientation==0 || this.orientation==2) {
      translateLimit=this.getLimitTranslationX();
      deltaLeft = Math.abs(this.x-translateLimit[0]);
      deltaRight = Math.abs(this.x-translateLimit[1]);
    }
    else {
      translateLimit=this.getLimitTranslationZ();
      deltaLeft = Math.abs(this.z-translateLimit[0]);
      deltaRight = Math.abs(this.z-translateLimit[1]);
    }

    let spaceArray=[];
    spaceArray[0]=deltaLeft;
    spaceArray[1]=deltaRight;
    return spaceArray;
  }

  getMaxAllowedWidth() {
    let translateLimit,deltaA,deltaB;
    if (this.orientation==0 || this.orientation==2) {
      translateLimit=this.getLimitTranslationX();
      deltaA = Math.abs(this.x-translateLimit[0]);
      deltaB = Math.abs(this.x-translateLimit[1]);
    }
    else {
      translateLimit = this.getLimitTranslationZ();
      deltaA = Math.abs(this.z - translateLimit[0]);
      deltaB = Math.abs(this.z - translateLimit[1]);
    }
    let delta = Math.min(deltaA, deltaB);
    return (2*delta+this.getLargeurReelle());
  }

  getMaxAllowedDepth() {
    let translateLimit,deltaA,deltaB,delta,result;
    if (this.orientation==0 || this.orientation==2) {
      translateLimit=this.getLimitTranslationZ();
      deltaA = Math.abs(this.z-translateLimit[0]);
      deltaB = Math.abs(this.z-translateLimit[1]);
    }
    else {
      translateLimit = this.getLimitTranslationX();
      deltaA = Math.abs(this.x - translateLimit[0]);
      deltaB = Math.abs(this.x - translateLimit[1]);
    }
    if (this.surSol) delta = Math.min(deltaA,deltaB)
      else delta = deltaB;
    console.log(deltaA,deltaB);
    if (this.surSol) result = 2*delta+this.getProfondeurReelle();
      else result = delta+this.getProfondeurReelle();
    return (result);
  }

  getLimitTranslationX() {
    var bY;
    var minXGlobal, maxXGlobal;
    var lBB = this.getLargeurBoundingBox();

    minXGlobal = -largeurPiece/2 + lBB / 2;
    maxXGlobal = largeurPiece/2 - lBB / 2;

    var minX = -10e34;
    var maxX = 10e34;

    for (var i = 0; i < meubles.length; i++) {
      if (i != this.numero) {

        bY = meubles[i].getBoundingBoxCenterY();
        if (this.intersectY(i) && this.intersectZ(i)) {
          if (this.x > meubles[i].x) {
            minX = (meubles[i].x + meubles[i].getLargeurBoundingBox() / 2) + (lBB / 2);
          }
          if (this.x < meubles[i].x) {
            maxX = (meubles[i].x - meubles[i].getLargeurBoundingBox() / 2) - (lBB / 2);
          }
        }
      }
      minXGlobal = Math.max(minX, minXGlobal);
      maxXGlobal = Math.min(maxX, maxXGlobal);
    }
    return [minXGlobal, maxXGlobal];
  }

  getLimitTranslationY() {
    var hA = this.getHauteurReelle();
    var minYGlobal = 0;
    var maxYGlobal = hauteurPiece-hA;
    var minY = 0;
    var maxY = hauteurPiece-hA;
    for (var i = 0; i < meubles.length; i++) {
      if (i != this.numero) {
        if (this.intersectX(i) && this.intersectZ(i)) {
          if (this.y > meubles[i].y) {
            minY = meubles[i].getHauteurReelle() + meubles[i].y;
          }
          if (this.y < meubles[i].y) {
            maxY = meubles[i].y - hA;
          }
          minYGlobal = Math.max(minY, minYGlobal);
          maxYGlobal = Math.min(maxY, maxYGlobal);
        }
      }
    }
    return [minYGlobal, maxYGlobal];
  }
  
  getLimitTranslationZ() {
    var bY;
    var minZGlobal, maxZGlobal;
    var pBB = this.getProfondeurBoundingBox();

    minZGlobal = pBB / 2;
    maxZGlobal = profondeurPiece - pBB / 2;

    var minZ = 0;
    var maxZ = 10e34;

    for (var i = 0; i < meubles.length; i++) {
      if (i != this.numero) {

        bY = meubles[i].getBoundingBoxCenterY();
        if (this.intersectX(i) && this.intersectY(i)) {
          if (this.z > meubles[i].z) {
            minZ = (meubles[i].z + meubles[i].getProfondeurBoundingBox() / 2) + (pBB / 2);
          }
          if (this.z < meubles[i].z) {
            maxZ = (meubles[i].z - meubles[i].getProfondeurBoundingBox() / 2) - (pBB / 2);
          }
        }
      }
      minZGlobal = Math.max(minZ, minZGlobal);
      maxZGlobal = Math.min(maxZ, maxZGlobal);
    }
    return [minZGlobal, maxZGlobal];
  }

  getBoundingBoxCenterX() {
    /* if (this.orientation==0 || this.orientation==2) return this.x
    else return this.z; */
    return this.x;
  }

  getBoundingBoxCenterY() {
    var cadreA = this.hasCadre * this.epaisseurCadre;
    var socleA = this.hasSocle * hauteurSocle;
    var piedA = this.hasPied * hauteurPied;
    var plateauA = this.hasPlateau * epaisseurPlateau;
    var evierA = this.hasEvier * hauteurEvier;
    var offsetHautA = Math.max(cadreA, plateauA)+evierA;
    var offsetBasA = cadreA + piedA + socleA;
    var aY = this.y + this.hauteur / 2 + offsetHautA / 2 + offsetBasA / 2;
    return aY;
  }

  getBoundingBoxCenterZ() {
    /* if (this.orientation==0 || this.orientation==2) return this.z
    else return this.x; */
    return this.z;
  }

  getLargeurBoundingBox() {
    if (this.orientation == 0 || this.orientation == 2)
      return this.getLargeurReelle();
    else return this.getProfondeurReelle();
  }

  getProfondeurBoundingBox() {
    if (this.orientation == 0 || this.orientation == 2)
      return this.getProfondeurReelle();
    else return this.getLargeurReelle();
  }

  getHauteurBoundingBox() {
    return this.getHauteurReelle();
  }

  intersectX(indiceMeubleB) {
    var xA = this.getBoundingBoxCenterX();
    var xB = meubles[indiceMeubleB].getBoundingBoxCenterX();
    var lA = this.getLargeurBoundingBox();
    var lB = meubles[indiceMeubleB].getLargeurBoundingBox();
    var intersectX = (Math.abs(xA - xB) * 2 < (lA + lB));
    //console.log("intersectX",Math.abs(xA - xB) * 2 - (lA + lB));
    return intersectX;
  }

  intersectY(indiceMeubleB) {
    var aY = this.getBoundingBoxCenterY();
    var bY = meubles[indiceMeubleB].getBoundingBoxCenterY();
    var hA = this.getHauteurBoundingBox();
    var hB = meubles[indiceMeubleB].getHauteurBoundingBox();
    var intersectY = (Math.abs(aY - bY) * 2 < (hA + hB));
    return intersectY;
  }

  intersectZ(indiceMeubleB) {
    var zA = this.getBoundingBoxCenterZ();
    var zB = meubles[indiceMeubleB].getBoundingBoxCenterZ();
    var pA = this.getProfondeurBoundingBox();
    var pB = meubles[indiceMeubleB].getProfondeurBoundingBox();
    var intersectZ = (Math.abs(zA - zB) * 2 < (pA + pB));
    return intersectZ;
  }

  getIntersectionList() {
    let collisionList=[];
    for (var i = 0; i < meubles.length; i++) {
      if (i != this.numero) {
        if (this.intersectX(i) && this.intersectY(i) && this.intersectZ(i)) {
          collisionList.push(meubles[i]);
        }
      }
    }
    return collisionList;
  }

  isInRoom() {
    let xMax = largeurPiece / 2 - this.getLargeurBoundingBox() / 2;
    let xMin = -largeurPiece / 2 + this.getLargeurBoundingBox() / 2;
    let yMin = 0;
    let yMax = hauteurPiece - this.getHauteurBoundingBox();
    let zMin = this.getProfondeurBoundingBox() / 2;
    let zMax = profondeurPiece - this.getProfondeurBoundingBox() / 2;
    let isInRoom=true;
    if (this.x<xMin) isInRoom=false;
    if (this.y<yMin) isInRoom=false;
    if (this.z<zMin) isInRoom=false;
    if (this.x>xMax) isInRoom=false;
    if (this.y>yMax) isInRoom=false;
    if (this.z>zMax) isInRoom=false;
    return isInRoom;
  }

  isPositionCorrect() {
    let hasNoIntersection=false;
    hasNoIntersection=(this.getIntersectionList().length==0);
    //console.log(this.getIntersectionList().length);
    let isInRoom=this.isInRoom();
    let positionOK=(hasNoIntersection && isInRoom);
    //console.log("isInRoom",isInRoom,"hasNoIntersection",hasNoIntersection);
    return(positionOK);
  }

  recaleDansPiece() { // return true if object moved
    let xMax = largeurPiece / 2 - this.getLargeurBoundingBox() / 2;
    let xMin = -largeurPiece / 2 + this.getLargeurBoundingBox() / 2;
    let yMin = 0;
    let yMax = hauteurPiece - this.getHauteurBoundingBox();
    let zMin = this.getProfondeurBoundingBox() / 2;
    let zMax = profondeurPiece - this.getProfondeurBoundingBox() / 2;

    let x0=this.x;
    let y0=this.y;
    let z0=this.z;

    if (this.onMurFond) this.z = zMin;
    if (this.onMurGauche) this.x = xMin;
    if (this.onMurDroit) this.x = xMax;
    if (this.surSol) this.y = yMin;

    this.x = this.x > xMin ? this.x : xMin;
    this.x = this.x < xMax ? this.x : xMax;
    this.y = this.y > yMin ? this.y : yMin;
    this.y = this.y < yMax ? this.y : yMax;
    this.z = this.z > zMin ? this.z : zMin;
    this.z = this.z < zMax ? this.z : zMax;

    if (x0==this.x && y0==this.y && z0==this.z) return false
    else return true;
  }

  recale(preferedAxis,count) { //returns true if successful
    if (count!=undefined) count++;
    if (count>4) return;
    if (this.isPositionCorrect()) {
      console.log("position correct");
      return;
    }
    console.log("count",count,preferedAxis);
    let x0=this.x;
    let y0=this.y;
    let cadreB, plateauB, evierB, piedB, socleB, offsetHautB, offsetBasB;
    let bX, bY, bZ, hB, wB, dB;
    let aX, aY, aZ, hA, wA, dA;
    let decalX, decalY, decalZ;
    let collisionList = [];
    let usedAxis ="";

    hA = this.getHauteurBoundingBox();
    wA = this.getLargeurBoundingBox();
    dA = this.getProfondeurBoundingBox();

    aX = this.getBoundingBoxCenterX();
    aY = this.getBoundingBoxCenterY();
    aZ = this.getBoundingBoxCenterZ();

    collisionList = this.getIntersectionList();

    for (var i = 0; i < collisionList.length; i++) {

      let meubleB = collisionList[i];

      cadreB = meubleB.hasCadre * meubleB.epaisseurCadre;
      plateauB = meubleB.hasPlateau * epaisseurPlateau;
      piedB = meubleB.hasPied * hauteurPied;
      socleB = meubleB.hasSocle * hauteurSocle;
      evierB = meubleB.hasEvier * hauteurEvier;
      offsetHautB = Math.max(cadreB, plateauB)+evierB;
      offsetBasB = socleB + piedB + cadreB;

      hB = meubleB.getHauteurBoundingBox();
      wB = meubleB.getLargeurBoundingBox();
      dB = meubleB.getProfondeurBoundingBox();

      bX = meubleB.getBoundingBoxCenterX();
      bY = meubleB.getBoundingBoxCenterY();
      bZ = meubleB.getBoundingBoxCenterZ();

        if (aX >= bX) { decalX = (aX - wA / 2) - (bX + wB / 2) }
        else { decalX = (aX + wA / 2) - (bX - wB / 2) }
        if (aY >= bY) { decalY = (aY - hA / 2) - (bY + hB / 2) }
        else { decalY = (aY + hA / 2) - (bY - hB / 2) }
        if (aZ >= bZ) { decalZ = (aZ - dA / 2) - (bZ + dB / 2) }
        else { decalZ = (aZ + dA / 2) - (bZ - dB / 2) }

      if (this.onMurFond) {
        //console.log((Math.abs(decalX) <= Math.abs(decalY)));
        if ((Math.abs(decalX) <= Math.abs(decalY)) || preferedAxis == "X" || preferedAxis=="-X")
          if (preferedAxis == "-X") {
            this.x += decalX;
            aX += decalX;
            usedAxis="-X";
          }
          else {
            this.x -= decalX;
            aX -= decalX;
            usedAxis="X";
          }
        else 
        {
          if (preferedAxis == "-Y") {
            console.log("decalage en Y");
            this.y += decalY;
            aY += decalY;
            usedAxis = "-Y";
          }
          else {
            console.log("decalage en Y");
            this.y -= decalY;
            aY -= decalY;
            usedAxis = "Y";
          }
        }
      }

      if (this.onMurDroit || this.onMurGauche) {
        if ((Math.abs(decalZ) <= Math.abs(decalY)) || preferedAxis == "Z" || preferedAxis=="-Z")
        {
          this.z -= decalZ;
          aZ -= decalZ;
          usedAxis="Z";
        }
        else 
        {
          this.y -= decalY;
          aY -= decalY;
          usedAxis="Y";
        }
      }

      if (this.surSol) {
        if ((Math.abs(decalZ) <= Math.abs(decalX)) || preferedAxis == "Z" || preferedAxis=="-Z")
        {
          this.z -= decalZ;
          aZ -= decalZ;
          usedAxis="Z";
        }
        else
        {
          this.x -= decalX;
          aX -= decalX;
          usedAxis="X";
        }
      }
    }

    //test deuxième itération sur deuxième axe si non concluant sur le premier axe
    if (this.getIntersectionList().length > 0) {
      //if (!preferedAxis) {
        console.log("deuxième itération");
        this.x = x0;
        this.y = y0;
        if (count==undefined) count=0;
        if (this.onMurFond) {
          if (usedAxis == "X") this.recale("-X", count);
          if (usedAxis == "-X") this.recale("Y", count);
          if (usedAxis == "Y") this.recale("-Y", count);
        }
        if (this.onMurDroit || this.onMurGauche) {
          if (usedAxis == "Z" || usedAxis == "-Z") this.recale("Y", count);
          if (usedAxis == "Y" || usedAxis == "-Y") this.recale("Z", count);
        }
        if (this.surSol) {
          if (usedAxis == "X" || usedAxis == "-X") this.recale("Y", count);
          if (usedAxis == "Z" || usedAxis == "-Z") this.recale("X", count);
        }
      //}
/*       else if (count>=0) {
        if (preferedAxis=="X") this.recale("Y",count);
        if (preferedAxis=="Y") this.recale("X",count);
      } */
    }
    return (this.getIntersectionList().length == 0);
  }

  findGoodPosition() {
    this.recaleDansPiece();
    let x0=this.x;
    let y0=this.y;
    let z0=this.z;
    for (var i = 0; i < meubles.length; i++) {
      if (!this.recale("X")) break;
    }
    let isPositionOk = (!this.recaleDansPiece() && this.getIntersectionList().length == 0);
    if (!isPositionOk) {
      this.x=x0;
      for (var i = 0; i < meubles.length; i++) {
        if (!this.recale("-X")) break;
      }
      let isPositionOk = (!this.recaleDansPiece() && this.getIntersectionList().length == 0);
      if (!isPositionOk) {
        this.x=x0;
        for (var i = 0; i < meubles.length; i++) {
          if (!this.recale("Y")) break;
        }
        let isPositionOk = (!this.recaleDansPiece() && this.getIntersectionList().length == 0);
        if (!isPositionOk) {
          //this.y=this.y0;
          for (var i = 0; i < meubles.length; i++) {
            if (!this.recale("Z")) break;
          }
          let isPositionOk = (!this.recaleDansPiece() && this.getIntersectionList().length == 0);

          if (!isPositionOk) console.log("Pas de position trouvée !!!");
        }
      }
    }
  }

  //trouve la premier emplacement valide en x sans changer y
  //renvoie x et y max (pour une rangée compléte au même y minimum) pour deuxième passage
  findFirstXplacement() {
    let demiProfondeur=this.getLargeurBoundingBox()/2;
    let list=[];
    let ySup=0;
    let y=0;
    for (var i=0;i<meubles.length;i++) {
      if (i!=this.numero) {
        if (this.intersectY(i) && this.intersectZ(i)) {
          list.push(meubles[i]);
          y=meubles[i].y+meubles[i].getHauteurBoundingBox();
          ySup=Math.max(y,ySup);    //à améliorer sortir inf egalement pour calage suivant
        }
      }
    }
    if (list.length==0) return [-largeurPiece/2+demiProfondeur,ySup];
    list.sort(function(a, b) {
      return (a.x-b.x);
    });
    let previous = -largeurPiece/2;
    let last = largeurPiece/2;
    let next;
    let width;

    for (var i=0;i<list.length;i++) {
      let demiProfondeurCurrent=list[i].getLargeurBoundingBox()/2;
      next = list[i].x-demiProfondeurCurrent;
      let width=next-previous;
      if (width>=this.getLargeurBoundingBox()) return [(previous+demiProfondeur),ySup];
      previous=list[i].x+demiProfondeurCurrent;;
    }

    width=last-previous;
    if (width>=this.getLargeurBoundingBox()) return [(previous+demiProfondeur),ySup];

    console.log("pas de X trouvé");
    return [undefined,ySup];
  }

  //trouve le y le plus bas possible, le x le plus à gauche pour emplacement valide
  findSecondXplacement() {
    let demiProfondeur=this.getLargeurBoundingBox()/2;
    let x0=this.x;
    let y0=this.y;
    let xMin=-largeurPiece/2+demiProfondeur;
    this.x=xMin;
    this.y=hauteurPiece;

    let yMin=this.getLimitTranslationY()[0];

    for (var i = 0; i < meubles.length; i++) {
      if (this.numero==i) continue;
      this.x = meubles[i].x + meubles[i].getLargeurBoundingBox() / 2 + demiProfondeur;
      if (this.x < (largeurPiece / 2 - demiProfondeur)) {
          let y = this.getLimitTranslationY()[0];
          if (y<yMin) xMin=this.x;
          if (y==yMin && this.x<xMin) xMin=this.x;
          yMin=Math.min(y,yMin);
      }
    }
      this.x = x0;
      this.y = y0;
      if (xMin < (largeurPiece / 2 - demiProfondeur) && (yMin < hauteurPiece - this.getHauteurBoundingBox()))
        return [xMin, yMin]
      else return undefined;
  }

  findSecondZplacement() {
    let demiProfondeur=this.getProfondeurBoundingBox()/2;
    let z0=this.z;
    let y0=this.y;
    let zMin=demiProfondeur;
    this.z=zMin;
    this.y=hauteurPiece;

    let yMin=this.getLimitTranslationY()[0];

    for (var i = 0; i < meubles.length; i++) {
      if (this.numero==i) continue;
      this.z = meubles[i].z + meubles[i].getProfondeurBoundingBox() / 2 + demiProfondeur;
      if (this.z < (profondeurPiece / 2 - demiProfondeur)) {
          let y = this.getLimitTranslationY()[0];
          if (y<yMin) zMin=this.z;
          if (y==yMin && this.z<zMin) zMin=this.z;
          yMin=Math.min(y,yMin);
      }
    }
      this.z = z0;
      this.y = y0;
      if (zMin < (profondeurPiece / 2 - demiProfondeur) && (yMin < hauteurPiece - this.getHauteurBoundingBox()))
        return [zMin, yMin]
      else return undefined;
  }

  findFirstZplacement() {
    let demiProfondeur=this.getProfondeurBoundingBox()/2;
    let list=[];
    let ySup=0;
    let y=0;
    for (var i=0;i<meubles.length;i++) {
      if (i!=this.numero) {
        if (this.intersectY(i) && this.intersectX(i)) {
          list.push(meubles[i]);
          y=meubles[i].y+meubles[i].getHauteurBoundingBox();
          ySup=Math.max(y,ySup);
        }
      }
    }
    if (list.length==0) return [demiProfondeur,ySup];
    list.sort(function(a, b) {
      return (a.z-b.z);
    });
    let previous = 0;
    let last = profondeurPiece;
    let next;
    let depth;

    for (var i=0;i<list.length;i++) {
      let demiProfondeurCurrent=list[i].getProfondeurBoundingBox()/2;
      next = list[i].z-demiProfondeurCurrent;
      let depth=next-previous;
      if (depth>=this.getProfondeurBoundingBox()) return [(previous+demiProfondeur),ySup];
      previous=list[i].z+demiProfondeurCurrent;
    }

    depth=last-previous;
    if (depth>=this.getProfondeurBoundingBox()) return [(previous+demiProfondeur),ySup];

    console.log("pas de Z trouvé");
    return [undefined,ySup];
  }

  automaticPlacement() {
    let result;
    this.recaleDansPiece();

    if (this.onMurFond || this.surSol) {
      result = this.findSecondXplacement();
      if (!result) {
        console.log ("WARNING : Aucun emplacement trouvé");
        return
      }
      this.x=result[0];
      this.y=result[1];
    }

    if (this.onMurDroit || this.onMurGauche || this.surSol) {
      result = this.findSecondZplacement();
      if (!result) {
        console.log ("WARNING : Aucun emplacement trouvé");
        return
      }
      this.z=result[0];
      this.y=result[1];
    }

    this.placeMeuble();
  }

  setActiveWall(mur) {
    if (mur=="onMurFond") {
      this.onMurGauche=false;
      this.onMurDroit=false;
      this.onMurFond=true;
      this.surSol=false;
      this.orientation=0;
    }
    if (mur=="onMurGauche") {
      this.onMurGauche=true;
      this.onMurDroit=false;
      this.onMurFond=false;
      this.surSol=false;
      this.orientation=1;
    }
    if (mur=="onMurDroit") {
      this.onMurGauche=false;
      this.onMurDroit=true;
      this.onMurFond=false;
      this.surSol=false;
      this.orientation=3;
    }
    if (mur=="surSol") {
      this.onMurGauche=false;
      this.onMurDroit=false;
      this.onMurFond=false;
      this.surSol=true;
    }
  }

  switchMur(mur) {
    this.setActiveWall(mur);
    this.recaleDansPiece();
    if (mur == "onMurGauche" || mur == "onMurDroit") {
      let z = this.findFirstZplacement()[0];
      if (z) this.z = z
      else {
        this.automaticPlacement();
      }
    }
    if (mur=="onMurFond") {
      let x = this.findFirstXplacement()[0];
      if (x) this.x = x
      else {
        this.automaticPlacement();
      }
    }
    if (mur =="surSol") {
      this.recaleDansPiece();
      console.log("recale successful",this.recale());
      if (!this.isPositionOk()) {
          console.log("looking for Z");
          let result = this.findSecondZplacement();
          if (result) {
            this.z = result[0];
            this.y = result[1];
          }
          else console.log("WARNING : pas de position trouvée");
      }
    }
    if (this.recaleDansPiece()) this.findGoodPosition();

    refreshInterfaceMeuble();
    selectedMeuble.update();
  }

  createGeometryRoot() {
    this.root = new THREE.Object3D();
    this.root.name = "meuble " + this.numero;
    this.root.shortName="root";
    this.root.position.set(0, 0, 0);

    let pivot = new THREE.Object3D();
    pivot.name = "pivot";// + this.numero;
    //pivot.shortName="pivot";
    pivot.position.set(0, 0, 0);
    this.root.add(pivot);

    let geometries = new THREE.Object3D();
    geometries.name = "geometries";
    pivot.add(geometries);
    let handlesMeuble = new THREE.Object3D();
    handlesMeuble.name = "handlesMeuble";
    pivot.add(handlesMeuble);
    scene.add(this.root);
  }

  placeMeuble() {
/*     if (this.isSousMeuble==true) {
      this.root.position.set(this.element.xTiroir,this.element.yTiroir,-this.epaisseur);
      return;
    } */
    let y=this.hauteur / 2 + this.y;
    if (this.hasCadre) y+=this.epaisseurCadre;
    if (this.hasSocle) y+=hauteurSocle;
    if (this.hasPied) y+=hauteurPied;

    let pivot=this.root.getObjectByName("pivot");
    if (this.orientation==0) pivot.rotation.set(0, 0, 0)
      else if (this.orientation==1) pivot.rotation.set(0, Math.PI/2, 0)
      else if (this.orientation==2) pivot.rotation.set(0, Math.PI, 0)
      else if (this.orientation==3) pivot.rotation.set(0, -Math.PI/2, 0);

    if (this.onMurFond) {
      this.root.position.set(
      this.x,
      y,
      this.profondeur / 2);
    }
      
    if (this.onMurGauche) {
      this.root.position.set(
        this.profondeur/2-largeurPiece/2,
        y,
        this.z);
    }

    if (this.onMurDroit) {
      this.root.position.set(
        -this.profondeur/2+largeurPiece/2,
        y,
        this.z);
    }

    if (this.surSol) {
      this.root.position.set(
        this.x,
        y,
        this.z);
    }
  }

  getPlateau() {
      let sx = this.largeur + 2 * debordPlateau;
      let sy = epaisseurPlateau;
      let sz = this.profondeur + debordPlateau;
      if (this.style == "Basique" || isPreviewOn) {
        geometry = new THREE.BoxGeometry(sx, sy, sz);
      }
      else {
        geometry = roundEdgedBox(sx, sy, sz, 0.5, 1, 1, 1, 1);
      }

    if (this.hasEvier) {
      const brush1 = new Brush(geometry);
      brush1.updateMatrixWorld();

      //let evierBrushB = this.evier.getObjectByName('evierBrush');
      let geo = evierBrush.geometry.clone();
      geo.translate(this.xEvier, 0, this.zEvier);

      const brush2 = new Brush(geo);
      brush2.updateMatrixWorld();

      const evaluator = new Evaluator();
      const result = evaluator.evaluate(brush1, brush2, SUBTRACTION);

      plateau = result;
    }
    else plateau = new THREE.Mesh(geometry, [materialPlateauCote, materialPlateauCote, materialPlateau, materialPlateau, materialPlateauAvant, materialPlateauAvant]);

    plateau.material = materialPlateau;

      plateau.position.set(0, this.hauteur / 2 + epaisseurPlateau / 2, debordPlateau / 2);
      plateau.name = "plateau";
      plateau.sx = sx;
      plateau.sy = sy;
      plateau.sz = sz;

      return plateau;
  }
  
  getEvier() {
    if (evierHandle==undefined) return;
    const ecartEvier = 5;
    this.yEvier = this.hauteur / 2 + epaisseurPlateau;
    //let evierGroupB=evierGroup.clone(true);
    //console.log(evierGroupB);
    //let evierHandleB=evierGroupB.getObjectByName("evierHandle");
    evierHandle.position.set(this.xEvier, this.yEvier, this.zEvier);//this.profondeur/2 - ecartEvier);
    evierHandle.meuble=this;
    this.evier = evierGroup;
    //scene.add(evierHandle);
    return evierHandle;
  }

  getSocle() {
      geometry = new THREE.BoxGeometry(
        this.largeur,
        hauteurSocle,
        this.profondeur - retraitSocle);
      socle = new THREE.Mesh(geometry, material);
      let cadre = this.hasCadre * this.epaisseurCadre;
      socle.position.set(0, -this.hauteur / 2 - hauteurSocle / 2 - cadre, -retraitSocle);
      socle.name = "socle";
      return socle;
  }
    
  getPieds() {
      geometry = new THREE.BoxGeometry(
        largeurPied,
        hauteurPied,
        largeurPied);
      let cadre = this.hasCadre * this.epaisseurCadre;

      piedA = new THREE.Mesh(geometry, material);
      piedA.position.set(
        -this.largeur / 2 + largeurPied / 2,
        -this.hauteur / 2 - hauteurPied / 2 - cadre,
        this.profondeur / 2 - largeurPied / 2);
      piedA.name = "piedA";

      piedB = new THREE.Mesh(geometry, material);
      piedB.position.set(
        this.largeur / 2 - largeurPied / 2,
        -this.hauteur / 2 - hauteurPied / 2 - cadre,
        this.profondeur / 2 - largeurPied / 2);
      piedB.name = "piedB";

      piedC = new THREE.Mesh(geometry, material);
      piedC.position.set(
        this.largeur / 2 - largeurPied / 2,
        -this.hauteur / 2 - hauteurPied / 2 - cadre,
        -this.profondeur / 2 + largeurPied / 2);
      piedC.name = "piedC";

      piedD = new THREE.Mesh(geometry, material);
      piedD.position.set(
        -this.largeur / 2 + largeurPied / 2,
        -this.hauteur / 2 - hauteurPied / 2 - cadre,
        -this.profondeur / 2 + largeurPied / 2);
      piedD.name = "piedD";

    let pieds = new THREE.Group()
    pieds.add(piedA,piedB,piedC,piedD);
    return pieds
  }

  getCadre() {
    //cadre meuble
    geometry = new THREE.BoxGeometry(
      this.largeur + 2 * this.epaisseurCadre - 0.05,
      this.epaisseurCadre,
      this.profondeur + debordCadre + 0.05);

    let cadreHaut = new THREE.Mesh(geometry, materialCadreCote, materialCadreCote, materialCadre, materialCadre, materialCadreAvant, materialCadreAvant);
    cadreHaut.position.set(0, this.hauteur / 2 + this.epaisseurCadre / 2, debordCadre);
    cadreHaut.name = "cadreHaut";

    let cadreBas = new THREE.Mesh(geometry, materialCadreCote, materialCadreCote, materialCadre, materialCadre, materialCadreAvant, materialCadreAvant);
    cadreBas.position.set(0, -this.hauteur / 2 - this.epaisseurCadre / 2, debordCadre);
    cadreBas.name = "cadreBas";

    geometry = new THREE.BoxGeometry(
      this.epaisseurCadre,
      this.hauteur + 2 * this.epaisseurCadre - 0.05,
      this.profondeur + debordCadre);

    let cadreGauche = new THREE.Mesh(geometry, materialCadreCote, materialCadreCote, materialCadre, materialCadre, materialCadreAvant, materialCadreAvant);
    cadreGauche.position.set(-this.largeur / 2 - this.epaisseurCadre / 2, 0, debordCadre);
    cadreGauche.name = "cadreGauche";

    let cadreDroit = new THREE.Mesh(geometry, materialCadreCote, materialCadreCote, materialCadre, materialCadre, materialCadreAvant, materialCadreAvant);
    cadreDroit.position.set(this.largeur / 2 + this.epaisseurCadre / 2, 0, debordCadre);
    cadreDroit.name = "cadreDroit";
    let cadres = new THREE.Group();
    cadres.add(cadreHaut, cadreBas, cadreDroit, cadreGauche);
    return cadres;
  }

  getMontant(x,y,isPrimaire) {
    let offset=0;
    if (isPrimaire) offset=x/2 
    else offset=-x/2;
    console.log(isPrimaire);
    console.log(offset);
    if (this.hasRoundedMontants) {
      //return new THREE.CylinderGeometry(x/2,x/2,y+x*isSecondaire,12,1);
      return getRoundedCylinder(x,y-offset);
    }
    else {return roundEdgedBox(x,
      y, x, 0.5, 1, 1, 1, 1);}
  }

  getMontants() {
    let geoA = new THREE.BufferGeometry;
    let geo2 = new THREE.BufferGeometry;
    let geo3;
    let geometries=[];

    let cadres = new THREE.Group();
    let montantsExterieurs,montantsIntermediaires,montantsInterieurs;

    //armature exterieure
    if (this.hasMontantsExterieurs) {

/*       let montantProfondeur = new THREE.BufferGeometry;
        montantProfondeur = new THREE.CylinderGeometry()
        montantProfondeur = roundEdgedBox(this.epaisseurMontants,
        this.epaisseurMontants,
        this.profondeur - 0.01 - 2 * this.epaisseurMontants, 0.5, 1, 1, 1, 1); */
      let montantProfondeur = this.getMontant(this.epaisseurMontants,this.profondeur-2*this.epaisseurMontants);
      montantProfondeur.rotateX(Math.PI/2);
      montantProfondeur.translate(-this.largeur / 2 + this.epaisseurMontants / 2, this.hauteur / 2 - this.epaisseurMontants / 2, 0);

 /*      let montantLargeur = new THREE.BufferGeometry;
      montantLargeur = roundEdgedBox(
        this.largeur - 2 * this.epaisseurMontants,
        this.epaisseurMontants,
        this.epaisseurMontants - 0.01, 0.5, 1, 1, 1, 1); */
      let montantLargeur = this.getMontant(this.epaisseurMontants,this.largeur - 2 * this.epaisseurMontants);
      montantLargeur.rotateZ(Math.PI/2);
      montantLargeur.translate(0, -this.hauteur / 2 + this.epaisseurMontants / 2 + this.elevation, this.profondeur / 2 - this.epaisseurMontants / 2);

/*       let montantHauteur = new THREE.BufferGeometry;
      montantHauteur = roundEdgedBox(
        this.epaisseurMontants,
        this.hauteur, // - 0.05,
        this.epaisseurMontants, 0.5, 1, 1, 1, 1); */
      let montantHauteur = this.getMontant(this.epaisseurMontants,this.hauteur,true);
      //montantHauteur.rotateY(-Math.PI/2);
      montantHauteur.translate(-this.largeur / 2 + this.epaisseurMontants / 2, 0, this.profondeur / 2 - this.epaisseurMontants / 2);
      geometries = [];
      geometries.push(montantProfondeur, montantLargeur, montantHauteur);

      geoA = BufferGeometryUtils.mergeGeometries(geometries);

      montantProfondeur.translate(0, -this.hauteur + this.elevation + this.epaisseurMontants, 0);
      montantLargeur.translate(0, +this.hauteur - this.epaisseurMontants - this.elevation, 0);
      montantHauteur.translate(0, 0, -this.profondeur + this.epaisseurMontants);
      geometries = [];
      geometries.push(geoA, montantProfondeur, montantLargeur, montantHauteur);
      geo2 = BufferGeometryUtils.mergeGeometries(geometries);
      geo3 = geo2.clone();
      geo3.rotateY(Math.PI);
      geometries = [];
      geometries.push(geo2, geo3)
      geoA = BufferGeometryUtils.mergeGeometries(geometries);

      let montantsExterieurs = new THREE.Mesh(geoA, materialCadre);
      cadres.add(montantsExterieurs);
    }

    //montants intermediaires
    if (this.hasMontantsIntermediaires && this.nbBlocs>1) {
    let montantIntermediaireVertical = [];
    geometries = [];
    let somme = 0;
    for (var i=1;i<this.nbBlocs;i++) {
      somme+=this.blocs[i-1].taille;
      /* montantIntermediaireVertical[i] =  new THREE.BufferGeometry;
      montantIntermediaireVertical[i] = roundEdgedBox(
        this.epaisseurMontants,
        this.hauteur-this.elevation,
        this.epaisseurMontants, 0.5, 1, 1, 1, 1); */
        montantIntermediaireVertical[i] = this.getMontant(this.epaisseurMontants,this.hauteur-this.elevation,true);
      montantIntermediaireVertical[i].translate(-this.largeur / 2 + somme, this.elevation/2, this.profondeur/2-this.epaisseurMontants/2);
      geometries.push(montantIntermediaireVertical[i]);
    }
    geo2 = BufferGeometryUtils.mergeGeometries(geometries);
    geo3=geo2.clone();
    geo3.translate(0,0,-this.profondeur+this.epaisseurMontants);
    geometries=[];
    geometries.push(geo2,geo3);
    geoA = BufferGeometryUtils.mergeGeometries(geometries);

    let montantIntermediaireProfondeur = [];
    geometries = [];
    somme = 0;
    for (var i=1;i<this.nbBlocs;i++) {
      somme+=this.blocs[i-1].taille;

/*        montantIntermediaireProfondeur[i] =  new THREE.BufferGeometry;
      montantIntermediaireProfondeur[i] = roundEdgedBox(
        this.epaisseurMontants,
        this.epaisseurMontants,
        this.profondeur,
        0.5, 1, 1, 1, 1); */
      
      montantIntermediaireProfondeur[i]=this.getMontant(this.epaisseurMontants,this.profondeur,true);
      montantIntermediaireProfondeur[i].rotateX(Math.PI/2);
      montantIntermediaireProfondeur[i].translate(-this.largeur / 2 + somme, this.hauteur/2-this.epaisseurMontants/2, 0);
      geometries.push(montantIntermediaireProfondeur[i]);
    }
    geo2 = BufferGeometryUtils.mergeGeometries(geometries);
    geo3=geo2.clone();
    geo3.translate(0,-this.hauteur+this.elevation+this.epaisseurMontants,0);
    geometries=[];
    geometries.push(geoA,geo2,geo3);
    geoA = BufferGeometryUtils.mergeGeometries(geometries);

    let montantsIntermediaires = new THREE.Mesh(geoA, materialCadre);
    cadres.add(montantsIntermediaires);
  }
  
    //let montants = new THREE.Mesh(geoA, materialCadre);

     //shadows
     cadres.traverse(function (child) {
      child.receiveShadow = true;
      child.castShadow = true;
    })
    return cadres;
  }

  getCadreSimple() {
    //let offsetMontantsRonds=this.hasRoundedMontants*this.epaisseurMontants*this.hasMontants;
    let offsetMontantsRonds=this.epaisseurMontants*this.hasMontants;
    let offsetCote = this.elevation*this.hasCotesEleves*this.hasMontants;
    let OffsetRetraitCotes = retraitCotes*this.hasMontants*this.meuble.hasCotesEleves;

    geometry = new THREE.BoxGeometry(
      this.largeur + 0.01 - offsetMontantsRonds,
      this.epaisseurCadre,
      this.profondeur +  0.01 - offsetMontantsRonds);

    let cadreSimpleHaut;
    
    if (this.hasEvier && this.hasPlancheHaut) {
      const brush1 = new Brush( geometry );
      brush1.updateMatrixWorld();
      
      let geo = evierBrush.geometry.clone();
      geo.translate(this.xEvier,0,this.zEvier);
      
      const brush2 = new Brush( geo );
      brush2.updateMatrixWorld();
      
      const evaluator = new Evaluator();
      const result = evaluator.evaluate( brush1, brush2, SUBTRACTION );

      cadreSimpleHaut = result;
      cadreSimpleHaut.material=materialCadre;
    }

    else cadreSimpleHaut = new THREE.Mesh(geometry, materialCadreCote, materialCadreCote, materialCadre, materialCadre, materialCadreAvant, materialCadreAvant);

    cadreSimpleHaut.position.set(0, this.hauteur / 2 - this.epaisseurCadre/2 - OffsetRetraitCotes * (this.hasRoundedMontants+1), 0);
    cadreSimpleHaut.name = "cadreSimpleHaut";

    geometry = new THREE.BoxGeometry(
      this.largeur - this.epaisseurCadre,
      this.epaisseurCadre,
      this.profondeur +  0.01 - offsetMontantsRonds);

    let cadreSimpleBas = new THREE.Mesh(geometry, materialCadreCote, materialCadreCote, materialCadre, materialCadre, materialCadreAvant, materialCadreAvant);
    cadreSimpleBas.position.set(0, -this.hauteur / 2 + this.epaisseurCadre/2 + this.elevation, 0);
    cadreSimpleBas.name = "cadreSimpleBas";

    geometry = new THREE.BoxGeometry(
      this.largeur - this.epaisseurCadre,
      this.hauteur-offsetCote, // - 0.05,
      this.epaisseurCadre);

    let cadreSimpleFond = new THREE.Mesh(geometry, materialCadreCote, materialCadreCote, materialCadre, materialCadre, materialCadreAvant, materialCadreAvant);
    cadreSimpleFond.position.set(0, offsetCote/2, -this.profondeur/2+this.epaisseurCadre/2+OffsetRetraitCotes);
    cadreSimpleFond.name = "cadreSimpleFond";

    geometry = new THREE.BoxGeometry(
      this.epaisseurCadre,
      this.hauteur - offsetCote - offsetMontantsRonds * this.hasRoundedMontants, // - 0.05,
      this.profondeur - offsetMontantsRonds-0.01);

    let cadreSimpleGauche = new THREE.Mesh(geometry, materialCadreCote, materialCadreCote, materialCadre, materialCadre, materialCadreAvant, materialCadreAvant);
    cadreSimpleGauche.position.set(-this.largeur / 2+this.epaisseurCadre/2+OffsetRetraitCotes, offsetCote/2, 0);
    cadreSimpleGauche.name = "cadreSimpleGauche";

    let cadreSimpleDroit = new THREE.Mesh(geometry, materialCadreCote, materialCadreCote, materialCadre, materialCadre, materialCadreAvant, materialCadreAvant);
    cadreSimpleDroit.position.set(this.largeur / 2-this.epaisseurCadre/2-OffsetRetraitCotes, offsetCote/2, 0);
    cadreSimpleDroit.name = "cadreSimpleDroit";

    geometry = new THREE.BoxGeometry(
      this.epaisseurCadre,
      this.hauteur-this.elevation - offsetMontantsRonds, // - 0.05,
      this.profondeur - offsetMontantsRonds);

    let cadres = new THREE.Group();
    if (this.hasPlanchesIntermediaires) {
      let cadreIntermediaire = [];
      let somme = 0;
      for (var i = 1; i < this.nbBlocs; i++) {
        somme += this.blocs[i - 1].taille;
        cadreIntermediaire[i] = new THREE.Mesh(geometry, materialCadreCote, materialCadreCote, materialCadre, materialCadre, materialCadreAvant, materialCadreAvant);
        cadreIntermediaire[i].position.set(-this.largeur / 2 + somme, this.elevation / 2, 0);
        cadres.add(cadreIntermediaire[i]);
      }
    }

    //cadres.add(cadreSimpleHaut, cadreSimpleBas, cadreSimpleDroit, cadreSimpleGauche);
    //cadres.add(cadreSimpleHaut, cadreSimpleDroit, cadreSimpleGauche);
    if (this.hasPlancheBas) cadres.add(cadreSimpleBas);
    if (this.hasPlancheHaut) cadres.add(cadreSimpleHaut);
    if (this.hasPlancheGauche) cadres.add(cadreSimpleGauche);
    if (this.hasPlancheDroite) cadres.add(cadreSimpleDroit);
    if (this.hasPlancheFond) cadres.add(cadreSimpleFond);

     //shadows
     cadres.traverse(function (child) {
      child.receiveShadow = true;
      child.castShadow = true;
    })
    return cadres;
  }
  
  updateGeometry() {
    let geometries = this.root.getObjectByName("geometries");
    geometries.children = [];
    geometry.dispose();
    material.dispose();
    scene.remove(geometries);

    renderer.renderLists.dispose();
    //evier
    if (this.hasEvier) { geometries.add(this.getEvier()); }
    //plateau
    if (this.hasPlateau) { geometries.add(this.getPlateau()); }
    //socle
    if (this.hasSocle) { geometries.add(this.getSocle()); }
    //pieds
    if (this.hasPied) { geometries.add(this.getPieds()); }
    //cadre meuble
    if (this.hasCadre) { geometries.add(this.getCadre()); }
    //cadre blocs
    if (this.isSimple) { geometries.add(this.getCadreSimple()); }
    //montants
    if (this.hasMontants) { geometries.add(this.getMontants()); }
    // blocs
    var blocs = new THREE.Object3D();
    blocs.name = "blocs";
    geometries.add(blocs);
    for (var i = 0; i < this.nbBlocs; i++) {
      let blocRoot = this.blocs[i].initializeBloc();
      blocs.add(blocRoot);
      this.blocs[i].disposeGeometry();
    //positionnement bloc dans meuble
    if (this.disposition=="horizontal") {
        var blocPosition = -this.largeur / 2.0;
    }
    else {var blocPosition = -this.hauteur / 2 ;}
      if (i > 0) {
        for (var j = 0; j < i; j++) {
          blocPosition += this.blocs[j].taille;
        }
      }
      blocPosition += this.blocs[i].taille / 2.0;
      if (this.disposition=="horizontal") { 
        blocRoot.position.set(blocPosition, this.elevation/2, 0)
      } 
      else {
        blocRoot.position.set(0, blocPosition, 0);
      }
    }
  }

  getBoiteSelection() {
    let delta=0;
    if (this.numero!=undefined) delta = 0.1 * this.numero;
    let x=this.largeur + delta + epsilon;
    let y=this.hauteur + delta + epsilon;
    let z=this.profondeur + delta + epsilon;
    geometry = roundEdgedBox(x, y, z, 3, 2, 2, 2, 2)
    let boite = new THREE.Mesh(geometry, materialSelectionMeuble);
    boite.name = "boiteSelection" + this.numero;
    boite.shortName = "boiteSelection";
    boite.category = "boiteSelection";
    boite.meuble = this;
    boite.visible = false;

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

    boite.add(coneHautMain,coneBasMain,coneGaucheMain,coneDroitMain);
    return boite;
  }

  getHandlesMeuble () {
    let scale=0.8;

    if (this.isSousMeuble) return;
    let handleMeubleRoot=new THREE.Object3D();
    handleMeubleRoot.name="handleMeubleRoot";
    geometry = new THREE.BoxGeometry(
      this.largeur + 0.05,
        this.epaisseurCadre,
        this.profondeur + 0.05);
    let handleMeubleHaut = new THREE.Mesh(geometry, materialSelectionMeuble);
    handleMeubleHaut.position.set(0, this.hauteur / 2-this.epaisseurCadre/2, 0);
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
    coneHaut.scale.set(scale,scale,scale);
    coneBas.scale.set(scale,scale,scale);
    handleMeubleRoot.add(handleMeubleHaut);


    let handleMeubleBas = new THREE.Mesh(geometry, materialHelper);
    handleMeubleBas.position.set(0, -this.hauteur / 2+this.epaisseurCadre/2+this.elevation, 0);
    handleMeubleBas.visible=false;
    handleMeubleBas.name = "handleMeubleBas";
    handleMeubleBas.shortName = "handleMeuble";
    handleMeubleBas.meuble = this;
    let coneHautBas=new THREE.Mesh(geometryConeHelper, materialSelectionMeuble);
    let coneBasBas=new THREE.Mesh(geometryConeHelper, materialSelectionMeuble);
    coneHautBas.shortName="cone";
    coneBasBas.shortName="cone";
    handleMeubleBas.add(coneHautBas,coneBasBas);
    coneHautBas.position.set(0,3*epaisseurHandleBlocs,0);
    coneBasBas.position.set(0,-3*epaisseurHandleBlocs,0);
    coneBasBas.rotateX(Math.PI);
    coneHautBas.scale.set(scale*0.8,scale*0.8,scale*0.8);
    coneBasBas.scale.set(scale*0.8,scale*0.8,scale*0.8);
    handleMeubleRoot.add(handleMeubleBas);



    geometry = new THREE.BoxGeometry(
      this.epaisseurCadre,
      this.hauteur,
      this.profondeur);

    let handleMeubleGauche = new THREE.Mesh(geometry, materialSelectionMeuble);
    handleMeubleGauche.position.set(-this.largeur / 2+this.epaisseurCadre/2, 0, 0);
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
    coneGaucheGauche.scale.set(scale,scale,scale);
    coneDroitGauche.scale.set(scale,scale,scale);

    let handleMeubleDroit = new THREE.Mesh(geometry, materialSelectionMeuble);
    handleMeubleDroit.position.set(this.largeur / 2-this.epaisseurCadre/2, 0, 0);
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
    coneGaucheDroit.scale.set(scale,scale,scale);
    coneDroitDroit.scale.set(scale,scale,scale);

    return handleMeubleRoot;
  }

  update() {
    this.updateGeometry();
    let handlesMeuble = this.root.getObjectByName("handlesMeuble");
    handlesMeuble.children=[];
    geometry.dispose();
    material.dispose();
    if (!isPreviewOn) {
      //boite de sélection
      let boiteSelection = this.getBoiteSelection();
      handlesMeuble.add(boiteSelection);
      this.selectionBox = boiteSelection;
      boiteSelection.meuble=this;
      selectableHandleMeuble = [];
      handlesMeuble.add(this.getHandlesMeuble());
      updateAllSelectable();
    }
      this.placeMeuble();
  }

  destroyBloc(numBloc) {
    this.root.getObjectByName("blocs").remove(this.blocRoot[numBloc]);
    geometry.dispose();
    material.dispose();
    this.blocRoot[numBloc] = undefined;
    scene.remove(this.blocRoot[numBloc]);
    geometry.dispose();
    material.dispose();
  }

  //recompute blocs size from meuble width - blocs sizes adjusted proportionally
  computeBlocsSize() {
    if (this.disposition == "horizontal") {
      var largeurSommeBlocs = 0;
      for (var i=0; i<this.nbBlocs; i++) {
        largeurSommeBlocs += this.blocs[i].taille;
      }
      var ratio = this.largeur/largeurSommeBlocs;
      for (var i=0; i<this.nbBlocs; i++) {
        this.blocs[i].taille *= ratio;
      } 
    }
    if (this.disposition == "vertical") {
      var hauteurSommeBlocs = 0;
      for (var i=0; i<this.nbBlocs; i++) {
        hauteurSommeBlocs += this.blocs[i].taille;
      }
      var ratio = this.hauteur/hauteurSommeBlocs;
      for (var i=0; i<this.nbBlocs; i++) {
        this.blocs[i].taille *= ratio;
      } 
    }
  }
  
  addNewBlocAndAdjust() {
    let spaceArray=this.getMaxAllowedSpaceOnSides();
    let freeSpace=Math.min(spaceArray[0],spaceArray[1]);
    let tailleBloc=this.addNewBloc();
    if (freeSpace<tailleBloc/2) changeBlocsQuantity(this.nbBlocs+1)
    else {
      this.nbBlocs+=1;
      this.updateTaille();
      this.update();
    }
    clearSelectionList();
    indiceCurrentBloc=-1;
    refreshInterfaceMeuble();
    refreshInterfaceBlocs();
  }

  //adds new bloc and return size of new bloc
  addNewBloc() {
    if (!this.blocs[this.blocs.length]) {
      this.blocs[this.blocs.length] = new Bloc(this,this.blocs.length);
    }
    return this.blocs[this.blocs.length-1].taille;
  }

  diviserBloc (num) {
    console.log(num);
    let taille=this.blocs[num].taille;
    let newBloc=this.blocs[num].duplicate(this,num);
    newBloc.taille=taille/2;
    this.blocs[num].taille=taille/2;
    this.blocs.splice(num+1,0,newBloc);
    this.nbBlocs+=1;
    this.recomputeBlocsId();
    /* this.blocs[num].recomputeElementsId();
    this.blocs[num+1].recomputeElementsId(); */
  }

  //sets blocs number and keeps meuble width constant - blocs sizes adjusted proportionally
  setBlocsQuantity (num) {
    var tailleEnlevee=0;
    if (num<this.nbBlocs) {
      for (var i=num;i<this.nbBlocs;i++) {
        tailleEnlevee+=this.blocs[i].taille;
      }
    }

    for (var i=0; i<num; i++) {
      if (!this.blocs[i]) {
        this.blocs[i] = new Bloc(this,i);
        }
    }

    if (indiceCurrentBloc>(this.nbBlocs-1)) {indiceCurrentBloc=this.nbBlocs-1;}

    var ratio = this.nbBlocs / num;
    var newTaille = 0;
    var difference = num - this.nbBlocs;

    if (num>this.nbBlocs) {
      for (var i=0;i<this.nbBlocs;i++) {
        this.blocs[i].taille*=ratio;
        newTaille+=this.blocs[i].taille;
      }
      var tailleNewBlocs=this.meuble.largeur-newTaille/difference;
      for (var i=this.nbBlocs;i<num;i++) {
        this.blocs[i].taille=tailleNewBlocs;
      }
    }

    if (num<this.nbBlocs) {
      ratio=this.meuble.largeur/(this.meuble.largeur-tailleEnlevee);
      for (var i=0;i<num;i++) {
        this.blocs[i].taille*=ratio;
      }
    }

    this.nbBlocs=num;
  }

  deleteBloc (blocToDelete) {
    console.log("delete bloc",blocToDelete.numero);
    if (blocToDelete=undefined || this.nbBlocs==1) return;
    //console.log(this.bloc);
    let num=blocToDelete.numero;
    this.blocs.splice(num, 1);
    //console.log(this.bloc);
    this.nbBlocs -= 1;
    this.recomputeBlocsId();
    this.computeBlocsSize();
  }

  recomputeBlocsId() {
    for (var i=0; i<this.blocs.length; i++)
    {
      this.blocs[i].numero=i;
    }
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
    let indice=" "+(this.numero+1);
    this.name=this.baseName+indice;
  }

  setEtageresNumber(num) {
    for (var i=0;i<this.nbBlocs;i++) {
      this.blocs[i].nbEtageres=num;
    }
  }

  tourner() {
    if (this.surSol) {
      this.orientation+=1;
      if (this.orientation==4) this.orientation=0;
      this.placeMeuble();
      this.recaleDansPiece();
      if (!this.recale()) this.automaticPlacement();
      this.placeMeuble();
    }
  }

 /*  duplicate() {
    var listKeysMeuble = ["hauteur", "largeur", "profondeur", "nbBlocs", "x", "y", "z", "disposition", "epaisseur", "epaisseurCadre", "hasPlateau", "hasCadre", "hasSocle", "hasPied", "IsSuspendu", "offsetPoignees", "isSousMeuble", "type", "isRentrant", "isSimple", "onMurFond", "onMurGauche", "onMurDroit", "surSol", "orientation", "_style", "isSelected", "nbEtageres", "ouverturePorte", "nombrePortes", "etageresVerticales"];


  } */


  duplicate() {
    var newMeuble = new Meuble(meubles.length);
    var oldMeuble = this;
  
    var listKeysMeuble = ["hauteur", "largeur", "profondeur", "elevation", "nbBlocs", "x", "y", "z", "disposition", "epaisseur", "epaisseurCadre", "hasPlateau", "hasCadre", "hasSocle", "hasPied", "IsSuspendu", "offsetPoignees", "isSousMeuble", "type", "isRentrant", "isSimple", "onMurFond", "onMurGauche", "onMurDroit", "surSol", "orientation", "_style", "_arrondi", "isSelected", "nbEtageres", "ouverturePorte", "nombrePortes", "etageresVerticales",
      "hasPlancheBas","hasPlancheHaut","hasPlancheGauche","hasPlancheDroite","hasPlancheFond","hasPlanchesIntermediaires","hasCotesEleves","hasMontants","epaisseurMontants","hasMontantsExterieurs","hasMontantsIntermediaires","hasMontantsInterieurs","largeurMontants","hasEtagereUnique","hasEtagereZero","hasEtagereFinale"];
    var listKeysSousMeuble = ["numero", "unherited", "_x", "_y", "_yTiroir", "_type", "_style", "isSelected", "selectionBox", "_isRentrant", "ouverturePorteLocal", "nombrePortesLocal"];
    
    newMeuble.setBlocsQuantity(oldMeuble.nbBlocs);
  
    for (var i = 0; i < oldMeuble.nbBlocs; i++) {
      newMeuble.blocs[i] = oldMeuble.blocs[i].duplicate(newMeuble,i);
    }
  
    listKeysMeuble.forEach(key => {
      if (newMeuble[key]!=undefined) newMeuble[key] = oldMeuble[key];
    });

/*     listKeysSousMeuble.forEach(key => {
      if (newMeuble[key]!=undefined) newMeuble[key] = oldMeuble[key];
    }); */
    console.log("duplicate meuble");
    newMeuble.meuble=newMeuble;
    //if (!newMeuble.isSousMeuble) 
    newMeuble.initialMeuble=newMeuble;
    //else newMeuble.initialMeuble=this.initialMeuble;
    
    //newMeuble.numero = meubles.length;
    newMeuble.rename();
    return newMeuble;
  }

  resetAllEtageres() {
    for (var i=0;i<this.nbBlocs;i++) {
      for (var j=0;j<this.blocs[i].elements.length;j++)
        this.blocs[i].elements[j].reset();
    }
  }

}

class SousMeuble extends Meuble {
  constructor (initialMeuble,initialBloc,parentElement,num) {
    super(num);
    this.numero = num;
    this.baseName="sousMeuble";
    this.rename();
    //this.name=this.baseName+num;
    //this.shortName=this.baseName;
    //this.hauteur = 50;
    //this.largeur = 140;
    //this.profondeur = 50;
    this.elevation=0;
    this.nbBlocs = 3;
    this.x = 0;
    this.y = 0;
    this.blocs = new Array;
    this.disposition = "horizontal";
    this.epaisseur=epaisseur;
    this.epaisseurCadre=epaisseurCadre;
    for (var i=0; i<this.nbBlocs; i++) {this.blocs[i] = new Bloc(this,i)}
    this.updateTaille();
    this.offsetPoignees=0;
    this.isSousMeuble=true;
    this.meubleRoot=undefined;
    this.createGeometryRoot();
    //this.bloc = bloc;
    //this.meuble=this.bloc.meuble; /////!!!!!!!!!!!
    this.meuble=this;
    this.initialMeuble=initialMeuble;
    this.initialBloc=initialBloc;
    this.parentElement=parentElement;

    this.type="etageres";

    this.isRentrant = true;
    this.isSimple = true;

    //commun aux autres classes
    this._style = undefined;
    this.isSelected = false;
    this.selectionBox = undefined;
    this.nbEtageres=1;
    
    //commun à la classe bloc
    this.ouverturePorte = "gauche";
    this.nombrePortes = "1";
    this.etageresVerticales = false;
    this.linkBlocsToInitialBloc();
  }

  linkBlocsToInitialBloc() {
    for (var i=0;i<this.nbBlocs;i++)
    {
      this.blocs[i].initialBloc=this.initialBloc;
      this.blocs[i].initialMeuble=this.initialMeuble;
      for (var j=0; j<this.blocs[i].elements.length; j++) {
        this.blocs[i].elements[j].initialBloc=this.initialBloc;
        this.blocs[i].elements[j].initialMeuble=this.initialMeuble;
      }
    }
  }

  placeMeuble() {
      this.root.position.set(this.element.xTiroir, this.element.yTiroir, -this.epaisseur);
    }


   update() {
    this.hasMontants=this.initialMeuble.hasMontants;
    this.hasMontantsExterieurs=this.initialMeuble.hasMontantsExterieurs;
    this.hasMontantsIntermediaires=this.initialMeuble.hasMontantsIntermediaires;
    this.hasMontantsInterieurs=this.initialMeuble.hasMontantsInterieurs;
    this.epaisseurMontants=this.initialMeuble.epaisseurMontants;


    this.updateGeometry();
    let handlesMeuble = this.root.getObjectByName("handlesMeuble");
    handlesMeuble.children=[];
    geometry.dispose();
    material.dispose();
    if (!isPreviewOn) {
      //boite de sélection
      let boiteSelection = this.getBoiteSelection();
      handlesMeuble.add(boiteSelection);
      this.selectionBox = boiteSelection;
      boiteSelection.meuble=this;
    }
    this.linkBlocsToInitialBloc();
  } 

  updateGeometry() {
    let geometries = this.root.getObjectByName("geometries");
    geometries.children = [];
    geometry.dispose();
    material.dispose();
    scene.remove(geometries);

    renderer.renderLists.dispose();

    //cadre blocs
    if (this.isSimple) { geometries.add(this.getCadreSimple()); }
    // blocs
    var blocs = new THREE.Object3D();
    blocs.name = "blocs";
    geometries.add(blocs);
    for (var i = 0; i < this.nbBlocs; i++) {
      let blocRoot = this.blocs[i].initializeBloc();
      blocs.add(blocRoot);
      this.blocs[i].disposeGeometry();
    //positionnement bloc dans meuble
    if (this.disposition=="horizontal") {
        var blocPosition = -this.largeur / 2.0;
    }
    else {var blocPosition = -this.hauteur / 2 ;}
      if (i > 0) {
        for (var j = 0; j < i; j++) {
          blocPosition += this.blocs[j].taille;
        }
      }
      blocPosition += this.blocs[i].taille / 2.0;
      if (this.disposition=="horizontal") { 
        blocRoot.position.set(blocPosition, 0, 0)
      } 
      else {
        blocRoot.position.set(0, blocPosition, 0);
      }
    }
  }

  getCadreSimple() {
    geometry = new THREE.BoxGeometry(
      this.largeur + 0.01,
      this.epaisseurCadre,
      this.profondeur +  0.01);

    geometry = new THREE.BoxGeometry(
      this.epaisseurCadre,
      this.hauteur - 0.05,
      this.profondeur);

    let cadres = new THREE.Group();
    let cadreIntermediaire = [];
    let somme = 0;
    for (var i=1;i<this.nbBlocs;i++) {
      somme+=this.blocs[i-1].taille;
      cadreIntermediaire[i] = new THREE.Mesh(geometry, materialCadreCote, materialCadreCote, materialCadre, materialCadre, materialCadreAvant, materialCadreAvant);
      cadreIntermediaire[i].position.set(-this.largeur / 2 + somme, 0, 0);
      cadres.add(cadreIntermediaire[i]);
    }
    
     //shadows
     cadres.traverse(function (child) {
      child.receiveShadow = true;
      child.castShadow = true;
    })
    return cadres;
  }

  getBoiteSelection() {
    let delta = 0.1 * this.numero;
    let x=this.largeur + epsilon +1; //+ delta
    let y=this.hauteur + epsilon +1; //+ delta
    let z=this.profondeur + epsilon; //+ delta
    geometry = roundEdgedBox(x, y, z, 3, 2, 2, 2, 2)
    let boite = new THREE.Mesh(geometry, materialSelectionSousMeuble);
    boite.name = "boiteSelectionSousMeuble" + this.numero;
    boite.shortName = "boiteSelectionSousMeuble";
    boite.category = "boiteSelectionSousMeuble";
    boite.sousMeuble = this;
    boite.visible = false;

    return boite;
  }

  duplicate(initialMeuble,initialBloc,parentElement) {
    var newSousMeuble = new SousMeuble(initialMeuble,initialBloc,parentElement,meubles.length);
    var oldSousMeuble = this;
  
    var listKeysMeuble = ["hauteur", "largeur", "profondeur", "elevation", "nbBlocs", "x", "y", "z", "disposition", "epaisseur", "epaisseurCadre", "hasPlateau", "hasCadre", "hasSocle", "hasPied", "IsSuspendu", "offsetPoignees", "isSousMeuble", "type", "isRentrant", "isSimple", "onMurFond", "onMurGauche", "onMurDroit", "surSol", "orientation", "_style", "isSelected", "nbEtageres", "ouverturePorte", "nombrePortes", "etageresVerticales",
      "hasPlancheBas","hasPlancheHaut","hasPlancheGauche","hasPlancheDroite","hasPlanchesIntermediaires","hasMontants","epaisseurMontants","hasMontantsExterieurs","hasMontantsIntermediaires","hasMontantsInterieurs","largeurMontants","hasEtagereUnique","hasEtagereZero","hasEtagereFinale"];
    var listKeysSousMeuble = ["numero", "unherited", "_x", "_y", "_yTiroir", "_type", "_style", "isSelected", "selectionBox", "_isRentrant", "ouverturePorteLocal", "nombrePortesLocal"];
    
    newSousMeuble.setBlocsQuantity(oldSousMeuble.nbBlocs);
  
    for (var i = 0; i < oldSousMeuble.nbBlocs; i++) {
      newSousMeuble.blocs[i] = oldSousMeuble.blocs[i].duplicate(newSousMeuble,i);
    }
  
    listKeysMeuble.forEach(key => {
      if (newSousMeuble[key]!=undefined) newSousMeuble[key] = oldSousMeuble[key];
    });

     listKeysSousMeuble.forEach(key => {
      if (newSousMeuble[key]!=undefined) newSousMeuble[key] = oldSousMeuble[key];
    });

    console.log("duplicate sous Meuble");
    newSousMeuble.meuble=newSousMeuble;
    /* if (!newSousMeuble.isSousMeuble) newSousMeuble.initialMeuble=newSousMeuble;
    else newSousMeuble.initialMeuble=this.initialMeuble; */
    //newSousMeuble.numero = meubles.length;
    newSousMeuble.rename();
    return newSousMeuble;
  }
}

class 
ObjetStatique extends Meuble {
  constructor (numero, baseName,largeur,hauteur,profondeur) {
    super(numero);

    this.baseName=baseName;
    this.rename();
    this.hauteur = hauteur;
    this.largeur = largeur;
    this.profondeur = profondeur;

    this.elevation = 0;

    this.hasPlancheBas = true;
    this.hasPlancheHaut = true;
    this.hasPlancheGauche = true;
    this.hasPlancheDroite = true;
    this.hasPlancheFond = true;
    this.hasPlanchesIntermediaires = true;
    this.hasCotesEleves = true;
    this.hasMontants = false;
    this.epaisseurMontants = 3;
    this.hasMontantsExterieurs = true;
    this.hasMontantsIntermediaires = true;
    this.hasMontantsInterieurs = true;
    this.largeurMontants=2.5;
    this.hasEtagereUnique=false;
    this.hasEtagereZero=false;
    this.hasEtagereFinale=false;
    this.hasRoundedMontants=true;   ////to add to list

    this.nbBlocs = 1;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.blocs = new Array;
    this.disposition = "horizontal";
    //valeurs possibles "horizontal" ou "vertical"
    this.epaisseur=epaisseur;
    this.epaisseurCadre=epaisseurCadre;
    for (var i=0; i<this.nbBlocs; i++) {this.blocs[i] = new Bloc(this.initialMeuble,i)}
    //this.blocs[1].type="four";
    this.calculTailleBlocs();
    //setTailleOnBloc(this.blocs[2],60.1);
    this.hasPlateau=false;
    this.hasCadre=false;
    this.hasSocle=false;
    this.hasPied=false;

    this.hasEvier=false;     ////to add to list
    this.xEvier=0;          ////
    this.yEvier=0;          ////
    this.zEvier=0;          ////
    this.evier=undefined;

    this.IsSuspendu=false;
    //this.offsetPoignees=0;
    this.isSousMeuble=false;
    this.meubleRoot=undefined;
    this.createGeometryRoot();

    this.type="objetStatique";
    //valeurs possibles : "etageres", "tiroirs", "portes", "panneau", "sousMeuble"

    this.isRentrant = false;
    this.isSimple = true;

    this.onMurFond = false;
    this.onMurGauche = false;
    this.onMurDroit = false;
    this.surSol = true;

    this.orientation = 0;
    //valeurs possibles : 0, 1 (rotation PI/2), 2 (rotation PI), 3 (rotation -PI/2)

    //commun aux autres classes
    this._style = undefined;
    this._arrondi=undefined;
    this.isSelected = false;
    this.selectionBox = undefined;
    this.nbEtageres=0;
    
    //commun à la classe bloc
    this.ouverturePorte = "gauche";
    this.nombrePortes = "1";
    this.etageresVerticales = false;

    this.objet3D=new THREE.Object3D();
  }

  initialize(filename) {
/*     let name="/src/"+filename;
    const loader = new GLTFLoader();
    loader.load(name, function (gltf) {
      let objetRoot = gltf.scene.getObjectByName('objet');
      for (var i = objetRoot.children.length; i > 0; i--) {
        this.objet3D.add(objetRoot.children[i - 1]);
      }
      this.objetRoot.scale.set(100, 100, 100);
      scene.add(this.objet3D);
    }); */

    let objectGeometries = new THREE.Group();

    let name="/src/"+filename;
    const loader = new GLTFLoader();
    loader.load(name, function (gltf) {
      let objetRoot = gltf.scene.getObjectByName('objet');
      for (var i = objetRoot.children.length; i > 0; i--) {
        objectGeometries.add(objetRoot.children[i - 1]);
      }
      objectGeometries.scale.set(100, 100, 100);
    });
      scene.add(objectGeometries);

      this.createGeometryRoot();

      let geometries = this.root.getObjectByName("geometries");
      objectGeometries.position.set(0,-this.hauteur/2,this.profondeur/2-epsilon/2);
      geometries.add(objectGeometries);

      //this.updateGeometry();
      let handlesMeuble = this.root.getObjectByName("handlesMeuble");
      handlesMeuble.children=[];
      geometry.dispose();
      material.dispose();
      //if (!isPreviewOn) {
        //boite de sélection
        let boiteSelection = this.getBoiteSelection();
        handlesMeuble.add(boiteSelection);
        this.selectionBox = boiteSelection;
        boiteSelection.meuble=this;
        //selectableHandleMeuble = [];
        //handlesMeuble.add(this.getHandlesMeuble());
      //updateAllSelectable();
      //}
        this.placeMeuble();
    }

    rename() {
      this.name=this.baseName;
    }

  update() {







    this.placeMeuble();
  }
}

function remap(inMin, inMax, outMin, outMax, value) {
  return (value - inMin) / (inMax - inMin) * (outMax - outMin) + outMin;
};

//fonctions meuble

function recomputeMeublesId() {
  for (var i=0; i<meubles.length; i++)
  {
    meubles[i].numero=i;
    updateAllSelectable();
  }
}

function deleteMeuble(meuble) {
  if (!selectedMeuble) {
    console.log("WARNING : pas de meuble actif !");
    return false;
  }
  let rootMeuble=meuble.root;
  scene.remove(rootMeuble);
  meubles.splice(meuble.numero,1);
  geometry.dispose();
  material.dispose();
  selectedObjects=[];
  indiceCurrentBloc=-1;
  indiceCurrentMeuble=-1;
  recomputeMeublesId();
  renameAllMeubles();
  updateScene();
  updateAllSelectable();
  return true;
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
  }
}

function createNewMeuble() {
  indiceCurrentMeuble=meubles.length;
  meubles[indiceCurrentMeuble] = new Meuble(indiceCurrentMeuble);
  selectedMeuble=meubles[indiceCurrentMeuble];
  selectedMeuble.automaticPlacement();
  selectedMeuble.update();
  select(meubles[indiceCurrentMeuble],false);
  if (indiceCurrentMeuble>0) flashMeuble(meubles[indiceCurrentMeuble]);
}

function duplicatePropertiesValues(fromObj, toObj) {
  Object.keys(fromObj, toObj).forEach(key => {
    if (typeof toObj[key] == "object") {
      duplicatePropertiesValues(fromObj[key], toObj[key]);
    }
    else { toObj[key] = fromObj[key] }
  });
}

//fonctions creations geometries

function getRoundedCylinder(x,y) {
  let cylindre = new THREE.CylinderGeometry(x/2,x/2,y-x/2,12,1,true);
  let demiSphereSup = new THREE.SphereGeometry(x/2,12,6,0,Math.PI*2,0,Math.PI/2);
  let demiSphereInf=demiSphereSup.clone();
  demiSphereInf.rotateX(Math.PI);
  demiSphereInf.translate(0,-y/2+x/4,0);
  demiSphereSup.translate(0,y/2-x/4,0);
  let geometries = [cylindre,demiSphereSup,demiSphereInf];
  return BufferGeometryUtils.mergeGeometries(geometries);
}

function getPlancheSuedoise(x, y, z, largeur, epaisseurS,arrondi) {
  let geo = new THREE.BufferGeometry;
  let pieceA = new THREE.BufferGeometry;
  pieceA = roundEdgedBox(largeur, y, epaisseurS, arrondi, 1, 1, 1, 1);
  let pieceB = pieceA.clone(true);
  pieceA.translate(largeur / 2 - x / 2, 0, epaisseurTiroirs/2);
  pieceB.translate(-largeur / 2 + x / 2, 0, epaisseurTiroirs/2);
  let pieceC = new THREE.BufferGeometry;
  let offset = -0.70;
  pieceC = roundEdgedBox(x - 2 * largeur - offset, largeur, epaisseurS, arrondi, 1, 1, 1, 1);
  let pieceD = pieceC.clone(true);
  pieceC.translate(0, -y / 2 + largeur/2, epaisseurTiroirs/2);
  pieceD.translate(0, y / 2 - largeur/2, epaisseurTiroirs/2);
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

function createPlanche (x,y,z,styleParam,arrondi) {
  let geo = new THREE.BufferGeometry;
  if (isPreviewOn || styleParam=="Basique") {
    geo = new THREE.BoxGeometry( x,y,z );
    return geo;
  }
  if (styleParam == "Arrondi") {geo = roundEdgedBox(x,y,z,arrondi,1,1,1,1)}
  if (styleParam == "Suédois 1") { 
    geo = getPlancheSuedoise (x,y,z,largeurSuedois,epaisseurSuedois,0.5);
  }
  if (styleParam=="Suédois 2") { 
    let geoTemp = getPlancheSuedoise (x,y,z,largeurSuedois,epaisseurSuedois,0.5);
    let pieceCentre = new THREE.BufferGeometry;
    pieceCentre = roundEdgedBox(x-4*largeurSuedois, y-4*largeurSuedois, epaisseurSuedois, 0.5, 1, 1, 1, 1);
    pieceCentre.translate(0,0,epaisseurTiroirs/2);
    let geometries=[];
    geometries.push(geoTemp,pieceCentre);
    geo = BufferGeometryUtils.mergeGeometries(geometries);
  }
  return geo;
}

//variables globales et constantes
var globalStyle="Arrondi";
//valeurs possibles : "Basique", "Arrondi", "Suédois 1", "Suédois 2"

var arrondi = 0.7;        // a rajouter en parametre
const retraitCotes = 0.5; // a rajouter en parametre

var selectionMode="meubles";
//valeurs possibles : "meubles", "blocs", "nbEtageres", 'sousMeubles", "elements", "ajusteMeubles", "ajusteBlocs"
var selectedMeuble;
var selectedSousMeuble;
var selectedObjects=[];

let frigo=undefined;

var isPreviewOn = false;

var indiceCurrentBloc = -1;
var indiceCurrentMeuble = 0;
var indiceCurrentSousMeubles = -1;

//const hasPlancheBas = false;
const hauteurBloc=0.9;
const epaisseurHandleBlocs = 6;
const epaisseur = 2; //epaisseur etageres
const epaisseurTiroirs = 1; // a rajouter en parametre
const epaisseurPlateau = 3;
const debordPlateau = 2;
const epaisseurCadre = 2;
const debordCadre = 0.5;
const retraitSocle = 2;
const hauteurSocle = 8;
const hauteurPied = 6;
const largeurPied= 4;
const tailleBlocDefaut = 40;
const epaisseurSuedois = 3;
const largeurSuedois = 4;
const maxBlocs = 9;
const maxEtageres = 20;
const epsilon = 5;
const taillePoignees = 1.5;
const focale=60;
const decalagePoignee=0.4;

const largeurPiece=400;
const profondeurPiece=600;
const hauteurPiece = 250;

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
var meubles=new Array;
var boiteSelectionBloc=[];        //pour selection des blocs dans la vue 3D
var selectableBloc=[];            //liste des boiteSelectionBlocs selectionnables par raycast
var selectableMeuble=[];
var selectableEtagere=[];
var selectableHandleBloc=[];
var selectableHandleMeuble=[];
var selectableElements=[];
var selectableSousMeubles=[];

var pressedKey=undefined;

var scene,camera,renderer;
var canvas,canvasSize,cameraTarget,boundingBoxCenter;
var boundingBoxHeight, boundingBoxWidth;
let controls;

function initializeCamera() {
  //new scene and camera
  scene = new THREE.Scene();
  canvas = document.getElementById("canvas");
  canvasSize = canvas.getBoundingClientRect();
  camera = new THREE.PerspectiveCamera(focale, canvasSize.width / window.innerHeight, 0.1, 1000);
  focaleV = getfocaleV(focale, canvasSize.width, window.innerHeight);
  cameraTarget = new THREE.Object3D();
  camera.position.z = 180; //overridden by orbit
  camera.position.y = 100;
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(canvasSize.width, window.innerHeight);
  canvas.appendChild(renderer.domElement);
  boundingBoxCenter = new THREE.Vector3();

  // camera controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.listenToKeyEvents(window); // optional
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 0.1;
  controls.maxDistance = 1000;
  controls.maxPolarAngle = Math.PI / 2;
}

function getfocaleV(focale,width,height) {
  if ((height/width)>1) return focale
  else return (2*(height/2)/((width/2)/Math.tan(0.0174533*(focale/2))));
}

function getfocaleH(focale,width,height) {
  return (2*(height/2)/((width/2)/Math.tan(0.0174533*(focale/2))));
}

//listener canvas

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

function add3DListener() {
  //listener espace 3D et keyboard
  canvas.addEventListener('mousemove', onPointerMove);
  //canvas.addEventListener('wheel', onMouseWheel);
  window.addEventListener('resize', onWindowResize);
  canvas.addEventListener('click', onCanvasClick);
  //canvas.addEventListener('dragstart', onCanvasDrag, false);
  canvas.addEventListener('contextmenu', onOpenContextMenu);
  //canvas.addEventListener('mouseleave', function leaving() {});

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
}

function onCanvasDrag () {
  if (raycastedBloc>-1) console.log("pointer=",pointer);
}

function onCanvasClick() {
  if (raycastedSousMeuble) {
    select(raycastedSousMeuble);
    selectedSousMeuble=raycastedSousMeuble;
    selectedMeuble=raycastedSousMeuble;
    console.log(raycastedSousMeuble);
    refreshInterfaceSousMeuble();
  }
}

function checkKey(e) {

    e = e || window.event;

    if (e.keyCode == '38') {
        // up arrow
    }
    else if (e.keyCode == '40') {
        // down arrow
    }
    else if (e.keyCode == '37') {
       // left arrow
    }
    else if (e.keyCode == '39') {
       // right arrow
    }

}

function onKeyDown(event) {
  //console.log(event.keyCode);
  if (event.key == "Escape") {
    hideAllContextMenu();
    clearSelectionList();
    indiceCurrentMeuble = -1;
    indiceCurrentBloc = -1;
    refreshInterface();
  }

if (event.keyCode == '34')
  {console.log("arrow pressed");
  onArrowDown();}

  pressedKey=event.key;
}

function onKeyUp(event) {
 pressedKey=undefined;
}

function onOpenContextMenu() {
  contextMenuGeneral.style.display = "block";
  contextMenuGeneral.style.left = pointerScreen.x + "px";
  contextMenuGeneral.style.top = pointerScreen.y + "px";
  if (raycastedMeuble) {
    changeCurrentMeubleFromClick(raycastedMeuble.meuble,false);
    updateAllSelectable();
  }
  contextMenuMeuble.style.display = "block";

  if (raycastedBloc) {
    indiceCurrentBloc = raycastedBloc.bloc.numero;
    changeCurrentBlocFromClick(raycastedBloc,false);
    updateAllSelectable();
    contextMenuBloc.style.display = "block";
  }
  if (raycastedEtagere > -1) {
    contextMenuEtagere.style.display = "block";
  }
}

function hideAllContextMenu() {
  contextMenuGeneral.style.display="none";
  contextMenuMeuble.style.display="none";
  contextMenuBloc.style.display="none";
  contextMenuEtagere.style.display="none";
}

//pointer raycast
const pointer = new THREE.Vector2(); //coordonées three normalisées
pointer.x=-1;
pointer.y=-1;
const pointerScreen = new THREE.Vector2(); // coordonées screenspace
pointerScreen.x=-1;
pointerScreen.y=-1;
const radius = 5;

//raycaster
let raycaster;
let intersectedBloc;
let intersectedMeuble;
let intersectedEtagere;
let intersectedHandle;
let intersectedHandleMeuble;
let intersectedElement;
var intersectedBox;
var raycastedBloc=undefined;
var raycastedMeuble=undefined;
var raycastedEtagere=undefined;
var raycastedSousMeuble=undefined;
var raycastedHandleBloc=undefined;
var raycastedHandleMeuble=undefined;
var raycastedElement=undefined;
var raycastedObject=undefined;
var raycastedHandle=undefined;
var rayCastEnabled=true;
raycaster = new THREE.Raycaster();

function checkRaycastObject(selectableList,objectName) {
if (!rayCastEnabled) return;
  raycaster.setFromCamera(pointer, camera, 0, 1000);
  const intersects = raycaster.intersectObjects(selectableList, true);
  if (intersects.length > 0) {
    if (intersectedBox != intersects[0].object) {
      if (intersectedBox && intersectedBox[objectName] && !intersectedBox[objectName].isSelected) {
        intersectedBox.visible = false;
      }
      intersectedBox = intersects[0].object;
      intersectedBox.visible = true;
      raycastedObject = intersectedBox[objectName];
    }
  }
  else {
    if (intersectedBox) {
      if (intersectedBox[objectName] && !intersectedBox[objectName].isSelected) {
        intersectedBox.visible = false; 
        }
    intersectedBox = null;
    raycastedObject = undefined;
   }
  }
  if (intersectedBox && intersectedBox[objectName] && intersectedBox[objectName].isSelected) {
    intersectedBox.visible = true;
    raycastedObject = intersectedBox[objectName];
  }
  return raycastedObject;
}

function checkRaycastEtageres() {
  if (!rayCastEnabled) return;
  raycaster.setFromCamera(pointer, camera, 0, 1000);
  const intersectsEtagere = raycaster.intersectObjects(selectableEtagere, false);
  if (intersectsEtagere.length > 0) {
    if (intersectedEtagere != intersectsEtagere[0].object) {
      if (intersectedEtagere && selectionMode == "etageres") {
        //intersectedEtagere.material.depthTest = false;
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
      //intersectedEtagere.material.depthTest = true;
      intersectedEtagere.renderOrder = 0;
    }
    intersectedEtagere = null;
    raycastedEtagere = -1;
  }
}

function checkRaycastHandle(selectableList) {
  //console.log(selectableList);
  if (!rayCastEnabled) return;
  raycaster.setFromCamera(pointer, camera, 0, 1000);
  const intersectsHandleBloc = raycaster.intersectObjects(selectableList, false);
  if (intersectsHandleBloc.length > 0 ) {
    //console.log(intersectsHandleBloc[0].object.name);
    if (intersectedHandle != intersectsHandleBloc[0].object) {
      if (intersectedHandle && (intersectedHandle.shortName=="handleBloc" || intersectedHandle.shortName=="handleMeuble")) {
        //intersectedHandle.material.depthTest = true;
        if (intersectedHandle.name=="evierHandle") {intersectedHandle.material.visible = false}
        else {intersectedHandle.visible = false;}
        intersectedHandle.renderOrder = 1;
      }
      intersectedHandle = intersectsHandleBloc[0].object;
      if (intersectedHandle.name=="evierHandle") {intersectedHandle.material.visible = true}
      else {intersectedHandle.visible = true;}
      //intersectedHandle.visible = true;
      intersectedHandle.material.depthTest = false;
      intersectedHandle.renderOrder = 1;
      raycastedHandle = intersectsHandleBloc[0].object;
    }
  }
  else {
    if (intersectedHandle && (intersectedHandle.shortName=="handleBloc" || intersectedHandle.shortName=="handleMeuble")) {
      if (intersectedHandle.name=="evierHandle") intersectedHandle.material.visible = false
      else intersectedHandle.visible = false;
      //intersectedHandle.material.depthTest = true;
      intersectedHandle.renderOrder = 0;
    }
    intersectedHandle = null;
    raycastedHandle = undefined;
  }
  return raycastedHandle;
}

function checkRaycast() {
  /* if (!rayCastEnabled) return;
  if (raycastMode==0) raycastedMeuble=checkRaycastObject(selectableMeuble,"meuble");
  if (raycastMode==1) raycastedBloc=checkRaycastObject(selectableBloc,"bloc");
  if (raycastMode==2) raycastedElement=checkRaycastObject(selectableElements,"element"); */
  //raycastedBloc=checkRaycastObject(selectableBloc,"bloc");

  //raycastedMeuble=checkRaycastObject(selectableMeuble,"meuble");
  if (selectionMode=="elements") {raycastedElement=checkRaycastObject(selectableElements,"element");}
  if (selectionMode=="blocs") {raycastedBloc=checkRaycastObject(selectableBloc,"bloc");}
  if (selectionMode=="meubles") {raycastedMeuble=checkRaycastObject(selectableMeuble,"meuble");}
  if (selectionMode=="ajusteMeubles") {raycastedHandleMeuble=checkRaycastHandle(selectableHandleMeuble);}
  if (selectionMode=="ajusteBlocs") {raycastedHandleBloc=checkRaycastHandle(selectableHandleBloc);}
  if (selectionMode=="etageres") checkRaycastEtageres();
  if (selectionMode=="sousMeubles") {raycastedSousMeuble=checkRaycastObject(selectableSousMeubles,"sousMeuble");}

}

var raycastMode=0;

function onArrowDown() {
  console.log("scrolling");
  //updateAllSelectable();

  if (raycastedMeuble) {
    hideRaycastedBox(raycastedMeuble);
    raycastMode=1;
    raycastedMeuble=undefined;
    checkRaycast();
    //raycastedBloc=checkRaycastObject(selectableBloc,"bloc");
    return;
  }
  if (raycastedBloc) {
    hideRaycastedBox(raycastedBloc);
    raycastedBloc=undefined;

    raycastMode=2;
    checkRaycast();

    //raycastedElement=checkRaycastObject(selectableElements,"element");
    return;  }

    if (raycastedElement) {
      hideRaycastedBox(raycastedElement);
      raycastedElement=undefined;
      raycastMode=0;
      checkRaycast();

      //raycastedElement=checkRaycastObject(selectableElements,"element");
      return;  }
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

function hideRaycastedBox(raycastedObject) {
  if (raycastedObject) {
    if (!raycastedObject.isSelected) {
      raycastedObject.selectionBox.visible = false
      raycastedObject = undefined
    }
  }
}

function hideAllRaycastedBoxes() {

  hideRaycastedBox(raycastedMeuble);
  hideRaycastedBox(raycastedElement);
  hideRaycastedBox(raycastedBloc);
  hideRaycastedBox(raycastedSousMeuble);
  if (raycastedHandleBloc) {raycastedHandleBloc.visible=false;}
  if (raycastedHandleMeuble) {raycastedHandleMeuble.visible=false;}
}

function clearRaycast() {
  controls.removeEventListener('change', checkRaycast);
  intersectedBox = undefined;
  intersectedHandle = undefined;
  hideAllRaycastedBoxes();
}

function hideAllBoxes() {
  let allBoxes=[];
  scene.getObjectsByProperty("category","boiteSelection",allBoxes);
  console.log(allBoxes);
  for (var i=0; i<allBoxes.length;i++) {
    allBoxes[i].visible=false;
    allBoxes[i].isSelected=false;
  }
}

//drag
var newHelper;
var dragElementControls;
function initDragElements() {
  dragElementControls = new DragControls(selectableElements, camera, renderer.domElement);
  dragElementControls.recursive=false;
  dragElementControls.addEventListener('dragstart',function (event) {
    if (selectionMode!="elements") return;
    let clickedElement=event.object.element;
    select(clickedElement,true);
    console.log(clickedElement);
    indiceCurrentBloc=clickedElement.initialBloc.numero;
    indiceCurrentMeuble=clickedElement.initialMeuble.numero;
    selectedMeuble=meubles[indiceCurrentMeuble];
    console.log("indiceCurrentBloc,indiceCurrentMeuble",indiceCurrentBloc,indiceCurrentMeuble,selectableMeuble);
    refreshInterfaceBlocs();
    refreshInterfaceMeuble();
    event.object.xInitial = event.object.position.x;
    event.object.yInitial = event.object.position.y;
    event.object.zInitial = event.object.position.z;
  });

  dragElementControls.addEventListener('drag',function (event) {
    event.object.position.x=event.object.xInitial;
    event.object.position.y=event.object.yInitial;
    event.object.position.z=event.object.zInitial;
    rayCastEnabled = true;
    controls.enabled = true;
  });

  dragElementControls.addEventListener('dragEnd',function (event) {
    rayCastEnabled = true;
    controls.enabled = true;
  });
}

function dragEvierStart(handle) {
  console.log("drag evier start");
  let xMax=handle.meuble.largeur/2-largeurEvier/2;
  let zMax=handle.meuble.profondeur/2-profondeurEvier/2;
  handle.xMax=xMax;
  handle.zMax=zMax;
  console.log("xMax,zMax",xMax,zMax);
  return;
}

function dragEvier(handle) {
  let x=handle.position.x;
  let z=handle.position.z;
  x= (x<-handle.xMax) ? -handle.xMax : x;
  x= (x>handle.xMax) ? handle.xMax : x;
  z= (z<-handle.zMax) ? -handle.zMax : z;
  z= (z>handle.zMax) ? handle.zMax : z;
  handle.position.set(x,handle.meuble.yEvier,z);
}

function dragEvierEnd(handle) {
  handle.meuble.xEvier = handle.position.x;
  handle.meuble.zEvier = handle.position.z;
  handle.meuble.update();
  resetRaycast();
  updateAllSelectable();
  controls.enabled = true;
  rayCastEnabled = true;
  handle.material.visible=false;
}

var dragHandleBlocControls;
function initDragHandleBloc() {
  var factOrientation = 1;
  //drag handle bloc
  dragHandleBlocControls = new DragControls(selectableHandleBloc, camera, renderer.domElement);
  dragHandleBlocControls.recursive=false;

  dragHandleBlocControls.addEventListener('dragstart', function (event) {

    console.log(event.object);

    if (selectionMode!="ajusteBlocs") return;
    controls.enabled = false;
    rayCastEnabled = false;

    if (event.object.name=="evierHandle") {
      dragEvierStart(event.object);
      return;
    }

    let meuble=event.object.bloc.meuble;
    let blocId = event.object.bloc.numero;
    var xMin,xMax;

    //calcul des limites en fonction des tailles de blocs adjacents
    let parent = event.object.parent.parent.parent;
    let blocPrecedent = parent.getObjectByName("Bloc " + (blocId - 1));
    let blocSuivant = parent.getObjectByName("Bloc " + (blocId));
    var dragLimit=meuble.getMaxAllowedSpaceOnSides();
    
    if (meuble.orientation==0 || meuble.orientation==2) {
      event.object.deltaMaxGauche = dragLimit[0];
      event.object.deltaMaxDroite = dragLimit[1];
    }
    else {
      event.object.deltaMaxGauche = dragLimit[1];
      event.object.deltaMaxDroite = dragLimit[0];
    }

    if (meuble.disposition == "horizontal") {

      if (event.object.name == "handleBlocDroit") { 
        xMin = event.object.position.x - meuble.blocs[blocId].taille + 1.5*meuble.epaisseurCadre;
        xMax = event.object.x + dragLimit[1] }
      else {
        if (blocPrecedent) {
          xMin = event.object.position.x - meuble.blocs[blocId - 1].taille + 1*meuble.epaisseurCadre;
        }
        else { xMin = event.object.x - dragLimit[0] }
        if (blocSuivant) { xMax = event.object.position.x + meuble.blocs[blocId].taille -1*meuble.epaisseurCadre }
      }

    event.object.xMin = xMin;
    event.object.xMax = xMax;
    event.object.xInitial = event.object.position.x;
    event.object.zInitial = event.object.position.z;
    event.object.xMeubleInitial = meuble.x;
    event.object.zMeubleInitial = meuble.z;
    isPreviewOn=true;
  }

  else { //vertical
    if (blocSuivant) { var yMax = event.object.position.y + meuble.blocs[blocId + 1].taille / 2 }
    else {var yMax = 10e35;}
    event.object.yMax = yMax;
    event.object.yInitial = event.object.position.y;
    event.object.yMeubleInitial = meuble.y;
    event.object.hauteurMeubleInitial = meuble.hauteur;

    event.object.maxDeltaY=meuble.getMaxAllowedHeight()-meuble.hauteur;
  }
    if (blocId > 0) event.object.tailleBlocPrecedent = meuble.blocs[blocId - 1].taille;
    if (blocId < meuble.nbBlocs-1) event.object.tailleBlocSuivant = meuble.blocs[blocId + 1].taille;
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
    event.object.newHelperZInit=newHelper.position.z;
    if (meuble.orientation==0) newHelper.rotation.set(0,0,0);
    if (meuble.orientation==1) newHelper.rotation.set(0,Math.PI/2,0);
    if (meuble.orientation==2) newHelper.rotation.set(0,Math.PI,0);
    if (meuble.orientation==3) newHelper.rotation.set(0,-Math.PI/2,0);
    scene.add(newHelper);
  });

  dragHandleBlocControls.addEventListener('drag', function (event) {
    if (event.object.name=="evierHandle") {
      dragEvier(event.object);
      return;
    }
    if (selectionMode!="ajusteBlocs") return;
    var obj1 = event.object;
    var meuble = obj1.bloc.meuble;
    var blocId = obj1.bloc.numero;
    if (meuble.disposition == "horizontal") {
      let x = obj1.position.x;
      x = x > event.object.xMax ? event.object.xMax : x;
      x = x < event.object.xMin ? event.object.xMin : x;
      var delta = x - obj1.xInitial;

      console.log(delta,obj1.deltaMaxGauche,obj1.deltaMaxDroite);

      //poignee située entre 2 blocs :
      if (blocId > 0 && obj1.name != "handleBlocDroit") {
        meuble.blocs[blocId - 1].taille = obj1.tailleBlocPrecedent + delta;
      }
      var fact = -1;

      //poignee située à gauche :
      if (blocId == 0) {
        //test collision
        if (-delta > (obj1.deltaMaxGauche)) {
          delta = -obj1.deltaMaxGauche;
          x = obj1.xInitial + delta;
        }
        fact = -1;
        meuble.x = obj1.xMeubleInitial + delta / 2;
        if (meuble.orientation==0 || meuble.orientation==2) meuble.x = obj1.xMeubleInitial + delta / 2
        else if (meuble.orientation==1) meuble.z = obj1.zMeubleInitial - delta / 2
        else if (meuble.orientation==3) meuble.z = obj1.zMeubleInitial + delta / 2;    
      }

      //poignée située à droite :
      if (obj1.name == "handleBlocDroit") {
        // test collision
        if (delta > (obj1.deltaMaxDroite)) {
          delta = obj1.deltaMaxDroite;
          x = obj1.xInitial + delta;
        }
        fact = 1;
        if (meuble.orientation==0 || meuble.orientation==2) meuble.x = obj1.xMeubleInitial + delta / 2
        else if (meuble.orientation==1) meuble.z = obj1.zMeubleInitial - delta / 2
        else if (meuble.orientation==3) meuble.z = obj1.zMeubleInitial + delta / 2;
      }

      meuble.blocs[blocId].taille = fact * (x + obj1.xInitial);
      obj1.position.set(x, 0, 0);

      if (meuble.orientation==0) {
        newHelper.position.x=obj1.newHelperXInit+delta;
      }
      else if (meuble.orientation==1) {
        newHelper.position.z=obj1.newHelperZInit-delta;
      }
      else if (meuble.orientation==3) {
        newHelper.position.z=obj1.newHelperZInit+delta;
      }
    }

    else { //vertical
      let y = obj1.position.y;
      delta=y-obj1.yInitial;
      delta = delta>obj1.maxDeltaY ? obj1.maxDeltaY : delta;
        meuble.blocs[blocId].taille = 2*obj1.yInitial + delta;
        if (blocId<meuble.nbBlocs-1) 
          {meuble.blocs[blocId+1].taille = obj1.tailleBlocSuivant - delta}
        newHelper.position.y=obj1.newHelperYInit+delta;
    }

    meuble.updateTaille();
    meuble.update(); 

    refreshInterface();
  });

  dragHandleBlocControls.addEventListener('dragend', function (event) {
    if (event.object.name=="evierHandle") {
      dragEvierEnd(event.object);
      return;
    }
    scene.remove(newHelper);
    geometry.dispose();
    material.dispose();
    if (selectionMode!="ajusteBlocs") return;
    isPreviewOn=false;
    //event.object.material.emissive.set(0x000000);
    event.object.bloc.meuble.update();
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
  dragHandleMeubleControls.recursive=false;
  dragHandleMeubleControls.addEventListener('dragstart', function (event) {
    if (selectionMode!="ajusteMeubles") {return;}
    controls.enabled = false;
    rayCastEnabled = false;
    var meuble = event.object.meuble;
    var dragLimit=meuble.getMaxAllowedSpaceOnSides();
    if (meuble.orientation == 0 || meuble.orientation == 3) {
      event.object.deltaMaxGauche=dragLimit[0];
      event.object.deltaMaxDroite=dragLimit[1];
      }
    else {
      event.object.deltaMaxGauche=dragLimit[1];
      event.object.deltaMaxDroite=dragLimit[0];
      }

    event.object.xInitial = event.object.position.x;
    event.object.yInitial = event.object.position.y;
    event.object.zInitial = event.object.position.z;
    event.object.xMeubleInitial = meuble.x;
    event.object.yMeubleInitial = meuble.y;
    event.object.zMeubleInitial = meuble.z;
    event.object.largeurInitiale = meuble.largeur;
    event.object.maxH=meuble.getMaxAllowedHeight();
    isPreviewOn=true;
  });

  dragHandleMeubleControls.addEventListener('drag', function (event) {
    let factOrientation=1;
    if (selectionMode!="ajusteMeubles") return;
    //event.object.material.emissive.set(0xaaaaaa);
    var obj1 = event.object;
    var meuble = obj1.meuble;

    //ajuste sur max size si collision
    if (obj1.name == "handleMeubleHaut") {
      let y = obj1.position.y;
      y = y > obj1.maxH/2 ? obj1.maxH/2 : y;
      obj1.position.set(0, y, 0);
      meuble.hauteur=y*2;
    }

    if (obj1.name == "handleMeubleBas") {
      let y = obj1.position.y;
      y = y > obj1.maxH/2 ? obj1.maxH/2 : y;
      y = y < -meuble.hauteur/2 ? -meuble.hauteur/2 : y;
      obj1.position.set(0, y, 0);
      meuble.elevation=meuble.hauteur/2+y;
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
      meuble.largeur = obj1.largeurInitiale-fact*delta*2;
      meuble.computeBlocsSize();
      if (meuble.orientation == 0) meuble.x = obj1.xMeubleInitial + delta
      else if (meuble.orientation == 1) meuble.z = obj1.zMeubleInitial - delta
      else if (meuble.orientation == 2) meuble.x = obj1.xMeubleInitial - delta
      else if (meuble.orientation == 3) meuble.z = obj1.zMeubleInitial + delta;
    }
    meuble.computeBlocsSize();
    meuble.updateGeometry();
    meuble.placeMeuble();
    refreshInterface();
  });

  dragHandleMeubleControls.addEventListener('dragend', function (event) {
    if (selectionMode!="ajusteMeubles") return;
    //event.object.material.emissive.set(0x000000);
    resetRaycast();
    controls.enabled = true;
    rayCastEnabled = true;
    isPreviewOn=false;
    event.object.meuble.update();
  });
}

var dragBlocControls;
function initDragBloc() {
  //drag blocs
  dragBlocControls = new DragControls(selectableBloc, camera, renderer.domElement);
  dragBlocControls.recursive=false;
  dragBlocControls.addEventListener('dragstart', function (event) {
    if (selectionMode!="blocs") return;
    let clickedBloc = event.object.bloc;
    select(clickedBloc,true);
    console.log(selectedObjects);
    refreshInterfaceBlocs();
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
    changeCurrentBlocFromClick(raycastedBloc);
    indiceCurrentMeuble=raycastedBloc.meuble.numero;
    selectedMeuble=meubles[indiceCurrentMeuble];
    refreshInterfaceMeuble();
    refreshInterfaceBlocs();
    //changeCurrentMeuble(meubles[raycastedBloc.meuble.numero],false);
    var num=event.object.numero;
    event.object.position.set(0,0,0);
    if ((!raycastedBloc) || (raycastedBloc.bloc==raycastedBlocBox.bloc)) {console.log("nothing happens")}
  });

}

var dragEtagereControls;
function initDragEtagere() {
  //drag etageres
  dragEtagereControls = new DragControls(selectableEtagere, camera, renderer.domElement);
  dragEtagereControls.recursive=false;
  dragEtagereControls.addEventListener('dragstart', function (event) {
    if (selectionMode!="etageres") return;
    controls.enabled=false;
    rayCastEnabled=false;
    //let clickedEtagereBox = event.object;
    let etagere = event.object.element;
    let meuble = etagere.bloc.initialMeuble;

    let id=etagere.numero;
    let blocId=etagere.bloc.numero;
    let parent=event.object.parent;
    let hasEtagerePrecedente = parent.getObjectByName("etagere "+(id-1));
    let hasEtagereSuivante = parent.getObjectByName("etagere "+(id+1));

    if (!etagere.bloc.etageresVerticales) {
      if (hasEtagerePrecedente) { var yMin = hasEtagerePrecedente.position.y }
      else { var yMin = -meuble.hauteur / 2 + meuble.epaisseur / 2 }
      if (hasEtagereSuivante) { var yMax = hasEtagereSuivante.position.y }
      else { var yMax = meuble.hauteur / 2 - meuble.epaisseur / 2 }

    }
    else {
      if (hasEtagerePrecedente) { var xMin = hasEtagerePrecedente.position.x }
      else { var xMin = -etagere.bloc.taille / 2 + meuble.epaisseur / 2 }
      if (hasEtagereSuivante) { var xMax = hasEtagereSuivante.position.x }
      else { var xMax = etagere.bloc.hauteur / 2 - meuble.epaisseur / 2 }
    }

    event.object.yMin = yMin + meuble.epaisseur;
    event.object.yMax = yMax - meuble.epaisseur;
    event.object.xMin = xMin + meuble.epaisseur;
    event.object.xMax = xMax - meuble.epaisseur;
    event.object.blocId = blocId;
    isPreviewOn=true;
  });

  dragEtagereControls.addEventListener('drag', function (event) {
    if (selectionMode!="etageres") return;
    var etagere = event.object;
    let meuble = etagere.element.bloc.initialMeuble;

    if (!etagere.element.bloc.etageresVerticales) {
      let y = etagere.position.y;
      y = y > event.object.yMax ? event.object.yMax : y;
      y = y < event.object.yMin ? event.object.yMin : y;
      etagere.position.set(0, y, 0);
      etagere.element.y = y;
    }
    else {
      let x = etagere.position.x;
      x = x > event.object.xMax ? event.object.xMax : x;
      x = x < event.object.xMin ? event.object.xMin : x;
      etagere.position.set(x, 0, 0);
      etagere.element.x = x;
    }
    meuble.update();
  });

  dragEtagereControls.addEventListener('dragend', function (event) {
    //event.object.material.emissive.set(0x000000);
    isPreviewOn=false;
    let etagere = event.object;
    let meuble = etagere.element.bloc.initialMeuble;
    let y = etagere.position.y;
    etagere.element.y = y;
    let x = etagere.position.x;
    etagere.element.x = x;
    resetRaycast();
    etagere.element.bloc.initialMeuble.update();
    controls.enabled = true;
    rayCastEnabled = true;
    meuble.update();
  });
}

function setInitialPosition(meuble, boxMeuble, wpos) {
  boxMeuble.xMeubleInit = meuble.x;
  boxMeuble.yMeubleInit = meuble.y;
  boxMeuble.zMeubleInit = meuble.z;
  boxMeuble.xLocalInit = boxMeuble.position.x;
  boxMeuble.yLocalInit = boxMeuble.position.y;
  boxMeuble.zLocalInit = boxMeuble.position.z;
  boxMeuble.xBoxOk = wpos.x;
  boxMeuble.yBoxOk = wpos.y;
  boxMeuble.zBoxOk = wpos.z;
  boxMeuble.xBoxInit = wpos.x;
  boxMeuble.yBoxInit = wpos.y;
  boxMeuble.zBoxInit = wpos.z;
  boxMeuble.xMeubleOk = meuble.x;
  boxMeuble.yMeubleOk = meuble.y;
  boxMeuble.zMeubleOk = meuble.z;
  boxMeuble.zOk = boxMeuble.position.z;
}

var dragMeubleControls;
function initDragMeuble() {
  var wA, hA, dA;
  var aX, aY, aZ;
  dragMeubleControls = new DragControls(selectableMeuble, camera, renderer.domElement);
  dragMeubleControls.recursive = false;

  dragMeubleControls.addEventListener('dragstart', function (event) { dragMeubleStart(event.object) });
  dragMeubleControls.addEventListener('drag', function (event) { dragMeuble(event) });
  dragMeubleControls.addEventListener('dragend', function (event) { dragMeubleEnd(event) });

  function dragMeubleStart(boxMeuble) {
    if (selectionMode != "meubles") return;

    let wpos = new THREE.Vector3();

    controls.enabled = false;
    rayCastEnabled = false;

    var meuble = boxMeuble.meuble;

    //boxMeuble.material.emissive.set(0xaaaaaa);
    changeCurrentMeubleFromClick(meuble, true);

    boxMeuble.localToWorld(wpos);

    setInitialPosition(meuble, boxMeuble, wpos);
    let geometries = meuble.root.getObjectByName("geometries");
    //on détache pour éviter les references circulaires dans les calculs de coordonnées
    boxMeuble.attach(geometries);
    geometries.position.set(0, 0, 0);
    let cadreA = meuble.hasCadre * meuble.epaisseurCadre;
    let plateauA = meuble.hasPlateau * epaisseurPlateau;
    let piedA = meuble.hasPied * hauteurPied;
    let socleA = meuble.hasSocle * hauteurSocle;
    let evierA = meuble.hasEvier * hauteurEvier;
    let offsetHautA = Math.max(cadreA, plateauA)+evierA;
    let offsetBasA = cadreA + piedA + socleA;
    wA = meuble.getLargeurBoundingBox();
    hA = meuble.getHauteurBoundingBox();
    dA = meuble.getProfondeurBoundingBox();
    boxMeuble.offsetHautA = offsetHautA;
    boxMeuble.offsetBasA = offsetBasA;
  }

  function dragMeuble(event) {
    var boxMeuble;
    var meuble;
    var num;
    var pos;
    let wpos;
    let aX,aY,aZ;
    wpos = new THREE.Vector3();

    function resetDragMeuble() {
      boxMeuble = event.object;
      meuble = boxMeuble.meuble;
      num = meuble.numero;
      pos = boxMeuble.position;
      
      boxMeuble.localToWorld(wpos);
      aX = wpos.x;
      aY = wpos.y - boxMeuble.offsetBasA / 2 + boxMeuble.offsetHautA / 2; // centre du bloc complet
      aZ = wpos.z;
    }

    resetDragMeuble();

    //changement de mur actif si on va dans l'angle

 /*    if (meuble.onMurFond) {
      let switchMur = false;
      if (aX < -(largeurPiece / 2) && aZ > meuble.getProfondeurReelle()) {
        meuble.setActiveWall("onMurGauche");
        //meuble.x=0;
        boxMeuble.xBoxInit = -largeurPiece/2+meuble.getProfondeurReelle()/2;

        switchMur = true;
      }

      if (aX > largeurPiece / 2 && aZ > meuble.getProfondeurReelle()) {
        meuble.setActiveWall("onMurDroit");
        //meuble.x=wA/2;
        boxMeuble.xBoxInit = largeurPiece/2-meuble.getProfondeurReelle()/2;

        switchMur = true;
      }

      if (switchMur) {
        console.log("switchmur !!!");
        //meuble.recaleDansPiece();
        meuble.placeMeuble();
        boxMeuble.position.x = 0;
        boxMeuble.position.z = 0;
        boxMeuble.xMeubleInit = meuble.x;
        boxMeuble.yMeubleInit += boxMeuble.position.y-boxMeuble.yLocalInit;
        boxMeuble.zMeubleInit = 0+meuble.getProfondeurReelle();

        boxMeuble.zBoxInit = 0;
        boxMeuble.yBoxInit = wpos.y;

        boxMeuble.xLocalInit = boxMeuble.position.x;
        //boxMeuble.yLocalInit = boxMeuble.position.y;
        boxMeuble.zLocalInit = boxMeuble.position.z;

        refreshInterfaceMeuble();
      }

    }

    else if (meuble.onMurGauche) {
      if (aX > (-largeurPiece/2) && aZ < 0) {
        meuble.setActiveWall("onMurFond");
        meuble.x = -(largeurPiece / 2 - wA / 2);
        meuble.z = 0;
        aX = wpos.x;
        meuble.placeMeuble();

        boxMeuble.xMeubleInit = meuble.x;
        boxMeuble.yMeubleInit = meuble.y;
        boxMeuble.xBoxOk = boxMeuble.position.x;
        boxMeuble.xMeubleOk = meuble.x;

        refreshInterfaceMeuble();
      }
    }

    else if (meuble.onMurDroit) {
      if (aX < (largeurPiece/2) && aZ < 0) {
        meuble.setActiveWall("onMurFond");
        meuble.x = (largeurPiece / 2 - wA / 2);
        meuble.z = 0;
        aX = wpos.x;
        meuble.placeMeuble();

        boxMeuble.xMeubleInit = meuble.x;
        boxMeuble.yMeubleInit = meuble.y;
        boxMeuble.xBoxOk = boxMeuble.position.x;
        boxMeuble.xMeubleOk = meuble.x;

        refreshInterfaceMeuble();
      }
    } */

    //contraintes sur surfaces (murs et sol)

    if (meuble.onMurFond) {
      pos.z = boxMeuble.zBoxInit;
      meuble.z = boxMeuble.zMeubleInit;
      boxMeuble.position.z = boxMeuble.zLocalInit;
    }

    else if (meuble.onMurGauche || meuble.onMurDroit) {
      //pos.z=boxMeuble.zBoxInit;
      meuble.x = boxMeuble.xMeubleInit;
      boxMeuble.position.z = -boxMeuble.zLocalInit;
    }

    else if (meuble.surSol) {
      pos.y = boxMeuble.yBoxInit;
      meuble.y = boxMeuble.yMeubleInit;
      boxMeuble.position.y = boxMeuble.yLocalInit;
    }

    adjustObjectPosition(boxMeuble, num, aX, aY, aZ, wA, hA, pos);

    refreshInterfaceMeuble();

  }

  function adjustObjectPosition(box, num, aX, aY, aZ, wA, hA, boxPos) {
    let meuble = box.meuble;
    let deltaBoxX, deltaBoxY, deltaBoxZ;
    let deltaMeubleX, deltaMeubleY, deltaMeubleZ;
    let pos = new THREE.Vector3();
    let deltaMeuble = new THREE.Vector3();
    let deltaBox = new THREE.Vector3();
    let currentPos = new THREE.Vector3();
    let localPos = new THREE.Vector3();

    box.localToWorld(pos);

    getDeltaBox();

    function getDeltaBox() {
      deltaBox.x = -box.xBoxInit + pos.x;
      deltaBox.y = -box.yBoxInit + pos.y;
      deltaBox.z = -box.zBoxInit + pos.z;
    }

    applyDeltaToMeuble();

    function applyDeltaToMeuble() {
      meuble.x = box.xMeubleInit + deltaBox.x;
      meuble.y = box.yMeubleInit + deltaBox.y;
      meuble.z = box.zMeubleInit + deltaBox.z;
      currentPos.x = meuble.x;
      currentPos.y = meuble.y;
      currentPos.z = meuble.z;
    }

    meuble.recaleDansPiece();
    meuble.recale();
    meuble.recaleDansPiece();
    let isPositionOk = (meuble.getIntersectionList().length == 0);

    getDeltaMeuble();

    function getDeltaMeuble() {
      deltaMeuble.x = currentPos.x - meuble.x;
      deltaMeuble.y = currentPos.y - meuble.y;
      deltaMeuble.z = currentPos.z - meuble.z;
    }

    applyDeltaToBox();

    function applyDeltaToBox() {
      let obj = new THREE.Object3D();
      let rot = new THREE.Euler();
      rot = meuble.root.getObjectByName("pivot").rotation;
      let rotB = new THREE.Euler(rot.x, rot.y, rot.z, 'XYZ');
      //application du delta suivant la rotation inverse dans le cas ou le meuble est pivoté sur Y
      rotB.y *= -1;
      deltaMeuble.applyEuler(rotB); 
      box.position.x -= deltaMeuble.x;
      box.position.y -= deltaMeuble.y;
      box.position.z -= deltaMeuble.z;
    }

    if (meuble.isPositionCorrect()) { //position ok
      //console.log("position ok");
      box.xMeubleOk = meuble.x;
      box.yMeubleOk = meuble.y;
      box.zMeubleOk = meuble.z;
      box.xBoxOk = box.position.x;
      box.yBoxOk = box.position.y;
      box.zBoxOk = box.position.z;
    }

     else { //on ne deplace pas
      console.log("on ne deplace pas");
  /*     getDeltaBox();
      applyDeltaToMeuble(); */
      meuble.x = box.xMeubleOk;
      meuble.y = box.yMeubleOk;
      meuble.z = box.zMeubleOk;
             box.position.x = box.xBoxOk;
      box.position.y = box.yBoxOk;
      box.position.z = box.zBoxOk;
    }
   //console.log("meuble",meuble.x,meuble.y,"box",box.position.x,box.position.y);
  }

  function dragMeubleEnd(event) {
    controls.enabled = true;
    rayCastEnabled = true;
    //event.object.material.emissive.set(0x000000);
    var boxMeuble = event.object;
    var meuble = boxMeuble.meuble;
    let geometries = boxMeuble.getObjectByName("geometries");
    let pivot = meuble.root.getObjectByName("pivot");
    // on rattache une fois fini
    pivot.attach(geometries);
    geometries.position.set(0, 0, 0);
    boxMeuble.position.set(0, 0, 0);
    meuble.isSelected = false;
    meuble.update();
    meuble.placeMeuble();
    refreshInterfaceMeuble();
    checkRaycast();
    frameCamera();
  }
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
  console.log("updateScene");
  for (var i=0; i<meubles.length; i++) {
    meubles[i].update();
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
  scene.getObjectsByProperty("shortName", "boiteSelection", selectableMeuble);
  dragMeubleControls.setObjects(selectableMeuble);
}

function updateSelectableEtagere() {
  selectableEtagere = [];
  scene.getObjectsByProperty("shortName","etagere",selectableEtagere);
  dragEtagereControls.setObjects(selectableEtagere);
}

function updateSelectableElements() {
  selectableElements = [];
  scene.getObjectsByProperty("shortName","boiteSelectionElement",selectableElements);
  for (var i=selectableElements.length-1;i>=0;i--) {
    if (selectableElements[i].element.type=="sousMeuble") {
      selectableElements.splice(i,1);
    }
  }
  dragElementControls.setObjects(selectableElements);
}

function updateSelectableHandleBloc() {
  selectableHandleBloc = [];
  scene.getObjectsByProperty("shortName", "handleBloc", selectableHandleBloc);
  if (dragHandleBlocControls) dragHandleBlocControls.setObjects(selectableHandleBloc);
}

function updateSelectableHandleMeuble() {
  selectableHandleMeuble = [];
  scene.getObjectsByProperty("shortName", "handleMeuble", selectableHandleMeuble);
  if (dragHandleMeubleControls) dragHandleMeubleControls.setObjects(selectableHandleMeuble);
  console.log(selectableHandleMeuble);
}

function updateSelectableSousMeubles() {
  selectableSousMeubles = [];
  scene.getObjectsByProperty("shortName", "boiteSelectionSousMeuble", selectableSousMeubles);
}

function updateAllSelectable() {
  updateSelectableElements();
  updateSelectableBlocs();
  updateSelectableMeubles();
  updateSelectableHandleMeuble();
  updateSelectableEtagere();
  updateSelectableHandleBloc();
  updateSelectableSousMeubles();
}

//selection functions
function clearSelectionList() {
  for (var i=selectedObjects.length; i>0; i--)
  {
    let object=selectedObjects[0];
    object.isSelected=false;
    if (object.selectionBox) {
      object.selectionBox.visible=false;}
      selectedObjects.splice(0,1);
  }
  hideAllRaycastedBoxes();
  refreshInterfaceContenu();
  /* indiceCurrentBloc=-1;
  indiceCurrentMeuble=-1; */
}

function addToSelection(object,highlight) {
  object.isSelected=true;
  if (highlight) object.selectionBox.visible=true;
  const isInSelectedObjects = (objectInList) => objectInList==object;
  let index=selectedObjects.findIndex(isInSelectedObjects);
  if (index>-1) {console.log("object already in list !!!")}
  else {
    selectedObjects.push(object);
    refreshInterfaceContenu();
  }
}

function removeFromSelection(object) {
  object.isSelected=false;
  object.selectionBox.visible=false;
  const isInSelectedObjects = (objectInList) => objectInList==object;
  let index=selectedObjects.findIndex(isInSelectedObjects);
  if (index<0) {console.log("object not in list !!!")}
  else {
    selectedObjects.splice(index,1);
  }
}

function select(object,highlight,add) {
  if (object==undefined) return;
  console.log("select",object.name);
  if (!add && (!pressedKey || pressedKey != "Shift")) {clearSelectionList()}
    object.isSelected = !object.isSelected;
    if (object.isSelected) { addToSelection(object,highlight) }
    else { removeFromSelection(object) }
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
const materialSelectionSousMeubleParams = structuredClone(materialSelection);
materialSelectionSousMeubleParams.color = '#ffaa00';

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
const materialSelectionSousMeuble = new THREE.MeshBasicMaterial( materialSelectionSousMeubleParams);
const materialHelper = new THREE.MeshBasicMaterial(materialHelperParams);
var materialSelectionBlocAnim = new THREE.MeshStandardMaterial( materialSelectionBlocParams );
materialSelectionMeuble.depthTest=false;
materialHelper.depthTest=false;
materialSelectionEtagere.depthTest=false;

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
  textureSol.repeat.set( 2000/profondeurPiece, 2000/largeurPiece );
  const materialSol = new THREE.MeshStandardMaterial( {color: 0xffffff, map:textureSol} );
  materialSol.roughness = 1;
  materialSol.metalness = 1;
  materialSol.bumpMap = textureSol;
  materialSol.bumpScale=5;

  geometry = new THREE.PlaneGeometry( largeurPiece, profondeurPiece );
  const plane = new THREE.Mesh( geometry, materialSol );
  plane.position.set(0,0,profondeurPiece/2);
  plane.rotateX(-Math.PI/2);
  plane.name = "sol";
  plane.receiveShadow = true;
  environnement.add( plane );

  geometry = new THREE.PlaneGeometry( largeurPiece, hauteurPiece );
  const materialMur = new THREE.MeshStandardMaterial( {color: 0xffffff} );
  const murFond = new THREE.Mesh( geometry, materialMur );
  murFond.position.set(0,hauteurPiece/2,0);
  murFond.name = "onMurFond"
  murFond.receiveShadow = true;
  environnement.add( murFond );

  geometry = new THREE.PlaneGeometry( profondeurPiece, hauteurPiece );
  const murDroit = new THREE.Mesh( geometry, materialMur );
  murDroit.position.set(+largeurPiece/2,hauteurPiece/2,profondeurPiece/2);
  murDroit.rotateY(-Math.PI/2);
  murDroit.name="onMurDroit";
  environnement.add( murDroit );
  const murGauche = new THREE.Mesh( geometry, materialMur );
  murGauche.position.set(-largeurPiece/2,hauteurPiece/2,profondeurPiece/2);
  murGauche.rotateY(Math.PI/2);
  murGauche.name="onMurGauche";
  environnement.add( murGauche );
  scene.add(environnement);
}

//Interface
var body;
var interfaceDiv;
var divEtageres;
var buttonNewMeuble,buttonDupliquerMeuble,buttonDeleteMeuble;
var buttonFrigo;
var buttonTourner;
var buttonAjouterBloc,buttonSupprimerBloc,buttonDecalerGauche,buttonDecalerDroite;
var listMeublesPopup;
var listMeublesName;
var buttonPlateau,buttonCadre,buttonSocle,buttonPied,buttonEvier;
var buttonSuspendu;
var selectListMeubles;
var selectListBlocs;
var blocsDiv;
var listBlocs;
var buttonPorte,buttonEtageres,buttonTiroirs,buttonPlein,buttonFour;
var buttonDeuxPortes,buttonUnePorte,buttonOuverturePorteDroite,buttonOuverturePorteGauche;
var nbPortes,sensOuverture;
var buttonEtageresVerticales;
var divPortes,divEtageres;
var checkboxRentrant;
var listPoigneesPopup;
var listPoigneesName;
var meubleSliders,blocsSliders,nbBlocsSlider,etageresSliders,sousMeublesSliders;
var largeurDiv,largeurSlider,largeurDivInput;
var hauteurDiv,hauteurDivSlider,hauteurDivInput;
var profondeurDiv,profondeurDivSlider,profondeurDivInput;
var XDiv,XDivSlider,XDivInput;
var YDiv,YDivSlider,YDivInput;
var ZDiv,ZDivSlider,ZDivInput;
var styleMenu;
var slidersAspect;
var checkboxVertical;
var checkboxMurFond,checkboxMurGauche,checkboxMurDroit,checkboxSurSol;

var checkboxSimple,checkboxCotesEleves,checkboxMontants,checkboxRoundedMontants,checkboxMontantsExterieurs,checkboxMontantsIntermediaires,checkboxMontantsInterieurs,checkboxEtagereUnique,checkboxEtagereZero,checkboxEtagereFinale;
var checkboxPlancheBas,checkboxPlancheHaut,checkboxPlancheDroite,checkboxPlancheGauche,checkboxPlancheFond,checkboxPlanchesIntermediaires;

var colorDrawer,colorMeuble,colorPlateau,colorCadre;
var menuPoignees;
var menuTexturesPlateau,menuTexturesCadre,menuTexturesMeuble,menuTexturesTiroirs;
var dropDownPoignees, dropDownMeuble, dropDownTiroirs, dropDownPlateau, dropDownCadre;
var buttonSelectMeuble,buttonSelectBloc,buttonSelectElement,buttonSelectSousMeuble;
var buttonAdjustBloc,buttonAdjustMeuble,buttonAdjustEtagere,buttonAdjustSousMeuble;
var buttonSousMeuble;
var buttonDiviserEtageres,buttonSupprimerEtageres,buttonResetEtageres;
var expandDimensions, expandBloc, expandMeubleData, expandAspect, expandEtageres, expandSousMeubles, expandContenu, expandEnregistrement, expandParametres, expandOptions;
var blocsData,contenuData,meubleData,etageresData,sousMeublesData,aspectData,enregistrementData,parametresData,optionsData;
var contextMenuGeneral,contextMenuMeuble,contextMenuBloc,contextMenuEtagere;
var warningContenu,warningBloc,warningEtageres,warningMeuble,warningSousMeubles;
var meubleHiddenIfEmpty;

function initializeScene() {
  initializeCamera();
  add3DListener();
  initializeAnimations();
  buildEnvironnement();
  addLights();
  initDragMeuble();
  initDragBloc();
  initDragEtagere();
  initDragElements();
  initializeInterface();
  initializeRaycast();
  initializePoignees();
  initializeFour();
  initializeEvier();
  createNewMeuble();
  selectedMeuble = meubles[0];
  indiceCurrentMeuble = 0;
  select(selectedMeuble,false);
  createInterfaceMeuble();
  refreshInterfaceBlocs();
  refreshInterfaceAspect();
  initPoigneesList();
  initListTexturesMeuble();
  createDropDownMenu(menuTexturesMeuble, imagesMeuble, "meuble");
  addListenerMenuTexture(menuTexturesMeuble);
  createDropDownMenu(menuTexturesTiroirs, imagesMeuble, "tiroirs");
  addListenerMenuTexture(menuTexturesTiroirs);
  createDropDownMenu(menuTexturesPlateau, imagesMeuble, "plateau");
  addListenerMenuTexture(menuTexturesPlateau);
  createDropDownMenu(menuTexturesCadre, imagesMeuble, "cadre");
  addListenerMenuTexture(menuTexturesCadre);
  createDropDownMenu(menuPoignees, poignees, "poignees");
  addListenerMenuPoignees(menuPoignees);
  frameCamera();
  renderer.setAnimationLoop(animate);
  initDragHandleBloc();
  initDragHandleMeuble();
  setSelectionMode("meubles");
  refreshInterfaceContenu();
  console.log(selectedMeuble);
  //setTailleOnBloc(selectedMeuble.bloc[2],60.1);
  selectedMeuble.blocs[2].taille=60.1;
  selectedMeuble.updateTaille();
  selectedMeuble.update();
  console.log(selectedMeuble.recaleDansPiece());
  selectedMeuble.placeMeuble();
}

function getHTMLElements () {
  body=document.getElementById("body");
  interfaceDiv = document.getElementById("interface");

  selectListMeubles =document.getElementById("selectListMeubles");
  buttonNewMeuble = document.getElementById("buttonNewMeuble");
  buttonDupliquerMeuble = document.getElementById("buttonDupliquerMeuble");
  buttonDeleteMeuble = document.getElementById("buttonDeleteMeuble");

  buttonFrigo = document.getElementById("buttonFrigo");

  buttonTourner=document.getElementById("buttonTourner");
  
  buttonSocle = document.getElementById("buttonSocle");
  buttonPied = document.getElementById("buttonPied");
  buttonSuspendu = document.getElementById("buttonSuspendu");
  buttonPlateau = document.getElementById("buttonPlateau");
  buttonCadre = document.getElementById("buttonCadre");
  buttonEvier = document.getElementById("buttonEvier");
  blocsDiv = document.getElementById("blocs");

  selectListBlocs=document.getElementById("selectListBlocs");
  buttonAjouterBloc = document.getElementById("buttonAjouterBloc");
  buttonSupprimerBloc = document.getElementById("buttonSupprimerBloc");
  buttonDecalerGauche = document.getElementById("buttonDecalerGauche");
  buttonDecalerDroite = document.getElementById("buttonDecalerDroite");

  buttonPorte = document.getElementById("buttonPorte");
  buttonTiroirs = document.getElementById("buttonTiroirs");
  buttonEtageres = document.getElementById("buttonEtageres");
  buttonPlein = document.getElementById("buttonPlein");
  buttonFour = document.getElementById("buttonFour");
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
  sousMeublesSliders = document.getElementById("sousMeublesSliders");
  blocsSliders = document.getElementById("blocsSliders");
  nbBlocsSlider = document.getElementById("nbBlocsSlider");
  etageresSliders = document.getElementById("etageresSliders");
  blocsData = document.getElementById("blocsData");
  contenuData = document.getElementById("contenuData");
  checkboxRentrant = document.getElementById("checkboxRentrant");
  listPoigneesPopup = document.getElementById("listPoigneesPopup");
  listPoigneesName = document.getElementById("listPoigneesName");
  styleMenu = document.getElementById("style");
  slidersAspect = document.getElementById("slidersAspect");

  checkboxVertical = document.getElementById("checkboxVertical");
  checkboxSimple = document.getElementById("checkboxSimple");
  checkboxCotesEleves = document.getElementById("checkboxCotesEleves");
  checkboxMontants = document.getElementById("checkboxMontants");
  checkboxRoundedMontants = document.getElementById("checkboxRoundedMontants");
  checkboxMontantsExterieurs = document.getElementById("checkboxMontantsExterieurs");
  checkboxMontantsIntermediaires = document.getElementById("checkboxMontantsIntermediaires");
  checkboxMontantsInterieurs = document.getElementById("checkboxMontantsInterieurs");
  checkboxEtagereUnique = document.getElementById("checkboxEtagereUnique");
  checkboxEtagereZero = document.getElementById("checkboxEtagereZero");
  checkboxEtagereFinale = document.getElementById("checkboxEtagereFinale");
  checkboxPlancheBas = document.getElementById("checkboxPlancheBas");
  checkboxPlancheHaut = document.getElementById("checkboxPlancheHaut");
  checkboxPlancheGauche = document.getElementById("checkboxPlancheGauche");
  checkboxPlancheDroite = document.getElementById("checkboxPlancheDroite");
  checkboxPlancheFond = document.getElementById("checkboxPlancheFond");
  checkboxPlanchesIntermediaires = document.getElementById("checkboxPlanchesIntermediaires");

  checkboxMurFond = document.getElementById("checkboxMurFond");
  checkboxMurGauche = document.getElementById("checkboxMurGauche");
  checkboxSurSol = document.getElementById("checkboxSurSol");
  checkboxMurDroit = document.getElementById("checkboxMurDroit");
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
  buttonSelectSousMeuble = document.getElementById("buttonSelectSousMeuble");
  buttonAdjustMeuble = document.getElementById("buttonAdjustMeuble");
  buttonSelectBloc = document.getElementById("buttonSelectBloc");
  buttonAdjustBloc = document.getElementById("buttonAdjustBloc");
  buttonAdjustEtagere = document.getElementById("buttonAdjustEtagere");
  buttonSelectElement = document.getElementById("buttonSelectElement");
  buttonSousMeuble = document.getElementById("buttonSousMeuble");

  buttonDiviserEtageres = document.getElementById("buttonDiviserEtageres");
  buttonSupprimerEtageres = document.getElementById("buttonSupprimerEtageres");
  buttonResetEtageres = document.getElementById("buttonResetEtageres");
  
  expandDimensions=document.getElementById("expandDimensions");
  expandBloc=document.getElementById("expandBloc");
  expandContenu=document.getElementById("expandContenu");
  expandEtageres=document.getElementById("expandEtageres");
  expandAspect=document.getElementById("expandAspect");
  expandEnregistrement=document.getElementById("expandEnregistrement");
  expandParametres=document.getElementById("expandParametres");
  expandOptions=document.getElementById("expandOptions");

  meubleData=document.getElementById("meubleData");
  expandMeubleData=document.getElementById("expandMeubleData");
  etageresData=document.getElementById("etageresData");
  sousMeublesData=document.getElementById("sousMeublesData");
  expandSousMeubles=document.getAnimations("expandSousMeubles");
  contenuData=document.getElementById("contenuData");
  aspectData=document.getElementById("aspectData");
  enregistrementData=document.getElementById("enregistrementData");
  parametresData=document.getElementById("parametresData");
  optionsData=document.getElementById("optionsData");

  warningContenu=document.getElementById("warningContenu");
  warningBloc=document.getElementById("warningBloc");
  warningEtageres=document.getElementById("warningEtageres");
  warningMeuble=document.getElementById("warningMeuble");
  warningSousMeubles=document.getElementById("warningSousMeubles");

  contextMenuGeneral = document.getElementById("contextMenuGeneral");
  contextMenuMeuble = document.getElementById("contextMenuMeuble");
  contextMenuBloc= document.getElementById("contextMenuBloc");
  contextMenuEtagere= document.getElementById("contextMenuEtagere");

  meubleHiddenIfEmpty=document.getElementById("meubleHiddenIfEmpty");
}

function initializeInterface() {
  getHTMLElements();

  // listeners
  //buttons meuble
  checkboxVertical.addEventListener("click", switchVertical);
  checkboxSimple.addEventListener("click", switchSimple);
  checkboxCotesEleves.addEventListener("click",switchCotesEleves);
  checkboxMontants.addEventListener("click", switchMontants);
  checkboxRoundedMontants.addEventListener("click",switchRoundedMontants);
  checkboxMontantsExterieurs.addEventListener("click", switchMontantsExterieurs);
  checkboxMontantsIntermediaires.addEventListener("click", switchMontantsIntermediaires);
  checkboxMontantsInterieurs.addEventListener("click", switchMontantsInterieurs);
  checkboxEtagereUnique.addEventListener("click", switchEtagereUnique);
  checkboxEtagereZero.addEventListener("click", switchEtagereZero);
  checkboxEtagereFinale.addEventListener("click", switchEtagereFinale);
  checkboxPlancheBas.addEventListener("click", switchPlancheBas);
  checkboxPlancheHaut.addEventListener("click", switchPlancheHaut);
  checkboxPlancheGauche.addEventListener("click", switchPlancheGauche);
  checkboxPlancheDroite.addEventListener("click", switchPlancheDroite);
  checkboxPlancheFond.addEventListener("click", switchPlancheFond);
  checkboxPlanchesIntermediaires.addEventListener("click", switchPlanchesIntermediaires);

  checkboxMurFond.addEventListener("click", function () { selectedMeuble.switchMur("onMurFond") });
  checkboxMurGauche.addEventListener("click", function () { selectedMeuble.switchMur("onMurGauche") });
  checkboxMurDroit.addEventListener("click", function () { selectedMeuble.switchMur("onMurDroit") });
  checkboxSurSol.addEventListener("click", function () { selectedMeuble.switchMur("surSol") });

  buttonTourner.addEventListener("click",function () {selectedMeuble.tourner(); refreshInterfaceMeuble()});

  buttonFrigo.addEventListener("click",getFrigo);

  buttonSocle.addEventListener("click", function () { switchSocle(indiceCurrentMeuble) });
  buttonPied.addEventListener("click", function () { switchPied(indiceCurrentMeuble) });
  buttonSuspendu.addEventListener("click", function () { switchSuspendu() });  //à virer
  buttonPlateau.addEventListener("click", function () { switchPlateau(indiceCurrentMeuble) });
  buttonCadre.addEventListener("click", function () { switchCadre(indiceCurrentMeuble) });
  buttonEvier.addEventListener("click", function () { switchEvier(indiceCurrentMeuble) });
  //context menu meuble
  document.getElementById("switchVertical").addEventListener("click",function() {switchVertical()});
  document.getElementById("switchPlateau").addEventListener("click",function() {switchPlateau(indiceCurrentMeuble)});
  document.getElementById("switchCadre").addEventListener("click",function() {switchCadre()});
  document.getElementById("switchSocle").addEventListener("click",function() {switchSocle()});
  document.getElementById("switchPied").addEventListener("click",function() {switchPied()});

  //functions meubles
  function getFrigo() {
    if (frigo==undefined) {
      frigo=new ObjetStatique(meubles.length,"frigo",70,187,65);
      frigo.initialize("frigo.glb");
      //frigo.type="frigo";
      /* frigo.largeur=70;
      frigo.hauteur=187;
      frigo.profondeur=65; */

      updateAllSelectable();
      selectableMeuble[1].visible=true;
      frigo.recaleDansPiece();
      frigo.recale("X");
      frigo.placeMeuble();
      meubles[meubles.length]=frigo;
      /* select(frigo);
      indiceCurrentMeuble=meubles.length;
      indiceCurrentBloc=-1;
      selectedMeuble=frigo; */
    }
    else {
      scene.remove(frigo.root);
      meubles.splice(frigo.numero,1);
      recomputeMeublesId;
      frigo=undefined;
      updateScene();
    }
    refreshInterface();
    //refreshButtonFrigo();
  }

  function switchVertical() {
    if (selectedMeuble.disposition == "vertical") selectedMeuble.disposition = "horizontal";
    else selectedMeuble.disposition = "vertical";
    selectedMeuble.computeBlocsSize();
    selectedMeuble.update();
    frameCamera()
  }

  function switchSimple() {
    selectedMeuble.isSimple = !selectedMeuble.isSimple;
    selectedMeuble.update();
  }

  function switchCotesEleves() {
    selectedMeuble.hasCotesEleves = !selectedMeuble.hasCotesEleves;
    selectedMeuble.update();
  } 

  function switchMontants() {
    selectedMeuble.hasMontants = !selectedMeuble.hasMontants;
    refreshCheckboxMeuble();
    selectedMeuble.update();
  }

  function switchRoundedMontants() {
    selectedMeuble.hasRoundedMontants = !selectedMeuble.hasRoundedMontants;
    selectedMeuble.update();
  }

  function switchMontantsExterieurs() {
    selectedMeuble.hasMontantsExterieurs = !selectedMeuble.hasMontantsExterieurs;
    selectedMeuble.update();
  }

  function switchMontantsIntermediaires() {
    selectedMeuble.hasMontantsIntermediaires = !selectedMeuble.hasMontantsIntermediaires;
    selectedMeuble.update();
  }

  function switchMontantsInterieurs() {
    selectedMeuble.hasMontantsInterieurs = !selectedMeuble.hasMontantsInterieurs;
    selectedMeuble.update();
  }

  function switchEtagereUnique() {
    selectedMeuble.hasEtagereUnique = !selectedMeuble.hasEtagereUnique;
    selectedMeuble.update();
  }

  function switchEtagereZero() {
    selectedMeuble.hasEtagereZero = !selectedMeuble.hasEtagereZero;
    selectedMeuble.update();
  }

  function switchEtagereFinale() {
    selectedMeuble.hasEtagereFinale = !selectedMeuble.hasEtagereFinale;
    selectedMeuble.update();
  }

  function switchPlancheBas() {
    selectedMeuble.hasPlancheBas = !selectedMeuble.hasPlancheBas;
    selectedMeuble.update();
  }

  function switchPlancheHaut() {
    selectedMeuble.hasPlancheHaut = !selectedMeuble.hasPlancheHaut;
    selectedMeuble.update();
  }

  function switchPlancheGauche() {
    selectedMeuble.hasPlancheGauche = !selectedMeuble.hasPlancheGauche;
    selectedMeuble.update();
  }

  function switchPlancheDroite() {
    selectedMeuble.hasPlancheDroite = !selectedMeuble.hasPlancheDroite;
    selectedMeuble.update();
  }

  function switchPlancheFond() {
    selectedMeuble.hasPlancheFond = !selectedMeuble.hasPlancheFond;
    selectedMeuble.update();
  }

  function switchPlanchesIntermediaires() {
    selectedMeuble.hasPlanchesIntermediaires = !selectedMeuble.hasPlanchesIntermediaires;
    selectedMeuble.update();
  }

  function switchSocle(num) {
    meubles[num].hasSocle=!meubles[num].hasSocle;
    if (meubles[num].hasSocle) {
      meubles[num].hasPied=false;
      meubles[num].IsSuspendu=false;
    }
    refreshButtonFixationGroup(num);
    meubles[num].update();
  }

  function switchPied(num) {
    meubles[num].hasPied=!meubles[num].hasPied;
    if (meubles[num].hasPied) {
      meubles[num].hasSocle=false;
      meubles[num].IsSuspendu=false;
    }
    refreshButtonFixationGroup(num);
    meubles[num].update();
  }

  function switchSuspendu(num) {
    meubles[num].IsSuspendu=!meubles[num].IsSuspendu;
    if (meubles[num].IsSuspendu) {
      meubles[num].hasPied=false;
      meubles[num].hasSocle=false;
    }
    refreshButtonFixationGroup(num);
    meubles[num].update();
  }

  function switchPlateau(num) {
    meubles[num].hasPlateau=!meubles[num].hasPlateau;
    refreshButtonPlateau(num);
    meubles[num].update();
  }

  function switchCadre(num) {
    meubles[num].hasCadre=!meubles[num].hasCadre;
    refreshButtonCadre(num);
    meubles[num].update();
  }

  function switchEvier(num) {
    meubles[num].hasEvier=!meubles[num].hasEvier;
    refreshButtonEvier(num);
    meubles[num].update();
  }

  //buttons blocs
  buttonAjouterBloc.addEventListener("click",clicAjouterBloc);
  buttonSupprimerBloc.addEventListener("click",clicSupprimerBlocs);
  buttonDecalerGauche.addEventListener("click",clicDecalerGauche);
  buttonDecalerDroite.addEventListener("click",clicDecalerDroite);

  //ajoute nouveau bloc, si taille disponible insuffisante les blocs sont réajustés en taille
  function clicAjouterBloc() {
    meubles[indiceCurrentMeuble].addNewBlocAndAdjust();
    clearSelectionList();
    indiceCurrentBloc=-1;
    refreshInterfaceMeuble();
    refreshInterfaceBlocs();
  }

  function deleteBlocFn (meuble,num) {
    //let meuble = bloc.meuble;
    console.log("delete bloc",num);
    let blocToDelete=meuble.blocs[num];
    if (blocToDelete=undefined || meuble.nbBlocs==1) return;
    //console.log(this.bloc);
    meuble.blocs.splice(num, 1);
    //console.log(this.bloc);
    meuble.nbBlocs -= 1;
    meuble.recomputeBlocsId();
    meuble.computeBlocsSize();
  }


  function deleteBlocsOnSelection() {
    for (var i = selectedObjects.length - 1; i > -1; i--) {
      let bloc = selectedObjects[i];
      let meuble = bloc.meuble;
      if (bloc.constructor.name == "Bloc") {
      deleteBlocFn(meuble,bloc.numero);
      }
    }
  }

  function clicSupprimerBlocs() {
    deleteBlocsOnSelection();
    meubles.forEach(meuble => {
      meuble.updateTaille();
    })
    updateScene();
    clearSelectionList();
    indiceCurrentBloc = -1;
    refreshInterfaceMeuble();
    refreshInterfaceBlocs();
  }

  function clicDecalerGauche() {
    for (var i = selectedObjects.length - 1; i > -1; i--) {
      let bloc = selectedObjects[i];
      let meuble = bloc.meuble;
      if (bloc.constructor.name == "Bloc") {
        if (bloc.numero > 0) {
          [meuble.blocs[bloc.numero], meuble.blocs[bloc.numero-1]] = [meuble.blocs[bloc.numero-1], meuble.blocs[bloc.numero]];
          bloc.meuble.recomputeBlocsId();
          meuble.update();
        }
      }
    }
    refreshInterfaceBlocs();
  }

  function clicDecalerDroite() {
    for (var i = selectedObjects.length - 1; i > -1; i--) {
      let bloc = selectedObjects[i];
      let meuble = bloc.meuble;
      if (bloc.constructor.name == "Bloc") {
        if (bloc.numero < meuble.nbBlocs-1) {
          [meuble.blocs[bloc.numero+1], meuble.blocs[bloc.numero]] = [meuble.blocs[bloc.numero], meuble.blocs[bloc.numero+1]];
          bloc.meuble.recomputeBlocsId();
          meuble.update();
        }
      }
    }
    refreshInterfaceBlocs();
  }

  //buttons etageres
  buttonDiviserEtageres.addEventListener("click", clicDiviserElements);
  buttonSupprimerEtageres.addEventListener("click",clicSupprimerEtageres);
  buttonResetEtageres.addEventListener("click",clicResetEtageres);

  function diviserElement(element) {
    // si première division on crée un sous meuble
    if (!element.meuble.isSousMeuble || element.bloc.nbEtageres>0) {
      let type=element.type;
      element.type="sousMeuble";
      element.initialMeuble.update();
      element.sousMeuble.nbEtageres=0;
      element.sousMeuble.type=type;
      element.sousMeuble.nbBlocs=2;
    }
    //sinon on ajoute un bloc au sous meuble
    else {
      //element.meuble.setBlocsQuantity(element.meuble.nbBlocs+1);
      element.meuble.diviserBloc(element.bloc.numero);
    }
  }
  
  function clicDiviserElements() {
    let meuble=selectedMeuble;
    if (selectionMode!="elements" || selectedObjects.length==0) return;
    let element;
    for (var i=0;i<selectedObjects.length;i++) {
      element = selectedObjects[i];
      element.isSelected = false;
      diviserElement(element);
      element.initialMeuble.update();
    }
    updateAllSelectable();
    clearSelectionList();
    selectedMeuble=meuble;
  }

  function supprimerEtagere(element) {
    console.log("element to delete",element);
    if (element.bloc.nbEtageres == 0) {
      if (element.meuble.nbBlocs>2) {
        deleteBlocFn(element.meuble,element.bloc.numero);
        //element.meuble.deleteBloc(element.bloc);
      }
      else  if (element.meuble.nbBlocs==2) {
        deleteBlocFn(element.meuble,element.bloc.numero);
        //element.meuble.deleteBloc(element.bloc);
        if (element.meuble.blocs[0].nbEtageres==0) element.meuble.parentElement.type="etageres";
      }
    }
    else {
      for (var i = 0; i < element.bloc.nbEtageres; i++) {
        element.bloc.elements[i].fixYValue();
      }
      console.log(element.numero);
      element.bloc.elements.splice(element.numero, 1);
      element.bloc.nbEtageres -= 1;
      element.bloc.recomputeElementsId();
    }
    element.initialMeuble.update();
    updateAllSelectable();
  }

  function supprimerEtageresOnSelection() {
    if (selectedObjects.length == 0) return;
    if (selectionMode = "elements") {
      for (var i = 0; i < selectedObjects.length; i++) {
        supprimerEtagere(selectedObjects[i]);
      }
    }
  }

  function clicSupprimerEtageres() {
    supprimerEtageresOnSelection();
    updateScene();
    refreshInterfaceEtagere();
    refreshInterfaceBlocs();
  }

  function clicResetEtageres() {
    selectedMeuble.resetAllEtageres();
    selectedMeuble.update();
    refreshInterface();
  }

  //buttons contenu
  buttonPorte.addEventListener("click", switchPorte);
  buttonTiroirs.addEventListener("click", switchTiroirs);
  buttonEtageres.addEventListener("click", switchEtageres);
  buttonPlein.addEventListener("click", switchPanneau);
  buttonFour.addEventListener("click", switchFour);
  buttonSousMeuble.addEventListener("click", switchSousMeuble);

  //contexte menu contenu
  document.getElementById("switchPorte").addEventListener("click", switchPorte);
  document.getElementById("switchTiroirs").addEventListener("click", switchTiroirs);
  document.getElementById("switchEtageres").addEventListener("click", switchEtageres);
  document.getElementById("switchPanneau").addEventListener("click", switchPanneau);
  document.getElementById("switchSousMeuble").addEventListener("click", switchSousMeuble);

  //functions contenu
  function switchPorte() { setSelectionType("portes"); }

  function setSelectionType(value) {
    for (var i = selectedObjects.length; i > 0; i--) {
      let object = selectedObjects[i - 1];
      object.type = value;
      object.initialMeuble.update();
    }
    refreshInterfaceBlocs();
  }

  function setValueOnSelection(key, value) {
    for (var i = selectedObjects.length; i > 0; i--) {
      let object = selectedObjects[i - 1];
      object[key] = value;
      object.initialMeuble.update();
    }
    if (selectedObjects.length==0) {
      selectedMeuble[key] = value;
      selectedMeuble.update();
    }
    refreshInterfaceBlocs();
    updateSelection();
  }

  function updateSelection() {
    for (var i = selectedObjects.length; i > 0; i--) {
      let object = selectedObjects[i - 1];
      object.initialMeuble.update();
      console.log("updateSelection");
    }
  }

  function switchTiroirs() { setValueOnSelection("type","tiroirs"); }
  function switchEtageres() { setValueOnSelection("type","etageres"); }
  function switchPanneau() { setValueOnSelection("type","panneau"); }
  function switchSousMeuble() { setValueOnSelection("type","sousMeuble"); }
  function switchFour() { setValueOnSelection("type","four"); }
  function switchUnePorte() { setValueOnSelection("nombrePortes","1"); }
  function switchDeuxPortes() { setValueOnSelection("nombrePortes","2"); }
  function switchPorteGauche() { setValueOnSelection("ouverturePorte","gauche"); }
  function switchPorteDroite() { setValueOnSelection("ouverturePorte","droite"); }

  buttonUnePorte.addEventListener("click", switchUnePorte);
  buttonDeuxPortes.addEventListener("click", switchDeuxPortes);
  buttonOuverturePorteGauche.addEventListener("click", switchPorteGauche);
  buttonOuverturePorteDroite.addEventListener("click", switchPorteDroite);
  buttonEtageresVerticales.addEventListener("click", function () {switchEtagereVerticale(indiceCurrentBloc)});
  checkboxRentrant.addEventListener("click", function () {switchRentrant()});

  function switchEtagereVerticale() {
    selectedMeuble.blocs[indiceCurrentBloc].etageresVerticales=!selectedMeuble.blocs[indiceCurrentBloc].etageresVerticales;
    selectedMeuble.update();
  }

  function switchRentrant() {
    let valueOnLast = selectedObjects[selectedObjects.length-1].isRentrant;
    setValueOnSelection("isRentrant",!valueOnLast);
  } 

  selectListMeubles.addEventListener("change", function eventListMeublesPopup(event) { 
    changeCurrentMeubleFromPopup(Number(event.target.value),false);
  });

  selectListBlocs.addEventListener("change",function changeCurrentBlocFromPopup(event) {
    flashBloc(Number(event.target.value));
    clearSelectionList();
    indiceCurrentBloc=event.target.value;
    select(meubles[indiceCurrentMeuble].blocs[indiceCurrentBloc]);
    console.log("indiceCurrentBloc=",indiceCurrentBloc);
    refreshInterfaceBlocs();
    updateSelectableEtagere();
    updateSelectableHandleBloc();
  });

  buttonNewMeuble.addEventListener("click", function eventButtonNewMeuble() {
    createNewMeuble();
    indiceCurrentBloc = -1;
    refreshInterface();
    frameCamera();
  });

  buttonDupliquerMeuble.addEventListener("click", function eventButtonDupliquerMeuble() {
    duplicateMeuble();
    indiceCurrentBloc = -1;
    refreshInterface();
  });

  function duplicateMeuble() {
    let newMeuble=selectedMeuble.duplicate();
    meubles[newMeuble.numero]=newMeuble;
    newMeuble.update();
    updateAllSelectable();
    console.log(selectedMeuble,newMeuble);
    /* if (newMeuble.onMurFond) newMeuble.switchMur("onMurFond");
    if (newMeuble.onMurGauche) newMeuble.switchMur("onMurGauche");
    if (newMeuble.onMurDroit) newMeuble.switchMur("onMurDroit");
    if (newMeuble.surSol) newMeuble.switchMur("surSol"); */
    newMeuble.automaticPlacement();
    updateScene();
    select(newMeuble,true);
    indiceCurrentMeuble=newMeuble.numero;
    selectedMeuble=newMeuble;
    refreshInterface();
    newMeuble.update();

    updateAllSelectable();
    frameCamera();
  }

  buttonDeleteMeuble.addEventListener("click", function eventButtonDeleteMeuble() {
    if (deleteMeuble(selectedMeuble)) console.log("meuble deleted");
    refreshInterface();
    frameCamera();
  });

  function changeStyle(event) { 
    if (selectedObjects.length>0) {setValueOnSelection("style",event.target.value)}
    else {
      globalStyle=event.target.value;
      updateScene();
    }
  }

  styleMenu.addEventListener("change", function setStyle(event) { changeStyle(event)}, false);

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
    setSelectionMode("blocs"); if (indiceCurrentBloc!=-1) select(meubles[indiceCurrentMeuble].blocs[indiceCurrentBloc]);
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

  buttonSelectSousMeuble.addEventListener("click", function clickSelectElements(event) {
    setSelectionMode("sousMeubles");
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


function expand(divSwitch, divData) {
  if (divSwitch.className == "expandOff") {
    divData.style.display = "";
    divSwitch.className = "expandOn";
  }
  else {
    divData.style.display = "none";
    divSwitch.className = "expandOff";
  }
}

  meubleData.style.display="none";
  expandMeubleData.addEventListener("click",function expandMeubleDataFn(event)
  {expand(expandMeubleData,meubleData); refreshInterfaceMeuble();});

  warningMeuble.style.display="none";
  meubleSliders.style.display="none";
  expandDimensions.addEventListener("click",function expandDimensionsMeuble(event)
  {expand(expandDimensions,meubleSliders); refreshInterfaceMeuble()});

  blocsData.style.display="none";
  expandBloc.addEventListener("click",function expandFn(event)
  {expand(expandBloc,blocsData); refreshInterfaceBlocs();});

  warningEtageres.style.display="none";
  etageresData.style.display="none";
  expandEtageres.addEventListener("click",function expandFn(event)
  {expand(expandEtageres,etageresData)});

  warningSousMeubles.style.display="none";
  sousMeublesData.style.display="none";
  //expandSousMeubles.addEventListener("click",function expandFnSM(event)
  //{expand(expandSousMeubles,sousMeublesData)});

  contenuData.style.display="none";
  warningContenu.style.display="none";
  expandContenu.addEventListener("click",function expandFn(event)
  {expand(expandContenu,contenuData); refreshInterfaceContenu()});

  aspectData.style.display="none";
  expandAspect.addEventListener("click",function expandFn(event)
  {expand(expandAspect,aspectData);});

  enregistrementData.style.display="none";
  expandEnregistrement.addEventListener("click",function expandFn(event)
  {expand(expandEnregistrement,enregistrementData)});

  parametresData.style.display="none",
  expandParametres.addEventListener("click",function expandFn(event)
  {expand(expandParametres,parametresData)});

 optionsData.style.display="none",
  expandOptions.addEventListener("click",function expandFn(event)
  {expand(expandOptions,optionsData)});
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
  console.log(selectableSousMeubles);
}

function refreshSelectButtons() {
  console.log("selectionMode=",selectionMode);
  if (selectionMode=="meubles") {buttonSelectMeuble.className="buttonOn";}
  else {buttonSelectMeuble.className="buttonOff"}

  if (selectionMode=="ajusteMeubles") {buttonAdjustMeuble.className="buttonOn";}
  else {buttonAdjustMeuble.className="buttonOff"}

  if (selectionMode=="blocs") {buttonSelectBloc.className="buttonOn";}
  else {buttonSelectBloc.className="buttonOff"}

  if (selectionMode=="ajusteBlocs") {buttonAdjustBloc.className="buttonOn";}
  else {buttonAdjustBloc.className="buttonOff"}
    
  if (selectionMode=="etageres") {buttonAdjustEtagere.className="buttonOn";}
  else {buttonAdjustEtagere.className="buttonOff"}

  if (selectionMode=="elements") {buttonSelectElement.className="buttonOn";}
  else {buttonSelectElement.className="buttonOff"}

  if (selectionMode=="sousMeubles") {buttonSelectSousMeuble.className="buttonOn";}
  else {buttonSelectSousMeuble.className="buttonOff"}
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

let poigneeGroup=new THREE.Group();
function changePoignee(i) {
  let name=poignees[i].filename;
  const loader = new GLTFLoader();
  poigneeGroup = new THREE.Group();
  loader.load(name, function (gltf) {
    let poigneeRoot = gltf.scene.getObjectByName('poignee');
    for (var i = poigneeRoot.children.length; i > 0; i--) {
      poigneeGroup.add(poigneeRoot.children[i - 1]);
    }
    poigneeGroup.scale.set(100, 100, 100);
    updateScene();
  });
}

function initializePoignees() {
  geometry = new THREE.SphereGeometry(taillePoignees,12,8);
  poignee = new THREE.Mesh( geometry, materialPoignees );
  poigneeGroup.add(poignee);
}

const largeurEvier = 100;
const profondeurEvier = 48;
const hauteurEvier = 50;
let evierGroup = new THREE.Group();
let evierGeometries = new THREE.Group();
let evierBrushGeometry = new THREE.BoxGeometry(largeurEvier,10000,profondeurEvier);
let evierHandleGeometry = new THREE.BoxGeometry(largeurEvier,2,profondeurEvier);
let evierHandle = new THREE.Mesh(evierHandleGeometry,materialHelper.clone());
let evierBrush = new THREE.Mesh(evierBrushGeometry,materialHelper);
evierBrush.visible=false;
evierHandle.material.visible=false;
evierHandle.name="evierHandle";
evierHandle.shortName="handleBloc";
evierBrush.name="evierBrush";
console.log(evierHandle);
evierHandle.add(evierBrush);
evierHandle.add(evierGeometries);
evierGeometries.visible=true;
evierHandle.isSelected=false;
evierGroup.add(evierHandle);
evierGeometries.position.set(0,0,profondeurEvier/2+2);

function initializeEvier() {
  let name="/src/evier.glb";
  const loader = new GLTFLoader();
  loader.load(name, function (gltf) {
    let evierRoot = gltf.scene.getObjectByName('evier');
    for (var i = evierRoot.children.length; i > 0; i--) {
      evierGeometries.add(evierRoot.children[i - 1]);
    }
    evierGeometries.scale.set(100, 100, 100);
  });
  //scene.add(evierHandle);
}

let fourGroup = new THREE.Group();
fourGroup.name="four";
function initializeFour() {
  let name="/src/four.glb";
  const loader = new GLTFLoader();
  loader.load(name, function (gltf) {
    let fourRoot = gltf.scene.getObjectByName('C-FOUR');
    for (var i = fourRoot.children.length; i > 0; i--) {
      fourGroup.add(fourRoot.children[i - 1]);
    }
    fourGroup.scale.set(100, 100, 100);
  });
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

function refreshInterface() {
  refreshInterfaceMeuble();
  refreshInterfaceBlocs();
  refreshInterfaceSousMeuble();
  refreshInterfaceAspect();  
}


function clearInterfaceSousMeuble() {
  sousMeublesSliders.innerHTML="";
  //selectListSousMeubles.innerHTML="";
  //selectListMeubles.classList.remove("animationMeublesName");
}

function refreshInterfaceSousMeuble() {
  clearInterfaceSousMeuble();
  createInterfaceSousMeuble(); // Rebuild HTML content
  if (displayWarning(expandSousMeubles,sousMeublesData,warningSousMeubles,(selectedSousMeuble))) return;
}

function createInterfaceSousMeuble() { // Rebuild HTML content
  //nbBlocs
  if (!selectedSousMeuble) return;
  let retour = createSliderWithoutListener(selectedSousMeuble,"nbBlocs","Nombre de blocs",selectedSousMeuble.nbBlocs,0,1,maxBlocs);
  let nbBlocsSousMeubleDiv = retour[0];
  nbBlocsSousMeubleDiv.querySelector("#slider").addEventListener("input",function (event) {
    changeBlocsQuantityOnSelection(Number(event.target.value));
    nbBlocsSousMeubleDiv.querySelector("#number").value=Number(event.target.value); //refresh
  },false);
  nbBlocsSousMeubleDiv.querySelector("#number").addEventListener("change",function (event) {
    changeBlocsQuantityOnSelection(Number(event.target.value));
    nbBlocsSousMeubleDiv.querySelector("#slider").value=Number(event.target.value); //refresh
  },false);
  sousMeublesSliders.append(nbBlocsSousMeubleDiv);

 /*  //profondeur meuble
  let elp=createSlider(meuble,"profondeur","Profondeur",meuble.profondeur,0,10,250);
  elp.querySelector("#slider").addEventListener("input",function eventElpInput() {selectedMeuble.update();frameCamera();},false);
  elp.querySelector("#number").addEventListener("change",function eventElpChange() {selectedMeuble.update();frameCamera();},false);
  sousMeublesSliders.append(elp); */

  retour = createSliderWithoutListener(selectedSousMeuble.blocs[0], "nbEtageres", "Nombre d'étagères", selectedSousMeuble.blocs[0].nbEtageres, 0, 0, maxEtageres);
  let sliderEtageresSousMeuble=retour[0];

  //Nombre d'étageres
  sliderEtageresSousMeuble.querySelector("#slider").addEventListener("input", function (event) {
    //raz des positions prédéfinies si changement de nb d'étageres ?;
    setEtageresNumberOnSelection(Number(event.target.value));
    sliderEtageresSousMeuble.querySelector("#number").value=Number(event.target.value); //refresh
  }, false);

  sliderEtageresSousMeuble.querySelector("#number").addEventListener("change", function (event) {
    setEtageresNumberOnSelection(Number(event.target.value));
    sliderEtageresSousMeuble.querySelector("#slider").value=Number(event.target.value); //refresh
  }, false);

  sousMeublesSliders.append(sliderEtageresSousMeuble);
}

function refreshInterfaceMeuble() {
  clearInterfaceMeuble();
  createInterfaceMeuble(); // Rebuild HTML content
  refreshButtonsMeuble();
  if (displayWarning(expandMeubleData,meubleHiddenIfEmpty,warningMeuble,(indiceCurrentMeuble==-1))) return;
  meubleHiddenIfEmpty.style.display="";
}

function clearInterfaceMeuble() {
  meubleSliders.innerHTML="";
  nbBlocsSlider.innerHTML="";
  parametresData.innerHTML="";
  selectListMeubles.innerHTML="";
  selectListMeubles.classList.remove("animationMeublesName");
}

function changeCurrentMeuble(meuble,highlight) {
  indiceCurrentMeuble = meuble.numero;
  selectedMeuble=meuble;
  select(meuble,highlight);
  refreshCheckboxMeuble();
  refreshInterface();
  updateAllSelectable();
}

function changeCurrentMeubleFromClick(meuble,highlight) {
  changeCurrentMeuble(meuble,highlight);
  selectListMeubles.classList.remove("animationMeublesName");
  selectListMeubles.offsetWidth; //pour temporisation
  selectListMeubles.classList.add("animationMeublesName");
  checkRaycast();
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

function onMaterialAnimationFinish (meuble) {
  clipActionMaterial.stop();
  clipActionMaterial.reset();
  let boiteSelection = meuble.selectionBox;

  boiteSelection.material = materialSelectionMeuble;
  mixerMaterial.removeEventListener('finished', onMaterialAnimationFinish, false);
  mixerMaterial=undefined;
  showChildren(boiteSelection);
  boiteSelection.visible = false;

}

var materialSelectionMeubleAnim,offset,clipMaterial,mixerMaterial,clipActionMaterial,clock;

function initializeAnimations() {
  materialSelectionMeubleAnim = new THREE.MeshBasicMaterial( materialSelectionMeubleParams );
  //materialSelectionMeubleAnim.depthTest=false;
  offset = new THREE.NumberKeyframeTrack( '.opacity', [ 0, 1 ], [ 0.5,0] )
  clipMaterial = new THREE.AnimationClip( 'opacity_animation', 1, [ offset ] );
  clock = new THREE.Clock();
}

function flashMeuble(meuble) {
  let boiteSelection = meuble.selectionBox;
  boiteSelection.material = materialSelectionMeubleAnim;
  hideChildren(boiteSelection);
  boiteSelection.visible = true;
  mixerMaterial = new THREE.AnimationMixer( materialSelectionMeubleAnim );
  clipActionMaterial = mixerMaterial.clipAction( clipMaterial );
  clipActionMaterial.setLoop(0,1);
  clipActionMaterial.play();
  mixerMaterial.addEventListener( 'finished', function finishMaterialAnim() {onMaterialAnimationFinish(meuble)}, false )
}
  
function changeCurrentMeubleFromPopup(num) {
  changeCurrentMeuble(meubles[num],false);
  flashMeuble(meubles[num]);
}

function createInterfaceMeuble() { // Rebuild HTML content for list meubles
  let meuble = selectedMeuble;
  //dropdown list meuble
  for (var i=0;i<meubles.length;i++) {
    let o = document.createElement("option");
    o.value = i;
    o.innerHTML = meubles[i].name;
    if (i==indiceCurrentMeuble) o.selected="selected";
    selectListMeubles.append(o);
  }
  if (indiceCurrentMeuble==-1) selectListMeubles.value="";

  //nbBlocs
  let retour = createSliderWithoutListener(meuble,"nbBlocs","Nombre de blocs",meuble.nbBlocs,0,1,maxBlocs);
  let nbBlocsDiv = retour[0];
  nbBlocsDiv.querySelector("#slider").addEventListener("input",function (event) {
    changeBlocsQuantity(Number(event.target.value));
  nbBlocsDiv.querySelector("#number").value=Number(event.target.value); //refresh
  },false);
  nbBlocsDiv.querySelector("#number").addEventListener("change",function (event) {
    changeBlocsQuantity(Number(event.target.value));
  nbBlocsDiv.querySelector("#slider").value=Number(event.target.value); //refresh
  },false);
  nbBlocsSlider.append(nbBlocsDiv);

  //hauteur meuble
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
    refreshInterfaceBlocs();
    selectedMeuble.update();
    refreshInterfaceHauteur();
    frameCamera();
  }

 //profondeur meuble
 profondeurDiv=createSlider(meuble,"profondeur","Profondeur",meuble.profondeur,0,10,250);
 profondeurDivSlider = profondeurDiv.querySelector("#slider");
 profondeurDivInput = profondeurDiv.querySelector("#number"); 
 profondeurDivSlider.addEventListener("change",function eventElpInput() {eventProfondeurSliderReleased()},false);
 profondeurDivSlider.addEventListener("input",function eventElpInput() {eventProfondeurSliderInput()},false);
 profondeurDivInput.addEventListener("change",function eventElpChange() {eventProfondeurDivInput()},false);
 meubleSliders.append(profondeurDiv);

  var maxDepth = undefined;
  function eventProfondeurSliderReleased() {
    selectedMeuble.recaleDansPiece();
    refreshInterfaceMeuble();
    maxDepth = undefined;
  }
  
  function eventProfondeurSliderInput() {
    if (!maxDepth) maxDepth=selectedMeuble.getMaxAllowedDepth();
    let profondeur=+profondeurDivSlider.value; //forçage de type
    selectedMeuble.profondeur = (profondeur<maxDepth) ? profondeur : maxDepth;
    selectedMeuble.update();
    selectedMeuble.recaleDansPiece();
    refreshInterfaceProfondeur();
    frameCamera();
  }

  function eventProfondeurDivInput() {
    eventProfondeurSliderInput();
    eventProfondeurSliderReleased();
    refreshInterfaceMeuble();
  }

  //largeur meuble
  largeurDiv=createSlider(meuble,"largeur","Largeur",meuble.largeur,0,10,500);
  meubleSliders.append(largeurDiv);
  largeurSlider=largeurDiv.querySelector("#slider");
  largeurDivInput=largeurDiv.querySelector("#number");
  largeurSlider.addEventListener("change",function() {eventLargeurSliderReleased()},false);
  largeurSlider.addEventListener("input",function() {eventLargeurSliderInput()},false);
  largeurDivInput.addEventListener("change",function() {eventLargeurDivInput()},false);

  var maxWidth = undefined;
  function eventLargeurSliderReleased() {
    console.log("slider released");
    maxWidth = undefined;
  }
  
  function eventLargeurSliderInput() {
    if (!maxWidth) maxWidth=selectedMeuble.getMaxAllowedWidth();
    var largeur=+largeurSlider.value; //forçage de type
    selectedMeuble.largeur = (largeur<maxWidth) ? largeur : maxWidth;
    selectedMeuble.computeBlocsSize();
    refreshInterfaceBlocs();
    selectedMeuble.update();
    refreshInterfaceLargeur();
    frameCamera();
  }

  function eventLargeurDivInput() {
    eventLargeurSliderInput();
    eventLargeurSliderReleased();
  }

  //placement horizontal meuble
  retour = createSliderWithoutListener(meuble,"x","Placement horizontal",meuble.x,0,-largeurPiece/2,largeurPiece/2);
  XDiv=retour[0];
  XDivSlider=retour[1];
  XDivInput=retour[2];
  XDivSlider.addEventListener("input",function () {eventXDivInput(+XDivSlider.value)},false); //forçage de type
  XDivInput.addEventListener("change",function () {eventXDivInput(+XDivInput.value)},false);  //forçage de type
  meubleSliders.append(XDiv);

  function eventXDivInput(x) {
    var translateX = selectedMeuble.getLimitTranslationX();  //calcul collision
    x = (x<translateX[0]) ? translateX[0] : x;
    x = (x>translateX[1]) ? translateX[1] : x;
    selectedMeuble.x = x;
    selectedMeuble.placeMeuble();
    XDivSlider.value = selectedMeuble.x;
    XDivInput.value = XDivSlider.value;
    frameCamera();
  }

  //placement vertical meuble 
  retour = createSliderWithoutListener(meuble,"y","Placement vertical",meuble.y,0,0,hauteurPiece);
  YDiv=retour[0];
  YDivSlider=retour[1];
  YDivInput=retour[2];
  YDivSlider.addEventListener("input",function () {eventYDivInput(+YDivSlider.value)},false); //forçage de type
  YDivInput.addEventListener("change",function () {eventYDivInput(+YDivInput.value)},false);  //forçage de type
  meubleSliders.append(YDiv);

  function eventYDivInput(y) {
    var translateY = selectedMeuble.getLimitTranslationY(); //collision
    y = (y<translateY[0]) ? translateY[0] : y;
    y = (y>translateY[1]) ? translateY[1] : y;
    selectedMeuble.y = y;
    selectedMeuble.placeMeuble();
    YDivSlider.value = selectedMeuble.y;
    YDivInput.value = YDivSlider.value;
    frameCamera();
  }

   //placement profondeur meuble
   retour = createSliderWithoutListener(meuble,"z","Placement en profondeur",meuble.z,0,0,profondeurPiece);
   ZDiv=retour[0];
   ZDivSlider=retour[1];
   ZDivInput=retour[2];
   ZDivSlider.addEventListener("input",function () {eventZDivInput(+ZDivSlider.value)},false); //forçage de type
   ZDivInput.addEventListener("change",function () {eventZDivInput(+ZDivInput.value)},false);  //forçage de type
   meubleSliders.append(ZDiv);
 
   function eventZDivInput(z) {
     var translateZ = selectedMeuble.getLimitTranslationZ();  //calcul collision
     z = (z<translateZ[0]) ? translateZ[0] : z;
     z = (z>translateZ[1]) ? translateZ[1] : z;
     selectedMeuble.z = z;
    
     selectedMeuble.placeMeuble();
     ZDivSlider.value = selectedMeuble.z;
     ZDivInput.value = ZDivSlider.value;
     frameCamera();
   }

  //parametres

  //epaisseur etageres
  let epaisseurDiv = createSlider(meuble, "epaisseur", "Epaisseur des étagères", meuble.epaisseur, 0, 0, 20);
  parametresData.append(epaisseurDiv);
  let epaisseurSlider = epaisseurDiv.querySelector("#slider");
  let epaisseurInput = epaisseurDiv.querySelector("#number");
  epaisseurSlider.addEventListener("input", function () { eventEpaisseurInput(+epaisseurSlider.value) }, false);
  epaisseurInput.addEventListener("change", function () { eventEpaisseurInput(+epaisseurInput.value) }, false);

  function eventEpaisseurInput(ep) {
    selectedMeuble.update();
  }

  //epaisseur cadre
  let epaisseurCadreDiv = createSlider(meuble, "epaisseurCadre", "Epaisseur du cadre", meuble.epaisseurCadre, 0, 0, 20);
  parametresData.append(epaisseurCadreDiv);
  let epaisseurCadreSlider = epaisseurCadreDiv.querySelector("#slider");
  let epaisseurCadreInput = epaisseurCadreDiv.querySelector("#number");
  epaisseurCadreSlider.addEventListener("input", function () { eventEpaisseurCadreInput(+epaisseurCadreSlider.value) }, false);
  epaisseurCadreInput.addEventListener("change", function () { eventEpaisseurCadreInput(+epaisseurCadreInput.value) }, false);

  function eventEpaisseurCadreInput(ep) {
    selectedMeuble.update();
  }

  //epaisseur montants
  let epaisseurMontantsDiv = createSlider(meuble, "epaisseurMontants", "Epaisseur des montants", meuble.epaisseurMontants, 0, 0, 20);
  parametresData.append(epaisseurMontantsDiv);
  let epaisseurMontantsSlider = epaisseurMontantsDiv.querySelector("#slider");
  let epaisseurMontantsInput = epaisseurMontantsDiv.querySelector("#number");
  epaisseurMontantsSlider.addEventListener("input", function () { eventepaisseurMontantsInput(+epaisseurMontantsSlider.value) }, false);
  epaisseurMontantsInput.addEventListener("change", function () { eventepaisseurMontantsInput(+epaisseurMontantsInput.value) }, false);

  function eventepaisseurMontantsInput(ep) {
    selectedMeuble.update();
  }

  refreshCheckboxMeuble();
  refreshButtonTourner();
  refreshButtonFrigo();
  refreshButtonPlateau();
  refreshButtonCadre();
  refreshButtonEvier();
  refreshButtonFixationGroup();
  refreshButtonDelete();
  refreshButtonDupliquerMeuble();
}

function refreshCheckboxMeuble() {
  if (selectedMeuble.disposition=="vertical") {checkboxVertical.checked=true} else {checkboxVertical.checked=false}
  if (selectedMeuble.isSimple) {checkboxSimple.checked=true} else {checkboxSimple.checked=false}
  if (selectedMeuble.hasCotesEleves) {checkboxCotesEleves.checked=true} else {checkboxCotesEleves.checked=false}
  if (selectedMeuble.hasMontants) {
    checkboxMontants.checked=true;
    checkboxRoundedMontants.disabled=false;
    checkboxMontantsInterieurs.disabled=false;
    checkboxMontantsExterieurs.disabled=false;
    checkboxMontantsIntermediaires.disabled=false;
    checkboxCotesEleves.disabled=false;
  }
  else {
    checkboxMontants.checked=false;
    checkboxRoundedMontants.disabled=true;
    checkboxMontantsInterieurs.disabled=true;
    checkboxMontantsExterieurs.disabled=true;
    checkboxMontantsIntermediaires.disabled=true;
    checkboxCotesEleves.disabled=true;
  }
  if (selectedMeuble.hasRoundedMontants) {checkboxRoundedMontants.checked=true} else {checkboxRoundedMontants.checked=false}
  if (selectedMeuble.hasMontantsInterieurs) {checkboxMontantsInterieurs.checked=true} else {checkboxMontantsInterieurs.checked=false}
  if (selectedMeuble.hasMontantsExterieurs) {checkboxMontantsExterieurs.checked=true} else {checkboxMontantsExterieurs.checked=false}
  if (selectedMeuble.hasMontantsIntermediaires) {checkboxMontantsIntermediaires.checked=true} else {checkboxMontantsIntermediaires.checked=false}
  if (selectedMeuble.hasEtagereUnique) {checkboxEtagereUnique.checked=true} else {checkboxEtagereUnique.checked=false}
  if (selectedMeuble.hasEtagereZero) {checkboxEtagereZero.checked=true} else {checkboxEtagereZero.checked=false}
  if (selectedMeuble.hasEtagereFinale) {checkboxEtagereFinale.checked=true} else {checkboxEtagereFinale.checked=false}
  if (selectedMeuble.hasPlancheBas) {checkboxPlancheBas.checked=true} else {checkboxPlancheBas.checked=false}
  if (selectedMeuble.hasPlancheHaut) {checkboxPlancheBas.checked=true} else {checkboxPlancheHaut.checked=false}
  if (selectedMeuble.hasPlancheGauche) {checkboxPlancheBas.checked=true} else {checkboxPlancheGauche.checked=false}
  if (selectedMeuble.hasPlancheDroite) {checkboxPlancheDroite.checked=true} else {checkboxPlancheDroite.checked=false}
  if (selectedMeuble.hasPlancheFond) {checkboxPlancheFond.checked=true} else {checkboxPlancheFond.checked=false}
  if (selectedMeuble.hasPlanchesIntermediaires) {checkboxPlanchesIntermediaires.checked=true} else {checkboxPlanchesIntermediaires.checked=false}
}

function refreshButtonDelete() {
  if (indiceCurrentMeuble!=-1) {
    buttonDeleteMeuble.disabled = false;
  }
  else {
    buttonDeleteMeuble.disabled = true;
  }
}

function refreshButtonDupliquerMeuble() {
  if (indiceCurrentMeuble!=-1) {
    buttonDupliquerMeuble.disabled = false;
  }
  else {
    buttonDupliquerMeuble.disabled = true;
  }
}

function refreshCheckboxVertical() { if (selectedMeuble.disposition=="vertical") {checkboxVertical.checked=true} else {checkboxVertical.checked=false}}
function refreshCheckboxMurFond() { if (selectedMeuble.onMurFond) {checkboxMurFond.checked=true} else {checkboxMurFond.checked=false}}
function refreshCheckboxMurGauche() { if (selectedMeuble.onMurGauche) {checkboxMurGauche.checked=true} else {checkboxMurGauche.checked=false}}
function refreshCheckboxMurDroit() { if (selectedMeuble.onMurDroit) {checkboxMurDroit.checked=true} else {checkboxMurDroit.checked=false}}
function refreshCheckboxSurSol() { if (selectedMeuble.surSol) {checkboxSurSol.checked=true} else {checkboxSurSol.checked=false}}
function refreshCheckboxSimple() { if (selectedMeuble.isSimple) {checkboxSimple.checked=true} else {checkboxSimple.checked=false}}

function refreshButtonsMeuble() {
  refreshCheckboxVertical();
  refreshCheckboxMurFond();
  refreshCheckboxMurGauche();
  refreshCheckboxMurDroit();
  refreshCheckboxSurSol();
  refreshCheckboxSimple();
  refreshButtonTourner();
}

function refreshButtonTourner() {
  if (!selectedMeuble.surSol) buttonTourner.disabled=true
    else buttonTourner.disabled=false;
}

function refreshButtonFrigo() { if (frigo!=undefined) {buttonFrigo.className="buttonOn"} else {buttonFrigo.className="buttonOff"}}

function refreshButtonPlateau() { if (selectedMeuble.hasPlateau) {buttonPlateau.className="buttonOn"} else {buttonPlateau.className="buttonOff"}}
function refreshButtonCadre() { if (selectedMeuble.hasCadre) {buttonCadre.className="buttonOn"} else {buttonCadre.className="buttonOff"}}
function refreshButtonSocle() { if (selectedMeuble.hasSocle) {buttonSocle.className="buttonOn"} else {buttonSocle.className="buttonOff"}}
function refreshButtonPied() { if (selectedMeuble.hasPied) {buttonPied.className="buttonOn"} else {buttonPied.className="buttonOff"} }
function refreshButtonSuspendu() { if (selectedMeuble.IsSuspendu) {buttonSuspendu.className="buttonOn"} else {buttonSuspendu.className="buttonOff"}}
function refreshButtonEvier() { if (selectedMeuble.hasEvier) {buttonEvier.className="buttonOn"} else {buttonEvier.className="buttonOff"}}

function refreshButtonFixationGroup() {
  refreshButtonSocle();
  refreshButtonPied();
  refreshButtonSuspendu();
}

function refreshInterfaceLargeur() {
  largeurDiv.querySelector("#slider").value = selectedMeuble.largeur;
  largeurDiv.querySelector("#number").value = selectedMeuble.largeur;
}

function refreshInterfaceHauteur() {
  hauteurDiv.querySelector("#slider").value = selectedMeuble.hauteur;
  hauteurDiv.querySelector("#number").value = selectedMeuble.hauteur;
}

function refreshInterfaceProfondeur() {
  profondeurDiv.querySelector("#slider").value = selectedMeuble.profondeur;
  profondeurDiv.querySelector("#number").value = selectedMeuble.profondeur;
  ZDivSlider.value = selectedMeuble.z;
  ZDivInput.value = selectedMeuble.z;
  XDivSlider.value = selectedMeuble.x;
  XDivInput.value = selectedMeuble.x;
}

function refreshInterfaceX() {
  XDiv.querySelector("#slider").value = selectedMeuble.x;
  XDiv.querySelector("#number").value = selectedMeuble.x;
}

function refreshInterfaceY() {
  YDiv.querySelector("#slider").value = selectedMeuble.y;
  YDiv.querySelector("#number").value = selectedMeuble.y;
}

function refreshInterfaceZ() {
  ZDiv.querySelector("#slider").value = selectedMeuble.z;
  ZDiv.querySelector("#number").value = selectedMeuble.z;
}

function changeCurrentBlocFromClick(bloc) {
  indiceCurrentBloc = bloc.numero;
  refreshInterfaceBlocs();
  //flash input box
  selectListBlocs.classList.remove("animationBlocsName");
  selectListBlocs.offsetWidth; // pour temporisation
  selectListBlocs.classList.add("animationBlocsName");
  updateSelectableEtagere();
  updateSelectableHandleBloc();
}

function changeBlocsQuantity(num) {
  selectedMeuble.setBlocsQuantity(num);
  selectedMeuble.updateTaille();
  selectedMeuble.update();
  refreshInterfaceBlocs();
  refreshInterfaceLargeur();
  refreshInterfaceHauteur();
  updateScene();
  frameCamera();
}

function changeBlocsQuantityOnSelection(num) {
  for (var i=0; i<selectedObjects.length;i++) {
    console.log(selectedObjects[i]);
    selectedObjects[i].setBlocsQuantity(num);
    selectedObjects[i].updateTaille();
    selectedObjects[i].update();
  }
  refreshInterfaceBlocs();
  refreshInterfaceLargeur();
  refreshInterfaceHauteur();
  updateScene();
  frameCamera();
}

function rebuildInterfaceBlocs() {
  for (var i=0;i<selectedMeuble.initialMeuble.nbBlocs;i++) {
    let o = document.createElement("option");
    o.value = i;
    o.innerHTML="Bloc "+(i+1);
    if (i==indiceCurrentBloc) o.selected="selected";
    selectListBlocs.append(o);
  }
  if (indiceCurrentBloc==-1) {selectListBlocs.value=""}
}

function displayWarning(divExpand,divContent,divWarning,condition) {
  if (divExpand.className=="expandOff") {
    divWarning.style.display="none";
    return true;
  }
  if (condition) {
    divContent.style.display="none";
    divWarning.style.display="";
    return true;
  }
  divWarning.style.display="none";
  return false;
}

function refreshInterfaceContenu() {

  if (displayWarning(expandBloc,blocsData,warningBloc,(indiceCurrentMeuble==-1))) {  blocsData.style.display="none";}
  else {  blocsData.style.display="";}
  if (displayWarning(expandContenu,contenuData,warningContenu,(indiceCurrentMeuble==-1))) return;
  warningContenu.style.display="none";

  contenuData.style.display="";

  var object=selectedObjects[selectedObjects.length-1];
  if (!object) object=selectedMeuble;
  if (!object) object=meubles[indiceCurrentMeuble];
  if (object.type == "portes") {
    buttonPorte.className = "buttonOn";
    divPortes.style.display = "inline";
  }
  else {
    buttonPorte.className = "buttonOff";
    divPortes.style.display = "none";
  }
  if (object.type == "tiroirs") { buttonTiroirs.className = "buttonOn" } else { buttonTiroirs.className = "buttonOff" }
  if (object.type == "etageres") {
    buttonEtageres.className = "buttonOn";
    divEtageres.style.display = "inline";
  }
  else {
    buttonEtageres.className = "buttonOff"
    divEtageres.style.display = "none";
  }
  if (object.type == "panneau") { buttonPlein.className = "buttonOn" } else { buttonPlein.className = "buttonOff" }
  if (object.type == "four") { buttonFour.className = "buttonOn" } else { buttonFour.className = "buttonOff" }
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

function refreshInterfaceBlocs() {
  clearInterfaceBlocs();
  rebuildInterfaceBlocs();
  refreshBlocsButtons();
  if (indiceCurrentBloc!=-1) createSlidersBlocs();
  createSlidersEtageres();
  refreshInterfaceContenu();
  refreshInterfaceEtagere();
}

function  refreshInterfaceEtagere() {
  if (indiceCurrentBloc==-1 && indiceCurrentMeuble==-1) {
    buttonDiviserEtageres.disabled=true;
    buttonResetEtageres.disabled=true;
  }
  else {
    buttonResetEtageres.disabled=false;
    buttonDiviserEtageres.disabled=false;
  }
}

function clearInterfaceBlocs() {
  blocsSliders.innerHTML="";
  selectListBlocs.innerHTML="";
  etageresSliders.innerHTML="";
}

function refreshBlocsButtons() {
  if (indiceCurrentBloc == -1 || selectedMeuble.blocs.length==1 || selectedObjects.length==0) {
    buttonSupprimerBloc.disabled = true;
    buttonDecalerGauche.disabled = true;
    buttonDecalerDroite.disabled = true;
  }
  else {
    buttonSupprimerBloc.disabled = false;
    buttonDecalerGauche.disabled = false;
    buttonDecalerDroite.disabled = false;
  }
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

function flashBloc(num) {
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
  let numBloc = indiceCurrentBloc;
  let meuble = selectedMeuble;
  let retour;

  //Taille bloc
  retour = createSliderWithoutListener(meuble.blocs[numBloc], "taille", "Taille du bloc", meuble.blocs[numBloc].taille, 0, 10, 200);
  let slideLargeurBloc = retour[0];

  slideLargeurBloc.querySelector("#slider").addEventListener("input", function (event) {
    isPreviewOn=true;
    setTailleOnSelection(Number(event.target.value));
    slideLargeurBloc.querySelector("#number").value=Number(event.target.value); //refresh
  }, false);

  slideLargeurBloc.querySelector("#slider").addEventListener("change", function (event) {
    isPreviewOn=false;
    setTailleOnSelection(Number(event.target.value));
    slideLargeurBloc.querySelector("#number").value=Number(event.target.value); //refresh
  }, false);

  slideLargeurBloc.querySelector("#number").addEventListener("change", function (event) {
    setTailleOnSelection(Number(event.target.value));
    slideLargeurBloc.querySelector("#slider").value=Number(event.target.value); //refresh
  }, false);
  blocsSliders.append(slideLargeurBloc);
}

function createSlidersEtageres() {
  let numBloc=indiceCurrentBloc;
  if (indiceCurrentBloc==-1) numBloc = 0;
  let meuble;
  if (selectionMode=="elements" && selectedObjects.length>0) {
    meuble=selectedObjects[selectedObjects.length-1].meuble;
    numBloc=selectedObjects[selectedObjects.length-1].bloc.numero;
  }
  else meuble = selectedMeuble;
  let retour;

  retour = createSliderWithoutListener(meuble.blocs[numBloc], "nbEtageres", "Nombre d'étagères", meuble.blocs[numBloc].nbEtageres, 0, 0, maxEtageres);
  let sliderEtageres=retour[0];

  //Nombre d'étageres
  sliderEtageres.querySelector("#slider").addEventListener("input", function (event) {
    //raz des positions prédéfinies si changement de nb d'étageres ?;
    setEtageresNumberOnSelection(Number(event.target.value));
    sliderEtageres.querySelector("#number").value=Number(event.target.value); //refresh
  }, false);

  sliderEtageres.querySelector("#number").addEventListener("change", function (event) {
    setEtageresNumberOnSelection(Number(event.target.value));
    sliderEtageres.querySelector("#slider").value=Number(event.target.value); //refresh
  }, false);

  etageresSliders.append(sliderEtageres);
}

function setEtageresNumberOnSelection(num) {
  for (var i=0; i<selectedObjects.length; i++) {
    let object = selectedObjects[i];
    let type=object.constructor.name;
    if (type=="Meuble" || type=="Bloc" || type=="sousMeuble") object.setEtageresNumber(Number(num));
    if (type=="Element") object.bloc.setEtageresNumber(Number(num));
  }
  if (selectedObjects.length==0 && indiceCurrentMeuble>-1) selectedMeuble.setEtageresNumber(Number(num));
  updateScene();
  updateAllSelectable();
  frameCamera();
}

function setTailleOnBloc(bloc,taille) {  //à mettre en methode !!!
  let lMax=bloc.initialMeuble.getMaxAllowedWidth();
  let deltaMax=lMax-bloc.initialMeuble.largeur;
  let deltaTaille = taille-bloc.taille;
  let newTaille = (deltaTaille>deltaMax) ? bloc.taille+deltaMax: taille;
  bloc.taille=newTaille;
  bloc.initialMeuble.updateTaille();
  bloc.initialMeuble.update();
}

function setTailleOnSelection(taille) {
  taille=Number(taille);
  if ((selectionMode!="blocs" && selectionMode!="elements") || selectedObjects.length==0) {
    let bloc=meubles[indiceCurrentMeuble].blocs[indiceCurrentBloc];
    setTailleOnBloc(bloc,taille);
  }
  else {
  for (var i=0; i<selectedObjects.length; i++) {
    let object = selectedObjects[i];
    if (object.bloc) setTailleOnBloc(object.bloc,taille)
  }
}
  refreshInterfaceLargeur();
  refreshInterfaceHauteur();
  frameCamera();
}

function refreshInterfaceAspect() {
  slidersAspect.innerHTML="";
  let sliderOffsetPoigneesParam=createSlider(selectedMeuble,"offsetPoignees","Décalage",selectedMeuble.offsetPoignees,0,-100,100);

  let sliderOffsetPoignees=sliderOffsetPoigneesParam.querySelector("#slider");
  let inputOffsetPoignees=sliderOffsetPoigneesParam.querySelector("#number");

  sliderOffsetPoignees.addEventListener("input", function () {selectedMeuble.update()}, false);
  inputOffsetPoignees.addEventListener("input", function () {selectedMeuble.update()}, false);
  inputOffsetPoignees.addEventListener("change", function () {selectedMeuble.update()}, false);

  slidersAspect.append(sliderOffsetPoigneesParam);
}

window.addEventListener("DOMContentLoaded", initializeScene);
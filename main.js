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

function initListTexturesPlateau() {
  imagesPlateau[0] = new image("124_big.jpg", "124_big_thumb.jpg", "Noyer");
  imagesPlateau[1] = new image("126_chene_de_montreal.jpg", "126_chene_de_montreal_thumb.jpg", "Chêne de Montréal");
  imagesPlateau[2] = new image("149_big.jpg", "149_big_thumb.jpg", "Béton gris terra");
  imagesPlateau[3] = new image("274_big.jpg", "274_big_thumb.jpg", "Marbre de Teramo");
  imagesPlateau[4] = new image("355_bronze.jpg", "355_bronze_thumb.jpg", "Bronze");
  imagesPlateau[5] = new image("393_chene_vintage.jpg", "393_chene_vintage_thumb.jpg", "Chêne vintage");
  imagesPlateau[6] = new image("398_noyer_naturel.jpg", "398_noyer_naturel_thumb.jpg", "Noyer naturel");
  imagesPlateau[7] = new image("781_venato_bianco.jpg", "781_venato_bianco_thumb.jpg", "Venato Bianco");
  imagesPlateau[8] = new image("809_epic_ash_grain-quartz.jpg", "809_epic_ash_grain-quartz_thumb.jpg", "Ash grain - quartz");
  imagesPlateau[8] = new image("Plan-de-travail-stratifié-marbre-noir.jpg", "Plan-de-travail-stratifié-marbre-noir_thumb.jpg", "Marbre noir");
  imagesPlateau[9] = new image("plan-travail-beton.jpg", "plan-travail-beton_thumb.jpg", "Béton");
}


class configurationClass {
  constructor () {
    this.style = "style 1";
    meubles
  }
}

class blocClass {
  constructor (i) {
    this.taille = 40;
    this.etageres = 3;
    this.type="Tiroirs";
    this.ouverturePorte="gauche";
    this.nombrePortes="1";
    this.etageresVerticales=false;
    this.rentrant=false;
    this.numero=i;
    this.etagereY=[];
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
    for (var i=0; i<this.nbBlocs; i++) {this.bloc[i] = new blocClass(i)}
    this.calculTaille();
    this.plateau=false;  //////////////////////////////initialiser bouton et menus couleurs
    this.cadre=false;
    this.socle=false;
    this.pied=false;
    this.suspendu=true;
    this.offsetPoignees=0;
    this.blocRoot=[];    //Racine 3D de chaque bloc
    this.sousMeuble=false;

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
    return (this.largeur+this.cadre*epaisseurCadre*2);
  }

  getHauteurReelle() {
    var bordSup=Math.max(this.cadre*epaisseurCadre,this.plateau*epaisseurPlateau);
    return (this.hauteur+this.cadre*epaisseurCadre+this.socle*hauteurSocle+this.pied*hauteurPied+bordSup);
  }

  createGeometryRoot() {
    //let root=this.getObjectByName("meuble "+indiceCurrentMeuble);
    if (!this.root) {
      console.log("creating root meuble "+indiceCurrentMeuble);
    this.root = new THREE.Object3D();
    this.root.name = "meuble "+indiceCurrentMeuble;
    this.root.position.set(0,0,0);
    }
    else {console.log("root already exists !!!")}

    let blocs=this.root.getObjectByName("blocs");
    if (!blocs) {
      console.log("creating blocs "+indiceCurrentBloc);

    let blocs = new THREE.Object3D();
    blocs.name="blocs";
    this.root.add(blocs);
  }
  else {console.log("blocs "+indiceCurrentBloc+" already exists !!!")}
    scene.add(this.root);
  }

  placeMeuble() {
    let y=this.hauteur / 2 + this.y;
    if (this.cadre) y+=epaisseurCadre;
    if (this.socle) y+=hauteurSocle;
    if (this.pied) y+=hauteurPied;
    this.root.position.set(
      this.x,
      y,
      this.profondeur / 2);
  }

  updateMeuble () {
    //selectableBloc=[];
    if (this.root) {this.root.children=[];}
    this.createGeometryRoot();
    let blocs=this.root.getObjectByName("blocs");
    //plateau
    if (this.plateau) {
      let sx=this.largeur + 2 * debordPlateau;
      let sy=epaisseurPlateau;
      let sz=this.profondeur + debordPlateau;
      if (/*this.*/style=="Basique") {
        geometry = new THREE.BoxGeometry(sx,sy,sz);
        plateau = new THREE.Mesh(geometry, [materialPlateauCote,materialPlateauCote,materialPlateau,materialPlateau,materialPlateauAvant,materialPlateauAvant])
      }
        else {
          geometry = RoundEdgedBox( sx, sy, sz , 0.5 , 1,1,1,1);
          plateau = new THREE.Mesh(geometry, materialPlateau);
        }
  
      plateau.position.set(0, this.hauteur / 2 + epaisseurPlateau / 2, debordPlateau / 2);
      plateau.name = "plateau";
      plateau.sx=sx;
      plateau.sy=sy;
      plateau.sz=sz;
      blocs.add(plateau);
    }
    //socle
    if (this.socle) {
      geometry = new THREE.BoxGeometry(
        this.largeur,
        hauteurSocle,
        this.profondeur - retraitSocle);
      socle = new THREE.Mesh(geometry, material);
      let cadre=this.cadre*epaisseurCadre;
      socle.position.set(0, -this.hauteur / 2 - hauteurSocle / 2-cadre, -retraitSocle);
      socle.name = "socle";
      blocs.add(socle);
    }
    //pieds
    if (this.pied) {
      geometry = new THREE.BoxGeometry(
        largeurPied,
        hauteurPied,
        largeurPied);
      let cadre = this.cadre * epaisseurCadre;
      piedA = new THREE.Mesh(geometry, material);
      piedA.position.set(
        -this.largeur / 2+largeurPied/2,
        -this.hauteur / 2 - hauteurPied / 2 - cadre,
        this.profondeur / 2 - largeurPied/2);
      piedA.name = "piedA";
      blocs.add(piedA);
      piedB = new THREE.Mesh(geometry, material);
      piedB.position.set(
        this.largeur/2-largeurPied/2,
        -this.hauteur / 2 - hauteurPied / 2 - cadre,
        this.profondeur / 2 - largeurPied/2);
      piedB.name = "piedB";
      blocs.add(piedB);
      piedC = new THREE.Mesh(geometry, material);
      piedC.position.set(
        this.largeur/2-largeurPied/2,
        -this.hauteur / 2 - hauteurPied / 2 - cadre,
        -this.profondeur / 2 + largeurPied/2);
      piedC.name = "piedC";
      blocs.add(piedC);
      piedD = new THREE.Mesh(geometry, material);
      piedD.position.set(
        -this.largeur/2+largeurPied/2,
        -this.hauteur / 2 - hauteurPied / 2 - cadre,
        -this.profondeur / 2 + largeurPied/2);
        piedD.name = "piedD";
      blocs.add(piedD);
    }
    //cadre
    if (this.cadre) {
      geometry = new THREE.BoxGeometry(
        this.largeur + 2 * epaisseurCadre-0.05,
        epaisseurCadre,
        this.profondeur + debordCadre+0.05);
      let cadreHaut = new THREE.Mesh(geometry, materialCadreCote,materialCadreCote,materialCadre,materialCadre,materialCadreAvant,materialCadreAvant);
      cadreHaut.position.set(0, this.hauteur / 2 + epaisseurCadre / 2, debordCadre);
      cadreHaut.name = "cadreHaut";
      blocs.add(cadreHaut);
      let cadreBas = new THREE.Mesh(geometry, materialCadreCote,materialCadreCote,materialCadre,materialCadre,materialCadreAvant,materialCadreAvant);
      cadreBas.position.set(0, -this.hauteur / 2 - epaisseurCadre / 2, debordCadre);
      cadreHaut.name = "cadreBas";
      blocs.add(cadreBas);
      geometry = new THREE.BoxGeometry(
        epaisseurCadre,
        this.hauteur + 2 * epaisseurCadre-0.05,
        this.profondeur + debordCadre);
      let cadreGauche = new THREE.Mesh(geometry, materialCadreCote,materialCadreCote,materialCadre,materialCadre,materialCadreAvant,materialCadreAvant);
      cadreGauche.position.set(-this.largeur / 2- epaisseurCadre / 2, 0, debordCadre);
      cadreGauche.name = "cadreGauche";
      blocs.add(cadreGauche);
      let cadreDroit = new THREE.Mesh(geometry, materialCadreCote,materialCadreCote,materialCadre,materialCadre,materialCadreAvant,materialCadreAvant);
      cadreDroit.position.set(this.largeur / 2+ epaisseurCadre / 2, 0, debordCadre);
      cadreDroit.name = "cadreDroit";
      blocs.add(cadreDroit);
    }
    for (var i=0; i<this.nbBlocs; i++) {
      this.updateBloc(i);
      blocs.add(this.blocRoot[i]);
    }
    var cubeTemp=this.root.getObjectByName("boiteSelectionMeuble"+this.numero);
  if (cubeTemp)                  //children 1 = cubes de selection
      {
        this.root.remove(cubeTemp);
        geometry.dispose();
        material.dispose();
        delete selectableMeuble[this.numero];
      }
      let delta = 0.1*this.numero;
      //geometry = new THREE.BoxGeometry(this.largeur + epsilon + delta, this.hauteur + epsilon + delta, this.profondeur + epsilon + delta);
      geometry = RoundEdgedBox( this.largeur+delta+ epsilon, this.hauteur+delta+ epsilon, this.profondeur+delta+ epsilon , 3 , 2,2,2,2)
      cube = new THREE.Mesh(geometry, materialSelectionMeuble);
      cube.numero=this.numero;
      cube.name="boiteSelectionMeuble"+this.numero;
      cube.shortName="boiteSelectionMeuble";
      cube.visible=false;
    this.root.add(cube);
    //selectableMeuble[this.numero]=cube;
    this.placeMeuble();
    updateSelectableMeubles();
    updateSelectableBlocs();
    updateSelectableEtagere();
    //dragBlocControls.setObjects(selectableBloc);
  }

  initializeBloc(numBloc) {
    this.blocRoot[numBloc] = new THREE.Object3D();
    this.blocRoot[numBloc].name = "Bloc "+numBloc;
    var h;
    var l;
    var p;
    if (this.disposition=="horizontal") {l=this.bloc[numBloc].taille; h=this.hauteur;}
    if (this.disposition=="vertical") {l=this.largeur; h=this.bloc[numBloc].taille ;} 
    p=this.profondeur;
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
    this.blocRoot[numBloc].add(plancheBas,plancheHaut,plancheDroite,plancheGauche);
  
    //portes
    if (this.bloc[numBloc].type == "Portes") {
      var offset = this.bloc[numBloc].rentrant*epaisseur;
      if (this.bloc[numBloc].nombrePortes == "1") {
        geometry = getElementBase(l - 0.25 * epaisseur-2*offset, h-0.25*epaisseur-2*offset, epaisseur,style);
        etagere[0] = new THREE.Mesh(geometry, materialTiroirs);
        etagere[0].name = "porte 0";
        //poignee
        let poigneeB = poigneeGroup.clone(true);
        poigneeB.name="poignee";
        etagere[0].add(poigneeB);
        let deltaX=l/2 - 4*taillePoignees;
        if (deltaX<0) deltaX=0;
        if (this.bloc[numBloc].ouverturePorte=="droite") {deltaX*=-1; poigneeB.rotateZ(Math.PI/2);}
        else poigneeB.rotateZ(-Math.PI/2);  // a soumettre à option
        poigneeB.position.set(deltaX,0,epaisseur/2);
        etagere[0].position.set(0,0,this.profondeur/2-offset);
        this.blocRoot[numBloc].add(etagere[0]);
      }
      else {
        //porte gauche
        geometry = getElementBase(l/2 - 0.25 * epaisseur-offset/2, h-0.25*epaisseur-2*offset, epaisseur,style);
        etagere[0] = new THREE.Mesh(geometry, materialTiroirs);
        etagere[0].name = "porte 0";
        //poignee gauche
        let poigneeB = poigneeGroup.clone(true);
        poigneeB.rotateZ(-Math.PI/2);  // a soumettre à option
        poigneeB.name="poignee";
        etagere[0].add(poigneeB);
        let deltaX=l/4 - 4*taillePoignees;
        if (4*taillePoignees>l/4) deltaX=0;
        poigneeB.position.set(deltaX,0,epaisseur/2);
        etagere[0].position.set(-l/4+offset/2,0,p/2-offset);
        this.blocRoot[numBloc].add(etagere[0]);
  
        //porte droite
        etagere[1] = new THREE.Mesh(geometry, materialTiroirs);
        etagere[1].name = "porte 1";
        //poignee droite
        let poigneeC = poigneeGroup.clone(true);
        poigneeC.rotateZ(Math.PI/2);  // a soumettre à option
        etagere[1].add(poigneeC);
        deltaX*=-1
        poigneeC.position.set(deltaX,0,epaisseur/2);
        poigneeC.name="poignee";
        etagere[1].position.set(l/4-offset/2,0,p/2-offset);
        this.blocRoot[numBloc].add(etagere[1]);
      }
    }
    
    //etageres
    if (this.bloc[numBloc].type == "Etageres" || this.bloc[numBloc].type == "Tiroirs") {
      if (this.bloc[numBloc].etageresVerticales) {
        //var haut=h/this.nbBlocs;
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
          this.blocRoot[numBloc].add(etagere[i]);
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
          this.blocRoot[numBloc].add(etagere[i]);
        }
      }
    }
  
    //tiroirs
    if (this.bloc[numBloc].type == "Tiroirs") {
      var offset = this.bloc[numBloc].rentrant*epaisseur;
      var step = (h-0.25*epaisseur-offset)/(this.bloc[numBloc].etageres+1);
      for (var i = 0; i < this.bloc[numBloc].etageres+1; i++) {

        var yPredefini = this.bloc[numBloc].etagereY[i];
        if (!yPredefini) {
          var positionYEtagere = step * (0.5 + i - this.bloc[numBloc].etageres / 2);
        }
        else {var positionYEtagere=yPredefini;}


         var yPredefiniEtagerePrecedent = this.bloc[numBloc].etagereY[i-1];
        if (!yPredefiniEtagerePrecedent) {
          var yPredefiniEtagerePrecedent = step * (0.5 + (i-1) - this.bloc[numBloc].etageres / 2);
        }
 

        var yPredefiniEtagereSuivant = this.bloc[numBloc].etagereY[i+1];
        if (!yPredefiniEtagereSuivant) {
          var yPredefiniEtagereSuivant = step * (0.5 + (i+1) - this.bloc[numBloc].etageres / 2);
        }


        let yl= positionYEtagere-yPredefiniEtagerePrecedent;

        let yPos = positionYEtagere-yl/2;

console.log(yPredefini,yPredefiniEtagerePrecedent,yPredefiniEtagereSuivant,yl,yPos);

        let xl = l - 0.25 * epaisseur - 2*offset;
        //let yl = (h - epaisseur - offset/2)/(this.bloc[numBloc].etageres+1);//-epaisseur/4;
        let zl = epaisseur;
        //geometry = new THREE.BoxGeometry(xl, yl, zl);
        geometry = getElementBase(xl,yl,zl,style);
        etagere[i] = new THREE.Mesh(geometry, materialTiroirs);
        etagere[i].name = "tiroir "+i;
        etagere[i].shortName = "tiroir";
        //poignees
        let poigneeB = poigneeGroup.clone(true);
        poigneeB.name="poignee";
        etagere[i].add(poigneeB);
        let posY=yl*(this.offsetPoignees/250);
        poigneeB.position.set(0,posY,epaisseur/2);//epaisseur+taillePoignees);
        //var positionY = step * (i - this.bloc[numBloc].etageres / 2);
        var positionZ = p/2;
        //etagere[i].position.set(0, positionY, positionZ-offset);
        etagere[i].position.set(0, yPos, positionZ-offset);

        this.blocRoot[numBloc].add(etagere[i]);
      }
    }
   
    //sous-meuble
    if (this.bloc[numBloc].type == "SousMeuble") {
      var sousMeuble = new meubleClass(0);
      //if (this.disposition=="horizontal") {
        sousMeuble.largeur = 0+this.bloc[numBloc].taille;
        sousMeuble.computeBlocsSize();
        sousMeuble.hauteur = 0+this.hauteur;
        sousMeuble.x=0;
        sousMeuble.y=-this.hauteur/2;
        console.log("sousMeuble.largeur ",this.bloc[numBloc].taille,this.hauteur );
        console.log("sousMeuble.largeur ",sousMeuble.largeur,sousMeuble.hauteur );
      //}
      //var sousMeuble = new meubleClass(0);
      //if (this.disposition=="vertical") {
        //sousMeuble.largeur = this.largeur;
        //sousMeuble.hauteur = this.bloc[numBloc].hauteur;
      //}
      sousMeuble.sousMeuble=true;
      sousMeuble.createGeometryRoot();
      sousMeuble.updateMeuble();
      sousMeuble.root.translateZ(-this.profondeur/2);
      this.blocRoot[numBloc].add(sousMeuble.root);
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
        this.blocRoot[numBloc].position.set(blocPosition, 0, 0)
      } 
      else {
        this.blocRoot[numBloc].position.set(0, blocPosition, 0);
      }
  
      //shadows
     this.blocRoot[numBloc].traverse(function (child) {
        child.receiveShadow = true;
        child.castShadow = true;
      }) 
  
    //boîte de sélection
    //geometry = new THREE.BoxGeometry( this.bloc[numBloc].largeur+epsilon, this.hauteur+epsilon, this.profondeur+epsilon );
    geometry = RoundEdgedBox(l+epsilon, h+epsilon, p+epsilon,2,1,1,1,1);
    //geometry = getElementBase(this.bloc[numBloc].largeur+epsilon, this.hauteur+epsilon, this.profondeur+epsilon,style);
    boiteSelectionBloc[numBloc] = new THREE.Mesh( geometry, materialSelectionBloc );
    boiteSelectionBloc[numBloc].name = "boiteSelectionBloc"+numBloc;
    boiteSelectionBloc[numBloc].shortName="boiteSelectionBloc";
    boiteSelectionBloc[numBloc].numeroMeuble = this.numero;
    boiteSelectionBloc[numBloc].bloc = this.bloc[numBloc];
    this.blocRoot[numBloc].add(boiteSelectionBloc[numBloc]);
    boiteSelectionBloc[numBloc].visible=false;
    boiteSelectionBloc[numBloc].numero=numBloc;
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

  updateBloc (numBloc) {
    this.initializeBloc(numBloc);
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
      if (((typeof this.bloc[i]))=="undefined") {this.bloc[i] = new blocClass(i)}
       else {if (i>(this.nbBlocs-1)) {this.destroyBloc(i)}}
    }
    if (indiceCurrentBloc>(this.nbBlocs-1)) {indiceCurrentBloc=this.nbBlocs-1;}
  }

  changeTexture(event) {
    let i=event.target.value;
    let piece=event.target.piece;
    if (piece=="plateau") {
      //console.log("indiceMeuble=",indiceMeuble);
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
    //if (piece="cadre") loadTexture(materialCadre,i);
  }
}

var style="Basique";
var selectionMode="meubles";

var indiceCurrentBloc = 0;
var indiceCurrentMeuble = 0;

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
var focaleV;
//var meubleRoot=[];  //Racine 3D de chaque meuble
var plancheBas;
var plancheHaut;
var plancheGauche;
var plancheDroite;
var plateau;
var socle;
var piedA,piedB,piedC,piedD;
//var cadre;
var poignee;
var geometry;
var cube;
var etagere=[];
var meubles=new Array;
var boiteSelectionBloc=[];       //pour selection des blocs dans la vue 3D
var selectableBloc=[];  //liste des boiteSelectionBlocs selectionnables par raycast
var selectableMeuble=[];
var selectableEtagere=[];
var raycastedBloc=-1;
var raycastedMeuble=-1;
var rayCastEnabled=true;
var origine = new THREE.Object3D();

//raycaster
let raycaster;
let IntersectedBloc;
let IntersectedMeuble;
let IntersectedEtagere;
const pointer = new THREE.Vector2();
pointer.x=-1;
pointer.y=-1;
const radius = 5;

const scene = new THREE.Scene();
var canvas = document.getElementById("canvas");
var canvasSize = canvas.getBoundingClientRect();
const camera = new THREE.PerspectiveCamera( focale, canvasSize.width/window.innerHeight, 0.1, 1000 );
focaleV=getfocaleV(focale,canvasSize.width,window.innerHeight);
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

// camera controls
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
var dragEtagereControls;
function initDrag() {
  var wA,hA;
  var aX,aY;//,bX,bY;
  //drag blocs
  dragBlocControls = new DragControls(selectableBloc, camera, renderer.domElement);

  dragBlocControls.addEventListener('dragstart', function (event) {
    controls.enabled=false;
    //dragMeubleControls.enabled=false;
    event.object.material.emissive.set(0xaaaaaa);
  });

  dragBlocControls.addEventListener('dragend', function (event) {
    controls.enabled=true;
    //dragMeubleControls.enabled=true;
    event.object.material.emissive.set(0x000000);
    var obj1=event.object;
    var num=event.object.numero;
    obj1.position.set(0,0,0);
    if ((raycastedBloc==-1) || (raycastedBloc==num) || (selectableBloc[raycastedBloc].numeroMeuble!=selectableBloc[num].numeroMeuble)) {console.log("nothing happens")}
      else {
        let bloc=meubles[selectableBloc[raycastedBloc].numeroMeuble].bloc;
        [bloc[num],bloc[raycastedBloc]]=[bloc[raycastedBloc],bloc[num]];
        //meubles[selectableBloc[raycastedBloc].numeroMeuble].updateMeuble();
        updateScene();
      }
  });

  //drag etageres
  dragEtagereControls = new DragControls(selectableEtagere, camera, renderer.domElement);

  dragEtagereControls.addEventListener('dragstart', function (event) {
    controls.enabled=false;
    rayCastEnabled=false;
    //dragBlocControls.enabled=false;
    //dragMeubleControls.enabled=false;
    event.object.material.emissive.set(0xaaaaaa);
    let id=event.object.numero;
    let blocId=event.object.numeroBloc;
    console.log("etager id=",id);
    console.log("bloc id=",blocId);
    let parent=event.object.parent;
    console.log("parent=",parent);
    let etagerePrecente = parent.getObjectByName("etagere "+(id-1));
    let etagereSuivante = parent.getObjectByName("etagere "+(id+1));
    console.log(etagerePrecente);
    console.log(etagereSuivante);
    if (etagerePrecente) {var yMin=etagerePrecente.position.y}
      else {var yMin = -meubles[indiceCurrentMeuble].hauteur/2+epaisseur/2}

      if (etagereSuivante) {var yMax=etagereSuivante.position.y}
      else {var yMax = meubles[indiceCurrentMeuble].hauteur/2-epaisseur/2}

      console.log("yMin, yMax = ",yMin,yMax);
      event.object.yMin=yMin+epaisseur;
      event.object.yMax=yMax-epaisseur;
      event.object.blocId=blocId;
  });

  dragEtagereControls.addEventListener('drag', function (event) {
    event.object.material.emissive.set(0xaaaaaa);
    var obj1=event.object;
    var num=obj1.numero;
    var blocId=obj1.blocId;
    console.log(blocId);
    let y=obj1.position.y;
    y= y>event.object.yMax ? event.object.yMax : y;
    y= y<event.object.yMin ? event.object.yMin : y;
    obj1.position.set(0,y,0);
    meubles[indiceCurrentMeuble].bloc[blocId].etagereY[event.object.numero] = event.object.position.y;
    meubles[indiceCurrentMeuble].updateMeuble();
  });

  dragEtagereControls.addEventListener('dragend', function (event) {
    event.object.material.emissive.set(0x000000);
    controls.enabled=true;
    rayCastEnabled=true;
   // meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].etagereY[event.object.numero] = event.object.position.y;
    //console.log("y final = ",meubles[indiceCurrentMeuble].bloc[blocId].etagereY[event.object.numero]);
  });







  //drag meubles
  dragMeubleControls=new DragControls(selectableMeuble, camera, renderer.domElement);

  dragMeubleControls.addEventListener('dragstart', function (event) {
    controls.enabled=false;
    rayCastEnabled=false;
    //dragBlocControls.enabled=false;
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
    let blocRoot=meubles[num].root.getObjectByName("blocs");
    obj1.attach(blocRoot); //on détache pour éviter les references circulaires dans les calculs de coordonnées
    blocRoot.position.set(0,0,0);
    let cadreA =meubles[num].cadre*epaisseurCadre;
    let plateauA = meubles[num].plateau*epaisseurPlateau;
    let piedA = meubles[num].pied*hauteurPied;
    let socleA = meubles[num].socle*hauteurSocle;
    let offsetHautA = Math.max(cadreA,plateauA);
    let offsetBasA = cadreA + piedA + socleA;
    wA=meubles[num].largeur+cadreA*2;
    hA=meubles[num].hauteur+offsetHautA+offsetBasA;//Math.max(cadreA*2,0);//meubles[num].plateau*epaisseurPlateau);
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
    //var worldPos = new THREE.Vector3();
    //var posMeuble = new THREE.Vector3();
    //var pos = new THREE.Vector3();
    //worldPos = obj1.position;
    //frameCamera();
  });

  function intersectWithOneOfAll(obj, num, aaX, aaY, wwA, hhA) {
    var pos = new THREE.Vector3();
    obj.localToWorld(pos);
    aaX = pos.x;
    aaY = pos.y-obj.offsetBasA/2+obj.offsetHautA/2;
    var intersectB = false;
    for (var i = 0; i < meubles.length; i++) {
      if (i != num) {

        var cadreB =meubles[i].cadre*epaisseurCadre;
        var plateauB = meubles[i].plateau*epaisseurPlateau;
        var piedB = meubles[i].pied*hauteurPied;
        var socleB = meubles[i].socle*hauteurSocle;
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
  
  function adjustObjectPosition(obj1,num,aX,aY,wA,hA,pos,count) {
    pos.z=obj1.zOk;
    if (count>meubles.length) {
      return
    }
    var wB, hB;
    var bX, bY, cadreB, plateauB, piedB, socleB;
    //var offsetBasA=obj1.offsetBasA;
    //var offsetHautA=obj1.offsetHautA;
    var offsetHautB,offsetBasB;
    var replace=false;
    //correction en y si on rentre dans le sol
    if (aY < hA/2) { pos.y += (hA/2 - aY); aY=hA/2 ; replace=true }
    for (var i = 0; i < meubles.length; i++) {
      if (i != num) {
        cadreB =meubles[i].cadre*epaisseurCadre;
        plateauB = meubles[i].plateau*epaisseurPlateau;
        piedB = meubles[i].pied*hauteurPied;
        socleB = meubles[i].socle*hauteurSocle;
        offsetHautB=Math.max(cadreB,plateauB);
        offsetBasB=socleB + piedB + cadreB;
        bX = meubles[i].x;
        wB = meubles[i].largeur+cadreB*2;
        hB = offsetBasB+meubles[i].hauteur+offsetHautB;
        bY = meubles[i].y + meubles[i].hauteur / 2 + offsetBasB/2 + offsetHautB/2;  // centre du bloc B
        //let hp=meubles[num].plateau*epaisseurPlateau;
        var intersect = (Math.abs(aX-bX)*2<(wA+wB)) && (Math.abs(aY-bY)*2<(hA+hB));
        if (intersect) {
          if (aX > bX) { var decalX = (aX-wA/2) - (bX+wB/2) }
          else { var decalX = (aX+wA/2)-(bX-wB/2)}
          if (aY > bY) { var decalY = (aY-hA/2) - (bY+hB/2) }
          else { var decalY = (aY+hA/2)-(bY-hB/2)}
          if ((Math.abs(decalX) > Math.abs(decalY)) && (obj1.yMeubleInit + pos.y > 0)) { pos.y -= decalY; aY -= decalY; }
          else { pos.x -= decalX; aX -= decalX; }
          replace = true;
        }
        //correction en y si on rentre dans le sol, après ajustement
        if (aY < hA/2) { pos.y += (hA/2 - aY); aY=hA/2; replace=true }
      }
    }
    if (replace) {
      if (intersectWithOneOfAll(obj1,num,pos.x,pos.y,wA,hA)==false) {
      obj1.xOk=pos.x; obj1.yOk=pos.y;
    }
    else {pos.x=obj1.xOk; pos.y=obj1.yOk;}
  }
  }

  dragMeubleControls.addEventListener('dragend', function (event) {
    controls.enabled=true;
    //dragBlocControls.enabled=true;
    rayCastEnabled=true;
    event.object.material.emissive.set(0x000000);
    var obj1=event.object;
    var num=event.object.numero;
    let blocRoot=obj1.getObjectByName("blocs");
    let parent=obj1.parent
    parent.attach(blocRoot); // on rattache une fois fini
    //parent.attach(obj1);
    blocRoot.position.set(0,0,0);
    obj1.position.set(0,0,0);
    meubles[num].placeMeuble();
    frameCamera();
  });
}

function updateSelectableBlocs() {
  selectableBloc = [];
  // if (selectionMode=="blocs") {
    scene.getObjectsByProperty("shortName","boiteSelectionBloc",selectableBloc);
    for (var i=0; i<selectableBloc.length; i++) {selectableBloc[i].numero=i}
  // }
  dragBlocControls.setObjects(selectableBloc);
}

function updateSelectableMeubles() {
  selectableMeuble = [];
  // if (selectionMode=="meubles") {
    scene.getObjectsByProperty("shortName","boiteSelectionMeuble",selectableMeuble);
  // }
  dragMeubleControls.setObjects(selectableMeuble);
}

function updateSelectableEtagere() {
  selectableEtagere = [];
  // if (selectionMode=="meubles") {
    let blocsRoot = scene.getObjectByName("meuble "+indiceCurrentMeuble).getObjectByName("blocs");//.getObjectByName("name","Bloc "+indiceCurrentBloc);//.getObjectsByProperty("shortName","etagere",selectableMeuble);
   //console.log("looking for Bloc " +indiceCurrentBloc);
    //let blocRoot = blocsRoot.getObjectByName("Bloc "+indiceCurrentBloc);
    console.log("blocsRoot=",blocsRoot);
    //console.log("blocRoot=",blocRoot);
    blocsRoot.getObjectsByProperty("shortName","etagere",selectableEtagere);
    console.log("selectableEtagere=",selectableEtagere);
    // }
  dragEtagereControls.setObjects(selectableEtagere);
}

//function getMeubleCenter

function intersectY(indiceMeubleA,indiceMeubleB) {
  var cadreA = meubles[indiceMeubleA].cadre*epaisseurCadre;
  var cadreB = meubles[indiceMeubleB].cadre*epaisseurCadre;
  var socleA = meubles[indiceMeubleA].socle*hauteurSocle;
  var socleB = meubles[indiceMeubleB].socle*hauteurSocle;
  var piedA = meubles[indiceMeubleA].pied*hauteurPied;
  var piedB = meubles[indiceMeubleB].pied*hauteurPied;
  var aY = meubles[indiceMeubleA].y + meubles[indiceMeubleA].hauteur / 2 + cadreA + socleA/2 + piedA/2;
  var bY = meubles[indiceMeubleB].y + meubles[indiceMeubleB].hauteur / 2 + cadreB + socleB/2 + piedB/2;
  var hA = meubles[indiceMeubleA].hauteur+cadreA+socleA+piedA;
  var hB = meubles[indiceMeubleB].hauteur+cadreB+socleB+piedB;
  var intersectY = (Math.abs(aY - bY) * 2 < (hA + hB));
  return intersectY;
}

function intersectX(indiceMeubleA,indiceMeubleB) {
  var cadreA = meubles[indiceMeubleA].cadre*epaisseurCadre;
  var cadreB = meubles[indiceMeubleB].cadre*epaisseurCadre;
  var xA=meubles[indiceMeubleA].x;
  var xB=meubles[indiceMeubleB].x;
  var lA=meubles[indiceMeubleA].largeur;
  var lB=meubles[indiceMeubleB].largeur;
  var intersectX = (Math.abs(xA - xB - cadreB) * 2 < (lA + lB + cadreA + cadreB));
  return intersectX;
}

function getLimitTranslationX(num) {
  var bY;
  //var aY = meubles[num].y + meubles[num].hauteur / 2 + meubles[num].cadre*epaisseurCadre;
  var minXGlobal=-10e34;
  var maxXGlobal=+10e34;
  var minX=-10e34;
  var maxX=10e34;
  for (var i = 0; i < meubles.length; i++) {
    if (i != num) {
      bY = meubles[i].y + meubles[i].hauteur / 2 + meubles[i].cadre*epaisseurCadre;
      if (intersectY(num,i)) {
          if (meubles[num].x > meubles[i].x) {
            minX = (meubles[i].x + meubles[i].largeur / 2 + meubles[i].cadre*epaisseurCadre) + (meubles[num].largeur / 2+meubles[num].cadre*epaisseurCadre);
          }
          if (meubles[num].x < meubles[i].x) {
            maxX = (meubles[i].x - meubles[i].largeur / 2 - meubles[i].cadre*epaisseurCadre) - (meubles[num].largeur / 2 + meubles[num].cadre*epaisseurCadre);
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
            minY = meubles[i].getHauteurReelle();//(yB + hB + bordSupB + piedB + socleB);
          }
          if (meubles[num].y < meubles[i].y) {
            maxY = yB-hAReelle;//-hA-bordSupA-piedA-socleA;
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
          deltaX = (meubles[num].x) - (meubles[i].x + meubles[i].largeur / 2 + meubles[i].cadre*epaisseurCadre + meubles[num].cadre*epaisseurCadre);
        }
        else {
          deltaX = (meubles[i].x - meubles[i].largeur / 2 - meubles[i].cadre*epaisseurCadre - meubles[num].cadre*epaisseurCadre) - (meubles[num].x);
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
  var cadreA = meubles[num].cadre*epaisseurCadre;
  var piedA = meubles[num].pied*hauteurPied;
  var socleA = meubles[num].socle*hauteurSocle;
  var plateauA = meubles[num].plateau*epaisseurPlateau;
  var hAReelle=meubles[num].getHauteurReelle();

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
  pointer.x = ( x / canvasSize.width ) * 2 - 1;
  pointer.y = - ( y / window.innerHeight ) * 2 + 1;
}

//Materials

  let loader2 = new THREE.TextureLoader();
  let textureBois = loader2.load('src/plywood_diff_4k.jpg');
  textureBois.wrapS = THREE.RepeatWrapping;
  textureBois.wrapT = THREE.RepeatWrapping;
  textureBois.repeat.set( 2, 2 );

const materialParams = {
  color: '#ffaa00',
  refractionRatio: 0.98,
  transparent: false,
  opacity: 1,
  map : textureBois
};

const materialTiroirsParams = {
  color: '#ffffff',
  refractionRatio: 0.98,
  transparent: false,
  opacity: 1,
  map : textureBois
};

const materialPoigneesParams = {
  color: '#bbbbbb',
  refractionRatio: 0.98,
  transparent: false,
  opacity: 1
};

const materialPlateauParams = {
  color: '#ffffff',
  refractionRatio: 0.98,
  transparent: false,
  opacity: 1,
  map:textureBois
};

const materialPlateauAvantParams = {
  color: '#ffffff',
  refractionRatio: 0.98,
  transparent: false,
  opacity: 1,
  map:textureBois
};

const materialPlateauCoteParams = {
  color: '#ffffff',
  refractionRatio: 0.98,
  transparent: false,
  opacity: 1,
  map:textureBois
};

const materialCadreParams = {
  color: '#ffffff',
  refractionRatio: 0.98,
  transparent: false,
  opacity: 1,
  map:textureBois
};

const materialSelectionBlocParams = {
  color: '#00ffff',
  refractionRatio: 0.98,
  transparent: true,
  opacity: 0.5
};

const materialSelectionEtagereParams = {
  color: '#0000ff',
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
const materialSelectionBloc = new THREE.MeshStandardMaterial( materialSelectionBlocParams);
const materialSelectionEtagere = new THREE.MeshStandardMaterial( materialSelectionEtagereParams);
const materialSelectionMeuble = new THREE.MeshStandardMaterial( materialSelectionMeubleParams);
const wireframeMaterial = new THREE.MeshBasicMaterial( 0x00ff00 );
wireframeMaterial.wireframe = true;

//Lights
const light = new THREE.DirectionalLight( 0xffffff, 1 );
light.position.set( 0.5, 1, 0.5 );
//light.castShadow = true;
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
//lightC.castShadow = true;
renderer.setClearColor( 0xAAAAAA, 1 );
scene.add( lightC );
const ambientLight = new THREE.AmbientLight( 0x404020,0.5 );
scene.add( ambientLight );
/*const helperA = new THREE.CameraHelper(lightA.shadow.camera);
scene.add(helperA);
const helperB = new THREE.CameraHelper(lightB.shadow.camera);
scene.add(helperB);
const helperC = new THREE.CameraHelper(lightC.shadow.camera);
scene.add(helperC);
const helperD = new THREE.CameraHelper(light.shadow.camera);
scene.add(helperD);*/

function checkRaycast() {
  if (!rayCastEnabled) return;
  raycaster.setFromCamera(pointer, camera, 0, 1000);
  //check intersect with blocs
  const intersects = raycaster.intersectObjects(selectableBloc, true);
  if (intersects.length > 0 && selectionMode=="blocs") {
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
  if (intersectsMeuble.length > 0 && selectionMode=="meubles") { //  && intersectsMeuble[0].object.numero!=indiceCurrentMeuble) {
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



    //check intersect with etageres
    const intersectsEtagere = raycaster.intersectObjects(selectableEtagere, true);
    if (intersectsEtagere.length > 0 && selectionMode=="etageres") { //  && intersectsMeuble[0].object.numero!=indiceCurrentMeuble) {
      if (IntersectedEtagere != intersectsEtagere[0].object) {
        if (IntersectedEtagere) {
          IntersectedEtagere.material.depthTest=false;
          IntersectedEtagere.material = material;
          IntersectedEtagere.renderOrder=1;
        }
        IntersectedEtagere = intersectsEtagere[0].object;
        IntersectedEtagere.material = materialSelectionEtagere;
        raycastedMeuble = intersectsEtagere[0].object.numero;
      }
    }
    else {
      if (IntersectedEtagere) {
        IntersectedEtagere.material = material;
        IntersectedEtagere.material.depthTest=true;
        IntersectedEtagere.renderOrder=0;
      }
      IntersectedEtagere = null;
      raycastedMeuble = -1;
    }
}




//raycast sur les objets 3d lors d'un changement de souris ou de camera
function onCanvasClick () {
  console.log("raycastedbloc=",raycastedBloc);
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
  //return;
  boundingBoxCenter = getGlobalBoundingBoxCenter();
  //controls.target = boundingBoxCenter;
  cameraTarget.position.set(boundingBoxCenter);
}

function updateScene () {
  for (var i=0; i<meubles.length; i++) {
    meubles[i].updateMeuble();
  }
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
var buttonSousMeuble;


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

function initializeScene() {
    buildEnvironnement ();
    initDrag();
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
  buttonSelectBloc = document.getElementById("buttonSelectBloc");
  buttonSelectEtagere = document.getElementById("buttonSelectEtagere");
  buttonSousMeuble = document.getElementById("buttonSousMeuble");

}

function initializeInterface() {
  getHTMLElements();

  // listeners
  // buttons blocs
  checkboxVertical.addEventListener("click", function switchVertical() {
    if (meubles[indiceCurrentMeuble].disposition == "vertical") meubles[indiceCurrentMeuble].disposition = "horizontal";
    else meubles[indiceCurrentMeuble].disposition = "vertical";
    meubles[indiceCurrentMeuble].computeBlocsSize();
    meubles[indiceCurrentMeuble].updateMeuble();
    frameCamera()
  }, false);
  buttonPorte.addEventListener("click", function () { 
    meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].type="Portes";
    refreshInterfaceBlocs(indiceCurrentMeuble);
    meubles[indiceCurrentMeuble].updateMeuble();
  }, false);
  buttonTiroirs.addEventListener("click", function () { 
    meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].type="Tiroirs"; 
    refreshInterfaceBlocs(indiceCurrentMeuble);
    meubles[indiceCurrentMeuble].updateMeuble();
  }, false);  
  buttonEtageres.addEventListener("click", function () { 
    meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].type="Etageres"; 
    refreshInterfaceBlocs(indiceCurrentMeuble);
    meubles[indiceCurrentMeuble].updateMeuble();
  }, false); 
  buttonPlein.addEventListener("click", function () { 
    meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].type="Panneau"; 
    refreshInterfaceBlocs(indiceCurrentMeuble);
    meubles[indiceCurrentMeuble].updateMeuble();
  }, false);

  buttonSousMeuble.addEventListener("click", function() {
    meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].type="SousMeuble"; 
    refreshInterfaceBlocs(indiceCurrentMeuble);
    meubles[indiceCurrentMeuble].updateMeuble();
  });

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
  buttonEtageresVerticales.addEventListener("click", function () {
    meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].etageresVerticales=!meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].etageresVerticales;
    meubles[indiceCurrentMeuble].updateMeuble();
  }, false);
  checkboxRentrant.addEventListener("click", function () {
    meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].rentrant=!meubles[indiceCurrentMeuble].bloc[indiceCurrentBloc].rentrant;
    meubles[indiceCurrentMeuble].updateMeuble();
  }, false);
  buttonSocle.addEventListener("click",function() {
    meubles[indiceCurrentMeuble].socle=!meubles[indiceCurrentMeuble].socle;
    if (meubles[indiceCurrentMeuble].socle) {
      meubles[indiceCurrentMeuble].pied=false;
      meubles[indiceCurrentMeuble].suspendu=false;
    }
    updateButtonSocle(indiceCurrentMeuble);
    updateButtonPied(indiceCurrentMeuble);
    updateButtonSuspendu(indiceCurrentMeuble);
    meubles[indiceCurrentMeuble].updateMeuble();
  },false);
  buttonPied.addEventListener("click",function() {
    meubles[indiceCurrentMeuble].pied=!meubles[indiceCurrentMeuble].pied;
    if (meubles[indiceCurrentMeuble].pied) {
      meubles[indiceCurrentMeuble].socle=false;
      meubles[indiceCurrentMeuble].suspendu=false;
    }
    updateButtonPied(indiceCurrentMeuble);
    updateButtonSocle(indiceCurrentMeuble);
    updateButtonSuspendu(indiceCurrentMeuble);
    meubles[indiceCurrentMeuble].updateMeuble();
  },false);
  buttonSuspendu.addEventListener("click",function() {
    meubles[indiceCurrentMeuble].suspendu=!meubles[indiceCurrentMeuble].suspendu;
    if (meubles[indiceCurrentMeuble].suspendu) {
      meubles[indiceCurrentMeuble].pied=false;
      meubles[indiceCurrentMeuble].socle=false;
    }
    updateButtonPied(indiceCurrentMeuble);
    updateButtonSocle(indiceCurrentMeuble);
    updateButtonSuspendu(indiceCurrentMeuble);
    meubles[indiceCurrentMeuble].updateMeuble();
  },false);
  buttonPlateau.addEventListener("click",function() {
    meubles[indiceCurrentMeuble].plateau=!meubles[indiceCurrentMeuble].plateau;
    updateButtonPlateau(indiceCurrentMeuble);
    meubles[indiceCurrentMeuble].updateMeuble();
  },false);
  buttonCadre.addEventListener("click",function() {
    meubles[indiceCurrentMeuble].cadre=!meubles[indiceCurrentMeuble].cadre;
    updateButtonCadre(indiceCurrentMeuble);
    meubles[indiceCurrentMeuble].updateMeuble();
  },false);
  selectListMeubles.addEventListener("change", function eventListMeublesPopup(event) { 
    changeCurrentMeubleFromPopup(event.target.value);
  }, false);
  selectListBlocs.addEventListener("change",function changeCurrentBlocFromPopup(event) { 
    startMaterialAnimationBloc(event.target.value);
    indiceCurrentBloc=event.target.value;
    updateInterfaceBlocs(indiceCurrentMeuble);
    updateSelectableEtagere();
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
    recomputeMeublesId();
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
    //dragEtagereControls.deactivate();
    updateSelectableBlocs();
    updateSelectableMeubles();
    updateSelectableEtagere();
    refreshSelectButtons();
  },false);
  buttonSelectBloc.addEventListener("click", function clickSelectBlocs(event) {
    selectionMode = "blocs";
    dragMeubleControls.deactivate();
    dragBlocControls.activate();
    //dragEtagereControls.deactivate();
    updateSelectableBlocs();
    updateSelectableMeubles();
    updateSelectableEtagere();
    refreshSelectButtons();
  },false);

  buttonSelectEtagere.addEventListener("click", function clickSelectEtageres(event) {
    selectionMode = "etageres";
    dragMeubleControls.deactivate();
    dragBlocControls.deactivate();
    //dragEtagereControls.activate();
    updateSelectableBlocs();
    updateSelectableMeubles();
    updateSelectableEtagere();
    refreshSelectButtons();
  },false);
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
}

function refreshSelectButtons() {
  if (selectionMode=="meubles") {
    buttonSelectMeuble.className="buttonOn";
    dragMeubleControls.activate();
    dragBlocControls.deactivate();
    dragEtagereControls.deactivate();
  }
  else {buttonSelectMeuble.className="buttonOff"}
  if (selectionMode=="blocs") {
    buttonSelectBloc.className="buttonOn";
    dragMeubleControls.deactivate();
    dragBlocControls.activate();
    dragEtagereControls.deactivate();
  }
  else {buttonSelectBloc.className="buttonOff"}
  if (selectionMode=="etageres") {
    buttonSelectEtagere.className="buttonOn";
    dragMeubleControls.deactivate();
    dragBlocControls.deactivate();
    dragEtagereControls.activate();
  }
  else {buttonSelectEtagere.className="buttonOff"}
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
    // divLineMenu.addEventListener("click",function eventChangeTexture(event){
    //   changeTexture(indiceCurrentMeuble,event)}
    //   ,false);
    menu.append(divLineMenu);
  }
}

function addListenerMenuTexture(menu) {
  //let divLineMenu=menu.querySelector("#divLineMenu");
  for (var divLineMenu of menu.children) {
    divLineMenu.addEventListener("click",function eventChangeTexture(event){
      meubles[indiceCurrentMeuble].changeTexture(event)}
      ,false);
  }
}

function addListenerMenuPoignees(menu) {
  //let divLineMenu=menu.querySelector("#divLineMenu");
  for (var divLineMenu of menu.children) {
    divLineMenu.addEventListener("click",function eventChangePoignee(event) {changePoignee(event.target.value)},false);
  }
}

var poigneeRoot;
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
    meubles[i].id=i;
    updateSelectableMeubles();
    updateSelectableEtagere();

    updateSelectableBlocs();
    //selectableMeuble[i].numero=i;
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
  updateSelectableMeubles();
  updateSelectableEtagere();

  updateSelectableBlocs();
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
  meubles[indiceCurrentMeuble] = new meubleClass(indiceCurrentMeuble);
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

  meubles[indiceNewMeuble] = new meubleClass(indiceNewMeuble);
  for (var i=0; i<meubles[num]; i++) {
    meubles[indiceNewMeuble].blocs[i]=new blocClass(i);
  }
  duplicatePropertiesValues(meubles[num],meubles[indiceNewMeuble])

  meubles[indiceNewMeuble].numero = indiceNewMeuble;
  meubles[indiceNewMeuble].name = "Meuble "+(indiceNewMeuble+1);

  meubles[indiceNewMeuble].root = new THREE.Object3D();
  //scene.add(meubles[indiceNewMeuble].root);
  meubles[indiceNewMeuble].root.name = "meuble "+indiceNewMeuble;
  meubles[indiceNewMeuble].root.position.set(0,0,0);
  let blocs = new THREE.Object3D();
  blocs.name="blocs";
  meubles[indiceNewMeuble].root.add(blocs);
  
  indiceCurrentMeuble = indiceNewMeuble;
  
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
  if (styleParam == "Arrondi") {geo = RoundEdgedBox(x,y,z,0.5,1,1,1,1)}
  if (styleParam=="Basique") {geo = new THREE.BoxGeometry( x,y,z )}
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
    //dispose
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
  if (meubles.length>1) {
    buttonDeleteMeuble.disabled = false;
  }
  else {
    buttonDeleteMeuble.disabled = true;
  }
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
  updateSelectableEtagere();
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
  selectableMeuble[num].material = materialSelectionMeuble;
  selectableMeuble[num].visible = false;
  mixerMaterial.removeEventListener('finished', onMaterialAnimationFinish, false);
  mixerMaterial=undefined;
}

var materialSelectionMeubleAnim = new THREE.MeshStandardMaterial( materialSelectionMeubleParams );
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
    meubles[num].placeMeuble();(indiceMeuble);
    elYS.value = meubles[indiceMeuble].y;
    elYB.value = elYS.value;
    frameCamera();
  }

  if (meubles[indiceMeuble].disposition=="vertical") {checkboxVertical.checked=true} else {checkboxVertical.checked=false}
  updateButtonPlateau(indiceMeuble);
  updateButtonCadre(indiceMeuble);
  updateButtonSocle(indiceMeuble);
  updateButtonPied(indiceMeuble);
  updateButtonSuspendu(indiceMeuble);
}

function updateButtonPlateau(indiceMeuble) {
  if (meubles[indiceMeuble].plateau) {buttonPlateau.className="buttonOn"} else {buttonPlateau.className="buttonOff"}
}

function updateButtonCadre(indiceMeuble) {
  if (meubles[indiceMeuble].cadre) {buttonCadre.className="buttonOn"} else {buttonCadre.className="buttonOff"}
}

function updateButtonSocle(indiceMeuble) {
  if (meubles[indiceMeuble].socle) {buttonSocle.className="buttonOn"} else {buttonSocle.className="buttonOff"}
}

function updateButtonPied(indiceMeuble) {
  if (meubles[indiceMeuble].pied) {buttonPied.className="buttonOn"} else {buttonPied.className="buttonOff"}
}

function updateButtonSuspendu(indiceMeuble) {
  if (meubles[indiceMeuble].suspendu) {buttonSuspendu.className="buttonOn"} else {buttonSuspendu.className="buttonOff"}
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
  console.log("new current meuble=",selectableBloc[num].numeroMeuble);
  changeCurrentMeubleFromClick(selectableBloc[num].numeroMeuble);
  indiceCurrentBloc = selectableBloc[num].bloc.numero;
  console.log("new current bloc=",selectableBloc[num].bloc);
  console.log("new current bloc=",indiceCurrentBloc);
  //indiceCurrentMeuble = selectableBloc[num].bloc.numero;
  updateInterfaceBlocs(indiceCurrentMeuble);
  selectListBlocs.classList.remove("animationBlocsName");
  selectListBlocs.offsetWidth; // pour temporisation
  selectListBlocs.classList.add("animationBlocsName");
  updateSelectableEtagere();
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
  if (meubles[indiceMeuble].bloc[indiceCurrentBloc].rentrant) {checkboxRentrant.checked=true;} else {checkboxRentrant.checked=false;}
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
export const poigneesPath="src/";

export class poigneeClass {
  constructor (filename, thumbnail, titre, indice, largeur, parametrable, nbPointAttache, type, material)
  {
    this.filename=poigneesPath+filename;
    this.thumbnail=poigneesPath+thumbnail;
    this.titre=titre;
    this.largeur=largeur;
    this.parametrable=parametrable,
    this.nbPointAttache=nbPointAttache;
    this.id=indice;
  }
}

export var poignees=new Array;

export function initPoigneesList() {
  poignees[0] = new poigneeClass("furniture_handle_1.glb","poignee1.0001.png","Vintage 1",1,10,false,2,0,0);
  poignees[1] = new poigneeClass("furniture_handle_2.glb","poignee2.0001.png","Vintage 2",2,10,false,2,0,0);
  poignees[2] = new poigneeClass("furniture_handle_3.glb","poignee3.0001.png","Classique",3,10,false,2,0,0);
  poignees[3] = new poigneeClass("furniture_handle_4.glb","poignee4.0001.png","Virolla",4,10,false,2,0,0);
  poignees[4] = new poigneeClass("furniture_handle_6.glb","poignee6.0001.png","Moderne",5,10,false,2,0,0);
  poignees[5] = new poigneeClass("furniture_handle_7.glb","poignee7.0001.png","Circle",6,10,false,2,0,0);
  poignees[6] = new poigneeClass("furniture_handle_9.glb","poignee9.0001.png","Barre 1",7,10,true,2,0,0);
  poignees[7] = new poigneeClass("furniture_handle_10.glb","poignee10.0001.png","Vintage",8,10,false,2,0,0);
  poignees[8] = new poigneeClass("furniture_handle_11.glb","poignee11.0001.png","Moderne",9,10,false,2,0,0);
  poignees[9] = new poigneeClass("furniture_handle_12.glb","poignee12.0001.png","Barre 2",10,10,true,2,0,0);
  poignees[10] = new poigneeClass("furniture_handle_13.glb","poignee13.0001.png","Barre 3",10,10,true,2,0,0);
  poignees[11] = new poigneeClass("furniture_handle_14.glb","poignee14.0001.png","Barre 4",10,10,true,2,0,0);
  poignees[12] = new poigneeClass("furniture_handle_15.glb","poignee15.0001.png","Poignée",10,10,false,2,0,0);
  poignees[13] = new poigneeClass("furniture_handle_16.glb","poignee16.0001.png","Bouton 1",10,10,false,1,0,0);
  poignees[14] = new poigneeClass("furniture_handle_17.glb","poignee17.0001.png","Bouton 2",10,10,false,1,0,0);
  poignees[15] = new poigneeClass("furniture_handle_18.glb","poignee18.0001.png","Bouton 3",10,10,false,1,0,0);
  poignees[16] = new poigneeClass("furniture_handle_19.glb","poignee19.0001.png","Bouton 4",10,10,false,1,0,0);
  poignees[17] = new poigneeClass("furniture_handle_20.glb","poignee20.0001.png","Bouton 5",10,10,false,1,0,0);
  poignees[18] = new poigneeClass("furniture_handle_21.glb","poignee21.0001.png","Poignée vintage",10,10,false,2,0,0);
  poignees[19] = new poigneeClass("furniture_handle_22.glb","poignee22.0001.png","Poignée moderne",10,10,false,2,0,0);
  poignees[20] = new poigneeClass("furniture_handle_23.glb","poignee23.0001.png","Barre 5",10,10,false,2,0,0);
  poignees[21] = new poigneeClass("furniture_handle_24.glb","poignee24.0001.png","Poignée moderne",10,10,false,2,0,0);
  poignees[22] = new poigneeClass("furniture_handle_25.glb","poignee25.0001.png","Barre 6",10,10,false,2,0,0);
  poignees[23] = new poigneeClass("furniture_handle_26.glb","poignee26.0001.png","Poignée",10,10,false,2,0,0);
}

// const poigneesFileList = new Map;
// poigneesFileList.set("Poignee type 1","src/furniture_handle_1.glb");
// poigneesFileList.set("Tulip Country","src/furniture_handle_2.glb");
// poigneesFileList.set("Poignee type 3","src/furniture_handle_3.glb");
// poigneesFileList.set("Tulip Virella","src/furniture_handle_4.glb");
// poigneesFileList.set("Vintage","src/furniture_handle_10.glb");
// poigneesFileList.set("Square","src/furniture_handle_6.glb");
// poigneesFileList.set("Half circle","src/furniture_handle_7.glb");
// poigneesFileList.set("Semi round","src/furniture_handle_8.glb");
// poigneesFileList.set("Barre","src/furniture_handle_9.glb");
// //poigneesFileList.set("10 bouton","src/furniture_handle_10.glb");
// poigneesFileList.set("11","src/furniture_handle_11.glb");
// poigneesFileList.set("12","src/furniture_handle_12.glb");
// poigneesFileList.set("13","src/furniture_handle_13.glb");
// poigneesFileList.set("14","src/furniture_handle_14.glb");
// poigneesFileList.set("15","src/furniture_handle_15.glb");
// poigneesFileList.set("16","src/furniture_handle_16.glb");
// poigneesFileList.set("17","src/furniture_handle_17.glb");
// poigneesFileList.set("18 bouton","src/furniture_handle_18.glb");
// poigneesFileList.set("19","src/furniture_handle_19.glb");
// poigneesFileList.set("20","src/furniture_handle_20.glb");
// poigneesFileList.set("21","src/furniture_handle_21.glb");
// poigneesFileList.set("22","src/furniture_handle_22.glb");
// poigneesFileList.set("23","src/furniture_handle_23.glb");
// poigneesFileList.set("24","src/furniture_handle_24.glb");
// poigneesFileList.set("25","src/furniture_handle_25.glb");
// poigneesFileList.set("26","src/furniture_handle_26.glb");
// //poigneesFileList.set("27","src/furniture_handle_27.glb");
// poigneesFileList.set("28","src/furniture_handle_28.glb");
// poigneesFileList.set("29","src/furniture_handle_29.glb");
// poigneesFileList.set("30","src/furniture_handle_30.glb");
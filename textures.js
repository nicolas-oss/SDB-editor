export const imagesPath="src/";

export class image {
  constructor(filename, thumbnail, titre) {
    this.fileName = imagesPath + filename;
    this.thumbnail = imagesPath + thumbnail;
    this.titre = titre;
    //console.log(this.fileName);
  }
}


export var imagesMeuble = new Array;

export function initListTexturesMeuble() {
  imagesMeuble[0] = new image("066_big.jpg", "066.jpg", "Ardoise");
  imagesMeuble[1] = new image("070_big.jpg", "070.jpg", "Gris Soie");
  imagesMeuble[2] = new image("078_big.jpg", "078.jpg", "Chêne San Rémo");
  imagesMeuble[3] = new image("097_big.jpg", "097.jpg", "Chêne Havane");
  imagesMeuble[4] = new image("117_big.jpg", "117.jpg", "Copper vintage");
  imagesMeuble[5] = new image("123_big.jpg", "123.jpg", "Chêne de Virginie");
  imagesMeuble[6] = new image("124_big.jpg", "124.jpg", "Noyer");
  imagesMeuble[7] = new image("126_big.jpg", "126.jpg", "Chêne de Montréal");
  imagesMeuble[8] = new image("149_big.jpg", "149.jpg", "Gris Terra");
  imagesMeuble[8] = new image("192_big.jpg", "192.jpg", "Chêne ambré");
  imagesMeuble[9] = new image("198_big.jpg", "198.jpg", "Chêne sierra");
  imagesMeuble[10] = new image("201_big.jpg", "201.jpg", "Béton sable fin");
  imagesMeuble[11] = new image("205_big.jpg", "205.jpg", "Chêne vicking");
  imagesMeuble[12] = new image("215_big.jpg", "215.jpg", "Stomboli clair");
  imagesMeuble[13] = new image("220_big.jpg", "220.jpg", "Pin Arizona");
  imagesMeuble[14] = new image("225_big.jpg", "225.jpg", "Écorce de chêne");
  imagesMeuble[15] = new image("231_big.jpg", "231.jpg", "Chêne Bergamo");
  imagesMeuble[16] = new image("235_big.jpg", "235.jpg", "Marbre Venato Bianco");
  imagesMeuble[17] = new image("265_big.jpg", "265.jpg", "Rouille");
  imagesMeuble[18] = new image("266_big.jpg", "266.jpg", "Calédonia");
  imagesMeuble[19] = new image("272_big.jpg", "272.jpg", "Chêne veiné");
  imagesMeuble[20] = new image("274_big.jpg", "274.jpg", "Marbre de Teramo");
  imagesMeuble[21] = new image("319_big.jpg", "319.jpg", "Métal oxidé");
  imagesMeuble[22] = new image("320_big.jpg", "320.jpg", "Marbre Venato Nero");
  imagesMeuble[23] = new image("322_big.jpg", "322.jpg", "Terrato blanc");
  imagesMeuble[24] = new image("330_big.jpg", "330.jpg", "Béton gris");
  imagesMeuble[25] = new image("344_big.jpg", "344.jpg", "Granit flammé noir");
  imagesMeuble[26] = new image("345_big.jpg", "345.jpg", "Chêne Yukon");
  imagesMeuble[27] = new image("355_big.jpg", "355.jpg", "Bronze");
  imagesMeuble[28] = new image("356_big.jpg", "356.jpg", "Loupe de chêne");
  imagesMeuble[29] = new image("363_big.jpg", "363.jpg", "Basalte gris taupe");
  imagesMeuble[30] = new image("366_big.jpg", "367.jpg", "Chêne artisan");
  imagesMeuble[31] = new image("369_big.jpg", "369.jpg", "Ardoise gris pierre");
  imagesMeuble[32] = new image("373_big.jpg", "373.jpg", "Ardoise grise");
  imagesMeuble[33] = new image("376_big.jpg", "376.jpg", "Limestone");
  imagesMeuble[34] = new image("378_big.jpg", "378.jpg", "Béton noir");
  imagesMeuble[35] = new image("392_big.jpg", "392.jpg", "Chêne maître");
  imagesMeuble[36] = new image("393_big.jpg", "393.jpg", "Chêne vintage");
  imagesMeuble[37] = new image("398_big.jpg", "398.jpg", "Noyer naturel");
  imagesMeuble[38] = new image("781_big.jpg", "781.jpg", "Venato bianco");
  imagesMeuble[39] = new image("783_big.jpg", "783.jpg", "Vénato nero");
  imagesMeuble[40] = new image("784_big.jpg", "784.jpg", "Gris fossile");
  imagesMeuble[41] = new image("785_big.jpg", "785.jpg", "Oxyde métallique");
  imagesMeuble[42] = new image("787_big.jpg", "787.jpg", "Chêne pierre");
  imagesMeuble[43] = new image("790_big.jpg", "790.jpg", "Plain black");
  imagesMeuble[44] = new image("792_big.jpg", "792.jpg", "Pierre bleue belge");
  imagesMeuble[45] = new image("794_big.jpg", "794.jpg", "Béton gris soie");
  imagesMeuble[46] = new image("796_big.jpg", "796.jpg", "Béton blanc");
  imagesMeuble[47] = new image("798_big.jpg", "798.jpg", "Béton sable fin");
  imagesMeuble[48] = new image("802_big.jpg", "802.jpg", "Epic raw");
  imagesMeuble[49] = new image("804_big.jpg", "804.jpg", "Epic black");
  imagesMeuble[50] = new image("806_big.jpg", "806.jpg", "Epic white");
  imagesMeuble[51] = new image("807_big.jpg", "807.jpg", "Epic easy clay");
  imagesMeuble[52] = new image("809_big.jpg", "809.jpg", "Epic ash grain");
  imagesMeuble[53] = new image("347_big.jpg", "347.jpg", "If");
  imagesMeuble[54] = new image("353_big.jpg", "353.jpg", "Béton blanc");
  imagesMeuble[55] = new image("354_big.jpg", "354.jpg", "Béton gris ardoise");
  imagesMeuble[56] = new image("366_big.jpg", "366.jpg", "Noir structuré");
}
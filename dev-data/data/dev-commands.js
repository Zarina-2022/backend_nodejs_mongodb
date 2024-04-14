
const fs = require("fs")
const Tour = require('../../mvc/models/tourModel')

//===============================================================================
// database ile baglanti kurmak icin:
// mongoose = node.js ile mongodb arasinda baglanti kurmamizi saglar:
const mongoose = require("mongoose"); // npm install mongoose --save
require("dotenv").config({ path: "../../config.env" }); // npm install dotenv --save

// mongodb ile baglanti saglayacagiz:
mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    console.log("The connection is successfully gedone.");
  })
  .catch((err) => {
    console.log("ERROR!!! There is an error occur.", err);
  });


//==============================================================================

/**
 * The process.argv property is an inbuilt application programming interface of
 *      the process module which is used to get the arguments passed to the node.js 
 *      process when run in the command line. 
 * Syntax: process.argv
 * 
 * Return Value: 
 *      This property returns an array containing the arguments passed to the process 
 *      when run it in the command line. 
 *      - The first element is the process execution path and 
 *      - the second element is the path for the js file.
 */

console.log(process.argv);
/**
 * console.log response:
 *  [
    '/usr/local/bin/node',
    '/Users/zarinasekerdag/Desktop/Backend/projects/nodejs_mongodb/dev-data/data/dev-commands.js',
    ]
 */

 // tours-simple.json dosyasindaki verileri oku:
let tours = fs.readFileSync(`${__dirname}/tours-simple.json`)
//js formatina cevir:
tours = JSON.parse(tours)

// --import/--delete icin kullanacagimiz functions:

//! dosyadaki tum verileri database teki collection'a aktaralim:
// bunu yapabilmek icin once database ile baglanti kurmam lazim (yukarida yapildi).
// Artik tours verisini database aktarabiliriz. insertMany() yerine create() ta kullanabiliriz:
const importData = async()=>{
    try {
        await Tour.insertMany(tours)
        console.log("Tum veriler aktarildi");
    } catch (err) {
        console.log("--import hatasi", err);
    }
    // bu islem calistiktan sonra terminal donakaliyor. Bunu onlemek icin:
    // terminalin yuruttugu islemi sonlandirir(terminalde yeniden komut yazilabilir hale geliyor):
    process.exit()
}

//! collection daki tum datayi temizler:
const deleteData = async()=>{
    try {
        await Tour.deleteMany()
        console.log("Tum veriler silindi");
    } catch (err) {
        console.log("--delete hatasi", err); 
    }
    process.exit()
}

// Once terminalde bu dosyaya bir komut ekleyelim: node dev-commands.js --import
// Sonra da bu komuta kosul verelim.
// Eger process.argv'de --import (veya --delete) komutu var ise sunu yap:

if(process.argv.includes("--import")){
	importData()
} else if (process.argv.includes("--delete")) {
    deleteData()
}

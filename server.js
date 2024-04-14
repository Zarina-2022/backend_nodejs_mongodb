const app = require("./index");
// mongoose = node.js ile mongodb arasinda baglanti kurmamizi saglar:
const mongoose = require("mongoose"); // npm install mongoose --save
require("dotenv").config({ path: "./config.env" }); // npm install dotenv --save

// mongodb ile baglanti saglayacagiz:
mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    console.log("The connection with database established.");
  })
  .catch((err) => {
    console.log("ERROR!!! There is an error occur.", err);
  });

// serveri ayaga kaldir:
// serverin calismaya basladigi port gibi bilgileri .ENV dosyasina tanimlamamiz dogru olur.
app.listen(process.env.PORT, () => {
  console.log(`It runs successfully on port ${process.env.PORT}`);
});

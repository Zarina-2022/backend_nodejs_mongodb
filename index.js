const express = require("express");
const morgan = require("morgan"); // npm install morgan
const toursRouter = require("./mvc/routes/tours-routes");
const userRouter = require("./mvc/routes/user-routes");
const AppError = require("./utils/appError");

const app = express();
app.use(express.json()); // Middleware to parse JSON requests (header or body)
app.use(morgan("dev")); // middleware that writes request details to the console

// toursRouter'i ve userRouter'i projeye tanitmaliyiz ki istek atildiginda bu routlara ulasalim:
app.use("/api/v1/tours", toursRouter);
app.use("/api/v1/users", userRouter); // burada "/api/v1//users" tanittigimiz icin user-routes.js'te bunu yazmamiza gerek yok


// tanimlanmayan bir route istek atildiginda hata ver:
app.all("*", (req, res, next) => {
  // hata detaylari belirle:
  const error = new AppError("You sent a request to an undefined route.", 404);

  // next ile error'u asagidaki error middelwarer'e hata bilgilerini aktariyoruz.
  next(error);

  // next(new AppError("You sent a request to an undefined route.", 404)) => yukaridaki 2 satir ile ayni anlama geliyor.
});

// hata oldugunda devreye giren bir middelware; app.all'dan gelen hata bilgilerini aliyor ve cevap olarak gonderir.
app.use((err, req, res, next) => {
  // hatanin tum detaylarini ver:
  console.log(err.stack);

  // statusCode or status gonderilmediginde varsayilar degerler girsin:
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  err.message = err.message || "Sorry, an error occurred.";

  // cevap gonder:
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

module.exports = app;

//=============================================================================
// first npm init
// npm i nodemon => Anlik olarak yaptigimiz degisiklikleri ekrana yansimasini saglayan Nodemonu yukleyelim
// sonra package-json'da:  "start": "nodemon server.js" (npm start)

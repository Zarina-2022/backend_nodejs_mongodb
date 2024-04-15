const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const filterObj = require("../../utils/filterObject");
const userModel = require("../models/userModel");

// (user) user kendi hesabini update yapabilir (sifre haric):
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) sifreyi guncellemey calisirsa hata ver:
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("You cannot update your password here.", 400));
  }

  // 2) istegin body kismindaki update icin izin verdigimiz degerleri al:
  const filteredBody = filterObj(req.body, "name", "email", "photo");

  // 3) Kullanicinin belirli bilgilerini guncelle ve yeni bilgileri almasi icin "new:true" eklememiz lazim:
  const updatedUser = await userModel.findByIdAndUpdate(
    req.user.id,
    filteredBody,
    { new: true }
  );

  res
    .status(200)
    .json({ message: "Kullanici basariyla guncellendi", user: updatedUser });
});

// (admin) butun kullanicilarin bilgilerini al:
exports.getAllUsers = (req, res) => {};

// (admin) yeni user olustur:
exports.createUser = (req, res) => {};

// () userin hesap bilgilerini al:
exports.getUser = (req, res) => {};

// (admin) admin'in user'i guncellemesi
exports.updateUser = (req, res) => {};

// hesabi siler
exports.deleteUser = (req, res) => {};

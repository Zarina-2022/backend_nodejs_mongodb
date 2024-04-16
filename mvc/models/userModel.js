const { Schema, model } = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt"); // crypto tek basina parola sifrelemeye yeterli degil, bu yuzden 'bcrypt' kutuphane kullanacagiz
const moment = require("moment"); // npm install moment
const crypto = require("crypto");

const userSchema = new Schema({
  name: {
    // Validation
    type: String,
    required: [true, "Please enter your name."],
  },
  email: {
    // Validation
    type: String,
    required: [true, "Please enter your email."],
    unique: [true, "This email address is already registered."],
    lowercase: true,
    validate: [validator.isEmail, "Please enter valid email address."], // To be written in e-mail format = validator package
  },
  role: {
    // Validation
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  active: {
    // Validation
    type: Boolean,
    default: true,
    select: false,
  },
  photo: {
    // Validation
    type: String,
    default: "defaultpic.webp",
  },
  password: {
    // Validation
    type: String,
    required: [true, "Please enter your password."],
    minLength: [8, "Password must be at least 8 characters."],
    validate: [
      validator.isStrongPassword,
      "Your password is not strong enough.",
    ],
    select: false, // find() veya herhandi metod ile veri alindiginda gondermedigimiz bir deger. Bu validation degil.
  },
  passwordConfirm: {
    // Validation
    type: String,
    required: [true, "Please confirm your password."],
    // custom validator
    validate: {
      validator: function (value) {
        return value == this.password;
      },
      message: "Your confirmation password does not match.",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

//!   MIDDELWARES
/* 1)
    Database'e user'i kaydetmeden once:
      -  password alanini sifreleme algoritmadan gecir ve sifrele. (document middelware pre kullan)
      -  passwordConfirm alanini kaldir (document middelware pre kullan)
*/

// user verileri save olmadan once password sifrelensin (hashing):
userSchema.pre("save", async function (next) {
  // daha once sifre hashlendi ise bu function calismasin:
  // reset sifre yaparken haslendigi icin bu functioni es gec:
  if (!this.isModified("password")) return next();

  //* Hashing (encryption)=> sifreyi hash ve saltla:
  this.password = await bcrypt.hash(this.password, 12);

  //* Remove the passwordConfirm field
  this.passwordConfirm = undefined;
});

// 2) sifre degisince tarihi degistir:
userSchema.pre("save", async function (next) {
  // if sifre degismediyse veya document yeni olusturulduysa birsey yapma:
  if (!this.isModified("password") || this.isNew) return next();

  // sifre sonradan degisildiyse sifre degisim tarihini belirle:
  // yeni password tarihini 1 saniye (-1000) ile olusturuyoruz ki token ile sorun olmasin.
  this.passwordChangedAt = Date.now() - 1000;

  next()
});

// 3) If the account is inactive (false) when trying to retrieve the user from the database, block access:
// /^find/ is a regular expression (regex). It's used to match strings that start with the word "find".
userSchema.pre(/^find/, function (next) {
  // bunda sonraki islemlerde active olmayanlari dahil etme kosulu giriyoruz burada:
  this.find({ active: { $ne: false } });
  next();
});

//!  METHODS
//todo: 4) hashlenmis sifre ile normal sifreyi karsilastiran model tanimla:
// tanimladigimiz bu method sadece user belgeleri uzerinden erisilebilir:
userSchema.methods.correctPassword = async function (
  normalCandidatePassword,
  hashedUserPassword
) {
  return await bcrypt.compare(normalCandidatePassword, hashedUserPassword);
};

//todo: 5) jwt olusturma tarihinden sonra sifre degistitilmis mi kontrol et:
userSchema.methods.controlPasswordDate = function (JWTTime) {
  if (JWTTime) {
    console.log("JWT TIME =>", JWTTime); // response =  1712998464
    console.log("Password Changed At ", this.passwordChangedAt); // response =  2024-04-15T23:00:00.000Z

    // todo: bu iki tarihi karsilastirip JWT tarihinin Changed at tarihinden once oldogunu ispatlamamiz lazim.
    // bunun icin iki tarihi de ayni formata cevirmemiz lazim (Changed at saniyeye cevirelim):
    // e.g. const changedTime = parseInt(this.passwordChangedAt.getTima() / 1000); or change it with moment.js:
    const passwordChangedAtSeconds = moment(this.passwordChangedAt).unix();
    console.log("Changed Date", passwordChangedAtSeconds);

    // jwt sifre sifirlandiktan once mi olusmus (karsilastirma function):
    // if JWTTime (token verilme tarihi) sifre sifirlama tarihinden once (kucuk) ise true (sifre degistirme tarihi ileri tarihtir ve ortada sorun vardir) dondur,
    // degilse sorun yoktur false olur.
    return JWTTime < passwordChangedAtSeconds;
  }
};

//todo: 6) sifre sifirlama (modeli) tokeni olustur:
// - Bu token (bu arada jwt tokeni degil bu, jwt'yi kimlik digrulamada kulaniriz daha cok)
//   daha sonra kullanıcıya mail'ine gonderilecek ve kullanıcı,
//   şifresini sıfırlarken kimliğini doğrulamak için bu token'i (crypto ile olusturdugumuz) kullanacaktır.
// - 10 dakikalik gecerlilik suresini koyacagiz.
// error function burada kullanamiyoruz cunku "this" anahtar kelimesine ulasmak istiyoruz.
userSchema.methods.createPasswordResetToken = function () {
  // 1) crypto ile 32(byte) karakterlik rastgele bir token olusturalim ve onu hexadecimal bir diziye donustur:
  const resetToken = crypto.randomBytes(32).toString("hex");
  console.log(resetToken); // original token => f810dcc7e95087cb7c7aa1cdb7bb0aa8e6b9715f094cd7e59ab865ad14a31d5d

  // 2) simdi bu tokeni sifreleyelim (shake256/sha256 algoritmayi kullanarak) ve database kaydedelim:
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  console.log(this.passwordResetToken); // original tokenin hashlenmis versiyonu => f3d4c62a3725496e2751308718aeff221171d6d441f4cc781f0bca6fe7412ba0

  // 3) token'in son gecerlilik tarihinin kullanici dokumanina ekle
  /* 
    - Set the password reset expiration time to 10 minutes from now
    - Date.now() returns the current timestamp in milliseconds
    - 10 * 60 * 1000 calculates 10 minutes in milliseconds
  */
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  //  4) tokenin original halini return et
  return resetToken;
};

const userModel = model("User", userSchema);
module.exports = userModel;

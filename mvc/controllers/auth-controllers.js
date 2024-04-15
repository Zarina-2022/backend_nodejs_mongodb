const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken"); // npm i jsonwebtoken
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const sendMail = require("../../utils/email");
const crypto = require("crypto");

// Create JWT
/*
        JWT create yapmak istiyorsam jwt metodu kullanacagim: jwt.sign()
        { id: newUser._id } => neyi sifreleyecegiz.
        process.env.JWT_SECRET => secret signature in config.env
        {expiresIn: "90d"} => the duration of accessability of token
    */
const signToken = (user_id) => {
  return jwt.sign({ id: user_id }, process.env.JWT_SECRET, {
    expiresIn: "90d",
  });
};

// sifre update oldugunda otomatik logout (tekrar login yapilmasi icin) olmamasi icin token olusturup gondermemiz lazim.
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // dont send a password:
  user.password = undefined

  res.status(statusCode).json({
    message: "Logged in",
    user,
    token,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await userModel.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password, // sifre kaydedilirken acik olmamali, sifrelenmis kaydedilmeli.
    passwordConfirm: req.body.passwordConfirm, // sifre onayi database'e kaydedilmemesi lazim (ayni sifre iki kez yer tutuyor)
  });

  // jwt tokeni olustur ve gonder:
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  // var olan bir hesaba girmek icin sadece email ve password alacagiz
  const { email, password } = req.body;

  // 1st => Check your e-mail address, is your password correct:
  if (!email || !password) {
    return next(
      new AppError("Please enter your correct e-mail and password", 401)
    );
  }

  // 2nd = > Check if there is a user for the sent e-mail is available.
  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    return next(new AppError("The data you entered is invalid.", 404));
  }

  // 3rd = > Check if the sent password is correct.
  // to compare passwords in database and new entered password we need 'bcrypt.compare()'
  const isValid = await user.correctPassword(password, user.password);
  if (!isValid) {
    return next(new AppError("The data you entered is invalid.", 400));
  }

  // 4th => If everything is OK, create and send jwt token
  createSendToken(user, 200, res);
});

/**
It is a middelware that will verify the validity of the token through the user's 
token and then allow access to the route if it is valid and the role is appropriate,
 otherwise it will give an "You do not have authorization" error.
 */

// Bu middelware'i korumak istedigim route'larda kullanacagim: tourRoutes
exports.protect = async (req, res, next) => {
  /* kullanıcının token üzerinden token geçerliliğini doğrulayıp ardından geçerli 
    ise ve rolü uygunsa route'a  erişime izin verecek, aksi takdirde yetkiniz yok 
    hatası verecek bir middelware'dir.
    */
  // 1-step: token'i al ve make sure the token is defined
  // su an tokeni frontend'ten backend'e headerin icinde gonderdim
  // headerlar requestin icerisinde gelir ve tokenin Bearer ile mi basliyor kontrol et.
  let token = req.headers.authorization;
  if (token && token.startsWith("Bearer")) {
    // Token'in Bearer kisminda sonrasini al (tokenin kendisini al)
    token = token.split(" ")[1]; // bosluga gore bol ve ikinci elemani al.
  }
  if (!token) {
    return next(new AppError("Submit your token to access the service.", 401)); // 401 unauthorised = yetkiniz yok
  }

  // 2-step: token'in gecerliligini dogrula / verify token validit
  let decoded;
  try {
    // decoded kullanicinin id'si gibi oluyor:
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.message === "jwt expired") {
      return next(
        new AppError(
          "Your subscription has expired. Please, subscribe again.",
          401
        )
      ); // 401 unauthorised = yetkiniz yok
    } else {
      return next(new AppError("You sent an invalid token.", 401));
    }
  }

  //Todo: 3-step: user'in hesabi duruyor mu kontrol et (silinmemis mi?)?
  const activeUser = await userModel.findById(decoded.id);
  if (!activeUser) {
    return next(new AppError("User's account cannot be accessed.", 401));
  }

  //Todo: 4-step: After giving the token, check if the password has been changed.
  // once sifre sifirlama islemi hazirla sonra bu islem kontrol edilsin.
  const isValidToken = activeUser.controlPasswordDate(decoded.iat);
  console.log("IS VALID TOKEN =>", isValidToken);
  if (!isValidToken) {
    return next(
      new AppError(
        "You recently changed your password. Please log in again.",
        401
      )
    );
  }
  // bir sonraki asamaya activeUser bilgilerini aktar:
  req.user = activeUser;
  next();
};
// token backend'e header icerisinde gonderilir Authorization: Bearer ile.

// parametre olarak gelen roldeki (user, admin, guide, lead-guide) kullanicilarin route'e erismesini engelleyen middelrare:
// parametre olarak girilen kullanicilar tamamen yasaklansin, bu middelware'e giremesinler:

// gelen parametre sayisi belli olmadigi icin spread operator use:
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    //todo-1: Kullanicinin rolu gecerli roller arasinda yoksa erisimi engelle:
    console.log("ROLES => ", roles);
    console.log("ACTIVE USER => ", req.user.role);
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You are not authorized to perform this action.", 401)
      );
    }

    //todo-2: Kullanicinin rolu gecerli roller arasinda varsa erisime izin verecegiz:
    next();
  };

//todo: Kullanici sifresini sifirlama:

//? If user forget his password

//* e-mail'ine sifre sifirlama baglantisi gonder:
exports.forgotPasssword = catchAsync(async (req, res, next) => {
  // 1) e-mail'e gore user'in hesabina erismek:
  const user = await userModel.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("No user found with this email.", 404));
  }

  // 2) sifre sifirlama token'i olustur:
  const resetToken = user.createPasswordResetToken();

  // 3) database'e tokenin sifrelenmis halini ve son gecerlilik tarihini kaydet ve sifre validationlari devre disi biraktik :
  await user.save({ validateBeforeSave: false });

  // 4) kullanicinin mail'ine tokeni link ile gonder ve ayni anda Database tokenin sifrelenmis halini kaydet:
  try {
    const link = `http://127.0.0.1:4001/api/v1/users/reset-password/${resetToken}`;

    const html = `
<h1>Hello, ${user.name} !</h1>
<p>Below is the password reset link for the tourify account linked to ${user.email} email.</p>

<p>
<a href="${link}">${link}</a>
You can update your password within 10 minutes by sending a PATCH request to this URL with your new password.
</p>


<p>Eger bu maili siz gondermediyseniz lutfen gormazden gelin.</p>
<p>Tourify Team</p>
`;

    await sendMail({
      email: user.email,
      subject: "Reset password token (10 min) ",
      html,
    });
  } catch (err) {
    return next(
      new AppError("An error occurred while sending the email.", 404)
    );
  }

  // cevap gonder:
  res.status(200).json({
    message:
      "Database tokenin sifrelenmis hali kaydedildi ve original token maile gonderildi",
  });
});

//*  kullanicinin yeni sifresini kaydet:
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) tokenden yola cikarak kullaniciyi bul
  const token = req.params.token;
  console.log(token); // original (mail'e gelen) token (not hashed)

  // databaseteki token hashlendigi icin biz maildeki tokeni databasteki ile karsilastiramayiz.
  // Bu yuzden once maildeki tokeni hashleyecegiz sonra database teki ile karsilastirip user'i bulacagiz.
  // bunun icin daha once tokeni hashlemek icin hangi yontemi kullandiysak ayni yontemi kullanmamiz lazim:
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // database'teki hashlenmis token degerine sahip user'i al ve tokenin son kullanim tarihi mevcut tarihten ileri (buyuk)
  // ise (yani tokenin olusturuldugu andan itibaren suresi bitecegi ana kadar olan surenin icinde ise kulan) yeni sifreyi belirle:
  const user = await userModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) Token gecersiz veya suresi dolmus ise uyari gonder:
  if (!user) {
    return next(new AppError("Token is invalid or expired."));
  }
  console.log("YENI SIFRE => ", req.body.password);
  // 3) kullanicinin sifre degistirme tarihini guncelle:
  user.password = req.body.password;
  user.passwordConfirm = req.body.password;
  user.passwordResetToken = undefined; // null yazarsak database te yer tutar. undefined ise database'ten tatamen kalkar.
  user.passwordResetExpires = undefined;

  await user.save();

  return res.status(200).json({ message: "Your new password has been set." });
});

//? If user knows his password and still wants to change(update) it
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) kullaniciyi al:
  const user = await userModel.findById(req.user._id).select("+password");

  // 2) Gelen mevcut sifre dogru mu kontrol et:
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError("The current password you entered is incorrect."));
  }

  // 3) dogru ise sifreyi guncelle:
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPassword;
  await user.save();

  // bu sekilde birakirsak user otomatik logout olur ve tekrar yeni sifresi ile giris yapmak zorundadir

  // eger user sifreyi degistirdikten sonra tekrar login olmasini istemiyorsak:
  // 4) yeni JWT tokeni olustur ve gonder:
  createSendToken(user, 200, res);
});

/**

iki error function ic ice olunca iki sekilde yazabiliriz:
ex.1 
    exports.restrictTo=(...roles)=>{
      return (req,res,next)=>{
  }
} 
 ex.2
exports.restrictTo=(...roles)=>(req,res,next)=>{
  //task-1: Kullanicinin rolu gecerli roller arasinda yoksa erisimi engelle:
  //task-2: Kullanicinin rolu gecerli roller arasinda varsa erisime izin verecegiz:
}
 */

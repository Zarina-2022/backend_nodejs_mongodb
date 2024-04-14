const express = require("express");
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/user-controllers");

const {signup, login, forgotPasssword, resetPassword} = require("../controllers/auth-controllers")

const router = express.Router();

// USER'IN KULLANDIGI ROUTE'LAR: - authentication & authorizasition operations
// auth-controllers.js
router.post('/signup', signup) // yeni hesap olusturmakb (register) icin
router.post('/login', login) // var olan hesaba giris yapmak icin

// user sifresini unuttuysa:
router.post("/forgot-password", forgotPasssword);

// e-mailine gonderdigimiz linke istek atinca
router.patch("/reset-password/:token", resetPassword)


// GENELLIKLE ADMIN KULLANDIGI ROUTE'LAR: - crud operations
// user-controllers.js
// index.js te '/users' tanittogimiz icin burada yazmasak ta olur => router.route("/api/v1/users").get().post();
router
  .route("/")
  .get(getAllUsers) // admin
  .post(createUser); // admin

//router.route("/api/v1/users/:id").get().put().delete();
router
  .route("/:id")
  .get(getUser) // user
  .put(updateUser) // user
  .delete(deleteUser); // user & admin

module.exports = router;
// simdi router'i index.js te tanitmamiz lazim


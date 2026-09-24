const express = require("express");
const router = express.Router();
const userController = require("../controllers/user");
const wrapAsync = require("../utils/wrapAsync");

// Registration routes
router
    .route("/register")
    .get(userController.renderRegister)
    .post(wrapAsync(userController.register));

// Login routes
router
    .route("/login")
    .get(userController.renderLogin)
    .post(wrapAsync(userController.login));

// Logout route
router.post("/logout", userController.logout);
router.get("/logout", userController.logout);

module.exports = router;

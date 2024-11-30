const authController = require("../controller/auth.controller")
const { adminProtected } = require("../middleware/Protected")

const router = require("express").Router()

router

    .post("/register", authController.RegisterAdmin)
    .post("/register-hr", adminProtected, authController.registerHr)
    .post("/login", authController.LoginAdmin)
    .post("/logout", authController.LogoutAdmin)

module.exports = router
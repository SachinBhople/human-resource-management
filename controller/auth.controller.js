const asyncHandler = require("express-async-handler")
const validator = require("validator")
const bcrypt = require("bcryptjs")
const JWT = require("jsonwebtoken")
const Auth = require("../model/Auth")
const { checkEmpty } = require("../utils/cheackEmpty")
const Employee = require("../model/Employee")
const { demo } = require("./employee.controller")
const sendEmail = require("../utils/email")
const { io } = require("../socket/socket")

// ADMIN
exports.RegisterAdmin = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body
    const { isError, error } = checkEmpty({ name, email, password })
    if (isError) {
        return res.status(400).json({ message: "All Feiled Required", error })
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid Email" })
    }
    if (!validator.isStrongPassword(password)) {
        return res.status(400).json({ message: "Provide Strong Password" })
    } s
    const isFound = await Auth.findOne({ email })
    if (isFound) {
        return res.status(400).json({ message: "Email Already registered with us" })
    }

    const hash = await bcrypt.hash(password, 10)
    await Auth.create({ name, email, password: hash, role })
    res.json({ message: "Admin Register Success" })
})

exports.LoginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    console.log(password, email);

    const { isError, error } = checkEmpty({ email, password })
    if (isError) {
        return res.status(401).json({ message: "All Fields required" })
    }
    if (!validator.isEmail(email)) {
        return res.status(401).json({ message: "Invalid Credentials" })
    }
    const isFound = await Auth.findOne({ email })
    if (!isFound) {
        return res.status(401).json({ message: "Invalid Credentials" })
    }
    const isVerify = await bcrypt.compare(password, isFound.password)
    if (!isVerify) {
        return res.status(401).json({ message: "Invalid Credentials" })
    }

    const Token = JWT.sign({ userID: isFound._id }, process.env.JWT_KEY, { expiresIn: "1d" })
    //Cookie
    res.cookie("admin", Token, {
        maxAge: 86400000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    })

    res.json({ message: "Admin Login success", result: isFound })

})

exports.LogoutAdmin = asyncHandler(async (req, res) => {
    res.clearCookie("admin")
    res.json({ message: "Admin Logout Success" })
})


exports.registerHr = asyncHandler(async (req, res) => {

    const { name, email, mobile, role } = req.body
    console.log(req.body);

    const { isError, error } = checkEmpty({ name, email, mobile })
    if (isError) {
        return res.status(400).json({ message: "All Feiled Required", error })
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid Email" })
    }

    const isFound = await Employee.findOne({ email })
    if (isFound) {
        return res.status(400).json({ message: "Email Already registered with us" })
    }
    let fname = name, lmobile = mobile

    const n = fname.slice(0, 4)
    const m = lmobile.slice(-4)
    const result = n + m
    console.log(result);


    const hash = await bcrypt.hash(result, 10)
    await sendEmail({
        to: email, subject: `Your ID Password`, message: `<h1>Do Not share Your Account Details.</h1>
        <p>Your Id :<strong>${email}</strong> 
        </p>
        <p>Your Password :<strong>${result}</strong> 
        </p>
        `
    })
    console.log(req.user);
    await Employee.create({ name, email, password: hash, role, userId: req.user, mobile })
    const dresult = await Employee.find()
    io.emit("fetch-allhr", dresult)
    console.log(dresult);
    res.json({ message: " Register Success" })
})




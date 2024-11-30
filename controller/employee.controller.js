const asyncHandler = require("express-async-handler")
const validator = require("validator")
const bcrypt = require("bcryptjs")
const Employee = require("../model/Employee")
const { checkEmpty } = require("../utils/cheackEmpty")
const JWT = require("jsonwebtoken")
const cloudinary = require("../utils/cloudinary.config")
const { projectUpload } = require("../utils/upload")
const Leave = require("../model/Leave")
const Attendance = require("../model/Attendance")
const sendEmail = require("../utils/email")
const { io } = require("../socket/socket")
const mongoose = require("mongoose")

exports.registerEmployee = asyncHandler(async (req, res) => {
    const { name, email, mobile, role } = req.body
    console.log(req.body);
    const { isError, error } = checkEmpty({ name, email, mobile })
    if (isError) {
        return res.status(400).json({ message: "All Feiled Required", error })
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid Email" })
    }
    // if (!validator.isStrongPassword(password)) {
    //     return res.status(400).json({ message: "Provide Strong Password" })
    // }
    const isFound = await Employee.findOne({ email })
    if (isFound) {
        return res.status(400).json({ message: "Email Already registered with us" })
    }

    let fname = name, lmobile = mobile

    const n = fname.slice(0, 4)
    const m = lmobile.slice(-4)
    const result = n + m
    console.log("passwordddd", result);


    const hash = await bcrypt.hash(result, 10)
    await sendEmail({
        to: email, subject: `Your ID Password`, message: `<h1>Do Not share Your Account Details.</h1>
        <p>Your Id :<strong>${email}</strong> 
        </p>
        <p>Your Password :<strong>${result}</strong> 
        </p>
        `
    })
    console.log("userrrrr", req.user);
    await Employee.create({ name, email, password: hash, role, userId: req.user, mobile })
    const dresult = await Employee.find()
    io.emit("fetch-register-employee", dresult)
    res.json({ message: " Register Success" })
})

exports.loginHr = asyncHandler(async (req, res) => {
    const { email, password, role } = req.body
    const { isError, error } = checkEmpty({ email, password })
    if (isError) {
        return res.status(401).json({ message: "All Fields required" })
    }
    if (!validator.isEmail(email)) {
        return res.status(401).json({ message: "Invalid email" })
    }
    const isFound = await Employee.findOne({ email })
    if (!isFound) {
        return res.status(401).json({ message: "Email Not found" })
    }


    if (isFound.role !== "hr") {
        return res.status(400).json({ message: "your Role is Not hr" })
    }

    const isVerify = await bcrypt.compare(password, isFound.password)
    if (!isVerify) {
        return res.status(401).json({ message: "Invalid Password" })
    }

    const Token = JWT.sign({ userID: isFound._id }, process.env.JWT_KEY, { expiresIn: "1d" })
    //Cookie

    const dateT = new Date()
    dateT.toLocaleDateString()
    const TodayDate = dateT.toISOString().split('T')[0]
    const Hour = dateT.getHours()
    const Min = dateT.getMinutes()
    let isLate
    const officeTime = "10:0"
    const oficeTimexs = officeTime.split(":")
    const Time = `${Hour}: ${Min}`
    const LoginTimesx = Time.split(":")
    if (+LoginTimesx[0] >= +oficeTimexs[0] && +LoginTimesx[1] >= +oficeTimexs[1]) {
        isLate = true
    } else {
        isLate = false
    }
    await Attendance.create({ checkIn: `${Hour}: ${Min}`, date: TodayDate, userId: isFound._id, isLate, checkInType: "Login" })

    res.cookie("hr", Token, {
        maxAge: 86400000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    })

    res.json({
        message: "Login success", result: isFound
    })

})

exports.loginManagar = asyncHandler(async (req, res) => {
    const { email, password, role } = req.body
    const { isError, error } = checkEmpty({ email, password })
    if (isError) {
        return res.status(401).json({ message: "All Fields required" })
    }
    if (!validator.isEmail(email)) {
        return res.status(401).json({ message: "Invalid Eamil" })
    }
    const isFound = await Employee.findOne({ email })
    console.log(isFound);

    if (isFound.role !== "manager") {
        return res.status(400).json({ message: "your Role is Not manager" })
    }

    if (!isFound) {
        return res.status(401).json({ message: "Invalid Email not register" })
    }
    const isVerify = await bcrypt.compare(password, isFound.password)
    if (!isVerify) {
        return res.status(401).json({ message: "Invalid Password" })
    }


    const Token = JWT.sign({ userID: isFound._id }, process.env.JWT_KEY, { expiresIn: "1d" })
    //Cookie
    res.cookie("manager", Token, {
        maxAge: 86400000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    })

    res.json({
        message: "manager Login success"
    })

})

exports.loginTeamLead = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    const { isError, error } = checkEmpty({ email, password })
    if (isError) {
        return res.status(401).json({ message: "All Fields required" })
    }
    if (!validator.isEmail(email)) {
        return res.status(401).json({ message: "Invalid Eamil" })
    }
    const isFound = await Employee.findOne({ email })
    console.log(isFound);

    if (!isFound) {
        return res.status(401).json({ message: "Invalid Email not register" })
    }

    if (isFound.role !== "team lead") {
        return res.status(400).json({ message: "your Role is Not team lead" })
    }
    const isVerify = await bcrypt.compare(password, isFound.password)
    if (!isVerify) {
        return res.status(401).json({ message: "Invalid Password" })
    }

    const Token = JWT.sign({ userID: isFound._id }, process.env.JWT_KEY, { expiresIn: "1d" })
    //Cookie

    //attendce
    const dateT = new Date()
    dateT.toLocaleDateString()
    const TodayDate = dateT.toISOString().split('T')[0]
    const Hour = dateT.getHours()
    const Min = dateT.getMinutes()
    let isLate
    const officeTime = "10:0"
    const oficeTimexs = officeTime.split(":")
    const Time = `${Hour}: ${Min}`
    const LoginTimesx = Time.split(":")
    if (+LoginTimesx[0] >= +oficeTimexs[0] && +LoginTimesx[1] >= +oficeTimexs[1]) {
        isLate = true
    } else {
        isLate = false
    }
    await Attendance.create({ checkIn: `${Hour}: ${Min}`, date: TodayDate, userId: isFound._id, isLate, checkInType: "Login" })

    res.cookie("teamLead", Token, {
        maxAge: 86400000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    })

    res.json({
        message: "Team Lead Login success", result: isFound
    })

})
exports.loginEmployee = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    const { isError, error } = checkEmpty({ email, password })
    if (isError) {
        return res.status(401).json({ message: "All Fields required" })
    }
    if (!validator.isEmail(email)) {
        return res.status(401).json({ message: "Invalid Eamil" })
    }
    const isFound = await Employee.findOne({ email })
    console.log(isFound);

    if (!isFound) {
        return res.status(401).json({ message: "Invalid Email not register" })
    }

    if (isFound.role !== "employee") {
        return res.status(400).json({ message: "your Role is Not employee" })
    }
    const isVerify = await bcrypt.compare(password, isFound.password)
    if (!isVerify) {
        return res.status(401).json({ message: "Invalid Password" })
    }




    const Token = JWT.sign({ userID: isFound._id }, process.env.JWT_KEY, { expiresIn: "1d" })


    //add attendce

    const dateT = new Date()
    dateT.toLocaleDateString()
    const TodayDate = dateT.toISOString().split('T')[0]
    const Hour = dateT.getHours()
    const Min = dateT.getMinutes()
    let isLate
    const officeTime = "10:0"
    const oficeTimexs = officeTime.split(":")
    const Time = `${Hour}: ${Min}`
    const LoginTimesx = Time.split(":")
    if (+LoginTimesx[0] >= +oficeTimexs[0] && +LoginTimesx[1] >= +oficeTimexs[1]) {
        isLate = true
    } else {
        isLate = false
    }
    await Attendance.create({ checkIn: `${Hour}: ${Min}`, date: TodayDate, userId: isFound._id, isLate, checkInType: "Login" })

    //Cookie
    res.cookie("employee", Token, {
        maxAge: 86400000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    })

    res.json({
        message: "Employee Login success", result: isFound
    })

})

exports.Logouthr = asyncHandler(async (req, res) => {
    // Check Out
    const officeTime = "10:0"
    const date = new Date()
    date.toLocaleDateString()
    const todayDate = date.toISOString().split("T")[0]
    const Hour = date.getHours()
    const Min = date.getMinutes()
    console.log(Hour);

    let isLate
    if (Hour > officeTime) {
        isLate = true
    }
    await Attendance.create({ checkout: `${Hour}: ${Min}`, date: todayDate, userId: req.params.id, isLate, checkInType: "Logout" })
    res.clearCookie("hr")
    await Attendance.create({ checkout: `${Hour}: ${Min}`, date: todayDate, userId: req.user, })
    res.json({ message: "Hr Logout Success" })

})
exports.Logoutmanager = asyncHandler(async (req, res) => {
    res.clearCookie("manager")
    res.json({ message: "Hr Logout Success" })
})
exports.logoutTeamLead = asyncHandler(async (req, res) => {


    console.log(req.params.id);
    const result = await Attendance.findOne({ userId: req.params.id })
    // Check Out
    const officeTime = 10
    const date = new Date()
    date.toLocaleDateString()
    const todayDate = date.toISOString().split("T")[0]
    const Hour = date.getHours()
    const Min = date.getMinutes()
    console.log(Hour);
    let isLate
    if (Hour > officeTime) {
        isLate = true
    }
    await Attendance.create({ checkout: `${Hour}: ${Min}`, date: todayDate, userId: req.params.id, isLate, checkInType: "Logout" })
    res.clearCookie("teamLead")
    res.json({ message: "Hr Logout Success" })
})
exports.logoutEmployee = asyncHandler(async (req, res) => {

    const result = await Attendance.findOne({ userId: req.params.id })
    // Check Out
    const officeTime = 10
    const date = new Date()
    date.toLocaleDateString()
    const todayDate = date.toISOString().split("T")[0]
    const Hour = date.getHours()
    const Min = date.getMinutes()
    console.log(Hour);
    let isLate
    if (Hour > officeTime) {
        isLate = true
    }
    await Attendance.create({ checkout: `${Hour}: ${Min}`, date: todayDate, userId: req.params.id, isLate, checkInType: "Logout" })
    res.clearCookie("employee")

    res.json({ message: "emplyeee Logout Success" })
})







exports.getEmployeeProfile = asyncHandler(async (req, res) => {
    // const { id } = req.params
    // console.log("pramas", id)
    // console.log("ddd", req.user);
    const userId = req.user
    const result = await Employee.findOne({ _id: userId })
    console.log(result, "getemp profile");

    res.status(200).json({ massage: "profile fetch success", result })
})


exports.updateemployeeProfile = asyncHandler(async (req, res) => {
    projectUpload(req, res, async err => {
        if (err) {
            console.log(err.message)
            return res.status(400).json({ message: "Multer Error" })
        }
        const { id } = req.params
        // if (!req.files["photo"] || !req.files["resume"] || !req.files["expletter"] || !req.files["other"]) {
        //     return res.status(400).json({ message: "All Images Required" })
        // }
        try {
            const documents = {}
            for (const key in req.files) {
                if (key === "expletter" || key === "other") {
                    if (!documents[key]) {
                        documents[key] = []
                    }
                    const uploadAllImagesPromise = []
                    for (const item of req.files[key]) {
                        uploadAllImagesPromise.push(cloudinary.uploader.upload(item.path))
                    }
                    const allData = await Promise.all(uploadAllImagesPromise)
                    documents[key] = allData.map(item => item.secure_url)
                } else {
                    const { secure_url } = await cloudinary.uploader.upload(req.files[key][0].path)
                    documents[key] = secure_url
                }
            }
            // console.log(req.body);

            let jobHistory

            if (typeof (req.body.company) === "string") {
                jobHistory = {
                    company: req.body.company,
                    joinDate: req.body.joindate,
                    resingDate: req.body.resigndate,
                    jobRole: req.body.jobrole,
                    tech: req.body.tech.split(","),
                }
            } else {
                jobHistory = req.body.company.map((item, index) => ({
                    company: item,
                    joinDate: req.body.joindate[index],
                    resingDate: req.body.resigndate[index],
                    jobRole: req.body.jobrole[index],
                    tech: req.body.tech[index].split(","),
                }))
            }

            // console.log(documents, "doucmentsss");
            // console.log(req.body, "req.bodyyyyyyyyyy");
            // console.log(jobHistory, "jobshirtryyyyyy");

            const x = await Employee.findByIdAndUpdate(id, {
                // name:"xxxxxxxxxxxxxxxx", 
                gender: req.body.gender,
                dob: req.body.dob,
                department: req.body.department,
                jobtitle: req.body.jobtitle,
                documents: {
                    photo: documents["photo"],
                    resume: documents["resume"],
                    expletter: documents["expletter"],
                    other: documents["other"]
                },
                jobhistory: jobHistory,
                isExperinace: req.body.isExperinace
            })

            console.log(x, "updateeeeeeeeeeeeeee");
            res.status(200).json({ massage: "TeamLead profile update success", })
        } catch (error) {
            console.error(error)
            res.status(500).json({ message: "Error updating TeamLead profile" });
        }

    })

})


exports.requiestLeave = asyncHandler(async (req, res) => {
    const { reason, fromDate, noOfDays } = req.body
    const { isError, error } = checkEmpty({ reason, fromDate, noOfDays })
    if (isError) {
        return res.status(400).json({ message: "All Fields Required.", error })
    }
    await Leave.create({ reason: reason, fromDate: fromDate, noOfDays, userId: req.user })
    const result = await Leave.find()
    io.emit("fetch-employee-leave", result)
    res.json({ message: "Leave Request Send Success" })
})



exports.finrequeststatus = asyncHandler(async (req, res) => {
    // const result = await Leave.findOne({ userId: req.user })
    console.log("req.user", req.user);

    const result = await Leave.find({ userId: req.user })
    console.log("dddd", result);

    let employeeRequest = []
    for (let i = 0; i < result.length; i++) {
        const employee = result[i]
        employeeRequest.push(await employee.populate("userId"))
    }
    console.log(employeeRequest)
    if (!result) {
        return res.json({ message: "No Data Found" })
    }
    res.json({ message: "Leave Request Send Success", result: employeeRequest })



})



// exports.EmployeeLeteData = asyncHandler(async (req, res) => {
//     try {
//         const result = await Attendance.aggregate([
//             { $sort: { date: 1, checkIn: 1 } }, // sort date ani  check in time
//             {
//                 $group: {
//                     _id: { date: "$date", userId: "$userId" },  // group date ani userid
//                     firstLogin: { $first: "$$ROOT" }  // first login shodhto hia per daycha
//                 }
//             },
//             { $replaceRoot: { newRoot: "$firstLogin" } }
//         ]);


//         console.log(result, "Aggregated data...");

//         const populatedResult = await Attendance.populate(result, { path: "userId" });

//         const lateHrData = populatedResult.filter(employee =>
//             employee.userId.role === "employee" &&
//             employee.isLate === true &&
//             employee.checkInType === "Login",
//             // console.log(employee.userId),
//             console.log(req.user)

//         );

//         console.log("late hr data", lateHrData);

//         res.json({ message: "Late HR Fetch Success", result: lateHrData });
//     } catch (error) {
//         console.error("Error fetching late HR data:", error);
//         res.status(500).json({ message: "Error fetching late HR data" });
//     }
// });

// only fetch login employee late data
exports.EmployeeLeteData = asyncHandler(async (req, res) => {
    try {
        const loginUserId = req.user

        const result = await Attendance.aggregate([

            {
                $match: {
                    userId: new mongoose.Types.ObjectId(loginUserId), // Convert loginUserId to ObjectId
                    isLate: true,
                    checkInType: "Login",
                }
            },
            { $sort: { date: 1, checkIn: 1 } }, // sort date ani  check in time

            {
                $group: {
                    _id: { date: "$date", userId: "$userId" },  // group date ani userid
                    firstLogin: { $first: "$$ROOT" }  // first login shodhto hia per daycha
                }
            },
            { $replaceRoot: { newRoot: "$firstLogin" } }
        ]);

        console.log(result, "Aggregated data...");

        const populatedResult = await Attendance.populate(result, { path: "userId" });

        const lateHrData = populatedResult.filter(employee =>
            employee.userId.role === "employee" &&
            employee.isLate === true &&
            employee.checkInType === "Login"
        );

        console.log("late hr data", lateHrData);

        res.json({ message: "Late HR Fetch Success", result: lateHrData });
    } catch (error) {
        console.error("Error fetching late HR data:", error);
        res.status(500).json({ message: "Error fetching late HR data" });
    }
});









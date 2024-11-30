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
const { io } = require("../socket/socket")
const moment = require("moment");

const mongoose = require("mongoose")

exports.getTeamLeadProfile = asyncHandler(async (req, res) => {
    // const { id } = req.params
    // console.log("pramas", id)
    // console.log("ddd", req.user);
    const userId = req.user

    const result = await Employee.findOne({ _id: userId })
    console.log(result);

    res.status(200).json({ massage: "profile fetch success", result })
})


exports.updateTeamLeadProfile = asyncHandler(async (req, res) => {
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
            console.log(req.body);

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

            console.log(documents);
            console.log(jobHistory);

            await Employee.findByIdAndUpdate({ _id: id }, {
                gender: req.body.gender,
                dob: req.body.dob,
                department: req.body.department,
                documents: {
                    photo: documents["photo"],
                    resume: documents["resume"],
                    expletter: documents["expletter"],
                    other: documents["other"]
                },
                jobhistory: jobHistory
            })
            const dresult = await Employee.find()
            io.emit("fetch-teamlead-profile", dresult)
            res.status(200).json({ massage: "TeamLead profile update success" })
        } catch (error) {
            console.error(error)
            res.status(500).json({ message: "Error updating TeamLead profile" });
        }

    })

})







exports.requiestLeave = asyncHandler(async (req, res) => {
    const { reason, noOfDays, fromDate, } = req.body
    console.log(req.body);
    const { isError, error } = checkEmpty({ reason, noOfDays, fromDate, })
    if (isError) {
        return res.status(401).json({ message: "All Fields required" })
    }
    console.log(req.body);

    const result = await Leave.create({ reason, fromDate, noOfDays, userId: req.user })
    console.log("dddd", result);
    const dresult = await Leave.find()
    io.emit("fetch-leave-teamlead", dresult)
    res.status(200).json({ message: "leave request send succes", result })
})

exports.finrequeststatus = asyncHandler(async (req, res) => {
    const result = await Leave.find({ userId: req.user })
    let teamLeadRequest = []
    for (let i = 0; i < result.length; i++) {
        const employee = result[i]
        teamLeadRequest.push(await employee.populate("userId"))
    }
    console.log(teamLeadRequest)
    if (!result) {
        return res.json({ message: "No Data Found" })
    }
    res.json({ message: "Leave Request Send Success", result: teamLeadRequest })


})




exports.teamleadLeteData = asyncHandler(async (req, res) => {
    try {
        const loginUserId = req.user

        const result = await Attendance.aggregate([
            { $sort: { date: 1, checkIn: 1 } }, // sort date ani  check in time 

            {
                $match: {
                    userId: new mongoose.Types.ObjectId(loginUserId), // Convert loginUserId to ObjectId
                    isLate: true,
                    checkInType: "Login",
                }
            },
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
            employee.userId.role === "team lead" &&
            employee.isLate === true &&
            employee.checkInType === "Login"
        );

        console.log(lateHrData);

        res.json({ message: "Late HR Fetch Success", result: lateHrData });
    } catch (error) {
        console.error("Error fetching late HR data:", error);
        res.status(500).json({ message: "Error fetching late HR data" });
    }
});



















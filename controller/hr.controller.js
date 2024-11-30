const asyncHandler = require("express-async-handler")
const validator = require("validator")
const bcrypt = require("bcryptjs")
const Employee = require("../model/Employee")
const { checkEmpty } = require("../utils/cheackEmpty")
const JWT = require("jsonwebtoken")
const cloudinary = require("../utils/cloudinary.config")
const { projectUpload } = require("../utils/upload")
const Leave = require("../model/Leave")
const sendEmail = require("../utils/email")
const Attendance = require("../model/Attendance")
const path = require("path")
const excel = require("excel4node")
const { io } = require("../socket/socket")
const mongoose = require("mongoose")

exports.getHrProfile = asyncHandler(async (req, res) => {
    // const { id } = req.params
    // console.log("pramas", id)
    // console.log("ddd", req.user);
    console.log("body", req.body);

    const userId = req.user

    const result = await Employee.findOne({ _id: userId })
    res.status(200).json({ massage: "profile fetch success", result })
})

exports.updateHrProfile = asyncHandler(async (req, res) => {
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
            console.log(req.body);

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
            res.status(200).json({ massage: "Hr profile update success", })
        } catch (error) {
            console.error(error)
            res.status(500).json({ message: "Error updating TeamLead profile" });
        }

    })

})

exports.findserchemployee = asyncHandler(async (req, res) => {

    const result = await Employee.find(
        {
            $or: [{ department: req.body.search }, { status: req.body.search },
            { role: req.body.search },
            ]
        }
    );
    console.log(result);
    res.status(200).json({ message: "employee search success", result })
})



exports.updateLeaveRequest = asyncHandler(async (req, res) => {
    const { leave, noOfDays } = req.body
    const { id } = req.params
    const isFound = await Leave.findOne({ _id: id })
    if (isFound.leave === "accept") {
        return res.status(400).json({ message: "Leave Already Accepted" })
    }
    if (isFound.leave === "reject") {
        return res.status(400).json({ message: "Leave Already Rejected" })
    }
    let countLeave = 0
    let unPaidLeave = 0
    let isOnLeave
    const result = await isFound.populate("userId")
    if (leave === "accept") {
        if (result.userId.annual <= 0) {
            await sendEmail({
                to: result.userId.email, subject: `About Your Leave`, message: `<p>Your Leave count In Unpaid Leaves.</p>`
            })
            unPaidLeave = +result.unpaidLeaves + noOfDays
            if (!countLeave) {
                countLeave = result.userId.unpaidLeaves + noOfDays
                unPaidLeave = Math.abs(countLeave)
            } else {
                unPaidLeave = Math.abs(countLeave)
                if (countLeave <= 0) {
                    countLeave = 0
                }
            }
        } else {
            if (result.userId.annual >= noOfDays) {
                countLeave = result.userId.annual - noOfDays
            } else {
                countLeave = result.userId.annual - noOfDays
                unPaidLeave = Math.abs(countLeave)
                if (countLeave <= 0) {
                    countLeave = 0
                }
            }
        }
        isOnLeave = true
    } else {
        await sendEmail({
            to: result.userId.email, subject: `About Your Leave`, message: `<p>Your Leave Is Rejected By HR.</p>
`        })
    }
    await Leave.findByIdAndUpdate(id, { leave, })
    await Employee.findByIdAndUpdate(result.userId._id, { annual: countLeave, isOnLeave: isOnLeave, unpaidLeaves: unPaidLeave })
    const updatedResult = await Leave.find()
    io.emit("leave-update", updatedResult)
    res.json({ message: "Leave Update Success" })
})




exports.findemployeeleaverequest = asyncHandler(async (req, res) => {
    const result = await Leave.find()
    let EmployeeLeaveRequest = []
    for (let i = 0; i < result.length; i++) {
        const employee = result[i]
        EmployeeLeaveRequest.push(await employee.populate("userId"))
    }
    let employee = []
    for (let i = 0; i < EmployeeLeaveRequest.length; i++) {
        if (EmployeeLeaveRequest[i].userId.role === "employee") {
            employee.push(EmployeeLeaveRequest[i])
        }
    }
    console.log(employee)
    res.json({ message: "Leave Requests Fetch Success", result: employee })
})

exports.fetchTeamLeadLeaveRequest = asyncHandler(async (req, res) => {
    const result = await Leave.find()
    let TeamLeadRequest = []
    for (let i = 0; i < result.length; i++) {
        const employee = result[i]
        TeamLeadRequest.push(await employee.populate("userId"))
    }
    console.log("requeuuuuuuuuust", TeamLeadRequest);

    let TeamLead = []
    for (let i = 0; i < TeamLeadRequest.length; i++) {
        if (TeamLeadRequest[i].userId.role === "team lead") {
            TeamLead.push(TeamLeadRequest[i])
        }
    }
    console.log("dddddddddddd", TeamLead)
    res.json({ message: "TeamLead Requests Fetch Success", result: TeamLead })
})

exports.requiestLeave = asyncHandler(async (req, res) => {
    const { reason, fromDate, noOfDays } = req.body
    const { isError, error } = checkEmpty({ reason, fromDate, noOfDays })
    if (isError) {
        return res.status(400).json({ message: "All Fields Required.", error })
    }
    await Leave.create({ reason: reason, fromDate: fromDate, noOfDays, userId: req.user })

    const result = await Leave.find()
    let EmployeeLeaveRequest = []
    for (let i = 0; i < result.length; i++) {
        const employee = result[i]
        EmployeeLeaveRequest.push(await employee.populate("userId"))
    }
    let employee = []

    for (let i = 0; i < EmployeeLeaveRequest.length; i++) {
        console.log(EmployeeLeaveRequest[i])
        if (EmployeeLeaveRequest[i].userId.role === "hr") {
            employee.push(EmployeeLeaveRequest[i])
        }
    }
    io.emit("fetch-leave", employee)
    res.json({ message: "Leave Request Send Success" })
})

exports.fetchequeststatus = asyncHandler(async (req, res) => {

    const result = await Leave.find({ userId: req.user })
    let hrleaveRequest = []
    for (let i = 0; i < result.length; i++) {
        const employee = result[i]
        hrleaveRequest.push(await employee.populate("userId"))
    }
    console.log(hrleaveRequest)
    if (!result) {
        return res.json({ message: "No Data Found" })
    }
    res.json({ message: "Leave Request Send Success", result: hrleaveRequest })

})


exports.fetchAllEmployee = asyncHandler(async (req, res) => {
    const result = await Employee.find({ role: "employee" })
    res.status(200).json({ massage: "profile fetch success", result })
})

exports.fetchAllTeamLead = asyncHandler(async (req, res) => {
    const result = await Employee.find({ role: "team lead" })
    res.status(200).json({ massage: "profile fetch success", result })
})

exports.EmployeeAttendenceFetch = asyncHandler(async (req, res) => {
    const result = await Attendance.find()
    let EmployeeAtt = []
    for (let i = 0; i < result.length; i++) {
        const attendence = result[i]
        EmployeeAtt.push(await attendence.populate("userId"))
    }
    let EmpAttendence = []
    for (let i = 0; i < EmployeeAtt.length; i++) {
        if (EmployeeAtt[i].userId.role === "employee") {
            EmpAttendence.push(EmployeeAtt[i])
        }
    }
    res.json({ message: "Employee Attendence fetch Success", result: EmpAttendence })
})

exports.TeamLeadAttendenceFetch = asyncHandler(async (req, res) => {
    const result = await Attendance.find()
    let teamLeadAtt = []
    for (let i = 0; i < result.length; i++) {
        const attendence = result[i]
        teamLeadAtt.push(await attendence.populate("userId"))
    }
    let teamAttendence = []
    for (let i = 0; i < teamLeadAtt.length; i++) {
        if (teamLeadAtt[i].userId.role === "team lead") {
            teamAttendence.push(teamLeadAtt[i])
        }
    }
    res.json({ message: "TeamLead Attendence fetch Success", result: teamAttendence })
})

exports.EmpAttendenceExcel = asyncHandler(async (req, res) => {
    const workbook = new excel.Workbook()
    const worksheet = workbook.addWorksheet("Employee Attendence")
    const result = await Attendance.find()
    let EmployeeAtt = []
    for (let i = 0; i < result.length; i++) {
        const attendence = result[i]
        EmployeeAtt.push(await attendence.populate("userId"))
    }
    let EmpAttendence = []
    for (let i = 0; i < EmployeeAtt.length; i++) {
        if (EmployeeAtt[i].userId.role === "employee") {
            EmpAttendence.push(EmployeeAtt[i])
        }
    }
    const x = EmpAttendence.map(item => [item.checkIn, item.checkout && item.checkout, item.date, item.isLate ? "Late" : "onTime", item.isPresent ? "Absent" : "Present", item.userId.name, item.userId.email])
    const Data = [
        ["CheckIn", "CheckOut", "Date", "IsLate", "Absent", "Name", "Email"],
    ]
    for (let i = 0; i < x.length; i++) {
        Data.push(x[i])
    }

    Data.forEach((row, rowIndex) => {
        console.log(row);

        row.forEach((cell, cellIndex) => {

            worksheet.cell(rowIndex + 1, cellIndex + 1).string(cell.toString())
        })
    })
    const fn = Date.now() + path.extname("EmployeeAttendence.xlsx")
    const filePath = path.join(__dirname, "..", 'excelSheet', fn);
    workbook.write(filePath, (err, status) => {
        if (err) {
            console.log(err);
        }
        res.json({ message: "Attendence Excel Sheet Create Success" })
    })
})

// exports.hrLeteData = asyncHandler(async (req, res) => {

//     const result = await Attendance.find()
//     let employeeLate = []
//     for (let i = 0; i < result.length; i++) {
//         const employee = result[i]
//         employeeLate.push(await employee.populate("userId"))
//     }



//     let employee = []

//     for (let i = 0; i < employeeLate.length; i++) {
//         if (employeeLate[i].userId.role === "employee") {
//             employee.push(employeeLate[i])
//         }


//     }



//     let LateEmployee = []

//     for (let i = 0; i < employee.length; i++) {
//         if (employee[i].isLate === true && employee[i].checkInType === "Login") {
//             console.log("loigin", employee[i]);
//             LateEmployee.push(employee[i])
//         }

//     }



//     res.json({ message: "late Employee Fetch Succcess", result: LateEmployee })

// })


exports.hrLeteData = asyncHandler(async (req, res) => {
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
            employee.userId.role === "hr" &&
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

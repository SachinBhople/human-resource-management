const asyncHandler = require("express-async-handler");
const Employee = require("../model/Employee");
const Leave = require("../model/Leave");
const Attendance = require("../model/Attendance");
const { io } = require("../socket/socket");
const sendEmail = require("../utils/email");

exports.gethandleSearch = asyncHandler(async (req, res) => {

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

exports.fetchAllEmployee = asyncHandler(async (req, res) => {
    const result = await Employee.find({ role: "employee" })
    res.status(200).json({ massage: "profile fetch success", result })
})
exports.fetchAllTeamLead = asyncHandler(async (req, res) => {
    const result = await Employee.find({ role: "team lead" })
    res.status(200).json({ massage: "profile fetch success", result })
})
exports.fetchAllHr = asyncHandler(async (req, res) => {
    const result = await Employee.find({ role: "hr" })
    res.status(200).json({ massage: "profile fetch success", result })
})

exports.findhrleaverequest = asyncHandler(async (req, res) => {
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
    console.log(employee)
    res.json({ message: "Leave Requests Fetch Success", result: employee })
})

// exports.updateHrLeaveRequest = asyncHandler(async (req, res) => {
//     const { leave, noOfDays } = req.body
//     const { id } = req.params
//     const isFound = await Leave.findOne({ _id: id })
//     if (isFound.leave === "accept") {
//         return res.status(400).json({ message: "Leave Already Accepted" })
//     }
//     if (isFound.leave === "reject") {
//         return res.status(400).json({ message: "Leave Already Rejected" })
//     }
//     let countLeave = 0
//     let unPaidLeave = 0
//     let isOnLeave = 0
//     const result = await isFound.populate("userId")
//     if (leave === "accept") {
//         if (+result.userId.annual <= 0) {
//             res.status(400).json({ message: "Your Annual Leave Is Finished." })
//             await sendEmail({
//                 to: result.userId.email, subject: `About Your Leave`, message: ` <p>Your Leave count In Unpaid Leaves.</p>`
//             })
//             unPaidLeave = result.userId.unpaidLeaves + noOfDays
//         } else {
//             console.log("!anuual");
//             // console.log("anuuulal", result.userId.annual);
//             if (+result.userId.annual >= noOfDays) {
//                 console.log("if");

//                 countLeave = result.userId.annual - noOfDays
//             } else {
//                 console.log("else", result.userId.annual);
//                 countLeave = +result.userId.annual - noOfDays
//                 unPaidLeave = Math.abs(countLeave)
//                 if (countLeave <= 0) {
//                     countLeave = 0
//                 }
//             }
//         }
//         isOnLeave = true
//     } else {
//         await sendEmail({
//             to: result.userId.email, subject: `About Your Leave`, message: `<p>Your Leave Is Rejected By HR.</p>`
//         })
//     }
//     await Leave.findByIdAndUpdate(id, { leave, })
//     await Employee.findByIdAndUpdate(result.userId._id, { annual: countLeave, isOnLeave: isOnLeave, unpaidLeaves: unPaidLeave })
//     const dresult = await Leave.find()
//     io.emit("update-leave", dresult)
//     res.json({ message: "Leave Update Success" })

// })


exports.updateHrLeaveRequest = asyncHandler(async (req, res) => {
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


exports.adminEmployeeAttendenceFetch = asyncHandler(async (req, res) => {
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

exports.adminTeamLeadAttendenceFetch = asyncHandler(async (req, res) => {
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

// exports.fetchLetEmployee = asyncHandler(async (req, res) => {
//     const result = await Attendance.find()

//     let teamLeadAtt = []
//     for (let i = 0; i < result.length; i++) {
//         const attendence = result[i]
//         teamLeadAtt.push(await attendence.populate("userId"))
//     }
//     let teamAttendence = []
//     for (let i = 0; i < teamLeadAtt.length; i++) {
//         if (teamLeadAtt[i].isLate === true) {
//             teamAttendence.push(teamLeadAtt[i])
//         }
//     }

//     res.json({ message: "TeamLead Attendence fetch Success", result: teamAttendence })
// })


// exports.fetchabsentEmployee = asyncHandler(async (req, res) => {
//     const result = await Attendance.find()
//     let teamLeadAtt = []
//     for (let i = 0; i < result.length; i++) {
//         const attendence = result[i]
//         teamLeadAtt.push(await attendence.populate("userId"))
//     }
//     let teamAttendence = []
//     for (let i = 0; i < teamLeadAtt.length; i++) {
//         if (teamLeadAtt[i].isPresent === false) {
//             teamAttendence.push(teamLeadAtt[i])
//         }
//     }

//     res.json({ message: "TeamLead Attendence fetch Success", result: teamAttendence })
// })

// exports.AdminLateEmployee = asyncHandler(async (req, res) => {
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
//             // employee.userId.role === "employee" &&
//             employee.isLate === true &&
//             employee.checkInType === "Login"
//         );

//         console.log(lateHrData);

//         res.json({ message: "Late HR Fetch Success", result: lateHrData });
//     } catch (error) {
//         console.error("Error fetching late HR data:", error);
//         res.status(500).json({ message: "Error fetching late HR data" });
//     }
// });

exports.AdminLateEmployee = asyncHandler(async (req, res) => {
    try {
        const result = await Attendance.aggregate([
            // Match records where login is late and check-in type is 'Login'
            {
                $match: {
                    isLate: true,
                    checkInType: "Login"
                }
            },
            // Sort by date and check-in time
            { $sort: { date: 1, checkIn: 1 } },
            // Group by date and userId to get the first login per day for each employee
            {
                $group: {
                    _id: { date: "$date", userId: "$userId" },
                    firstLogin: { $first: "$$ROOT" }
                }
            },
            // Replace the root with the first login document
            { $replaceRoot: { newRoot: "$firstLogin" } }
        ]);

        // Populate user information in the results
        const populatedResult = await Attendance.populate(result, { path: "userId" });

        console.log("Filtered late login data for employees:", populatedResult);

        res.json({ message: "Late HR Fetch Success", result: populatedResult });
    } catch (error) {
        console.error("Error fetching late HR data:", error);
        res.status(500).json({ message: "Error fetching late HR data" });
    }
});



// exports.absentEmployee = asyncHandler(async (req, res) => {
//     const { monthstart } = req.body;
//     const attendanceRecords = await Attendance.find();
//     // const monthstart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
//     // Populate userId for each attendance record
//     let populatedRecords = [];
//     for (let i = 0; i < attendanceRecords.length; i++) {
//         const record = attendanceRecords[i];
//         populatedRecords.push(await record.populate("userId"));
//     }

//     // Generate all dates from monthstart to the current date
//     const startDate = new Date(monthstart);
//     const endDate = new Date();
//     const dates = [];

//     for (let currentDate = startDate; currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
//         dates.push(currentDate.toISOString().split('T')[0]); // Format to YYYY-MM-DD
//     }

//     // Group attendance records by employee (userId)
//     const employeeAttendance = {};
//     for (let i = 0; i < populatedRecords.length; i++) {
//         const { date, userId } = populatedRecords[i];
//         const id = userId.toString(); // Convert ObjectId to string
//         if (!employeeAttendance[id]) {
//             employeeAttendance[id] = { userId: userId._id, name: userId.name, role: userId.role, dates: [] };
//         }
//         employeeAttendance[id].dates.push(date);
//     }

//     // Calculate absent dates per employee using previous absences logic
//     const absences = Object.values(employeeAttendance).map(employee => {
//         const absentDates = dates.filter(date => !employee.dates.includes(date));
//         return {
//             userId: employee.userId,
//             name: employee.name,
//             role: employee.role,
//             absentDates,
//         };
//     });

//     res.json({ message: "Fetch Success", result: absences });
// });


exports.absentEmployee = asyncHandler(async (req, res) => {
    // Automatically set monthstart to the first day of the current month
    const monthstart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const result = await Attendance.find().populate("userId"); // Fetch records where employees were present

    const dates = [];
    let currentDate = new Date(monthstart);
    const end = new Date();

    // Generate all dates from the start of the month to the current date
    while (currentDate <= end) {
        dates.push(currentDate.toISOString().split('T')[0]); // Format to YYYY-MM-DD
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Group attendance records by employee (userId)
    const employeeAttendance = result.reduce((acc, record) => {
        const date = record.date;
        const userId = record.userId._id.toString(); // Convert ObjectId to string

        if (!acc[userId]) {
            acc[userId] = { name: record.userId.name, role: record.userId.role, dates: [] };
        }
        acc[userId].dates.push(date); // Add the date this employee was present
        return acc;
    }, {});

    // Calculate absent dates per employee
    const absences = Object.values(employeeAttendance).map(employee => {
        const absentDates = dates.filter(date => !employee.dates.includes(date));
        return {
            userId: employee.userId,
            name: employee.name,
            role: employee.role,
            absentDates,
        };
    });

    res.json({ message: "Fetch Success", result: absences });
});

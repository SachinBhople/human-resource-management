const asyncHandler = require("express-async-handler")
const validator = require("validator")
const bcrypt = require("bcryptjs")
const Employee = require("../model/Employee")
const { checkEmpty } = require("../utils/cheackEmpty")
const JWT = require("jsonwebtoken")
const cloudinary = require("../utils/cloudinary.config")
const { projectUpload } = require("../utils/upload")
const Leave = require("../model/Leave")


exports.getManagerProfile = asyncHandler(async (req, res) => {
    // const { id } = req.params
    // console.log("pramas", id)
    // console.log("ddd", req.user);
    const userId = req.user

    const result = await Employee.findOne({ _id: userId })
    res.status(200).json({ massage: "profile fetch success", result })
})

exports.updateManagerProfile = asyncHandler(async (req, res) => {
    projectUpload(req, res, async err => {
        // const { id } = req.params
        const id = req.user

        if (err) {
            console.log(err)
            return res.status(400).json({ message: "Multer Error" })
        }


        // console.log("bodydy", req.body);
        // console.log("req.fileessss", req.files);
        console.log("req.usseree", id);

        // if (
        //     !req.files["photo"] ||
        //     !req.files["resume"] ||
        //     !req.files["experinceLetter"] ||
        //     !req.files["other"]

        // ) {
        //     return res.status(400).json({ message: "All Images Required" })
        // }


        const documents = {}
        for (const key in req.files) {
            if (key === "experinceLetter" || key === "other") {

                if (!documents[key]) {
                    documents[key] = []
                }
                const uploadAllImagesPromise = []

                for (const item of req.files[key]) {
                    uploadAllImagesPromise.push(cloudinary.uploader.upload(item.path))
                    // uploadAllImagesPromise.push(cloudinary.uploader.upload(item.path))
                }
                const allData = await Promise.all(uploadAllImagesPromise)
                documents[key] = allData.map(item => item.secure_url)

            } else {
                const { secure_url } = await cloudinary.uploader.upload(req.files[key][0].path)
                documents[key] = secure_url
            }
        }

        await Employee.findByIdAndUpdate(id, {
            gender: req.body.gender,
            online: req.body.online,
            dob: req.body.dob,
            department: req.body.department,
            documents: {
                photo: documents["photo"],
                resume: documents["resume"],
                experinceLetter: documents["experinceLetter"],
                other: documents["other"]
            },
        })
        res.status(200).json({ massage: "profile update success" })

    })

})

exports.findemployeeleaverequest = asyncHandler(async (req, res) => {
    console.log(req.body);
    // const result = await Employee.find()
    const result = await Leave.find().populate("userId")
    // console.log(result[0].role);
    // console.log(result.userId.role);
    // console.log("roleeee", result[0].userId.role)

    console.log(result);


    if (result[0].userId.role !== "team lead") {
        return res.status(400).json({ message: "not Data found why but" })
    }



    res.status(200).json({ message: "leave request recive", result })
})

exports.updateleavrequest = asyncHandler(async (req, res) => {
    const { id } = req.params


    await Leave.findByIdAndUpdate(id, {
        ...req.body,
        // reason: req.body.reason,
        // fromData: req.body.fromData,
        // toDate: req.body.toDate,
        leave: req.body.leave,
        annual: req.body.annual - 1,
        // sick: req.body.sick,
        // unpaidLeaves: req.body.unpaidLeaves,
    })
    res.json({ message: "success" })
})


// exports.teamleadLeteData = asyncHandler(async (req, res) => {
//     try {
//         const result = await Attendance.aggregate([
//             { $sort: { date: 1, checkout: 1 } },
//             { $group: { _id: "$date", firstLogin: { $first: "$$ROOT" } } },
//             { $replaceRoot: { newRoot: "$firstLogin" } }
//         ]);

//         console.log(result, "Aggregated data...");

//         const populatedResult = await Attendance.populate(result, { path: "userId" });

//         const lateHrData = populatedResult.filter(employee =>
//             employee.userId.role === "team lead" &&
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










// exports.EmployeeLeteData = asyncHandler(async (req, res) => {

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



// / exports.absentEmployee = asyncHandler(async (req, res) => {
    //     const { monthstart } = req.body
    //     const result = await Attendance.find().populate("userId")
    //     const dates = [];
    //     let currentDate = new Date(monthstart);
    //     const end = new Date()
    
    //     while (currentDate <= end) {
    //         dates.push(currentDate.toISOString().split('T')[0]); // Format to YYYY-MM-DD
    //         currentDate.setDate(currentDate.getDate() + 1);
    //     }
    //     console.log(result);
    //     const loggedDates = result.map(record => record.date)
    //     const absentDates = dates.filter(date => !loggedDates.includes(date));
    //     console.log(absentDates)
    
    //     res.json({ message: "Fetch Success", result: absentDates })
    // })
    
    
    // exports.absentEmployee = asyncHandler(async (req, res) => {
    //     const { monthstart } = req.body;
    //     const result = await Attendance.find();  // Fetch all attendance records
    //     const dates = [];
    //     let currentDate = new Date(monthstart);
    //     const end = new Date();
    
    //     // Generate all dates from monthstart to the current date
    //     while (currentDate <= end) {
    //         dates.push(currentDate.toISOString().split('T')[0]); // Format to YYYY-MM-DD
    //         currentDate.setDate(currentDate.getDate() + 1);
    //     }
    
    //     // Group attendance records by employee
    //     const employeeAttendance = result.reduce((acc, record) => {
    //         const date = record.date;
    //         const employeeId = record.employeeId;
    
    //         if (!acc[employeeId]) {
    //             acc[employeeId] = [];
    //         }
    //         acc[employeeId].push(date);
    //         return acc;
    //     }, {});
    
    //     // Calculate absent dates per employee
    //     const absences = Object.keys(employeeAttendance).map(employeeId => {
    //         const loggedDates = employeeAttendance[employeeId];
    //         const absentDates = dates.filter(date => !loggedDates.includes(date));
    //         return { employeeId, absentDates };
    //     });
    
    //     res.json({ message: "Fetch Success", result: absences });
    // });
    
    
    
    
    // exports.absentEmployee = asyncHandler(async (req, res) => {
    //     const { monthstart } = req.body;
    //     const result = await Attendance.find().populate("userId"); // Only fetch records where the employee was present
    
    //     const dates = [];
    //     let currentDate = new Date(monthstart);
    //     const end = new Date();
    
    //     // Generate all dates from monthstart to the current date
    //     while (currentDate <= end) {
    //         dates.push(currentDate.toISOString().split('T')[0]); // Format to YYYY-MM-DD
    //         currentDate.setDate(currentDate.getDate() + 1);
    //     }
    
    //     // Group attendance records by employee (userId)
    //     const employeeAttendance = result.reduce((acc, record) => {
    //         const date = record.date;
    //         const userId = record.userId.toString(); // Convert ObjectId to string
    
    //         if (!acc[userId]) {
    //             acc[userId] = [];
    //         }
    //         acc[userId].push(date); // Add the date this employee was present
    //         return acc;
    //     }, {});
    
    //     // Calculate absent dates per employee
    //     const absences = Object.keys(employeeAttendance).map(userId => {
    //         const loggedDates = employeeAttendance[userId];
    //         const absentDates = dates.filter(date => !loggedDates.includes(date));
    //         return { userId, absentDates };
    //     });
    
    //     res.json({ message: "Fetch Success", result: absences });
    // });
    
    
    
    
    // exports.absentEmployee = asyncHandler(async (req, res) => {
    //     // Automatically set monthstart to the first day of the current month
    //     const monthstart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
    //     const result = await Attendance.find().populate("userId"); // Fetch records where employees were present
    
    //     const dates = [];
    //     let currentDate = new Date(monthstart);
    //     const end = new Date();
    
    //     // Generate all dates from the start of the month to the current date
    //     while (currentDate <= end) {
    //         dates.push(currentDate.toISOString().split('T')[0]); // Format to YYYY-MM-DD
    //         currentDate.setDate(currentDate.getDate() + 1);
    //     }
    
    //     // Group attendance records by employee (userId)
    //     const employeeAttendance = result.reduce((acc, record) => {
    //         const date = record.date;
    //         const userId = record.userId.toString(); // Convert ObjectId to string
    
    //         if (!acc[userId]) {
    //             acc[userId] = [];
    //         }
    //         acc[userId].push(date); // Add the date this employee was present
    //         return acc;
    //     }, {});
    
    //     // Calculate absent dates per employee
    //     const absences = Object.keys(employeeAttendance).map(userId => {
    //         const loggedDates = employeeAttendance[userId];
    //         const absentDates = dates.filter(date => !loggedDates.includes(date));
    //         return { userId, absentDates };
    //     });
    
    //     res.json({ message: "Fetch Success", result: absences });
    // });
    
    
    // exports.absentEmployee = asyncHandler(async (req, res) => {
    //     const { monthstart } = req.body;
    //     const attendanceRecords = await Attendance.find();
    
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
    //             employeeAttendance[id] = [];
    //         }
    //         employeeAttendance[id].push(date);
    //     }
    
    //     // Calculate absent dates per employee
    //     let absences = [];
    //     for (const userId in employeeAttendance) {
    //         const loggedDates = employeeAttendance[userId];
    //         const absentDates = dates.filter(date => !loggedDates.includes(date));
    //         absences.push({ userId, absentDates });
    //     }
    
    
    //     res.json({ message: "Fetch Success", result: absences });
    // });
    
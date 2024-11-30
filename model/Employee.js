const mongoose = require("mongoose")

const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    mobile: { type: String },
    department: { type: String },
    dob: { type: String },
    jobtitle: { type: String },
    documents: {
        photo: { type: String },
        resume: { type: String },
        expletter: { type: [String] },
        other: { type: [String] }
    },
    isExperinace: { type: Boolean, default: false },
    // leaverequest: {
    //     sendTo: { type: String, enum: ["team lead", "manager", "hr",], default: "team lead" },
    //     leave: { type: String, enum: ["request", "accept", "reject",], default: "request" }
    // },

    jobhistory: [
        {
            company: { type: String },
            joinDate: { type: String },
            jobRole: { type: String },
            resingDate: { type: String },
            tech: { type: [String] }
        }
    ],
    gender: { type: String },
    userId: { type: mongoose.Types.ObjectId, ref: "employee" },
    role: { type: String, enum: ["admin", "hr", "manager", "team lead", "employee"], default: "employee" },
    status: { type: String, enum: ["active", "resigned", "on-leave"], default: "active" },
    online: { type: Boolean, default: false },
    hr: { type: [mongoose.Types.ObjectId], ref: "hr" },
    resigned: {
        reason: { type: String, },
        userId: { type: mongoose.Types.ObjectId, ref: "employee" },
        email: { type: String, },
        isResigned: { type: Boolean, default: true }
    },

    annual: { type: Number, default: 12 },
    sick: { type: Number, default: 5 },
    unpaidLeaves: { type: Number, },



}, { timestamps: true })

module.exports = mongoose.model("employee", employeeSchema)




// const mongoose = require("mongoose")

// const employeeSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     email: { type: String, required: true },
//     password: { type: String, required: true },
//     mobile: { type: String },
//     department: { type: String },
//     gender: { type: String },
//     dob: { type: String },
//     jobtitle: { type: String },
//     documents: {
//         resume: { type: String },
//         photo: { type: String },
//         expletter: { type: [String] },
//         other: { type: [String] },
//     },
//     userId: { type: mongoose.Types.ObjectId, ref: "auth", },
//     role: { type: String, enum: ["hr", "manager", "teamLead", "employee"], default: "employee" },
//     status: { type: String, enum: ["active", "resigned", "on-leave"], default: "active" },
//     online: { type: Boolean, default: false },
//     isExpirence: { type: Boolean, default: false },
//     jobHistory: [
//         {
//             compony: { type: String },
//             joindate: { type: String },
//             resigndate: { type: String },
//             jobrole: { type: String },
//             tech: { type: [String] }
//         }
//     ],
//     annual: { type: Number, default: 12 },
//     sick: { type: Number, default: 5 },
//     unpaidLeaves: { type: Number, },
//     resigned: {
//         reason: { type: String, },
//     },

// }, { timestamps: true })

// module.exports = mongoose.model("employee", employeeSchema)
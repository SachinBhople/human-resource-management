const mongoose = require("mongoose")

const attendanceSchma = mongoose.Schema({
    checkIn: { type: String },
    checkout: { type: String, },
    checkInType: { type: String, enum: ["Login", "Logout"], default: "Login" },
    userId: { type: mongoose.Types.ObjectId, ref: "employee" },
    isPresent: { type: Boolean, default: false },
    date: { type: String },
    isLate: { type: Boolean, default: false },

}, { timestamps: true })

module.exports = mongoose.model("attendance", attendanceSchma)
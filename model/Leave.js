const mongoose = require("mongoose")

const leaveSchema = mongoose.Schema({
    reason: { type: String, },
    fromDate: { type: String, },
    noOfDays: { type: Number, },
    userId: { type: mongoose.Types.ObjectId, ref: "employee" },
    leave: { type: String, enum: ["request", "accept", "reject",], default: "request" },
    IsOnleave: { type: Boolean, default: false },
}, { timestamps: true })

module.exports = mongoose.model("leave", leaveSchema)
const hrController = require("../controller/hr.controller")
const { hrProtected } = require("../middleware/Protected")


const router = require("express").Router()

router

    .get("/hr-profile", hrProtected, hrController.getHrProfile)
    .put("/update-hr-profile/:id", hrProtected, hrController.updateHrProfile)
    .post("/search", hrController.findserchemployee)
    .get("/find-leave", hrController.findemployeeleaverequest)
    .get("/find-teamlead-leave", hrController.fetchTeamLeadLeaveRequest)
    .put("/udate-leave/:id", hrController.updateLeaveRequest)
    .post("/request-leave", hrProtected, hrController.requiestLeave)
    .get("/leave-status", hrProtected, hrController.fetchequeststatus)

    .get("/fetch-teamlead", hrController.fetchAllTeamLead)
    .get("/fetch-employee", hrController.fetchAllEmployee)
    .post("/employee-attendce", hrController.EmpAttendenceExcel)
    .get("/fetch-employee-attence", hrController.EmployeeAttendenceFetch)
    .get("/fetch-teamLead-attendce", hrController.TeamLeadAttendenceFetch)
    .get("/late-hr", hrProtected, hrController.hrLeteData)


module.exports = router
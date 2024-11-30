const adminController = require("../controller/admin.controller")

const router = require("express").Router()

router

    .post("/handle-search-admin", adminController.gethandleSearch)
    .get("/fetch-employee", adminController.fetchAllEmployee)
    .get("/fetch-teamlead", adminController.fetchAllTeamLead)
    .get("/fetch-hr", adminController.fetchAllHr)
    .get("/find-leaverequest", adminController.findhrleaverequest)
    .put("/update-leaverequest/:id", adminController.updateHrLeaveRequest)
    .get("/employee-attendnce", adminController.adminEmployeeAttendenceFetch)
    .get("/teamlead-attendnce", adminController.adminTeamLeadAttendenceFetch)
    // .get("/fetch-letemployee", adminController.fetchLetEmployee)
    // .get("/fetch-absentemployee", adminController.fetchabsentEmployee)
    .get("/fetch-letEmployee", adminController.AdminLateEmployee)
    .get("/fetch-absentemployee", adminController.absentEmployee)

module.exports = router
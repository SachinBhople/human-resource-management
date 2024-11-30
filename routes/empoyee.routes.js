const empoyeeController = require("../controller/employee.controller")
const { hrProtected, employeeProtected } = require("../middleware/Protected")

const router = require("express").Router()

router

    .post("/register", hrProtected, empoyeeController.registerEmployee)
    .post("/login-hr", empoyeeController.loginHr)
    .post("/login-teamlead", empoyeeController.loginTeamLead)
    .post("/login-employee", empoyeeController.loginEmployee)
    .post("/login-manager", empoyeeController.loginManagar)
    .put("/logout-employee/:id", empoyeeController.logoutEmployee)
    .put("/logout-teamlead/:id", empoyeeController.logoutTeamLead)
    .post("/logout-teamlead", empoyeeController.loginManagar)
    .put("/logout-hr/:id", hrProtected, empoyeeController.Logouthr)

    .get("/profile", employeeProtected, empoyeeController.getEmployeeProfile)
    .put("/update-profile/:id", employeeProtected, empoyeeController.updateemployeeProfile)
    .post("/leave-request", employeeProtected, empoyeeController.requiestLeave)
    .get("/find-leavestatus", employeeProtected, empoyeeController.finrequeststatus)
    .get("/late-employee", employeeProtected, empoyeeController.EmployeeLeteData)


module.exports = router
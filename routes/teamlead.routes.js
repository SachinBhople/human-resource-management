const teamLeadController = require("../controller/teamLead.controller")
const { teamLeadProtect } = require("../middleware/Protected")


const router = require("express").Router()

router
    .get("/teamlead-profile", teamLeadProtect, teamLeadController.getTeamLeadProfile)
    .put("/update-teamlead-profile/:id", teamLeadProtect, teamLeadController.updateTeamLeadProfile)
    .post("/leave-request-teamlead", teamLeadProtect, teamLeadController.requiestLeave)
    .get("/find-leavestatus", teamLeadProtect, teamLeadController.finrequeststatus)
    .get("/fetch-lates", teamLeadProtect, teamLeadController.teamleadLeteData)

module.exports = router
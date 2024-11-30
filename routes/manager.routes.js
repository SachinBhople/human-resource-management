const managerController = require("../controller/manager.controller")
const { managerProtected } = require("../middleware/Protected")


const router = require("express").Router()

router

    .get("/manager-profile", managerProtected, managerController.getManagerProfile)
    .put("/update-manager-profile/:id", managerProtected, managerController.updateManagerProfile)

    .get("/find-leave-teamlead", managerController.findemployeeleaverequest)
    .put("/udate-leave/:id", managerController.updateleavrequest)
module.exports = router
const jwt = require("jsonwebtoken")

exports.adminProtected = (req, res, next) => {
    const { admin } = req.cookies
    console.log("admin Protected", admin)

    if (!admin) {
        return res.status(401).json({ message: "No Cookie Found" })
    }
    jwt.verify(admin, process.env.JWT_KEY, (error, decode) => {
        if (error) {
            console.log(error)
            return res.status(401).json({ message: "Invalid Token" })
        }
        req.user = decode.userID
        console.log("protected", req.user, "****");

        next()
    })
}
exports.hrProtected = (req, res, next) => {
    const { hr } = req.cookies
    console.log(req.cookies)

    if (!hr) {
        return res.status(401).json({ message: "No Cookie Found" })
    }
    jwt.verify(hr, process.env.JWT_KEY, (error, decode) => {
        if (error) {
            console.log(error)
            return res.status(401).json({ message: "Invalid Token" })
        }
        req.user = decode.userID
        console.log("protected", req.user);

        next()
    })
}
exports.managerProtected = (req, res, next) => {
    const { manager } = req.cookies
    console.log("MANERR", req.cookies)

    if (!manager) {
        return res.status(401).json({ message: "No Cookie Found" })
    }
    jwt.verify(manager, process.env.JWT_KEY, (error, decode) => {
        if (error) {
            console.log(error)
            return res.status(401).json({ message: "Invalid Token" })
        }
        req.user = decode.userID
        console.log("MANGERR", req.user);

        next()
    })
}
exports.teamLeadProtect = (req, res, next) => {
    const { teamLead } = req.cookies
    console.log(req.cookies)

    if (!teamLead) {
        return res.status(401).json({ message: "No Cookie Found" })
    }
    jwt.verify(teamLead, process.env.JWT_KEY, (error, decode) => {
        if (error) {
            console.log(error)
            return res.status(401).json({ message: "Invalid Token" })
        }
        req.user = decode.userID
        console.log("protected", req.user);

        next()
    })
}
exports.employeeProtected = (req, res, next) => {
    const { employee } = req.cookies
    console.log("employee cookies", employee)

    if (!employee) {
        return res.status(401).json({ message: "No Cookie Found" })
    }
    jwt.verify(employee, process.env.JWT_KEY, (error, decode) => {
        if (error) {
            console.log(error)
            return res.status(401).json({ message: "Invalid Token" })
        }
        req.user = decode.userID
        console.log("protected", req.user);

        next()
    })
}
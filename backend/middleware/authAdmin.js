import jwt from "jsonwebtoken"

// admin authentication middleware
const authAdmin = async (req, res, next) => {
    try {
        const { atoken } = req.headers

        if (!atoken) {
            return res.json({ success: false, message: "Not Authorized" })
        }

        const decoded = jwt.verify(atoken, process.env.JWT_SECRET)

        if (decoded.role !== "admin") {
            return res.json({ success: false, message: "Not Authorized" })
        }

        req.user = decoded
        next()

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export default authAdmin
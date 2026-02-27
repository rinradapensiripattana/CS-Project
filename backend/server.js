import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import adminRouter from "./routes/adminRoute.js"
import doctorRouter from './routes/doctorRoute.js'
import userRouter from './routes/userRoute.js'
import db from "./config/mysql.js"
import path from "path"

const app = express()
const port = process.env.PORT || 4000

// ✅ ต้องมีอันนี้อันเดียว
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")))

app.use(express.json())

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true
}))

app.use("/api/admin", adminRouter)
app.use("/api/user", userRouter)
app.use("/api/doctor", doctorRouter)

app.get('/', (req, res) => {
  res.send('API WORKING')
})

app.listen(port, () => {
  console.log("Server Started", port)
})
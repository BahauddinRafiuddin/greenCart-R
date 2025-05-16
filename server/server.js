import express from 'express'
import 'dotenv/config'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import connectDb from './config/db.js'
import userRouter from './routes/userRoutes.js'
import sellerRouter from './routes/sellerRoutes.js'
import cloudinaryConnect from './config/cloudinary.js'
import productRouter from './routes/productRoutes.js'
import cartRouter from './routes/cartRoutes.js'
import addressRouter from './routes/addressRoutes.js'
import orderRouter from './routes/orderRoutes.js'
import { stripeWebhook } from './controllers/orderController.js'


const app = express()
const port = process.env.PORT || 10000
const allowedOrigin = [
  'http://localhost:5173',
  'https://green-cart-r-frontend-qzuigtu7b-bahauddinrafiuddins-projects.vercel.app'  // Add your real Vercel URL here
]


app.post('/stripe',express.raw({type:'application/json'}),stripeWebhook)
// Middlewares....
app.use(express.json())
app.use(cookieParser())
app.use(cors({ origin: allowedOrigin, credentials: true }))

// Calling Function That Will Connect With Database
await connectDb()

// Calling Function That Will Connect Cloudinary
await cloudinaryConnect()

app.get('/', (req, res) => {
    res.send("Api Working..")
})

// User Routes
app.use('/api/user', userRouter)

// Seller Routes
app.use('/api/seller', sellerRouter)

// Server Routes
app.use('/api/product', productRouter)

// Cart Routes
app.use('/api/cart', cartRouter)

// Address Routes
app.use('/api/address', addressRouter)

// Order Routes
app.use('/api/order', orderRouter)

app.listen(port, (req, res) => {
    console.log(`Server Is Running On http://localhost:${port}`)
})
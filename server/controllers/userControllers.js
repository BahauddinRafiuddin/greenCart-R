import User from "../models/User.js";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Register User : /api/user/register
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.json({ success: false, message: "Missing Details" })
        }

        const existingUser = await User.findOne({ email })

        if (existingUser) {
            return res.json({ success: false, message: "User Already Exists" })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        })

        // After Creating User We Have to create token ...
        // First Argument Is Unique id 2ed is secret key and 3rd is when token expires
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })

        res.cookie('token', token, {
            httpOnly: true, //prevent Javascript to acces cookies
            secure: process.env.NODE_ENV === 'production', //use secure cookie in production
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',//CSRF protection
            maxAge: 7 * 24 * 60 * 60 * 1000, //Cookie Expiretion Time
        })

        return res.json({
            success: true,
            user: {
                email: user.email,
                name: user.name
            }
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
        console.log(error.message)
    }
}

// Login User :/api/user/login

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.json({ success: false, message: "Email And Password are Required!!" })
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "Invalid Email Or Password!!" })
        }

        // Compare Existing Password With User Entered Password
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid Email Or Password!!" })
        }

        // If Email And Password Are Correct Then Create Token..
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })

        res.cookie('token', token, {
            httpOnly: true, //prevent Javascript to acces cookies
            secure: process.env.NODE_ENV === 'production', //use secure cookie in production
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',//CSRF protection
            maxAge: 7 * 24 * 60 * 60 * 1000, //Cookie Expiretion Time
        })

        return res.json({
            success: true,
            message:"Login Successfull",
            user: {
                email: user.email,
                name: user.name
            }
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
        console.log(error.message)
    }
}

// Check Auth :/api/user/is-auth
export const checkAuth = async (req, res) => {
    try {
        const { userId } = req.body
        const user = await User.findById(userId).select("-password")

        return res.json({ success: true, user })
    } catch (error) {
        res.json({ success: false, message: error.message })
        console.log(error.message)
    }
}

// Logout User :/api/user/logout
export const logOut = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true, //prevent Javascript to acces cookies
            secure: process.env.NODE_ENV === 'production', //use secure cookie in production
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',//CSRF protection
        })

        return res.json({ success: true, message: "Logged Out" })
    } catch (error) {
        res.json({ success: false, message: error.message })
        console.log(error.message)
    }
}
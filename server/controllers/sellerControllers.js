import jwt from 'jsonwebtoken'


// Seller Login :/api/seller/login
export const sellerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({ success: false, message: "Email And Password are Required!!" })
        }

        if (password === process.env.SELLER_PASSWORD && email === process.env.SELLER_EMAIL) {
            const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '7d' })

            res.cookie('sellerToken', token, {
                httpOnly: true, //prevent Javascript to acces cookies
                secure: process.env.NODE_ENV === 'production', //use secure cookie in production
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',//CSRF protection
                maxAge: 7 * 24 * 60 * 60 * 1000, //Cookie Expiretion Time
            })

            return res.json({ success: true, message: "Logged In" })
        } else {
            return res.json({ success: true, message: "Invalid Credentials" })
        }
    } catch (error) {
        res.json({ success: false, message: error.message })
        console.log(error.message)
    }
}

// Check Seller Is Auth :/api/seller/is-auth
export const checkSellerAuth = async (req, res) => {
    try {
        return res.json({ success: true })
    } catch (error) {
        res.json({ success: false, message: error.message })
        console.log(error.message)
    }
}

// Logout Seller :/api/seller/logout
export const sellerLogout = async (req, res) => {
    try {
        res.clearCookie('sellerToken', {
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
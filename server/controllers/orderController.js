import Order from '../models/Order.js'
import Product from '../models/Product.js'
import stripe from 'stripe'
import User from '../models/User.js'

// Place Order COD -/api/order/cod
export const placeOrderCOD = async (req, res) => {
    try {
        const { userId, items, address } = req.body
        if (!address || items.length === 0) {
            return res.json({ success: false, message: "Invalid Data" })
        }

        // Calculate Amout Using Items
        let amount = await items.reduce(async (acc, item) => {
            const product = await Product.findById(item.product);
            return (await acc) + product.offerPrice * item.quantity;
        }, 0)

        // Add tex Charg 2%

        amount += Math.floor(amount * 0.02)

        await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "COD"
        })

        res.json({ success: true, message: "Order Placed Successfully" })
    } catch (error) {
        res.json({ success: false, message: error.message })
        console.log(error.message)
    }
}

// Place Order Sripe -/api/order/stripe
export const placeOrderStripe = async (req, res) => {
    try {
        const { userId, items, address } = req.body
        const { origin } = req.headers

        if (!address || items.length === 0) {
            return res.json({ success: false, message: "Invalid Data" })
        }

        let productData = []

        // Calculate Amout Using Items
        let amount = await items.reduce(async (acc, item) => {
            const product = await Product.findById(item.product);
            productData.push({
                name: product.name,
                price: product.offerPrice,
                quantity: item.quantity,
            })
            return (await acc) + product.offerPrice * item.quantity;
        }, 0)

        // Add tex Charg 2%
        amount += Math.floor(amount * 0.02)

        const order = await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "Online"
        })

        // Stripe Gateway Initialize
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

        // create line items for stripe
        const line_items = productData.map((item) => {
            return {
                price_data: {
                    currency: 'GBP',
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: Math.round(item.price * 100), // Stripe needs amount in pence
                },
                quantity: item.quantity,
            }
        })

        // Create Session 
        const session = await stripeInstance.checkout.sessions.create({
            line_items,
            mode: 'payment',
            success_url: `${origin}/loader?next=my-orders`,
            cancel_url: `${origin}/cart`,
            metadata: {
                orderId: order._id.toString(),
                userId,
            }
        })

        res.json({ success: true, url: session.url })
    } catch (error) {
        res.json({ success: false, message: error.message })
        console.log(error.message)
    }
}

// Stripe Webhook  To Verify Payment Action :/stripe
export const stripeWebhook = async (req, res) => {
    // Stripe Getway Initialize
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)
    const sig = req.headers["stripe-signature"]
    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WENHOOK_SECRET
        );
    } catch (error) {
        res.status(400).send(`Webhook Error :${error.message}`)
    }

    //  Handle Event
    switch (event.type) {
        case "payment_intent.succeeded": {
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;

            // Getting Session Meta data
            const session = await stripeInstance.checkout.sessions.list({
                payment_intent: paymentIntentId,
            })

            const { orderId, userId } = session.data[0].metadata;
            // Mark Payment As Paid
            await Order.findByIdAndUpdate(orderId, { isPaid: true })
            // Claer Cart Data
            await User.findByIdAndUpdate(userId, { cartItems: {} })
            break;
        }
        case "payment_intent.payment_failed": {
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;

            // Getting Session Meta data
            const session = await stripeInstance.checkout.sessions.list({
                payment_intent: paymentIntentId,
            })

            const { orderId } = session.data[0].metadata;
            await Order.findByIdAndDelete(orderId)
            break;
        }
        default:
            console.error(`Unhandled Event Type ${event.type}`)
            break;
    }
    res.json({ received: true })
}

// Get User Orders By Id -/api/order/user
export const getUserOrders = async (req, res) => {
    try {
        const { userId } = req.body
        const orders = await Order.find({
            userId,
            $or: [{ paymentType: 'COD' }, { isPaid: true }]
        }).populate("items.product address").sort({ createdAt: -1 })

        res.json({
            success: true,
            orders
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
        console.log(error.message)
    }
}

// Get All Order For Seller / Admin :- api/order/seller
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            $or: [{ paymentType: 'COD' }, { isPaid: true }]
        }).populate("items.product address").sort({ createdAt: -1 })

        res.json({
            success: true,
            orders
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
        console.log(error.message)
    }
}
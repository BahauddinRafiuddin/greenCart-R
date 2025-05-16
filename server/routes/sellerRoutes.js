import express from 'express'
import { checkSellerAuth, sellerLogin, sellerLogout } from '../controllers/sellerControllers.js'
import authSeller from '../middleware/authSeller.js'

const sellerRouter = express.Router()

sellerRouter.post('/login', sellerLogin)
sellerRouter.get('/is-auth', authSeller, checkSellerAuth)
sellerRouter.get('/logout', authSeller, sellerLogout)

export default sellerRouter;
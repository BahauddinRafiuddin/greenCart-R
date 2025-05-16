import express from 'express'
import { checkAuth, login, logOut, register } from '../controllers/userControllers.js';
import authUser from '../middleware/authUser.js';

const userRouter = express.Router();

userRouter.post('/register', register)
userRouter.post('/login', login)
userRouter.get('/is-auth', authUser, checkAuth)
userRouter.get('/logout', authUser, logOut)



export default userRouter;
import db from '../../db/models/index.cjs';
import jwt from 'jsonwebtoken'
import { validate } from "uuid";

const secretkey = process.env.TOKEN_SECRET

export const signtoken = (userId) => jwt.sign({userId}, secretkey, { expiresIn: "30m" })

export const verifycookie = async(req, res, next) => {
    try{
      if (!req.cookies.smartposting_token) throw new Error("no authorization");
      const token = req.cookies.smartposting_token
      const token_params = jwt.verify(token, secretkey);
      const { userId } = token_params
      if (!userId || !validate(userId)) throw new Error("invalid token");
      const user = await db.users.findOne({where: {userId}})
      console.log('got user from cookie', user.email)
      if (!user) throw new Error("invalid user");
      req.query = {...req.query, user}
      next()
    }
    catch(err){
      console.log('err', err.message)
      // todo - verified
      return res.status(403).send({error: err.message})
    }
  }
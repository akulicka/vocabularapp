import {Router} from "express";
import { signtoken } from "../../util/cookie.js";
import { v4 as uuidv4 } from "uuid";
import db from '../../../db/models/index.cjs';
import argon2 from 'argon2'

const authorize_user = async(email, password) => {
    const user = await db.users.findOne({where: {email}})
    if(!user) throw new Error('mismatch password or email');
    const match = await argon2.verify(user.password,password)
    if(!match) throw new Error('mismatch password or email');
    return user
}

const auth_router = Router()

auth_router.post("/verify", async(req, res) => {
    try{
      const user = await authorize_user(req.body.email, req.body.password)
      const {verified, userId} = user
      res.send({verified: verified || process.env.VERIFY_EMAIL === 'false', userId}) 
    }
    catch(err){
      console.log('err', err)
      res.status(500)
      res.send(err.message)
    }
  });
  
auth_router.post("/login", async(req, res) => {
try{
    const user = await authorize_user(req.body.email, req.body.password)
    if(!user) throw new Error('mismatch password or email');
    const token = signtoken(user.userId)
    res.cookie("smartposting_token", token, {
    httpOnly: true,
    path: "/",
    secure: true,
    sameSite: "strict",
    maxAge: 3600000, // 1 hour
    }).cookie("smartposting_session", 'true', {
    httpOnly: false,
    path: "/",
    secure: true,
    sameSite: "strict",
    maxAge: 3600000, // 1 hour
    }).sendStatus(200)
}
catch(err){
    console.log('err', err)
    res.status(500)
    res.send(err.message)
}
});

auth_router.post('/logout', (req, res) => res.clearCookie("smartposting_token").clearCookie("smartposting_session").sendStatus(200))

auth_router.post("/register", async(req, res) => {
// todo- HMAC
try{
    const found = await db.users.findOne({where: {email : req.body.email}})
    if(found) throw new Error('user already exists');
    const hash = await argon2.hash(req.body.password)
    // todo process env verify email
    const user = await db.users.build({ userId: uuidv4(), username: req.body.username, password: hash, email: req.body.email})
    await user.save()
    const {verified, userId} = user
    res.send({verified: verified || process.env.VERIFY_EMAIL === 'false', userId})
}
catch(err){
    console.log('err', err.message)
    res.sendStatus(500)
}
});

export default auth_router
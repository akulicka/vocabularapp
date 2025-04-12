import {Router} from "express";
import { v4 as uuidv4 } from "uuid";
import multer from 'multer';

import { upload_file, download_file } from "../../helpers/storage.js";
import { verifycookie } from "../../util/cookie.js";
import db from '../../../db/models/index.cjs';

const upload = multer()
const user_router = Router()

user_router.get("/", [verifycookie], async(req, res) => {
  try{
    const {userId, email, username, verified} = req.query.user
    res.send({user : {userId, email, username, verified}})
  }catch(err){
    console.log('err', err.message)
    res.sendStatus(500)
  }
});

user_router.get("/img", [verifycookie], async(req, res) => {
  try{
    const user = await db.users.findOne({where: {userId : req.query.user.userId}})
    if(!user) throw new Error('user not found');
    if(user.profile_image){
      const img_buffer = await download_file(user.profile_image)
      if (!Buffer.isBuffer(img_buffer[0])) throw new Error('invalid image downloaded');
      res.send({img_buffer: img_buffer[0]})
    }
    else{
      res.sendStatus(200)
    }
  }catch(err){
    console.log('err', err.message)
    res.sendStatus(500)
  }
});

user_router.post("/img", [verifycookie, upload.single('avatar')], async(req, res) => {
  try{
    
    if(!req.file) throw new Error('no pic sent');
    const user = await db.users.findOne({where: {userId : req.query.user.userId}})
    if(!user) throw new Error('user not found');
    req.file.originalname = user.profile_image || uuidv4()
    const upload_result = await upload_file(req.file)
    if (user.profile_image != req.file.originalname) {
      user.profile_image = req.file.originalname
      await user.save()
    }
    res.send({upload_result})
  }catch(err){
    console.log('err', err.message)
    res.sendStatus(500)
  }
});

user_router.post("/files", [verifycookie, upload.array('files[]')], async(req, res) => {
  try{
      const files = req.body
      console.log('files', files, req.files)
      if(!req.files.isEmpty){
      const promises = req.files.map((file) => upload_file(file))
      const results = await Promise.all(promises)
      console.log(results)
      }
      console.log('done')
      res.sendStatus(200)
  }catch(err){
      console.log('err', err.message)
      res.sendStatus(500)
  }
});

export default user_router
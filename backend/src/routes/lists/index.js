import {Router} from "express";
import { v4 as uuidv4 } from "uuid";
import { verifycookie } from "../../util/cookie.js";
import { upload_file } from "../../helpers/storage.js";
import db from '../../../db/models/index.cjs';
import multer from 'multer';

const upload = multer()
const list_router = Router()

list_router.get("/", [verifycookie], async(req, res) => {
    try{
      const {userId} = req.query.user
      const lists = await db.list.findAll({where: {userId: userId}})
      res.send({lists})
    }catch(err){
      console.log('err', err.message)
      res.sendStatus(500)
    }
});
  
list_router.post("/", [verifycookie], async(req, res) => {
    try{
        const {userId} = req.query.user
        const {listName} = req.body
        const listId = uuidv4()
        const list = await db.list.build({ userId, listName, listId })
        await list.save()
        res.send({list})
    }catch(err){
        console.log('err', err.message)
        res.sendStatus(500)
    }
});

list_router.post("/files", [verifycookie, upload.array('files[]')], async(req, res) => {
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
//   list_router.get("/buckets", [verifycookie], async(req, res) => {
//     try{
//       const buckets = await storage.getBuckets()
//       console.log(buckets)
//       res.status(200).send(buckets)
//     }catch(err){
//       console.log('err', err.message)
//       res.sendStatus(500)
//     }
//   });
export default list_router


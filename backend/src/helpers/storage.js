import {Storage} from '@google-cloud/storage';
import { PassThrough } from "stream";

const IMAGE_BUCKET_ID = process.env.IMAGE_BUCKET
const projectId = process.env.STORAGE_CLOUD_PROJECT;

const storage = new Storage({
  projectId: projectId,
});

export const download_file = async (file_id) => {
  const bucket = storage.bucket(IMAGE_BUCKET_ID)
  const remote_file = bucket.file(file_id)
  const contents = await remote_file.download()
  return contents
}

export const upload_file = (file) => {
  const bucket = storage.bucket(IMAGE_BUCKET_ID)
  const remote_file = bucket.file(file.originalname)
  const promise = new Promise((resolve, reject) => {
    const stream = new PassThrough()
    stream.write(file.buffer)
    stream.end()
    stream.pipe(remote_file.createWriteStream())
    .on('error', function(err) {
      console.log('err ', file.originalname, err.message)
      reject('err ', file.originalname, err.message)
    })
    .on('finish', function() {
      console.log('upload of ', file.originalname, ' complete')
      resolve('upload of ', file.originalname, ' complete')
    });
  })
  return promise
}

// // The name for the new bucket
// const bucketName = 'my-new-bucket';

// // Creates the new bucket
// storage
//   .createBucket(bucketName)
//   .then(() => {
//     console.log(`Bucket ${bucketName} created.`);
//   })
//   .catch(err => {
//     console.error('ERROR:', err);
//   });
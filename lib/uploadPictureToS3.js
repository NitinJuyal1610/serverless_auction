import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const s3Client = new S3Client({ region: 'ap-south-1' });
export async function uploadPictureToS3(key, body) {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.AUCTIONS_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: 'image/jpeg',
      ContentEncoding: 'base64',
    },
  });

  upload.on('httpUploadProgress', (progress) => {
    console.log('Upload is in progress');
  });
  await upload.done();
}

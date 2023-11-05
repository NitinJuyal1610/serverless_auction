import { getAuctionById } from './getAuction.js';
import { uploadPictureToS3 } from '../../lib/uploadPictureToS3.js';
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import createHttpError from 'http-errors';
async function uploadAuctionPicture(event, context) {
  const { id } = event.pathParameters;
  const auction = await getAuctionById(id);
  const base64 = event.body.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');

  const key = `${auction.id}.jpeg`;
  try {
    await uploadPictureToS3(key, buffer);

    const pictureUrl = `https://${process.env.AUCTIONS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
  } catch (error) {
    console.error(error);
    throw new createHttpError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({}),
  };
}

export const handler = middy(uploadAuctionPicture).use(httpErrorHandler());

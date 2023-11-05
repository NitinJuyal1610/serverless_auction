import { getAuctionById } from './getAuction.js';
import { uploadPictureToS3 } from '../../lib/uploadPictureToS3.js';
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import createHttpError from 'http-errors';
import { addPictureUrl } from '../../lib/addPictureUrl.js';
import validator from '@middy/validator';
import { transpileSchema } from '@middy/validator/transpile';
import addPictureSchema from '../../lib/schemas/addPictureSchema.js';
async function uploadAuctionPicture(event, context) {
  const { id } = event.pathParameters;
  const auction = await getAuctionById(id);

  const { email } = event.requestContext.authorizer;

  if (auction.seller !== email) {
    throw new createHttpError.Forbidden(
      'You are not the seller of this auction',
    );
  }

  const base64 = event.body.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');

  if (buffer.toString('base64') !== base64) {
    throw new createHttpError.BadRequest(
      'An invalid base64 string was provided for the auction image.',
    );
  }

  const key = `${auction.id}.jpeg`;
  let updatedResult;
  try {
    await uploadPictureToS3(key, buffer);

    const pictureUrl = `https://${process.env.AUCTIONS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
    updatedResult = await addPictureUrl(auction, pictureUrl);
    console.log(updatedResult);
  } catch (error) {
    console.error(error);
    throw new createHttpError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedResult),
  };
}

export const handler = middy(uploadAuctionPicture)
  .use(httpErrorHandler())
  .use(
    validator({
      eventSchema: transpileSchema(addPictureSchema),
      i18nEnabled: false,
      ajvOptions: {
        useDefaults: true,
      },
    }),
  );

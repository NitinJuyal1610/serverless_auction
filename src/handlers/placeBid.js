'use strict';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { commonMiddleware } from '../../lib/commonMiddleware';
import createHttpError from 'http-errors';
import validator from '@middy/validator';
import { transpileSchema } from '@middy/validator/transpile';
import { getAuctionById } from './getAuction';
import placeBidSchema from '../../lib/schemas/placeBidSchema';

const client = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

let updatedAuction;
const placeBid = async (event, context) => {
  const { id } = event.pathParameters;
  const { amount } = event.body;
  const { email } = event.requestContext.authorizer;

  const auction = await getAuctionById(id);

  if (auction.seller === email) {
    throw new createHttpError.Forbidden('You cannot bid on your own auctions!');
  }

  if (auction.status == 'CLOSED') {
    throw new createHttpError.Forbidden('Cannot bid on an closed auction!');
  }

  if (auction.highestBid.amount >= amount) {
    throw new createHttpError.Forbidden(
      `Bid amount must be higher than ${auction.highestBid.amount}!`,
    );
  }

  if (auction.highestBid.bidder === email) {
    throw new createHttpError.Forbidden('Cannot bid on your highest bid!');
  }

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: {
      id,
    },
    UpdateExpression:
      'set highestBid.amount = :amount, highestBid.bidder= :bidder',
    ExpressionAttributeValues: {
      ':amount': amount,
      ':bidder': email,
    },
    ReturnValues: 'ALL_NEW',
  };

  try {
    updatedAuction = await docClient.send(new UpdateCommand(params));
  } catch (error) {
    console.error(error);
    throw new createHttpError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction.Attributes),
  };
};

export const handler = commonMiddleware(placeBid).use(
  validator({
    eventSchema: transpileSchema(placeBidSchema),
    i18nEnabled: false,
    ajvOptions: {
      useDefaults: true,
    },
  }),
);

'use strict';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { commonMiddleware } from '../../lib/commonMiddleware';
import createHttpError from 'http-errors';
import { getAuctionById } from './getAuction';

const client = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

let updatedAuction;
const placeBid = async (event, context) => {
  const { id } = event.pathParameters;
  const { amount } = event.body;

  const auction = await getAuctionById(id);

  if (auction.highestBid.amount >= amount) {
    throw new createHttpError.Forbidden(
      `Bid amount must be higher than ${auction.highestBid.amount}!`,
    );
  }

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: {
      id,
    },
    UpdateExpression: 'set highestBid.amount = :amount',
    ExpressionAttributeValues: {
      ':amount': amount,
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

export const handler = commonMiddleware(placeBid);

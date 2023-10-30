'use strict';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { commonMiddleware } from '../../lib/commonMiddleware';
import createHttpError from 'http-errors';

const client = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

export async function getAuctionById(id) {
  let auction;
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': id,
        },
      }),
    );

    [auction] = result.Items;
  } catch (error) {
    console.error(error);
    throw new createHttpError.InternalServerError(error);
  }

  if (!auction) {
    throw new createHttpError.NotFound('Auction with id ' + id + ' not found');
  }

  return auction;
}

const getAuction = async (event, context) => {
  const { id } = event.pathParameters;

  const auction = await getAuctionById(id);
  return {
    statusCode: 200,
    body: JSON.stringify(auction),
  };
};

export const handler = commonMiddleware(getAuction);

'use strict';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import createHttpError from 'http-errors';

const client = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const getAuction = async (event, context) => {
  let auction = [];

  const { id } = event.pathParameters;
  try {
    auction = await docClient.send(
      new QueryCommand({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': id,
        },
      }),
    );
  } catch (error) {
    console.error(error);
    throw new createHttpError.InternalServerError(error);
  }

  if (!auction) {
    throw new createHttpError.NotFound('Auction with id ' + id + ' not found');
  }
  return {
    statusCode: 200,
    body: JSON.stringify(auction.Items),
  };
};

export const handler = middy(getAuction)
  .use(httpJsonBodyParser())
  .use(httpEventNormalizer())
  .use(httpErrorHandler());

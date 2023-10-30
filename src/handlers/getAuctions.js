'use strict';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import createHttpError from 'http-errors';

const client = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const getAuctions = async (event, context) => {
  let auctions = [];

  try {
    auctions = await docClient.send(
      new ScanCommand({
        TableName: process.env.AUCTIONS_TABLE_NAME,
      }),
    );
  } catch (error) {
    console.error(error);
    throw new createHttpError.InternalServerError(error);
  }
  return {
    statusCode: 200,
    body: JSON.stringify(auctions.Items),
  };
};

export const handler = middy(getAuctions)
  .use(httpJsonBodyParser())
  .use(httpEventNormalizer())
  .use(httpErrorHandler());

'use strict';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { commonMiddleware } from '../../lib/commonMiddleware';
import getAuctionsSchema from '../../lib/schemas/getAuctionsSchema';
import validator from '@middy/validator';
import { transpileSchema } from '@middy/validator/transpile';
import createHttpError from 'http-errors';

const client = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const getAuctions = async (event, context) => {
  let auctions = [];

  const status = event.queryStringParameters.status;

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    IndexName: 'statusAndEndingAtIndex',
    KeyConditionExpression: '#status = :status',
    ExpressionAttributeValues: {
      ':status': status,
    },
    ExpressionAttributeNames: {
      '#status': 'status',
    },
  };

  try {
    auctions = await docClient.send(new QueryCommand(params));
  } catch (error) {
    console.error(error);
    throw new createHttpError.InternalServerError(error);
  }
  return {
    statusCode: 200,
    body: JSON.stringify(auctions.Items),
  };
};

export const handler = commonMiddleware(getAuctions).use(
  validator({
    eventSchema: transpileSchema(getAuctionsSchema),
    i18nEnabled: false,
    ajvOptions: {
      useDefaults: true,
    },
  }),
);

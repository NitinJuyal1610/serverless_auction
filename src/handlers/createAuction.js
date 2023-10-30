'use strict';
import crypto from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import createHttpError from 'http-errors';
import { commonMiddleware } from '../../lib/commonMiddleware';
const client = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const createAuction = async (event, context) => {
  const body = event.body;
  const auction = {
    id: crypto.randomUUID(),
    title: body.title,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    highestBid: {
      amount: 0,
    },
  };
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Item: auction,
  };
  let result = {};
  let status = 201;
  try {
    result = await docClient.send(new PutCommand(params));
    console.log(`result: ${JSON.stringify(result, null, 2)}`);
  } catch (error) {
    console.error(error);
    throw new createHttpError.InternalServerError(error);
  }

  return {
    statusCode: status,
    body: JSON.stringify(result),
  };
};

export const handler = commonMiddleware(createAuction);

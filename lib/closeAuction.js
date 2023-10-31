'use strict';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
const client = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

export const closeAuction = async (auction) => {
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: {
      id: auction.id,
    },
    UpdateExpression: 'set #status = :status',
    ReturnValues: 'ALL_NEW',
    ExpressionAttributeValues: {
      ':status': 'CLOSED',
    },
    ExpressionAttributeNames: {
      '#status': 'status',
    },
  };

  const result = await docClient.send(new UpdateCommand(params));

  return result;
};

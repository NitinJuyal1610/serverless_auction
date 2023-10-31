'use strict';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
const client = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

export const getEndedAuctions = async () => {
  const now = new Date();
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    IndexName: 'statusAndEndingAtIndex',
    KeyConditionExpression: '#status = :status AND endingAt <= :now',
    ExpressionAttributeValues: {
      ':status': 'OPEN',
      ':now': now.toISOString(),
    },
    ExpressionAttributeNames: {
      '#status': 'status',
    },
  };

  const result = await docClient.send(new QueryCommand(params));

  return result.Items;
};

'use strict';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
const client = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);
export const addPictureUrl = async (auction, pictureUrl) => {
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: {
      id: auction.id,
    },
    UpdateExpression: 'set pictureUrl = :pictureUrl',
    ExpressionAttributeValues: {
      ':pictureUrl': pictureUrl,
    },
    ReturnValues: 'ALL_NEW',
  };

  const updatedResult = await docClient.send(new UpdateCommand(params));
  return updatedResult.Attributes;
};

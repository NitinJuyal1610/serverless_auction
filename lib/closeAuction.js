'use strict';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
const client = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const sqsClient = new SQSClient({ region: 'ap-south-1' });
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

  await docClient.send(new UpdateCommand(params));

  const { title, seller, highestBid } = auction;

  const { amount, bidder } = highestBid;

  if (amount === 0) {
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: process.env.MAIL_QUEUE_URL,
        MessageBody: JSON.stringify({
          subject: `Auction ${title} has been closed without a bid!`,
          recipient: seller,
          body: `Oh no, No bidder for ${title}!`,
        }),
      }),
    );
    return;
  }

  const notifySeller = sqsClient.send(
    new SendMessageCommand({
      QueueUrl: process.env.MAIL_QUEUE_URL,
      MessageBody: JSON.stringify({
        subject: `Auction ${title} was sold!`,
        recipient: seller,
        body: `Wow, ${title} was sold to ${bidder} for ${amount}!`,
      }),
    }),
  );

  const notifyBidder = sqsClient.send(
    new SendMessageCommand({
      QueueUrl: process.env.MAIL_QUEUE_URL,
      MessageBody: JSON.stringify({
        subject: `You won an auction!`,
        recipient: bidder,
        body: `You won an auction for ${title}!`,
      }),
    }),
  );

  return Promise.all([notifySeller, notifyBidder]);
};

import { closeAuction } from '../../lib/closeAuction';
import { getEndedAuctions } from '../../lib/getEndedAuctions';
import createHttpError from 'http-errors';
async function processAuctions(event, context) {
  try {
    const auctionsToClose = await getEndedAuctions();
    const closePromises = auctionsToClose.map((auction) =>
      closeAuction(auction),
    );
    await Promise.all(closePromises);

    return {
      closed: closePromises.length,
    };
    //process on them
  } catch (error) {
    console.error(error);
    throw new createHttpError.InternalServerError(error);
  }
}

export const handler = processAuctions;

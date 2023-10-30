import httpJsonBodyParser from '@middy/http-json-body-parser';
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';

export const commonMiddleware = (handler) => {
  return middy(handler).use([
    httpJsonBodyParser(),
    httpErrorHandler(),
    httpEventNormalizer(),
  ]);
};

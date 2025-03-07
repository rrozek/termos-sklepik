// middleware/responseStandardizer.ts

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to standardize API responses across all routes
 *
 * Response format:
 * - For collections: { success, message, [pagination], data: [] }
 * - For single items: { success, message, data: {} }
 * - For empty results: { success: true, message: "No results found", data: [] }
 */
export const standardizeResponse = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store the original res.json method
    const originalJson = res.json;

    // Replace the res.json method with our standardized version
    res.json = function (responseData: any) {
      // If the response is already standardized, don't modify it
      if (
        responseData &&
        responseData.hasOwnProperty('success') &&
        responseData.hasOwnProperty('data')
      ) {
        return originalJson.call(this, responseData);
      }

      // Determine if this is a single item or collection request
      const path = req.path;
      const isSingleItem =
        !path.endsWith('/all') &&
        !path.endsWith('/search') &&
        !path.includes('?') &&
        /\/[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+$/.test(path);

      // Default standardized response structure
      const standardResponse: any = {
        success: true,
        message: '',
        data: isSingleItem ? {} : [],
      };

      // Handle different response structures
      if (responseData) {
        // Case: {data: []} format
        if (responseData.data && Array.isArray(responseData.data)) {
          standardResponse.data = responseData.data;
          if (responseData.data.length === 0) {
            standardResponse.message = 'No results found';
          }
        }
        // Case: {data: {objectname: []}} format
        else if (
          responseData.data &&
          typeof responseData.data === 'object' &&
          !Array.isArray(responseData.data)
        ) {
          const objectKey = Object.keys(responseData.data).find(key =>
            Array.isArray(responseData.data[key]),
          );
          if (objectKey) {
            standardResponse.data = responseData.data[objectKey];
            if (standardResponse.data.length === 0) {
              standardResponse.message = 'No results found';
            }
          } else if (isSingleItem) {
            // If it's a single item request, keep the data as an object
            standardResponse.data = responseData.data;
          }
        }
        // Case: Direct array response
        else if (Array.isArray(responseData)) {
          standardResponse.data = responseData;
          if (responseData.length === 0) {
            standardResponse.message = 'No results found';
          }
        }
        // Case: Direct object response for single item
        else if (
          typeof responseData === 'object' &&
          !Array.isArray(responseData)
        ) {
          if (isSingleItem) {
            standardResponse.data = responseData;
          } else {
            // If it's not a single item request but we got an object,
            // convert it to an array if it seems like a collection
            if (
              Object.keys(responseData).some(key =>
                Array.isArray(responseData[key]),
              )
            ) {
              const arrayKey = Object.keys(responseData).find(key =>
                Array.isArray(responseData[key]),
              );
              standardResponse.data = arrayKey
                ? responseData[arrayKey] || []
                : [];
              if (standardResponse.data.length === 0) {
                standardResponse.message = 'No results found';
              }
            } else {
              standardResponse.data = [responseData];
            }
          }
        }

        // Copy any pagination information from the original response
        [
          'page',
          'limit',
          'totalPages',
          'totalItems',
          'hasNextPage',
          'hasPrevPage',
        ].forEach(key => {
          if (responseData[key] !== undefined) {
            standardResponse[key] = responseData[key];
          }
        });

        // Copy any status information
        if (responseData.success !== undefined) {
          standardResponse.success = responseData.success;
        }

        if (responseData.message) {
          standardResponse.message = responseData.message;
        }

        if (responseData.error) {
          standardResponse.success = false;
          standardResponse.message = responseData.error;
        }
      }

      // Call the original json method with our standardized response
      return originalJson.call(this, standardResponse);
    };

    next();
  };
};

/**
 * Helper function to create a standardized successful response
 * @param {Object|Array} data - The data to send
 * @param {String} message - Optional message
 * @param {Object} metadata - Optional metadata (pagination, etc.)
 */
export const sendSuccess = (
  data: any = [],
  message = '',
  metadata: any = {},
) => {
  const isSingleItem = !Array.isArray(data) || metadata.isSingleItem;

  const response = {
    success: true,
    message:
      message ||
      (Array.isArray(data) && data.length === 0
        ? 'No results found'
        : 'Success'),
    data: isSingleItem
      ? Array.isArray(data) && data.length > 0
        ? data[0]
        : data
      : data,
    ...metadata,
  };

  return response;
};

/**
 * Helper function to create a standardized error response
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code
 */
export const sendError = (message = 'An error occurred', statusCode = 400) => {
  return {
    success: false,
    message,
    data: [],
    statusCode,
  };
};

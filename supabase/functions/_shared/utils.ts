/**
 * Shared utility functions for Supabase Edge Functions
 */

/**
 * Parses Lambda response body which may be stringified JSON or direct object
 * @param lambdaData - The response from AWS Lambda
 * @returns Parsed response object
 */
export function parseLambdaResponse(lambdaData: any): any {
  if (typeof lambdaData.body === "string") {
    return JSON.parse(lambdaData.body);
  } else if (lambdaData.body) {
    return lambdaData.body;
  } else {
    return lambdaData;
  }
}

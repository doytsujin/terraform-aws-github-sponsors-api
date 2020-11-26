/*
 * Copyright (c) 2020 Martin Donath <martin.donath@squidfunk.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"

import { Sponsorship, sponsorships } from "../../sponsors"

/* ----------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

/**
 * API Gateway event after all middlewares
 *
 * @template T - Data type of body
 */
export type Event<T = any> =
  & Omit<APIGatewayProxyEvent, "body">
  & { body: T }

/**
 * API Gateway result before all middlewares
 *
 * @template T - Data type of body
 */
export type Result<T = any> =
  & Omit<APIGatewayProxyResult, "body">
  & { body?: T }

/* ----------------------------------------------------------------------------
 * Functions
 * ------------------------------------------------------------------------- */

/**
 * Dispatch event
 *
 * The GitHub GraphQL API is used to retrieve the sponsors of the user which is
 * associated with the `GITHUB_TOKEN` environment variable. Currently, only
 * 100 sponsors are supported - pagination may be added at some point in the
 * future when we need it.
 *
 * @param event - API Gateway event
 *
 * @return Promise resolving with API Gateway result
 */
export async function dispatch(
  event: Event
): Promise<Result<Sponsorship>> {
  switch (event.httpMethod) {

    /* CORS preflight request */
    case "OPTIONS":
      return {
        statusCode: 204
      }

    /* Return a listing of sponsors */
    case "GET":
      return {
        statusCode: 200,
        body: await sponsorships()
      }

    /* Catch everything else */
    default:
      throw new Error("Method not implemented")
  }
}

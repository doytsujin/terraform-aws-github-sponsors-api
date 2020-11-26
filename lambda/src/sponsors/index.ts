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

import axios from "axios"

/* ----------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

/**
 * Sponsor visibility
 */
export enum SponsorType {
  PUBLIC  = "PUBLIC",                  /* Public sponsorship */
  PRIVATE = "PRIVATE"                  /* Private sponsorship */
}

/* ------------------------------------------------------------------------- */

/**
 * Public sponsor
 */
export interface PublicSponsor {
  type: SponsorType.PUBLIC             /* Sponsor visibility */
  name: string                         /* Sponsor login name */
  image: string                        /* Sponsor image URL */
  url: string                          /* Sponsor URL */
}

/**
 * Private sponsor
 */
export interface PrivateSponsor {
  type: SponsorType.PRIVATE            /* Sponsor visibility */
}

/* ------------------------------------------------------------------------- */

/**
 * Sponsor
 */
export type Sponsor =
  | PublicSponsor
  | PrivateSponsor

/* ------------------------------------------------------------------------- */

/**
 * Sponsorship
 */
export interface Sponsorship {
  sponsors: Sponsor[]                  /* Sponsors */
  total: number                        /* Total amount */
}

/* ----------------------------------------------------------------------------
 * Functions
 * ------------------------------------------------------------------------- */

/**
 * Return a listing of sponsors
 *
 * The GitHub GraphQL API is used to retrieve the sponsors of the user which is
 * associated with the `GITHUB_TOKEN` environment variable. Currently, only
 * 100 sponsors are supported - pagination may be added at some point in the
 * future when we need it.
 *
 * @return Promise resolving with listing of sponsors
 */
export async function sponsorships(): Promise<Sponsorship> {
  const res = await axios.post("https://api.github.com/graphql", {
    query: `
      query {
        viewer {
          sponsorshipsAsMaintainer(
            first: 100,
            includePrivate: true,
            orderBy: {
              field: CREATED_AT,
              direction: DESC
            }
          ) {
            nodes {
              privacyLevel,
              sponsorEntity {
                ...on User {
                  login,
                  avatarUrl,
                  url
                }
              },
              tier {
                monthlyPriceInDollars
              }
            }
          }
        }
      }`
  }, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
    }
  })

  /* Handle errors */
  if (res.status !== 200)
    throw new Error(res.statusText)

  /* Handle rsponse */
  const { data } = res.data

  /* Post-process sponsorship data */
  const list: any[] = data.viewer.sponsorshipsAsMaintainer.nodes
  const sponsorship = list.reduce<Sponsorship>((result, item) => {
    result.total += item.tier.monthlyPriceInDollars

    /* Handle public sponsors */
    if (item.privacyLevel === SponsorType.PUBLIC) {
      result.sponsors.push({
        type: SponsorType.PUBLIC,
        name: item.sponsorEntity.login,
        image: item.sponsorEntity.avatarUrl,
        url: item.sponsorEntity.url
      })

    /* Handle private sponsors - don't include url or image */
    } else {
      result.sponsors.push({
        type: SponsorType.PRIVATE
      })
    }
    return result
  }, { sponsors: [], total: 0 })

  /* Return sponsorships */
  return sponsorship
}

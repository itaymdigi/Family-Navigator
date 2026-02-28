/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accommodations from "../accommodations.js";
import type * as attractions from "../attractions.js";
import type * as auth from "../auth.js";
import type * as conversations from "../conversations.js";
import type * as currencyRates from "../currencyRates.js";
import type * as dayEvents from "../dayEvents.js";
import type * as familyMembers from "../familyMembers.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as mapLocations from "../mapLocations.js";
import type * as messages from "../messages.js";
import type * as photos from "../photos.js";
import type * as restaurants from "../restaurants.js";
import type * as seed from "../seed.js";
import type * as tips from "../tips.js";
import type * as travelDocuments from "../travelDocuments.js";
import type * as tripDays from "../tripDays.js";
import type * as trips from "../trips.js";
import type * as users from "../users.js";
import type * as weather from "../weather.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accommodations: typeof accommodations;
  attractions: typeof attractions;
  auth: typeof auth;
  conversations: typeof conversations;
  currencyRates: typeof currencyRates;
  dayEvents: typeof dayEvents;
  familyMembers: typeof familyMembers;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  mapLocations: typeof mapLocations;
  messages: typeof messages;
  photos: typeof photos;
  restaurants: typeof restaurants;
  seed: typeof seed;
  tips: typeof tips;
  travelDocuments: typeof travelDocuments;
  tripDays: typeof tripDays;
  trips: typeof trips;
  users: typeof users;
  weather: typeof weather;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

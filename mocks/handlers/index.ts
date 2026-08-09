import { adminHandlers } from "./admin";
import { authHandlers } from "./auth";
import { cardHandlers } from "./card";
import { healthHandlers } from "./health";
import { oauthHandlers } from "./oauth";
import { userHandlers } from "./user";

export const handlers = [
  ...adminHandlers,
  ...authHandlers,
  ...cardHandlers,
  ...healthHandlers,
  ...oauthHandlers,
  ...userHandlers,
];

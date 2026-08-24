import { adminHandlers } from "./admin";
import { alumniHandlers } from "./alumni";
import { authHandlers } from "./auth";
import { cardHandlers } from "./card";
import { healthHandlers } from "./health";
import { oauthHandlers } from "./oauth";
import { userHandlers } from "./user";

export const handlers = [
  ...adminHandlers,
  ...alumniHandlers,
  ...authHandlers,
  ...cardHandlers,
  ...healthHandlers,
  ...oauthHandlers,
  ...userHandlers,
];

import { adminHandlers } from "./admin";
import { alumniHandlers } from "./alumni";
import { authHandlers } from "./auth";
import { badgeHandlers } from "./badge";
import { departmentHandlers } from "./departments";
import { healthHandlers } from "./health";
import { oauthHandlers } from "./oauth";
import { userHandlers } from "./user";

export const handlers = [
  ...adminHandlers,
  ...alumniHandlers,
  ...authHandlers,
  ...badgeHandlers,
  ...departmentHandlers,
  ...healthHandlers,
  ...oauthHandlers,
  ...userHandlers,
];

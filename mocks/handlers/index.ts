import { adminHandlers } from "./admin";
import { authHandlers } from "./auth";
import { cardHandlers } from "./card";
import { healthHandlers } from "./health";
import { userHandlers } from "./user";

export const handlers = [
  ...adminHandlers,
  ...authHandlers,
  ...cardHandlers,
  ...healthHandlers,
  ...userHandlers,
];

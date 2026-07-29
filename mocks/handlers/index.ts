import { authHandlers } from "./auth";
import { cardHandlers } from "./card";
import { healthHandlers } from "./health";
import { userHandlers } from "./user";

export const handlers = [
  ...authHandlers,
  ...cardHandlers,
  ...healthHandlers,
  ...userHandlers,
];

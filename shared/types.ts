import { type } from "arktype";
export const FIBONACCI = [0, 1, 2, 3, 5, 8, 13, 21] as const;
export type StoryPointType = typeof FIBONACCI[number];


export const AccessToken = type({
  exp: "number",
  iat: "number",
  auth_time: "number",
  jti: "string",
  iss: "string",
  aud: "string",
  sub: "string",
  typ: "string",
  azp: "string",
  session_state: "string",
  acr: "string",
  "allowed-origins": "string[]",
  scope: "string",
  sid: "string",
  email_verified: "boolean",
  role: "string",
  user_id: "string",
  preferred_username: "string",
  email: "string",
});

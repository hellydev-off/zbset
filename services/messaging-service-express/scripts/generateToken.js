import jwt from "jsonwebtoken";

import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES;

console.log({
  JWT_SECRET: JWT_SECRET,
  JWT_EXPIRES: JWT_EXPIRES,
});

const generateToken = async () => {
  const body = {
    sub: "9c858901-8a57-4791-81fe-4c455b099bc9",
    email: "user@example.com",
    roles: ["user"],
    session_id: "b3c1f9e0-4a2d-4e3f-9c1a-2b3c4d5e6f7a",
    iss: "auth-service",
    aud: "social-app",
  };

  const token = jwt.sign({ ...body }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  });

  return token;
};

const decodeToken = (token) => {
  return jwt.decode(token);
};

const prinInfo = async () => {
  const generate = await generateToken();
  const result = decodeToken(generate);

  return {
    token: generate,
    result: result,
  };
};

console.log(await prinInfo());

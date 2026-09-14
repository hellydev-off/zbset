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
    id: 13,
    email: "user@example.com",
    roles: ["user"],
    username: "Helly",
    phone_number: 79228556998,
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

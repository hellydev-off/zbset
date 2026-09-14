// lib/storage/localStorage.js
import { promises as fs } from "fs";
import path from "path";

const UPLOAD_DIR = "./storage";

export async function upload({ key, buffer }) {
  const filePath = path.join(UPLOAD_DIR, key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  return { url: `/files/${key}` };
}

export async function getStream(key) {
  const filePath = path.join(UPLOAD_DIR, key);
  const { createReadStream } = await import("fs");
  return createReadStream(filePath);
}

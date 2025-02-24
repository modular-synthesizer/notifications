import { Request, Response } from "express";
import dotenv from "dotenv";
import 'dotenv/config';
import { sse } from "./functions/sse";
import { amqp } from "./functions/amqp";
import { app } from "./functions/app";

dotenv.config();

(async () => {
  const connection = await amqp.createConnection();
  app.create(async (req: Request, res: Response) => {
    req.setTimeout(0);
    sse.headers(res);
    const channel = await connection.createChannel();
    const token: string = `${req.query.auth_token}`;
    amqp.consume(channel, token, (message: string) => sse.send(res, message));
    req.on('close', () => sse.end(res, channel));
  });
})();
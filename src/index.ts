import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import amqplib, { ConsumeMessage } from 'amqplib';
import cors from "cors";
import 'dotenv/config';
import { v4 as uuid } from 'uuid'

dotenv.config();
function writeSSEHeaders(res: Response) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
}
const app: Express = express();
app.use(cors())
const port = process.env.PORT || 4000;
const { AMQP_URL } = process.env;
(async () => {
  const connection = await amqplib.connect(AMQP_URL || '');
  app.get("/", cors(), async (req: Request, res: Response) => {
    writeSSEHeaders(res);
    res.write('retry: 0\n\n');
    const channel = await connection.createChannel();
    function handleMessage(message: ConsumeMessage | null) {
      if (message === null) return;
      channel.ack(message);
      const content: string = `data: ${message.content.toString()}\n\n`;
      console.log(`sending to ${req.query.auth_token}`, content)
      res.write(content);
    }
    const tmpUuid: string = uuid();
    const token: string = `${req.query.auth_token}`
    const queue: string = `${token}.${tmpUuid}`;
    channel.assertQueue(queue, { autoDelete: true, durable: true });
    channel.bindQueue(queue, 'production.commands', token);
    console.log("Starting consumer for " + token + " --- " + tmpUuid)
    channel.consume(queue, handleMessage);

    req.on('close', () => {
      console.log("Closing the connection for " + token + " --- " + tmpUuid);
      channel.close();
      res.end();
    })
  });
  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
  });
})();
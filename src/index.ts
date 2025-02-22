import 'dotenv/config'
import dotenv from 'dotenv';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { writeHeaders } from './headers';
import { addToRegistry, removeFromRegistry } from './registry';

dotenv.config();

const app: Express = express();
const port: number = +(process.env.PORT || '4000');

app.get('/', cors(), async (req: Request, res: Response) => {
  writeHeaders(res);

  if (req.query.auth_token === undefined) {
    res.status(403).send({ message: 'forbidden' });
    return;
  }

  const token: string = `${req.query.auth_token}`;
  const id: string = await addToRegistry(token, res);

  console.log("Added a new connection for session " + token + " at index " + id)

  req.on('close', () => removeFromRegistry(token, id));
});

app.listen(port, () => console.log(`Listening on port ${port}`));
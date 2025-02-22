import 'dotenv/config'
import dotenv from 'dotenv';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { writeHeaders } from './headers';
import { addToRegistry, removeFromRegistry } from './registry';

dotenv.config();

const app: Express = express();
const port: number = +(process.env.PORT || '4000');

app.use(cors());

app.get('/', cors(), async (req: Request, res: Response) => {
  writeHeaders(res);

  if (req.query.auth_token === undefined) {
    res.status(403).send({ message: 'forbidden' });
    return;
  }

  console.log("Sending the retry command");
  res.write('retry: 0')

  const token: string = `${req.query.auth_token}`;
  const id: string = await addToRegistry(token, res);

  console.log("Added a new connection for session " + token + " at index " + id)

  req.on('close', () => removeFromRegistry(token, id));
});

app.listen(port, () => console.log(`Listening on port ${port}`));
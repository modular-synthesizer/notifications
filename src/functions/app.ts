import express, { type Express, type Request, type Response } from "express"
import cors from 'cors';

type ExpressCallback = (req: Request, res: Response) => void;

export const app = {
  /**
   * Declares all necessary configuration for the route and the application itself.
   * @param callback The express callback called whenever the main route is requested by the user.
   */
  async create(callback: ExpressCallback) {
    const app: Express = express();
    app.use(cors());
    app.get("/", cors(), callback);
    const port: number = +(process.env.PORT || 4000)
    console.log("Application created, now listening");
    app.listen(port, () => `App started on port ${port}`);
  }
}
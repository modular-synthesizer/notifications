import type { Channel } from "amqplib";
import type { Response } from "express";

export const sse = {
  async end(response: Response, channel: Channel) {
    await channel.close();
    response.end();
  },
  /**
   * Sets all necessary HTTP headers in the response object, and sends the first retry command
   * to ensure that clients will retry to get a connection once they're disconnected.
   * 
   * @param response The ExpressJS Response object to set the headers of.
   */
  headers(response: Response) {
    response.set({
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Content-Type': 'text/event-stream'
    });
    response.write('retry: 0\n\n');
  },
  /**
   * Sends a formatted data string in the SSE socket to be received by the user.
   * @param response the ExpressJS Response Object in which send the data.
   * @param content the raw content to be formatted as a SSE valid data string.
   */
  send(response: Response, content: string) {
    console.log(`Sending message ${content}`)
    response.write(`data: ${content}\n\n`);
  }
}
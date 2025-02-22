import { Response } from "express"
import { createConnection } from "./rabbitmq"
import { Channel, ConsumeMessage } from "amqplib";
import { v4 as uuid } from 'uuid'

/**
 * TODO : deport all the logic of the different queue for one session on RMQ.
 * 
 * Context : if the same session is connected on two different screens that are in turn connected
 * on two different instances of the applications when it's scaled, they will be consuming in the
 * same queue, thus one will have the message and not the other.
 * 
 * Solution : we should be doing one queue for each instance of a session connected here, and route
 * the messages in RMQ to be "duplicated" in each session instance's queue. This way each instance
 * of the same client will have a dedicated queue, and a dedicated instance of a message.
 * 
 * Other solution : when scaled, ensure that the same session UUID is always routed to the same
 * instance of the notifications service, thus all the current logic could be kept.
 */

type SessionBinding = {
  channel: Channel,
  responses: Record<string, Response>
}

type Registry = Record<string, SessionBinding>;

const registry: Registry = { };

export async function addToRegistry(session_token: string, response: Response): Promise<string> {
  if (registry[session_token] === undefined) {
    const channel: Channel = await (await createConnection()).createChannel();
    registry[session_token] = { responses: {}, channel };
    const queue: string = `${process.env.ENV}.commands.${session_token}`;
    channel.assertQueue(queue, { autoDelete: true });
    channel.consume(queue, (message: ConsumeMessage | null) => {
      if (message === null) return;
      const responses: Array<Response> = Object.values(registry[session_token].responses)
      responses.forEach((resp: Response) => {
        resp.write(`data: ${message?.content.toString()}\n\n`)
      })
    });
  }
  const id: string = uuid();
  registry[session_token].responses[id] = response
  return id
}

export function removeFromRegistry(session_token: string, id: string) {
  const binding: SessionBinding = registry[session_token];
  delete binding.responses[id];
  if (Object.keys(binding.responses).length <= 0) {
    binding.channel.close();
    delete registry[session_token];
  }
}
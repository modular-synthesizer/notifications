import amqplib, { Channel, ConsumeMessage } from 'amqplib';
import { v4 as uuid } from 'uuid'

type ConsumerCallback = (message: string) => void;

export const amqp = {
  async consume(channel: Channel, token: string, callback: ConsumerCallback) {
    const queue: string = `${token}.${uuid()}`;
    channel.assertQueue(queue, { autoDelete: true, durable: true });
    channel.bindQueue(queue, 'production.commands', token);
    console.log(`Creating and consuming queue ${queue}`)
    channel.consume(queue, (payload: ConsumeMessage | null) => {
      if (payload !== null) {
        channel.ack(payload);
        callback(payload.content.toString());
      }
    });
  },
  async createConnection() {
    return await amqplib.connect(process.env.AMQP_URL ?? '');
  }
}
import amqplib, { Connection } from "amqplib"

export let connection: Connection | undefined;

export async function createConnection(): Promise<Connection> {
  if (connection === undefined) {
    connection = await amqplib.connect(process.env.AMQP_URL || '');
  }
  return connection;
}
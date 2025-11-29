import { EventEmitter } from "events";

export interface ServerEvents {
  message: (data: { message: string }) => void;
}

export class TypedEventEmitter extends EventEmitter {
  override on<E extends keyof ServerEvents>(
    event: E,
    listener: ServerEvents[E]
  ) {
    return super.on(event, listener);
  }

  override off<E extends keyof ServerEvents>(
    event: E,
    listener: ServerEvents[E]
  ) {
    return super.off(event, listener);
  }

  override emit<E extends keyof ServerEvents>(
    event: E,
    ...args: Parameters<ServerEvents[E]>
  ) {
    return super.emit(event, ...args);
  }
}

// Singleton emitter for your app
export const serverEvents = new TypedEventEmitter();
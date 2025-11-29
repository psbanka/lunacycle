import { EventEmitter } from "events";

export type CacheKey =
  | `userIds`
  | `userById`
  | `userAtoms`
  | `currentTaskAtom`
  | `backlogTaskAtoms`
  | `categoryAtoms`
  | `templateTaskAtoms`
  | `taskIds`
  | `currentMonth`
  | `statistics`
  | `focusedTaskIds`
  | `backlogTaskIds`
  | `template`
  | `templateTaskIds`
  | `categoryIds`
  | `categoryById`

  export type CacheArg = Record<CacheKey, string | null>

export interface ServerEvents {
  message: (data: { message: string }) => void;
  clearCache: (data: { keys: CacheArg }) => void;
}

export function clearCache(key: CacheKey, arg: string | null = null) {
  console.log("clearing cache", key, arg);
  const keys: CacheArg = { [key]: arg } as CacheArg;
  serverEvents.emit("clearCache", { keys });
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

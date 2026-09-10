import { EventEmitter } from 'events';

export class MemoryRedisMock extends EventEmitter {
  public status = 'ready';
  private storage = new Map<string, { value: string; expiresAt?: number }>();

  constructor() {
    super();
  }

  private cleanKey(key: string): void {
    const item = this.storage.get(key);
    if (item && item.expiresAt && Date.now() > item.expiresAt) {
      this.storage.delete(key);
    }
  }

  async get(key: string): Promise<string | null> {
    this.cleanKey(key);
    const item = this.storage.get(key);
    return item ? item.value : null;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    let expiresAt: number | undefined;
    if (mode === 'EX' && typeof duration === 'number') {
      expiresAt = Date.now() + duration * 1000;
    } else if (mode === 'PX' && typeof duration === 'number') {
      expiresAt = Date.now() + duration;
    }
    this.storage.set(key, { value: String(value), expiresAt });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.storage.delete(key)) {
        count++;
      }
    }
    return count;
  }

  async keys(pattern: string): Promise<string[]> {
    const result: string[] = [];
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.storage.keys()) {
      this.cleanKey(key);
      if (this.storage.has(key) && regex.test(key)) {
        result.push(key);
      }
    }
    return result;
  }

  defineCommand(name: string, _options?: any): void {
    (this as any)[name] = async (key: string, points: number, duration: number) => {
      this.cleanKey(key);
      const existing = this.storage.get(key);
      let currentPoints = 0;
      let expiresAt = Date.now() + duration * 1000;

      if (existing) {
        currentPoints = parseInt(existing.value, 10) || 0;
        expiresAt = existing.expiresAt || expiresAt;
      }

      currentPoints += Number(points) || 1;
      this.storage.set(key, { value: String(currentPoints), expiresAt });

      const msBeforeNext = Math.max(0, expiresAt - Date.now());
      return [currentPoints, msBeforeNext];
    };
  }

  // rate-limiter-flexible default method name registered on redis client
  async rlflxIncr(key: string, points: number, duration: number): Promise<[number, number]> {
    this.cleanKey(key);
    const existing = this.storage.get(key);
    let currentPoints = 0;
    let expiresAt = Date.now() + duration * 1000;

    if (existing) {
      currentPoints = parseInt(existing.value, 10) || 0;
      expiresAt = existing.expiresAt || expiresAt;
    }

    currentPoints += Number(points) || 1;
    this.storage.set(key, { value: String(currentPoints), expiresAt });

    const msBeforeNext = Math.max(0, expiresAt - Date.now());
    return [currentPoints, msBeforeNext];
  }

  async eval(...args: any[]): Promise<any> {
    const key = args[2];
    const points = Number(args[3]) || 1;
    const duration = Number(args[4]) || 60;
    return this.rlflxIncr(key, points, duration);
  }

  async multi(): Promise<any> {
    const commands: (() => Promise<any>)[] = [];
    const pipeline = {
      del: (...k: string[]) => {
        commands.push(() => this.del(...k));
        return pipeline;
      },
      exec: async () => {
        const res = [];
        for (const cmd of commands) {
          res.push([null, await cmd()]);
        }
        return res;
      },
    };
    return pipeline;
  }
}

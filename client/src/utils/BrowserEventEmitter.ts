/**
 * Browser-compatible EventEmitter implementation
 * Replaces Node.js EventEmitter for client-side use
 */

export class BrowserEventEmitter {
  private static instance: BrowserEventEmitter;
  private events: { [key: string]: Function[] } = {};
  
  static getInstance(): BrowserEventEmitter {
    if (!BrowserEventEmitter.instance) {
      BrowserEventEmitter.instance = new BrowserEventEmitter();
    }
    return BrowserEventEmitter.instance;
  }

  on(event: string, listener: Function): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    if (!this.events[event]) {
      return false;
    }
    this.events[event].forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
    return true;
  }

  off(event: string, listener?: Function): this {
    if (!this.events[event]) {
      return this;
    }
    if (listener) {
      this.events[event] = this.events[event].filter(l => l !== listener);
    } else {
      delete this.events[event];
    }
    return this;
  }

  once(event: string, listener: Function): this {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    return this.on(event, onceWrapper);
  }

  removeAllListeners(event?: string): this {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }

  listenerCount(event: string): number {
    return this.events[event]?.length || 0;
  }
}
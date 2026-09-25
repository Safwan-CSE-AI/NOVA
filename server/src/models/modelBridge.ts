import { isUsingMemoryDB } from '../config/db.js';
import { getInMemoryCollection } from '../services/dataStore.js';

export function createModelBridge(name: string, mongooseModel: any): any {
  return new Proxy(mongooseModel, {
    get(target, prop, receiver) {
      if ((global as any).isInMemoryDB || isUsingMemoryDB) {
        const inMem = getInMemoryCollection(name);
        if (prop in inMem) {
          return (inMem as any)[prop].bind(inMem);
        }
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

import crypto from 'crypto';

export class InMemDoc {
  [key: string]: any;

  constructor(data: any) {
    Object.assign(this, data);
    if (!this._id) {
      this._id = crypto.randomBytes(12).toString('hex');
    }
    if (!this.createdAt) this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async save(): Promise<this> {
    this.updatedAt = new Date();
    return this;
  }

  toObject(): any {
    return { ...this };
  }

  toJSON(): any {
    return { ...this };
  }
}

export class InMemoryCollection {
  private items: Map<string, InMemDoc> = new Map();

  async create(data: any | any[]): Promise<any> {
    if (Array.isArray(data)) {
      const created = data.map((d) => {
        const doc = new InMemDoc(d);
        this.items.set(doc._id.toString(), doc);
        return doc;
      });
      return created;
    }
    const doc = new InMemDoc(data);
    this.items.set(doc._id.toString(), doc);
    return doc;
  }

  find(query: any = {}) {
    let results = Array.from(this.items.values()).filter((item) => matchQuery(item, query));

    const chain = {
      sort: (sortCriteria: any) => {
        const key = Object.keys(sortCriteria)[0];
        const dir = sortCriteria[key];
        results.sort((a, b) => {
          const valA = a[key];
          const valB = b[key];
          if (valA < valB) return dir === 1 ? -1 : 1;
          if (valA > valB) return dir === 1 ? 1 : -1;
          return 0;
        });
        return chain;
      },
      limit: (n: number) => {
        results = results.slice(0, n);
        return chain;
      },
      populate: (_pathOrOptions: any) => {
        return chain;
      },
      then: (resolve: (val: any) => any, reject?: (err: any) => any) => {
        return Promise.resolve(results).then(resolve, reject);
      },
      exec: async () => results,
    };

    return chain;
  }

  findOne(query: any = {}) {
    let items = Array.from(this.items.values()).filter((item) => matchQuery(item, query));
    let doc: any = items[0] || null;

    const chain = {
      sort: (sortCriteria: any) => {
        const key = Object.keys(sortCriteria)[0];
        const dir = sortCriteria[key];
        items.sort((a, b) => {
          const valA = a[key];
          const valB = b[key];
          if (valA < valB) return dir === 1 ? -1 : 1;
          if (valA > valB) return dir === 1 ? 1 : -1;
          return 0;
        });
        doc = items[0] || null;
        return chain;
      },
      populate: (options: any) => {
        if (!doc) return chain;
        if (typeof options === 'object' && options.path === 'tasks') {
          // Populate tasks from TaskCollection if this is a DailyPlan
          const tasksCol = collections.get('Task');
          if (tasksCol && Array.isArray(doc.tasks)) {
            const taskDocs = doc.tasks.map((tid: any) => {
              const strId = typeof tid === 'object' ? tid._id?.toString() || tid.toString() : tid.toString();
              return tasksCol.items.get(strId) || tid;
            });
            if (options.options?.sort) {
              const sortKey = Object.keys(options.options.sort)[0];
              const sortDir = options.options.sort[sortKey];
              taskDocs.sort((a: any, b: any) => (a[sortKey] > b[sortKey] ? sortDir : -sortDir));
            }
            doc.tasks = taskDocs;
          }
        }
        return chain;
      },
      then: (resolve: (val: any) => any, reject?: (err: any) => any) => {
        return Promise.resolve(doc).then(resolve, reject);
      },
      exec: async () => doc,
    };

    return chain;
  }

  findById(id: any) {
    const strId = id?.toString();
    const doc = (strId && this.items.get(strId)) || null;

    const chain = {
      populate: (options: any) => {
        if (!doc) return chain;
        if (typeof options === 'object' && options.path === 'tasks') {
          const tasksCol = collections.get('Task');
          if (tasksCol && Array.isArray(doc.tasks)) {
            const taskDocs = doc.tasks.map((tid: any) => {
              const sId = typeof tid === 'object' ? tid._id?.toString() || tid.toString() : tid.toString();
              return tasksCol.items.get(sId) || tid;
            });
            if (options.options?.sort) {
              const sortKey = Object.keys(options.options.sort)[0];
              const sortDir = options.options.sort[sortKey];
              taskDocs.sort((a: any, b: any) => (a[sortKey] > b[sortKey] ? sortDir : -sortDir));
            }
            doc.tasks = taskDocs;
          }
        }
        return chain;
      },
      then: (resolve: (val: any) => any, reject?: (err: any) => any) => {
        return Promise.resolve(doc).then(resolve, reject);
      },
      exec: async () => doc,
    };

    return chain;
  }

  async findOneAndUpdate(query: any, update: any, options: any = {}): Promise<any> {
    let doc = Array.from(this.items.values()).find((item) => matchQuery(item, query));
    if (!doc && options.upsert) {
      const dataToCreate: any = { ...query };
      if (update.$setOnInsert) Object.assign(dataToCreate, update.$setOnInsert);
      if (update.$inc) {
        for (const [k, v] of Object.entries(update.$inc)) {
          dataToCreate[k] = (dataToCreate[k] || 0) + (v as number);
        }
      }
      for (const [k, v] of Object.entries(update)) {
        if (!k.startsWith('$')) dataToCreate[k] = v;
      }
      doc = new InMemDoc(dataToCreate);
      this.items.set(doc._id.toString(), doc);
      return doc;
    }

    if (doc) {
      if (update.$inc) {
        for (const [k, v] of Object.entries(update.$inc)) {
          doc[k] = (doc[k] || 0) + (v as number);
        }
      }
      for (const [k, v] of Object.entries(update)) {
        if (!k.startsWith('$')) doc[k] = v;
      }
      doc.updatedAt = new Date();
    }
    return doc;
  }

  async updateMany(query: any, update: any): Promise<void> {
    const docs = Array.from(this.items.values()).filter((item) => matchQuery(item, query));
    for (const doc of docs) {
      for (const [k, v] of Object.entries(update)) {
        if (!k.startsWith('$')) doc[k] = v;
      }
      doc.updatedAt = new Date();
    }
  }

  async deleteMany(query: any): Promise<void> {
    const toDelete = Array.from(this.items.values()).filter((item) => matchQuery(item, query));
    for (const doc of toDelete) {
      this.items.delete(doc._id.toString());
    }
  }

  async findByIdAndDelete(id: any): Promise<any> {
    const strId = id?.toString();
    if (!strId) return null;
    const doc = this.items.get(strId);
    if (doc) {
      this.items.delete(strId);
    }
    return doc || null;
  }
}

function matchQuery(item: any, query: any): boolean {
  for (const key of Object.keys(query)) {
    const targetVal = query[key];
    const itemVal = item[key];

    if (targetVal && typeof targetVal === 'object') {
      if (targetVal.$in && Array.isArray(targetVal.$in)) {
        if (!targetVal.$in.includes(itemVal)) return false;
      }
    } else {
      const strTarget = targetVal?.toString();
      const strItem = itemVal?.toString();
      if (strTarget !== strItem) {
        return false;
      }
    }
  }
  return true;
}

const collections = new Map<string, InMemoryCollection>();

export function getInMemoryCollection(name: string): InMemoryCollection {
  if (!collections.has(name)) {
    collections.set(name, new InMemoryCollection());
  }
  return collections.get(name)!;
}

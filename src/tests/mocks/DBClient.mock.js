import DatabaseClientInterface from '#src/core/database/DatabaseClientInterface.js';

export default class DBClient extends DatabaseClientInterface {
  constructor() {
    super();
    this.queries = [];
    this.shouldFail = false;
  }

  failNext() { this.shouldFail = true; }

  async query(sql, params = []) {
    if (this.shouldFail) throw new Error('DB error simulated');
    this.queries.push({ sql, params });
    // valeur fictive compatible avec ProductDAO
    return { insertId: 1, affectedRows: 1 };
  }

  async transaction(work) {
    return work(this); // pas de vraie transaction, mais l’API reste identique
  }
}

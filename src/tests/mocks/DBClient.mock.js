import DatabaseClientInterface from '#src/core/database/DatabaseClientInterface.js';

export default class DBClient extends DatabaseClientInterface {
  constructor() {
    super();
    this.queries = [];
    this.shouldFail = false;
    this.rollback = jest.fn();
    this.release = jest.fn();
    this.commit = jest.fn();
    this.beginTransaction = jest.fn();
  }

  failNext() { this.shouldFail = true; }

  async query(sql, params = []) {
    if (this.shouldFail) throw new Error('DB error simulated');
    this.queries.push({ sql, params });
    // valeur fictive compatible avec ProductDAO
    return { insertId: 1, affectedRows: 1 };
  }

  async transaction(work) {
    try {
      this.beginTransaction();
      const result = await work(this);
      this.commit();
      return result; 
    } catch (error) {
      this.rollback();
      throw error;
    } finally {
      this.release();
    }
  }
}

export default class DatabaseClientInterface {
  async query(sql, params = []) { throw new Error('Not implemented'); }

  async transaction(work /* async (client) => T */) { throw new Error('Not implemented'); }
}

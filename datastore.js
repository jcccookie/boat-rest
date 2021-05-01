const { Datastore } = require('@google-cloud/datastore');

module.exports = {
  ds: () => {
    return new Datastore();
  },

  getEntityId: item => {
    return item[Datastore.KEY].id;
  }
}
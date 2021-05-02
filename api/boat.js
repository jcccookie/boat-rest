const { Router } = require('express');
const { ds, getEntityId } = require('../datastore');
const { BOAT } = require('../datastoreConfig');
const { boatResponse, verifyAccept, verifyContentType, checkNumOfAttribute, hasId, isUnique, throwError, validateData } = require('./helpers');

const router = new Router();
const datastore = ds();
const dotenv = require('dotenv');
dotenv.config();
const url = process.env.APP_URL;

// Create a Boat
router.post('/', async (req, res, next) => {
  try {
    // Throwing errors
    verifyAccept({ req, type: "application/json" });
    verifyContentType({ req, type: "application/json" });
    checkNumOfAttribute({ req, action: 'ne', length: 3 });
    validateData({ req });

    // Get all boat to check if the uniqueness of the name of the boat
    const query = datastore.createQuery(BOAT);
    const entities = await datastore.runQuery(query);

    // Check if the name is unique
    try {
      isUnique({ entities: entities[0], value: req.body.name, attribute: "name" });
    } catch (error) {
      throw error;
    }

    const key = datastore.key(BOAT);
    const entity = {
      key,
      data: {
        ...req.body,
      }
    };

    await datastore.save(entity);
    const boat = await datastore.get(key);

    const id = getEntityId(boat[0]);
    const { name, type, length } = boat[0];

    res
      .status(201)
      .send(boatResponse({ id, name, type, length }));
  } catch (error) {
    next(error);
  }
});

// View a Boat
router.get('/:boat_id', async (req, res, next) => {
  try {
    // Accepts Headers of the client
    const accepts = req.accepts(["application/json", "text/html"]);

    // Check if the client accepts JSON or HTML
    if (!accepts) {
      throw throwError({
        code: 406,
        message: "Server only sends application/json or text/html"
      })
    }

    const key = datastore.key([BOAT, parseInt(req.params.boat_id, 10)]);

    const boatEntity = await datastore.get(key);
    if (boatEntity[0] === undefined) {
      throw throwError({
        code: 404,
        message: "No boat with this boat_id exists"
      })
    }

    res.status(200);

    const boat = boatResponse({
      id: getEntityId(boatEntity[0]),
      name: boatEntity[0].name,
      type: boatEntity[0].type,
      length: boatEntity[0].length
    })

    if (accepts === "application/json") {
      res.send(boat);
    } else if (accepts === "text/html") {
      // Send json to .pug
      res.render('boat', {
        id: getEntityId(boatEntity[0]),
        name: boatEntity[0].name,
        type: boatEntity[0].type,
        length: boatEntity[0].length
      });
    }
  } catch (error) {
    next(error);
  }
});

// Edit part of boat
router.patch('/:boat_id', async (req, res, next) => {
  try {
    // Throwing errors
    verifyAccept({ req, type: "application/json" });
    verifyContentType({ req, type: "application/json" });    
    hasId({ id: req.body.id });
    checkNumOfAttribute({ req, action: 'gt', length: 3 });

    // Get all boat to check if the uniqueness of the name of the boat
    const query = datastore.createQuery(BOAT);
    const entities = await datastore.runQuery(query);

    // Check if the name is unique
    if (req.body.name) {
      try {
        isUnique({ entities: entities[0], value: req.body.name, attribute: "name" });
      } catch (error) {
        throw error;
      }
    }

    // Retrieve the Boat from datastore so we can partial update
    const key = datastore.key([BOAT, parseInt(req.params.boat_id, 10)]);
    const boat = await datastore.get(key);

    const entity = {
      key,
      data: {
        name: req.body.name ? req.body.name : boat[0].name,
        type: req.body.type ? req.body.type: boat[0].type,
        length: req.body.length ? req.body.length : boat[0].length
      }
    };

    datastore.update(entity, async err => {
      if (err) {
        res.status(404).send({ Error: "No boat with this boat_id exists" });
      } else {
        const boat = await datastore.get(key);

        res
          .status(200)
          .send(boatResponse({
            id: getEntityId(boat[0]), 
            name: boat[0].name, 
            type: boat[0].type, 
            length: boat[0].length
          }));
        };
     });
  } catch (error) {
    next(error);
  }
});

// Edit a entire boat
router.put('/:boat_id', async (req, res, next) => {
  try {
    // Throwing errors
    verifyAccept({ req, type: "application/json" });
    verifyContentType({ req, type: "application/json" });    
    hasId({ id: req.body.id });
    checkNumOfAttribute({ req, action: 'ne', length: 3 });

    // Get all boat to check if the uniqueness of the name of the boat
    const query = datastore.createQuery(BOAT);
    const entities = await datastore.runQuery(query);

    // Check if the name is unique
    try {
      isUnique({ entities: entities[0], value: req.body.name, attribute: "name" });
    } catch (error) {
      throw error;
    }

    // Retrieve the Boat from datastore so we can update an entire boat
    const key = datastore.key([BOAT, parseInt(req.params.boat_id, 10)]);

    const entity = {
      key,
      data: req.body
    };

    datastore.update(entity, async err => {
      if (err) {
        res.status(404).send({ Error: "No boat with this boat_id exists" });
      } else {
        const boat = await datastore.get(key);

        res
          .location(`${url}/boats/${getEntityId(boat[0])}`)
          .status(303)
          .send(boatResponse({
            id: getEntityId(boat[0]), 
            name: boat[0].name, 
            type: boat[0].type, 
            length: boat[0].length
          }));
        };
     });
  } catch (error) {
    next(error);
  }
});


// Delete a boat
router.delete('/:boat_id', async (req, res, next) => {
  try {
    const boatKey = datastore.key([BOAT, parseInt(req.params.boat_id)]);

    // Get loads to delete carrier info in load
    const boatEntity = await datastore.get(boatKey);

    if (boatEntity[0] === undefined) {
      const error = new Error("Invalid Boat Id");
      error.statusCode = 404;

      throw error;
    }

    await datastore.delete(boatKey);

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// PUT on root boat url is not allowed. There's no such support on this API
router.put('/', (req, res, next) => {
  try {
    res.set('Accept', 'POST, GET');
    res.status(405).send({ Error: "PUT method is not allowed for root boat url" });
  } catch (error) {
    next(error);
  }
});

// DELETE on root boat url is not allowed. There's no such support on this API
router.delete('/', (req, res, next) => {
  try {
    res.set('Accept', 'POST, GET');
    res.status(405).send({ Error: "DELETE method is not allowed for root boat url" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
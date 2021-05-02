const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.enable('trust proxy');
app.use(bodyParser.json());
app.set('view engine', 'pug');

const boatRouter = require('./api/boat');

app.get('/', (req, res) => {
  res.send('Boat and the Rest!');
});

app.use('/boats', boatRouter);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).send({
    Error: err.message
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
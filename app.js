const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const routeRouter = require('./routes/route');
const userRoute = require('./routes/user.route');
const { handleError } = require('./utils/errorHandler');
const port = Number(process.env.PORT || 3001);

app.use(express.json());
app.use('/api', routeRouter);
app.use('/api/user', userRoute);
app.use(handleError);

async function init() {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
  });
  console.log('DB Connected Successfully');
}
init();

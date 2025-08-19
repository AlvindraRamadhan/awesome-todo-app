const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  let mongoUri;

  if (process.env.NODE_ENV === 'development') {
    console.log('Development environment detected. Starting in-memory MongoDB...');
    const mongod = await MongoMemoryServer.create();
    mongoUri = mongod.getUri();
  } else {
    mongoUri = process.env.MONGODB_URI;
  }

  try {
    await mongoose.connect(mongoUri);
    if (process.env.NODE_ENV === 'development') {
      console.log('In-memory MongoDB Connected...');
    } else {
      console.log('MongoDB Connected...');
    }
  } catch (err) {
    console.error(err.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;

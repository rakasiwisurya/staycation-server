const mongoose = require("mongoose");
const config = require("./index");

/**
 * Connects to MongoDB. The same call works for a local MongoDB 8 instance and
 * for MongoDB Atlas — only the `MONGODB_URI` value changes between branches.
 *
 * Mongoose 8 enables sensible driver defaults (unified topology, new URL
 * parser) automatically, so no legacy connection flags are needed.
 */
const connectDatabase = async () => {
  mongoose.set("strictQuery", true);

  await mongoose.connect(config.mongoUri);

  const { host, name } = mongoose.connection;
  console.log(`MongoDB connected: ${host}/${name}`);
};

module.exports = connectDatabase;

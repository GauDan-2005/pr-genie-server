const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const db_uri = process.env.MONGO_URI_LOCAL;
    await mongoose.connect(db_uri, {});
    console.log("MongoDB connected to " + db_uri);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

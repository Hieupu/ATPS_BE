const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const router = require("./routes/router");
const cors = require("cors");

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use("/api", router);

const PORT = process.env.PORT || 9999;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});

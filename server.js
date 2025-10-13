const express = require("express");
const connectDB = require("./config/db");
const router = require("./routes/router");

const app = express();
app.use(express.json());

let dbConnection;
(async () => {
  dbConnection = await connectDB();
})();

app.use("/api", router);

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

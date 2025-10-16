const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const router = require("./routes/routerAuth");
const passport = require("passport");
const cors = require("cors");

dotenv.config();
const app = express();
app.use(express.json());
app.use(passport.initialize());
app.use("/api", router);
app.use(cors());

const PORT = process.env.PORT || 9999; 
connectDB().then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
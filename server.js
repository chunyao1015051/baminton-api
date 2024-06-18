const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const User = require("./models/User"); // 假設我們有個User模型

const app = express();
const port = 3001;

// 使用 cors 中介軟體
app.use(cors());
app.use(express.json());

mongoose.connect(
  "mongodb+srv://haruhitokyonsos:sKmUmTB1EHvVS0WG@cluster0.laygasp.mongodb.net/Badminton?retryWrites=true&w=majority&appName=Cluster0"
);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Connected to MongoDB");
});

app.post("/register", async (req, res) => {
  try {
    const { name, phone, category, isBringingRacket, score, group } = req.body;
    const findUser = await User.findOne({ name });
    if (findUser) {
      return res.status(400).send("此姓名已報名，請登入");
    }
    const user = new User({ name, phone, category, isBringingRacket, score, group });
    await user.save();
    res.status(201).send("User registered");
  } catch ({ message }) {
    res.status(500).send(message);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findOne({ name, phone });
    if (!user) {
      return res.status(400).send("Invalid credentials");
    }

    const token = jwt.sign({ userId: user._id }, "your_jwt_secret");
    res.send({ token });
  } catch ({ message }) {
    return res.status(500).send(message);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://220.135.155.96:${port}`);
});

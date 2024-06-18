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

app.get("/getMemberGroupedData", async (req, res) => {
  try {
    // 聚合查詢，首先根據 category 分組，然後在每個 category 內根據 group 分組
    const groupedData = await User.aggregate([
      // 篩選 category 不為 "吃瓜"
      { $match: { category: { $ne: "吃瓜" } } },
      // 根據 category 分組
      { $group: { _id: "$category", members: { $push: "$$ROOT" } } },
      // 展開 members 數組
      { $unwind: "$members" },
      // 根據 category 和 group 進行二次分組
      {
        $group: {
          _id: { category: "$_id", group: "$members.group" },
          members: { $push: "$members" },
        },
      },
      // 排序 group
      { $sort: { "_id.group": 1 } },
      // 重組輸出格式
      {
        $group: {
          _id: "$_id.category",
          groups: {
            $push: {
              group: "$_id.group",
              members: "$members",
            },
          },
        },
      },
      // 最後根據 category 排序
      { $sort: { _id: 1 } },
    ]);

    console.log(groupedData);
    res.send({ groupedData });
  } catch ({ message }) {
    return res.status(500).send(message);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://220.135.155.96:${port}`);
});

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Onlookers = require('./models/Onlookers');
const Status = require('./models/Status');
const Scores = require('./models/Scores');
const Standings = require('./models/Standings');

const app = express();
const port = 3001;

// 使用 cors 中介軟體
app.use(cors());
app.use(express.json());
mongoose.connect(
  'mongodb+srv://haruhitokyonsos:sKmUmTB1EHvVS0WG@cluster0.laygasp.mongodb.net/Badminton?retryWrites=true&w=majority&appName=Cluster0'
);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('Connected to MongoDB');
});

app.post('/getUserData', async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const { userId } = decoded;
    const user = await User.findOne({ _id: userId });
    if (user) {
      return res.send(user);
    }
  } catch ({ message }) {
    res.status(500).send(message);
  }
});

app.get('/connectTest', async (req, res) => {
  res.status(200).send();
});

app.post('/register', async (req, res) => {
  try {
    const { name, phone, category, isBringingRacket, score, group } = req.body;
    const findUser = await User.findOne({ name });
    if (findUser) {
      return res.status(400).send('此姓名已報名，請登入');
    }
    const user = new User({ name, phone, category, isBringingRacket, score, group });
    await user.save();
    res.status(201).send('User registered');
  } catch ({ message }) {
    res.status(500).send(message);
  }
});

app.post('/login', async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findOne({ name, phone });
    if (!user) {
      return res.status(400).send('Invalid credentials');
    }

    const token = jwt.sign({ userId: user._id }, 'your_jwt_secret');
    res.send({ token });
  } catch ({ message }) {
    return res.status(500).send(message);
  }
});

app.get('/getMemberGroupedData', async (req, res) => {
  try {
    // 聚合查詢，首先根據 category 分組，然後在每個 category 內根據 group 分組
    const groupedData = await User.aggregate([
      // 篩選 category 不為 "吃瓜"
      { $match: { category: { $ne: '吃瓜' } } },
      // 根據 category 分組
      { $group: { _id: '$category', members: { $push: '$$ROOT' } } },
      // 展開 members 數組
      { $unwind: '$members' },
      // 根據 category 和 group 進行二次分組
      {
        $group: {
          _id: { category: '$_id', group: '$members.group' },
          members: { $push: '$members' },
        },
      },
      // 排序 group
      { $sort: { '_id.group': 1 } },
      // 重組輸出格式
      {
        $group: {
          _id: '$_id.category',
          groups: {
            $push: {
              group: '$_id.group',
              members: '$members',
            },
          },
        },
      },
      // 最後根據 category 排序
      { $sort: { _id: 1 } },
    ]);

    res.send({ groupedData });
  } catch ({ message }) {
    return res.status(500).send(message);
  }
});

// 新增瓜量
app.post('/addQty', async (req, res) => {
  try {
    const { name, phone, category, group, qty } = req.body;
    const dbOnlookers = await Onlookers.findOne({name, phone, category, group})
    if (dbOnlookers) {
      await Onlookers.updateOne({ name, phone, category, group }, { $set: { qty: dbOnlookers.qty + qty } });
    } else {
      const onlookers = new Onlookers({ name, phone, category, group, qty });
      await onlookers.save();
    }
    
    res.send();
  } catch ({ message }) {
    return res.status(500).send(message);
  }
});
app.get('/getQtyData', async (req, res) => {
  try {
    const groupedData = await Onlookers.aggregate([
      // 根據 category 和 group 進行分組
      {
        $group: {
          _id: { category: '$category', group: '$group' },
          totalQty: { $sum: '$qty' },
          members: { $push: '$$ROOT' },
        },
      },
      // 根據 category 和 group 進行排序
      { $sort: { '_id.category': 1, '_id.group': 1 } },
      // 將分組結果重組
      {
        $group: {
          _id: '$_id.category',
          groups: {
            $push: {
              group: '$_id.group',
              totalQty: '$totalQty',
              members: '$members',
            },
          },
        },
      },
      // 最終結果根據 category 進行排序
      { $sort: { _id: 1 } },
    ]);
    res.send(groupedData);
  } catch ({ message }) {
    return res.status(500).send(message);
  }
});

app.get('/getScores/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const scores = await Scores.find({ category }).sort({ group_one: 1, group_two: 1 });

    res.send(scores);
  } catch ({ message }) {
    res.status(500).send(message);
  }
});
app.get('/getStatus/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const status = await Status.findOne({ category });

    res.send(status);
  } catch ({ message }) {
    res.status(500).send(message);
  }
});

app.get('/getStandings/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const standings = await Standings.find({ category }).sort({ scores: -1, group: 1 });
    res.send(standings);
  } catch ({ message }) {
    res.status(500).send(message);
  }
});

app.post('/updateScores/:category', async (req, res) => {
  const category = req.params.category;

  const { group_one, group_two, group_one_scores, group_two_scores } = req.body;
  try {
    const response =  await Scores.updateOne({ category, group_one, group_two }, { $set: { group_one_scores, group_two_scores } });
    if (!response.modifiedCount) {
      const scores = new Scores({ category, group_one, group_two, group_one_scores, group_two_scores });
      await scores.save();
    }
    const standingsGroupOne = await Standings.findOne({ category, group: group_one });
    const standingsGroupTwo = await Standings.findOne({ category, group: group_two });
    await Standings.updateOne(
      { category, group: group_one },
      {
        $set: {
          win: group_one_scores > group_two_scores ? standingsGroupOne.win + 1 : standingsGroupOne.win,
          lose: group_one_scores > group_two_scores ? standingsGroupOne.lose : standingsGroupOne.lose + 1,
          scores: group_one_scores > group_two_scores ? standingsGroupOne.scores + 3 : standingsGroupOne.scores,
        },
      }
    );
    await Standings.updateOne(
      { category, group: group_two },
      {
        $set: {
          win: group_two_scores > group_one_scores ? standingsGroupTwo.win + 1 : standingsGroupTwo.win,
          lose: group_two_scores > group_one_scores ? standingsGroupTwo.lose : standingsGroupTwo.lose + 1,
          scores: group_two_scores > group_one_scores ? standingsGroupTwo.scores + 3 : standingsGroupTwo.scores,
        },
      }
    );
    res.send();
  } catch ({ message }) {
    res.status(500).send(message);
  }
});

app.post('/updateStatus/:category', async (req, res) => {
  const category = req.params.category;

  const { nowLeft, nowRight, nextLeft, nextRight } = req.body;
  console.log(category, nowLeft, nowRight, nextLeft, nextRight);
  try {
    await Status.updateOne({ category }, { $set: { nowLeft, nowRight, nextLeft, nextRight } });

    res.send();
  } catch ({ message }) {
    res.status(500).send(message);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://220.135.155.96:${port}`);
});
// 220.135.155.96

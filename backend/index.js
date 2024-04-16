const express = require("express");
const Moralis = require("moralis").default;
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = 3001;
const ABI = require("./abi.json");

app.use(cors());
app.use(express.json());

function convertArrayToObjects(array) {
  const dataArray = array.map((transaction, index) => ({
    key: (array.length + 1 - index).toString(),
    type: transaction[0],
    amount: transaction[1],
    message: transaction[2],
    address: `${transaction[3].slice(0, 4)}...${transaction[3].slice(0, 4)}`,
    subject: transaction[4],
  }));

  return dataArray.reverse();
}

app.get("/getNameAndBalance", async (req, res) => {
  const { userAddress } = req.query;

  const response = await Moralis.EvmApi.utils.runContractFunction({
    chain: "0x13881",
    address: "0x047278cB22573270Bdb5a59483a438Db235a30D6",
    functionName: "getMyName",
    abi: ABI,
    params: { _user: userAddress },
  });

  const jsonResponseName = response.raw;

  const secResponse = await Moralis.EvmApi.balance.getNativeBalance({
    chain: "0x13881",
    address: userAddress,
  });

  const jsonResponseBalance = (secResponse.raw.balance / 1e18).toFixed(2);

  const thirdResponse = await Moralis.EvmApi.token.getTokenPrice({
    address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
  });

  const jsonResponseeDollars = (
    thirdResponse.raw.usdPrice * jsonResponseBalance
  ).toFixed(2);

  const fourthResponse = await Moralis.EvmApi.utils.runContractFunction({
    chain: "0x13881",
    address: "0x047278cB22573270Bdb5a59483a438Db235a30D6",
    functionName: "getMyHistory",
    abi: ABI,
    params: { _user: userAddress },
  });

  const jsonResponseHistory = convertArrayToObjects(fourthResponse.raw);

  const fifthResponse = await Moralis.EvmApi.utils.runContractFunction({
    chain: "0x13881",
    address: "0x047278cB22573270Bdb5a59483a438Db235a30D6",
    functionName: "getRequests",
    abi: ABI,
    params: { _user: userAddress },
  });

  const jsonResponseRequests = fifthResponse.raw;

  const jsonResponse = {
    name: jsonResponseName,
    balance: jsonResponseBalance,
    dollars: jsonResponseeDollars,
    history: jsonResponseHistory,
    requests: jsonResponseRequests,
  };

  return res.status(200).json(jsonResponse);
});

Moralis.start({
  apiKey: process.env.MORALIS_KEY,
}).then(() => {
  app.listen(port, () => {
    console.log(`Listening for API Calls at ${port}`);
  });
});

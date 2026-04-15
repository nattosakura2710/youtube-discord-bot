const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const express = require("express");

// ===== Webサーバー =====
const app = express();
const PORT = process.env.PORT || 3000;

// 強制的にレスポンス返す
app.use((req, res) => {
  res.status(200).send("OK");
});

// 明示的にlisten
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Web server running on port ${PORT}`);
});

// ===== Discord BOT =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

let lastVideoId = null;

async function checkLive() {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet&type=video&eventType=upcoming&order=date`;

    const res = await axios.get(url);

    if (!res.data.items || res.data.items.length === 0) return;

    const video = res.data.items[0];

    if (video.id.videoId !== lastVideoId) {
      lastVideoId = video.id.videoId;

      const liveUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`;

      const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
      await channel.send(`🔴 ライブ枠が立ちました！\n${liveUrl}`);

      console.log("通知送信:", liveUrl);
    }
  } catch (err) {
    console.error("YouTube APIエラー:", err.response?.data || err.message);
  }
}

// ===== 起動 =====
client.once("clientReady", () => {
  console.log(`ログイン: ${client.user.tag}`);

  checkLive();
  setInterval(checkLive, 5 * 60 * 1000);
});

client.login(process.env.DISCORD_TOKEN);
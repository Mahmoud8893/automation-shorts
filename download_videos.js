const path = require('path');
const fs = require('fs');
const { search } = require('youtube-search-without-api-key');
const youtubedl = require('youtube-dl-exec');

const videoCount = 5;

const videoDir = path.resolve('D:\\yt-automation\\node\\temp');
// Removed musicDir since audio is no longer downloaded

if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

const list = [
  "epic pentakill", "clutch outplay", "insane mechanics", "wild yasuo play", "master yi carry",
  "fiora outplay", "darius dunk", "top lane beast", "mid lane god", "jungler steal",
  "smurf gameplay", "diamond gameplay", "challenger montage", "unbelievable plays",
  "flash combo", "outplayed", "no scope draven", "ezreal skillshot", "jinx rocket",
  "adc domination", "support saves", "mage burst", "assassin kill", "tank engage",
  "teamfight chaos", "objective control", "baron steal", "dragon control", "split push",
  "solo queue madness", "ranked climb", "climbing elo", "high elo plays", "low elo funny",
  "funny moments", "fail montage", "tilted moments", "rage quit", "comeback win",
  "perfect kda", "zero deaths", "1v5 pentakill", "one shot combo", "flash outplay",
  "cooldown manipulation", "combo tutorial", "animation cancel", "attack speed",
  "critical strike", "ability max", "skill cap", "kiting master", "zone control",
  "vision control", "roam success", "early game snowball", "late game carry",
  "lane swap", "counter jungle", "invade success", "jungler gank", "tower dive",
  "heal clutch", "barrier clutch", "exhaust plays", "ignite kill", "ghost chase",
  "merc treads rush", "trinity force", "lethality build", "burst build", "tank build",
  "split push montage", "catch outplay", "bait and switch", "baited enemy", "baited skillshot",
  "perfect timing", "ward placement", "map awareness", "team communication", "shotcall",
  "clutch smite", "zoning ultimate", "aoe damage", "cc chain", "root chain", "stun chain",
  "flash engage", "flash escape", "outnumbered clutch", "1v2 outplay", "1v3 outplay",
  "quadra kill", "double kill spree", "kill streak", "shutdown spree", "godlike spree",
  "legendary spree", "play of the game", "game winning play", "comeback mechanics",
  "tilt proof", "mind games", "psych out", "feeder comeback"
];

let index = 0;

function getDateFilename(extension = 'mp4') {
  const now = new Date();
  return `${now.toISOString().replace(/:/g, '-').split('.')[0].replace('T', '_')}.${extension}`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanPartFiles(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    if (file.endsWith('.part')) {
      fs.unlinkSync(path.join(directory, file));
      console.log(`🧹 Deleted .part file: ${file}`);
    }
  }
}

async function getVideoUrls(query, limit) {
  try {
    const results = await search(query);
    console.log(`\n🔍 Raw results for "${query}":`);
    results.slice(0, videoCount).forEach((res, i) => {
      console.log(`Result ${i + 1}: ${res.url} (${res.duration})`);
    });

    let shorts = results.filter(r => r.url && r.url.includes('/shorts/')).slice(0, limit);
    if (shorts.length === 0) {
      console.log(`⚠️ No shorts found, falling back to normal videos for '${query}'`);
      shorts = results.filter(r => r.url && !r.url.includes('/shorts/')).slice(0, limit);
    }

    return shorts.map(r => r.url);
  } catch (err) {
    console.error('❌ Search error:', err);
    return [];
  }
}

async function downloadVideo(url) {
  const outputPath = path.join(videoDir, getDateFilename('mp4'));
  try {
    await youtubedl(url, {
      output: outputPath,
      format: 'mp4',
      noWarnings: true,
      noCheckCertificates: true,
      noPlaylist: true,
      maxFilesize: '20M'
    });
    console.log(`🎥 Downloaded video: ${url}`);
    return outputPath;
  } catch (err) {
    console.error(`❌ Failed video: ${url}`, err);
    return null;
  }
}

// === MAIN CYCLE ===
async function runDownloadCycle() {
  console.log(`\n🔁 ${new Date().toLocaleTimeString()} | Query index: ${index}`);
  const randomIndex = Math.floor(Math.random() * list.length);

  const query = `${list[randomIndex]} shorts`;

  cleanPartFiles(videoDir);

  const videoUrls = await getVideoUrls(query, 2);

  console.log(`\n🎮 Downloading League Videos...`);
  for (const url of videoUrls) {
    await downloadVideo(url);
  }


  console.log('\n✅ Cycle complete. Run `2_merge.js` to combine content.\n');

  index = (index + 1) % list.length;
}

// Loop forever every 20 seconds
(async () => {
  while (true) {
    await runDownloadCycle();
    console.log('⏱ Waiting 20 seconds...\n');
    await sleep(20_000);
  }
})();

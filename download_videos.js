const path = require('path');
const fs = require('fs');
const { search } = require('youtube-search-without-api-key');
const youtubedl = require('youtube-dl-exec');

const videoDir = path.resolve('D:\\yt-automation\\node\\temp');
// Removed musicDir since audio is no longer downloaded

if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

const list = [
  "korean montage", "korean riven montage",
  "korean attroxx montage", "korean feora montage","riven montage","chinese darius montage","chinese riven montage", "yasou montage"
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
    results.slice(0, 10).forEach((res, i) => {
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
  const query = `${list[index]} shorts`;

  cleanPartFiles(videoDir);

  const videoUrls = await getVideoUrls(query, 2);

  console.log(`\n🎮 Downloading League Videos...`);
  for (const url of videoUrls) {
    await downloadVideo(url);
  }

  console.log('\n✅ Cycle complete. Run `2_merge.js` to combine content.\n');

  index = (index + 1) % list.length;
}

// Loop forever every 60 seconds
(async () => {
  while (true) {
    await runDownloadCycle();
    console.log('⏱ Waiting 60 seconds...\n');
    await sleep(60_000);
  }
})();

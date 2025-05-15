const path = require('path');
const fs = require('fs');
const { search } = require('youtube-search-without-api-key');
const youtubedl = require('youtube-dl-exec');

// Paths
const videoDir = path.resolve('D:\\yt-automation\\node\\temp');
const musicDir = path.resolve('D:\\yt-automation\\node\\music');

// Ensure directories exist
for (const dir of [videoDir, musicDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// List of League of Legends search terms
const list = [
  "riven montage", "chinese darius montage", "chinese riven montage",
  "yasou montage", "korean montage", "korean riven montage",
  "korean attroxx montage", "korean feora montage"
];

let index = 0;

// Helper: create filename with timestamp
function getDateFilename(extension = 'mp4') {
  const now = new Date();
  return `${now.toISOString().replace(/:/g, '-').split('.')[0].replace('T', '_')}.${extension}`;
}

// Helper: sleep for N ms
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Clean .part files
function cleanPartFiles(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    if (file.endsWith('.part')) {
      const filePath = path.join(directory, file);
      fs.unlinkSync(filePath);
      console.log(`🧹 Deleted leftover part file: ${file}`);
    }
  }
}

// Search YouTube
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

// Download video
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

// Download audio
async function downloadAudio(url) {
  const outputPath = path.join(musicDir, getDateFilename('mp3'));
  try {
    await youtubedl(url, {
      output: outputPath,
      extractAudio: true,
      audioFormat: 'mp3',
      audioQuality: 0,
      noWarnings: true,
      noCheckCertificates: true,
      noPlaylist: true,
      maxFilesize: '15M'
    });
    console.log(`🎵 Downloaded audio: ${url}`);
    return outputPath;
  } catch (err) {
    console.error(`❌ Failed audio: ${url}`, err);
    return null;
  }
}

// Main download cycle
async function runDownloadCycle() {
  console.log(`\n🔁 ${new Date().toLocaleTimeString()} | Query index: ${index}`);
  const query = `${list[index]} shorts`;

  // Cleanup temp files
  cleanPartFiles(videoDir);
  cleanPartFiles(musicDir);

  // Search and download
  const videoUrls = await getVideoUrls(query, 2);
  const audioUrls = await getVideoUrls('action music shorts', 1);

  console.log(`\n🎮 Downloading League Videos...`);
  for (const url of videoUrls) {
    await downloadVideo(url);
  }

  console.log(`\n🎧 Downloading Action Music...`);
  for (const url of audioUrls) {
    await downloadAudio(url);
  }

  console.log('\n✅ Cycle done. Run `2_merge.js` to combine videos and audio.\n');

  index = (index + 1) % list.length;
}

(async () => {
  while (true) {
    await runDownloadCycle();
    console.log('⏱ Waiting 60 seconds...\n');
    await sleep(60_000); // wait 60 seconds
  }
})();

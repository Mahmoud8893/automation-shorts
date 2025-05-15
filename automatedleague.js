const path = require('path');
const fs = require('fs');
const { search } = require('youtube-search-without-api-key');
const youtubedl = require('youtube-dl-exec');
const ffmpeg = require('fluent-ffmpeg');

const videoDir = path.resolve('D:\\yt-automation\\league_of_legends_bot\\temp');
const musicDir = path.resolve('D:\\yt-automation\\league_of_legends_bot\\music');
const outputDir = path.resolve('D:\\yt-automation\\league_of_legends_bot\\output');

// Ensure directories exist
for (const dir of [videoDir, musicDir, outputDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Helper: get date-time filename string safe for filenames
function getDateFilename(extension = 'mp4') {
  const now = new Date();
  const dateStr = now.toISOString().replace(/:/g, '-').split('.')[0].replace('T', '_');
  return `${dateStr}.${extension}`;
}

// Search and return an array of video URLs (shorts or fallback regular)
async function getVideoUrls(query, limit) {
  try {
    const results = await search(query);
    console.log(`\nRaw results for "${query}":`, results);

    // Filter shorts URLs (by 'url' property)
    let shorts = results.filter(result => result.url && result.url.includes('/shorts/')).slice(0, limit);

    if (shorts.length === 0) {
      // fallback regular videos
      shorts = results.filter(result => result.url && !result.url.includes('/shorts/')).slice(0, limit);
      console.log(`No shorts found for "${query}", falling back to regular videos.`);
    } else {
      console.log(`Found shorts for "${query}".`);
    }

    // Return array of URLs
    return shorts.map(result => result.url);
  } catch (err) {
    console.error('Error searching YouTube:', err);
    return [];
  }
}


// Download video file
async function downloadVideo(url) {
  const outputPath = path.join(videoDir, getDateFilename('mp4'));
  console.log(`Downloading video: ${url}\n -> ${outputPath}`);
  try {
    await youtubedl(url, {
      output: outputPath,
      format: 'mp4',
      noWarnings: true,
    });
    return outputPath;
  } catch (err) {
    console.error(`Error downloading video ${url}:`, err);
    return null;
  }
}

// Download audio file
async function downloadAudio(url) {
  const outputPath = path.join(musicDir, getDateFilename('mp3'));
  console.log(`Downloading audio: ${url}\n -> ${outputPath}`);
  try {
    await youtubedl(url, {
      output: outputPath,
      extractAudio: true,
      audioFormat: 'mp3',
      audioQuality: 0,
      noWarnings: true,
    });
    return outputPath;
  } catch (err) {
    console.error(`Error downloading audio ${url}:`, err);
    return null;
  }
}

// Merge video + audio into one output file
async function mergeVideoAudio(videoPath, audioPath) {
  if (!videoPath || !audioPath) {
    console.error('Invalid video or audio path for merging.');
    return null;
  }

  const outputPath = path.join(outputDir, getDateFilename('mp4'));
  console.log(`Merging video and audio:\n Video: ${videoPath}\n Audio: ${audioPath}\n Output: ${outputPath}`);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions('-c:v copy') // copy video codec (no re-encoding)
      .outputOptions('-c:a aac') // encode audio as aac
      .outputOptions('-shortest') // stop when shortest input ends
      .on('end', () => {
        console.log(`Merged file created at ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('FFmpeg merge error:', err);
        reject(err);
      })
      .save(outputPath);
  });
}

(async () => {
  try {
    // Get URLs
    const leagueUrls = await getVideoUrls('league of legends shorts', 10);
    const actionUrls = await getVideoUrls('action music shorts', 5);

    // Download league videos
    console.log('\n=== Downloading League of Legends Videos ===');
    const leagueVideos = [];
    for (const url of leagueUrls) {
      const videoPath = await downloadVideo(url);
      if (videoPath) leagueVideos.push(videoPath);
    }

    // Download action music audios
    console.log('\n=== Downloading Action Music Audios ===');
    const actionAudios = [];
    for (const url of actionUrls) {
      const audioPath = await downloadAudio(url);
      if (audioPath) actionAudios.push(audioPath);
    }

    // Merge videos with audios - pair by index; if count mismatch, merge what you have
    console.log('\n=== Merging Video and Audio Files ===');
    const mergeCount = Math.min(leagueVideos.length, actionAudios.length);
    for (let i = 0; i < mergeCount; i++) {
      await mergeVideoAudio(leagueVideos[i], actionAudios[i]);
    }

    console.log('\nAll done!');
  } catch (err) {
    console.error('Fatal error:', err);
  }
})();

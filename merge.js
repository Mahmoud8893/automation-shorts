const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

// Set directories
const outputDir = path.resolve(__dirname, 'output');
const videoDir = path.resolve(__dirname, 'temp');
const musicDir = path.resolve(__dirname, 'music');
// Ensure output directory exists
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Helper: shuffle and pick N items
function getRandomFiles(dir, extension, count) {
  const files = fs.readdirSync(dir)
    .filter(file => file.endsWith(extension))
    .sort(() => 0.5 - Math.random()) // shuffle
    .slice(0, count);
  return files.map(file => path.join(dir, file));
}

// Helper: create timestamped output file
function getOutputPath(index) {
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(outputDir, `merged_${now}_${index + 1}.mp4`);
}

// Merge one video and one audio
async function mergeVideoAudio(videoPath, audioPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions('-map 0:v:0')      // take video from first input
      .outputOptions('-map 1:a:0')      // take audio from second input
      .videoCodec('libx264')            // re-encode video
      .audioCodec('aac')                // re-encode audio
      .outputOptions('-shortest')       // stop at shortest input
      .on('start', () => {
        console.log(`Merging:\n  Video: ${videoPath}\n  Audio: ${audioPath}`);
      })
      .on('end', () => {
        console.log(`✅ Done: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`❌ FFmpeg error:`, err);
        reject(err);
      })
      .save(outputPath);
  });
}

(async () => {
  try {
    const videos = getRandomFiles(videoDir, '.mp4', 5);
    const audios = getRandomFiles(musicDir, '.mp3', 5);

    const mergeCount = Math.min(videos.length, audios.length);
    if (mergeCount === 0) {
      console.log('⚠️ No videos or audios found to merge.');
      return;
    }

    console.log(`Merging ${mergeCount} pairs...`);

    for (let i = 0; i < mergeCount; i++) {
      const outputPath = getOutputPath(i);
      await mergeVideoAudio(videos[i], audios[i], outputPath);
    }

    console.log('\n🎉 All merging complete!');
  } catch (err) {
    console.error('🔥 Fatal error during merging:', err);
  }
})();

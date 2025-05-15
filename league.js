const path = require('path');
const youtubedl = require('youtube-dl-exec');
const ffmpeg = require('fluent-ffmpeg');

const videoDir = 'D:\\yt-automation\\league_of_legends_bot\\temp';
const musicDir = 'D:\\yt-automation\\league_of_legends_bot\\music';
const outputDir = 'D:\\yt-automation\\league_of_legends_bot\\output';

// Helper to create a date-based filename string safe for filenames
function getDateFilename(extension = 'mp4') {
  const now = new Date();
  // Format: YYYY-MM-DD_HH-mm-ss
  const dateStr = now.toISOString().replace(/:/g, '-').split('.')[0].replace('T', '_');
  return `${dateStr}.${extension}`;
}

async function downloadVideo(url) {
  try {
    const outputPath = path.join(videoDir, getDateFilename('mp4'));

    console.log('Downloading video to:', outputPath);

    await youtubedl(url, {
      output: outputPath,
      format: 'mp4',
      noWarnings: true,
    });

    return outputPath;
  } catch (err) {
    console.error('Error downloading video:', err);
    return null;
  }
}

async function downloadAudio(url) {
  try {
    const outputPath = path.join(musicDir, getDateFilename('mp3'));

    console.log('Downloading audio to:', outputPath);

    await youtubedl(url, {
      output: outputPath,
      extractAudio: true,
      audioFormat: 'mp3',
      audioQuality: 0, // best
      noWarnings: true,
    });

    return outputPath;
  } catch (err) {
    console.error('Error downloading audio:', err);
    return null;
  }
}

// Merge video and audio, output file named by date
function mergeVideoAudio(videoPath, audioPath) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(outputDir, getDateFilename('mp4'));

    console.log('Merging video and audio into:', outputPath);

    ffmpeg(videoPath)
      .input(audioPath)
      .outputOptions([
        '-c:v copy',   // copy video codec (no re-encode)
        '-c:a aac',    // encode audio to AAC (compatible with MP4)
        '-map 0:v:0',  // map video from first input
        '-map 1:a:0',  // map audio from second input
        '-shortest'    // stop at shortest input length
      ])
      .on('end', () => {
        console.log('Merge completed:', outputPath);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Error during merge:', err);
        reject(err);
      })
      .save(outputPath);
  });
}

(async () => {
  const videourl = 'https://www.youtube.com/shorts/Dli2BPXk3c0';
  const audiourl = 'https://www.youtube.com/shorts/4iWFuv8oPCg';

  const videoPath = await downloadVideo(videourl);
  const audioPath = await downloadAudio(audiourl);

  if (videoPath && audioPath) {
    const mergedPath = await mergeVideoAudio(videoPath, audioPath);
    console.log('Final merged file:', mergedPath);
  } else {
    console.log('Skipping merge due to missing video or audio');
  }
})();

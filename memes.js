const { spawn } = require('child_process');
const path = require('path');

// Example selected inputs (replace with your random selection logic)
const videoPath = 'D:\\yt-automation\\memebot\\temp\\Pizza 🤬🤯.mp4';
const musicPath = 'D:\\yt-automation\\memebot\\music\\Elevator Music (Kevin MacLeod) - Background Music (HD).mp3';

// Get date string
const now = new Date();
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, '0');
const dd = String(now.getDate()).padStart(2, '0');
const dateString = `${yyyy}${mm}${dd}`;

const outputDir = 'D:\\yt-automation\\memebot\\output';
const outputFilename = `merged_output_${dateString}.mp4`;
const outputPath = path.join(outputDir, outputFilename);

// Build ffmpeg command args
const args = [
  '-i', videoPath,
  '-i', musicPath,
  '-filter_complex', '[0:v]format=yuv420p[v];[0:a][1:a]amix=inputs=2:duration=shortest:dropout_transition=2,volume=2[mixedaudio]',
  '-map', '[v]',
  '-map', '[mixedaudio]',
  '-shortest',
  outputPath,
];


// Spawn ffmpeg process
console.log('Spawned ffmpeg with command:', 'ffmpeg', args.join(' '));

const ffmpeg = spawn('ffmpeg', args);

ffmpeg.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

ffmpeg.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

ffmpeg.on('close', (code) => {
  console.log(`ffmpeg exited with code ${code}`);
  if (code === 0) {
    console.log('Video successfully generated at', outputPath);
  }
});

const fs = require('fs');
const path = require('path');

const videoFiles = [
  'public/1.webm',
  'public/2.webm', 
  'public/3.webm',
  'public/4.webm',
  'public/Space_Time_Travel__Seamless_VJ_Loop_uhd_2533132_compressed.webm',
  'public/zodiac/aries.gif',
  'public/zodiac/taurus.gif',
  'public/zodiac/gemini.gif',
  'public/zodiac/cancer.gif',
  'public/zodiac/leo.gif',
  'public/zodiac/virgo.gif',
  'public/zodiac/libra.gif',
  'public/zodiac/scorpio.gif',
  'public/zodiac/sagittarius.gif',
  'public/zodiac/capricorn.gif',
  'public/zodiac/aquarius.gif',
  'public/zodiac/pisces.gif'
];

console.log('Checking video files...');
videoFiles.forEach(file => {
  const exists = fs.existsSync(file);
  const size = exists ? fs.statSync(file).size : 0;
  console.log(`${file}: ${exists ? 'EXISTS' : 'MISSING'} (${size} bytes)`);
});

console.log('\nVideo files check complete.');

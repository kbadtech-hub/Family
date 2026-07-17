const fs = require('fs');
const path = require('path');

function getFiles(dir, files_) {
  files_ = files_ || [];
  const files = fs.readdirSync(dir);
  for (let i in files) {
    const name = path.join(dir, files[i]);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files_);
    } else {
      files_.push(name);
    }
  }
  return files_;
}

const envVars = new Set();
const allFiles = getFiles('c:/Users/KB/Desktop/Beteseb/Family/src');

allFiles.forEach(file => {
  if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(/process\.env\.[A-Za-z0-9_]+/g);
    if (matches) {
      matches.forEach(m => envVars.add(m));
    }
  }
});

console.log('Environment Variables Found:');
Array.from(envVars).sort().forEach(v => console.log(v));

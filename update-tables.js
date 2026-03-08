const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function findFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        findFiles(filePath, files);
      }
    } else if (file.endsWith('.tsx')) {
      files.push(filePath);
    }
  }
  return files;
}

const allTsxFiles = findFiles('app');

allTsxFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('<Table>')) {
    content = content.replace(/<Table>/g, '<Table noPagination={true}>');
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});

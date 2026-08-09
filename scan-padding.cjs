const fs = require('fs');
const path = require('path');

// ყველა ფაილის სკანირება src/ ფოლდერში
function walk(dir) {
  const results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...walk(fullPath));
    } else if (item.name.endsWith('.css') || item.name.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = walk('src');
let found = 0;

console.log('\n🔍 ვეძებ padding-top / margin-top / paddingTop / marginTop...\n');

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // ვეძებთ padding-top, paddingTop, margin-top, marginTop რომლებიც არ არის 0
    if (/(padding-top|paddingTop|margin-top|marginTop)\s*[:=]\s*[^0;\n,}]/.test(line)) {
      // გამოვრიცხოთ ცრუ დადებითი (0, '0', 0px)
      if (!/[:=]\s*['"]?0['"]?\s*[;\n,}]/.test(line) && !/['"]0px['"]/.test(line)) {
        found++;
        console.log(`📄 ${file}:${i + 1}`);
        console.log(`   ${line.trim()}`);
        console.log('');
      }
    }
  }
}

console.log(`\n✅ სულ ნაპოვნია: ${found} ელემენტი\n`);
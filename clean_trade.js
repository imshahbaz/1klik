const fs = require('node:fs');
const filePath = 'app/(tabs)/trade.tsx';
let content = fs.readFileSync(filePath, 'utf8');

let newContent = content.replace(/ {2}const \[zerodhaUser[\s\S]*?const \[searchQuery, setSearchQuery\] = useState\(''\);/m, "  const [searchQuery, setSearchQuery] = useState('');");
newContent = newContent.replace(/ {2}\/\/ Authentication Route Guardian & Profile Fetcher[\s\S]*?}, \[user\?\.id, appLoading\]\);/m, "");
newContent = newContent.replace(/ {2}if \(appLoading\) \{[\s\S]*? {4}\);\n {2}}/m, "");

const fetchStartIdx = newContent.indexOf('  const fetchZerodhaProfile = async () => {');
const returnIdx = newContent.indexOf('  return (\n    <View style={[styles.safeArea, layout.screenPadding]}>');

if (fetchStartIdx !== -1 && returnIdx !== -1) {
  newContent = newContent.substring(0, fetchStartIdx) + newContent.substring(returnIdx);
}

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Cleaned up trade.tsx');

const fs = require('fs');
const filePath = 'app/(tabs)/trade.tsx';
let content = fs.readFileSync(filePath, 'utf8');

let newContent = content.replace(/  const \[zerodhaUser[\s\S]*?const \[searchQuery, setSearchQuery\] = useState\(''\);/m, "  const [searchQuery, setSearchQuery] = useState('');");
newContent = newContent.replace(/  \/\/ Authentication Route Guardian & Profile Fetcher[\s\S]*?}, \[user\?\.id, appLoading\]\);/m, "");
newContent = newContent.replace(/  if \(appLoading\) \{[\s\S]*?    \);\n  }/m, "");

const fetchStartIdx = newContent.indexOf('  const fetchZerodhaProfile = async () => {');
const returnIdx = newContent.indexOf('  return (\n    <View style={[styles.safeArea, layout.screenPadding]}>');

if (fetchStartIdx !== -1 && returnIdx !== -1) {
  newContent = newContent.substring(0, fetchStartIdx) + newContent.substring(returnIdx);
}

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Cleaned up trade.tsx');

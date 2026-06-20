const fs = require('fs');
const filePath = 'app/(tabs)/brokers.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = "    if (!appLoading && user && !hasFetchedProfile.current) {";
const startIdx = content.indexOf(targetStr);

if (startIdx !== -1) {
  const replacement = \  useEffect(() => {
    if (activeBrokerTab === 'rupeezy' && !rupeezyUser && !rupeezyError) {
      fetchRupeezyProfile();
    }
  }, [activeBrokerTab]);

  useEffect(() => {
\ + targetStr;
  
  const newContent = content.substring(0, startIdx) + replacement.substring(replacement.indexOf('  useEffect')) + content.substring(startIdx + targetStr.length);
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('Successfully added tab switch useEffect');
} else {
  console.log('Index not found!');
}

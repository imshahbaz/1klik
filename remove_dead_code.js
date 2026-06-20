const fs = require('fs');
const filePath = 'app/(tabs)/trade.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const startIdx = content.indexOf('  const renderEditCalendar = () => {');
const endStr = '  return (\r\n    <View style={[styles.safeArea, layout.screenPadding]}>';
let endIdx = content.indexOf(endStr);

if (endIdx === -1) {
  endIdx = content.indexOf('  return (\n    <View style={[styles.safeArea, layout.screenPadding]}>');
}

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + content.substring(endIdx);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully removed dead code');
} else {
  console.log('Could not find markers', startIdx, endIdx);
}

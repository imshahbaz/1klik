const fs = require('fs');
const filePath = 'app/(tabs)/trade.tsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

const insertIdx = lines.findIndex(l => l.includes('const [searchQuery, setSearchQuery] = useState(\\'\\');'));

if (insertIdx !== -1) {
  const toInsert = \  const [marginsData, setMarginsData] = useState<any[]>([]);

  useEffect(() => {
    marginAPI.getAllMargins().then(res => {
      if (res.data?.success) {
        setMarginsData(res.data.data);
      } else {
        setMarginsData(res.data);
      }
    }).catch(console.error);
  }, []);\;
  
  lines.splice(insertIdx, 0, toInsert);
  
  // also fix the type errors
  const fix1 = lines.findIndex(l => l.includes('filter(m => m && m.symbol'));
  if (fix1 !== -1) {
    lines[fix1] = lines[fix1].replace('m =>', '(m: any) =>');
  }
  
  const fix2 = lines.findIndex(l => l.includes('sort((a, b) => {'));
  if (fix2 !== -1) {
    lines[fix2] = lines[fix2].replace('(a, b)', '(a: any, b: any)');
  }
  
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Restored marginsData');
} else {
  console.log('Could not find insert idx');
}

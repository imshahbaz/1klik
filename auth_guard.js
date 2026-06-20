const fs = require('fs');

function addAuthGuard(filePath) {
  let lines = fs.readFileSync(filePath, 'utf8').split('\n');
  
  const insertIdx = lines.findIndex(l => l.includes('const layout = useAdaptiveLayout(insets);'));
  if (insertIdx !== -1) {
    const toInsert = \
  useEffect(() => {
    if (!appLoading && !user) {
      router.replace('/login');
    }
  }, [user, appLoading]);
\;
    lines.splice(insertIdx + 4, 0, toInsert);
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log('Added guard to ' + filePath);
  }
}

addAuthGuard('app/(tabs)/trade.tsx');
addAuthGuard('app/(tabs)/brokers.tsx');

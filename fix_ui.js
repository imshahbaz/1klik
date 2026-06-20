const fs = require('fs');

const filePath = 'app/(tabs)/trade.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1
const cancelEditOld =                     setEditingMtfOrderId(null);
                    setTradeSymbol('');
                    setTradeQty('10');
                    setTargetDate(new Date());
                  }};
const cancelEditNew =                     setEditingMtfOrderId(null);
                    setTradeSymbol('');
                    setTradeQty('10');
                    setTargetDate(new Date());
                    setTradeBroker('ZERODHA');
                  }};
content = content.replace(cancelEditOld, cancelEditNew);

// Fix 2
const btnContainerOld =             {/* Execute Action Button */}
            {editingMtfOrderId ? (
              <View style={{ flexDirection: 'row', gap: 12 }}>;
const btnContainerNew =             {/* Execute Action Button */}
            {editingMtfOrderId ? (
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>;
content = content.replace(btnContainerOld, btnContainerNew);

// Fix 3
const btnNoneditOld =               <TouchableOpacity
                style={[
                  styles.executeActionBtn,
                  styles.executeBuyBtn,
                  executingTrade && styles.disabledButton
                ]};
const btnNoneditNew =               <TouchableOpacity
                style={[
                  styles.executeActionBtn,
                  styles.executeBuyBtn,
                  executingTrade && styles.disabledButton,
                  { marginTop: 12 }
                ] as any};
content = content.replace(btnNoneditOld, btnNoneditNew);

// Fix 4
const histEditOld =                             setTargetDate(parsedDate);
                            setPickerDate(parsedDate);
                            setEditingMtfOrderId(log.id);;
const histEditNew =                             setTargetDate(parsedDate);
                            setPickerDate(parsedDate);
                            setTradeBroker(log.broker || 'ZERODHA');
                            setEditingMtfOrderId(log.id);;
content = content.replace(histEditOld, histEditNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done');

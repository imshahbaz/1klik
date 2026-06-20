import re

file_path = 'app/(tabs)/trade.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Add setTradeBroker('ZERODHA'); in CANCEL EDIT
cancel_edit_old = '''                    setEditingMtfOrderId(null);
                    setTradeSymbol('');
                    setTradeQty('10');
                    setTargetDate(new Date());
                  }}'''

cancel_edit_new = '''                    setEditingMtfOrderId(null);
                    setTradeSymbol('');
                    setTradeQty('10');
                    setTargetDate(new Date());
                    setTradeBroker('ZERODHA');
                  }}'''

content = content.replace(cancel_edit_old, cancel_edit_new)

# Fix 2: Add marginTop: 12 to the editing buttons container
btn_container_old = '''            {/* Execute Action Button */}
            {editingMtfOrderId ? (
              <View style={{ flexDirection: 'row', gap: 12 }}>'''

btn_container_new = '''            {/* Execute Action Button */}
            {editingMtfOrderId ? (
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>'''

content = content.replace(btn_container_old, btn_container_new)

# Fix 3: Add marginTop: 12 to the non-editing button
btn_nonedit_old = '''              <TouchableOpacity
                style={[
                  styles.executeActionBtn,
                  styles.executeBuyBtn,
                  executingTrade && styles.disabledButton
                ]}'''

btn_nonedit_new = '''              <TouchableOpacity
                style={[
                  styles.executeActionBtn,
                  styles.executeBuyBtn,
                  executingTrade && styles.disabledButton,
                  { marginTop: 12 }
                ] as any}'''

content = content.replace(btn_nonedit_old, btn_nonedit_new)

# Fix 4: Add setTradeBroker(log.broker || 'ZERODHA') in History MTF edit
hist_edit_old = '''                            setTargetDate(parsedDate);
                            setPickerDate(parsedDate);
                            setEditingMtfOrderId(log.id);'''

hist_edit_new = '''                            setTargetDate(parsedDate);
                            setPickerDate(parsedDate);
                            setTradeBroker(log.broker || 'ZERODHA');
                            setEditingMtfOrderId(log.id);'''

content = content.replace(hist_edit_old, hist_edit_new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")

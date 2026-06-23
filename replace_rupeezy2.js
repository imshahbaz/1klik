const fs = require('fs');
const filePath = 'app/(tabs)/brokers.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetFuncStart = "  const handleRupeezyNavigationChange = async (navState: any) => {";
const targetFuncEnd = "  const handleSaveRupeezyConfig = async () => {";

const startIdx = content.indexOf(targetFuncStart);
const endIdx = content.indexOf(targetFuncEnd);

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `  const checkRupeezyAuthUrl = async (url: string) => {
    if (url && url.includes('auth=')) {
      const tokenMatch = url.match(/[?&]auth=([^&]+)/);
      if (tokenMatch && tokenMatch[1]) {
        const auth = tokenMatch[1];
        setShowRupeezyWebView(false);

        try {
          setRupeezyLoading(true);
          setRupeezyError(null);
          setIsRupeezyTokenExpired(false);
          await rupeezyAPI.login(auth, user?.id || user?.userId || '');
          CustomAlert.alert(
            "Connection Successful",
            "Your Rupeezy session has been successfully established and authenticated!",
            [{ text: "OK", onPress: () => fetchRupeezyProfile() }]
          );
        } catch (err: any) {
          const errMsg = err.response?.data?.message || err.message || "Failed to authenticate session with the backend.";
          CustomAlert.alert("Authentication Failed", errMsg);
          setIsRupeezyTokenExpired(true);
        } finally {
          setRupeezyLoading(false);
        }
      }
    }
  };

  const handleRupeezyNavigationChange = (navState: any) => checkRupeezyAuthUrl(navState.url);
  const handleRupeezyWebViewError = (e: any) => {
    if (e.nativeEvent && e.nativeEvent.url) {
      checkRupeezyAuthUrl(e.nativeEvent.url);
    }
  };

`;
  
  const newContent = content.substring(0, startIdx) + replacement + content.substring(endIdx);
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('Successfully replaced handleRupeezyNavigationChange block');
} else {
  console.log('Indices not found!');
}

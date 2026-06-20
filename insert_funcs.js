const fs = require('fs');
const filePath = 'app/(tabs)/brokers.tsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

const insertIdx = lines.findIndex(l => l.includes('const handleSaveRupeezyConfig = async () => {'));

if (insertIdx !== -1) {
  const toInsert = \  const fetchRupeezyProfile = async () => {
    try {
      setRupeezyLoading(true);
      setRupeezyError(null);
      setIsRupeezy404Error(false);
      setIsRupeezyTokenExpired(false);
      const res = await rupeezyAPI.getMe();
      const payload = res.data;
      
      if (payload && payload.success === true) {
        setRupeezyUser(payload.data);
      } else {
        setRupeezyError(payload?.message || "Rupeezy session is disconnected.");
        setIsRupeezyTokenExpired(true);
        if (payload && typeof payload.data === 'string') {
          setRupeezyAppId(payload.data);
        } else if (payload && payload.data && payload.data.appId) {
          setRupeezyAppId(payload.data.appId);
        }
      }
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 404) {
        setRupeezyError("No linked Rupeezy account found.");
        setIsRupeezy404Error(true);
      } else {
        setRupeezyError("Rupeezy session is disconnected.");
        setIsRupeezyTokenExpired(true);
      }
    } finally {
      setRupeezyLoading(false);
    }
  };

  const handleRupeezyNavigationChange = async (navState: any) => {
    if (navState.url.includes('auth=')) {
      const tokenMatch = navState.url.match(/[?&]auth=([^&]+)/);
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
\;
  
  lines.splice(insertIdx, 0, toInsert);
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Inserted Rupeezy functions');
} else {
  console.log('Could not find insert index');
}

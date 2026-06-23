const path = require('node:path');

const localAndroidGoogleServicesFile = path.join(__dirname, 'google-services.json');
const localIosGoogleServicesFile = path.join(__dirname, 'GoogleService-Info.plist');

module.exports = ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    googleServicesFile:
      process.env.GOOGLE_SERVICE_INFO_PLIST ?? config.ios?.googleServicesFile ?? localIosGoogleServicesFile,
  },
  android: {
    ...config.android,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? config.android?.googleServicesFile ?? localAndroidGoogleServicesFile,
  },
});

const { withProjectBuildGradle } = require('expo/config-plugins');

module.exports = function withNotifeeRepo(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = setNotifeeMaven(config.modResults.contents);
    }
    return config;
  });
};

function setNotifeeMaven(buildGradle) {
  const mavenString = `
        maven {
            // Add notifee maven repo manually to fix configure-on-demand issue
            def notifeeDir = new File(["node", "--print", "require.resolve('@notifee/react-native/package.json')"].execute(null, rootDir).text.trim()).getParentFile().absolutePath
            url "$notifeeDir/android/libs"
        }
`;
  if (buildGradle.includes('url "$notifeeDir/android/libs"')) {
    return buildGradle;
  }
  return buildGradle.replace(/allprojects\s*{\s*repositories\s*{/, `allprojects {\n  repositories {${mavenString}`);
}

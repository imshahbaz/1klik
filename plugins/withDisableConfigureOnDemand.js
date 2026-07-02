const { withGradleProperties } = require('@expo/config-plugins');

const KEY = 'org.gradle.configureondemand';

module.exports = function withDisableConfigureOnDemand(config) {
  return withGradleProperties(config, (cfg) => {
    cfg.modResults = cfg.modResults.filter(
      (item) => !(item.type === 'property' && item.key === KEY)
    );
    cfg.modResults.push({ type: 'property', key: KEY, value: 'false' });
    return cfg;
  });
};

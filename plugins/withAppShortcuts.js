const {
  withAndroidManifest,
  withStringsXml,
  withDangerousMod,
} = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

const SHORTCUTS = [
  {
    id: 'trade',
    label: 'Trade',
    longLabel: 'Place a Trade',
    route: 'trade',
  },
  {
    id: 'calculator',
    label: 'Calculator',
    longLabel: 'Open Calculator',
    route: 'calculator',
  },
  {
    id: 'screener',
    label: 'Screener',
    longLabel: 'Run a Screener',
    route: 'screener',
  },
  {
    id: 'holdings',
    label: 'Holdings',
    longLabel: 'View Holdings',
    route: 'brokers',
  },
];

module.exports = function withAppShortcuts(config) {
  const pkg = config.android?.package;
  const scheme = config.scheme ?? 'oneklik';
  if (!pkg) {
    throw new Error('withAppShortcuts: "expo.android.package" is required');
  }

  config = withAndroidManifest(config, (manifestConfig) => {
    const application = manifestConfig.modResults.manifest.application?.[0];
    const activity = application?.activity?.find(
      (a) => {
        const name = a.$?.['android:name'] ?? '';
        return name === '.MainActivity' || name.endsWith('.MainActivity');
      }
    );

    if (activity) {
      activity['meta-data'] = activity['meta-data'] ?? [];
      const hasShortcuts = activity['meta-data'].some(
        (m) => m.$?.['android:name'] === 'android.app.shortcuts'
      );
      if (!hasShortcuts) {
        activity['meta-data'].push({
          $: {
            'android:name': 'android.app.shortcuts',
            'android:resource': '@xml/shortcuts',
          },
        });
      }
    }
    return manifestConfig;
  });

  config = withStringsXml(config, (stringsConfig) => {
    const resources = stringsConfig.modResults.resources ?? {};
    resources.string = resources.string ?? [];

    const existingNames = new Set(
      resources.string.map((s) => s.$?.name).filter(Boolean)
    );

    for (const shortcut of SHORTCUTS) {
      const shortName = `shortcut_${shortcut.id}`;
      const longName = `shortcut_${shortcut.id}_long`;
      if (!existingNames.has(shortName)) {
        resources.string.push({ $: { name: shortName }, _: shortcut.label });
        existingNames.add(shortName);
      }
      if (!existingNames.has(longName)) {
        resources.string.push({ $: { name: longName }, _: shortcut.longLabel });
        existingNames.add(longName);
      }
    }

    stringsConfig.modResults.resources = resources;
    return stringsConfig;
  });

  config = withDangerousMod(config, [
    'android',
    async (dangerousConfig) => {
      const xmlDir = path.join(
        dangerousConfig.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml'
      );
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(
        path.join(xmlDir, 'shortcuts.xml'),
        buildShortcutsXml(pkg, scheme)
      );
      return dangerousConfig;
    },
  ]);

  return config;
};

function buildShortcutsXml(packageName, scheme) {
  const entries = SHORTCUTS.map(
    (shortcut) => `    <shortcut
        android:shortcutId="${shortcut.id}"
        android:enabled="true"
        android:icon="@mipmap/ic_launcher"
        android:shortcutShortLabel="@string/shortcut_${shortcut.id}"
        android:shortcutLongLabel="@string/shortcut_${shortcut.id}_long">
        <intent
            android:action="android.intent.action.VIEW"
            android:targetPackage="${packageName}"
            android:targetClass="${packageName}.MainActivity"
            android:data="${scheme}://${shortcut.route}" />
    </shortcut>`
  ).join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
${entries}
</shortcuts>
`;
}

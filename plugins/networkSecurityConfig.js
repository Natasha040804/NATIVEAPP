const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withNetworkSecurityConfig(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const androidDir = path.join(config.modRequest.projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml');

      // Ensure the directory exists
      fs.mkdirSync(androidDir, { recursive: true });

      // Write the network security config
      fs.writeFileSync(
        path.join(androidDir, 'network_security_config.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>

  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">16.176.194.83</domain>
  </domain-config>
</network-security-config>`
      );

      return config;
    }
  ]);
}

module.exports = (config) => {
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Add the reference in AndroidManifest.xml
    if (manifest.application && manifest.application[0].$) {
      manifest.application[0].$.android_networkSecurityConfig = '@xml/network_security_config';
    }

    return config;
  });

  config = withNetworkSecurityConfig(config);
  return config;
};

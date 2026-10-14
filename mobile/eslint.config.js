// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  { ignores: ['dist/*', 'builds/*', 'node_modules/*', 'ios/*', 'android/*', '.expo/*'] },
  expoConfig,
  {
    rules: {
      // useSharedValue(...).value = x is Reanimated's documented API, but the
      // react-hooks immutability rule treats every hook result as readonly.
      'react-hooks/immutability': 'off',
      // Data-on-mount effects (fetch then setLoading/setRows) are the app's
      // standard pattern; keep it visible without failing the build.
      'react-hooks/set-state-in-effect': 'warn'
    }
  }
]);

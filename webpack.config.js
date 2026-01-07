const { resolve } = require("path");

module.exports = {
  // 기존 웹팩 설정
  // ...
  resolve: {
    // 기존 resolve 설정
    // ...
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      fs: false, // fs 모듈을 비활성화합니다.
    },
  },
};

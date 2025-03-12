// CBOR_NATIVE_ACCELERATION_DISABLEDを設定
process.env.CBOR_NATIVE_ACCELERATION_DISABLED = 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    CBOR_NATIVE_ACCELERATION_DISABLED: 'true',
  },
};

module.exports = nextConfig;
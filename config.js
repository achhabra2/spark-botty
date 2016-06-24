module.exports = {
  token: process.env.NODE_TOKEN,
  webhookUrl: process.env.NODE_WEBHOOK,
  productionMode: process.env.PRODUCTION_MODE || 'False',
  port: process.env.PORT || 80,
  securePort: process.env.SECUREPORT || 443,
  sslkey: process.env.NODE_SSLKEY,
  sslcert: process.env.NODE_SSLCERT,
  sslca: process.env.NODE_SSLCA
};

module.exports = {
  token: process.env.NODE_TOKEN,
  webhookUrl: process.env.NODE_WEBHOOK,
  productionMode: process.env.PRODUCTION_MODE || 'False',
  port: process.env.PORT || 80,
  securePort: process.env.SECUREPORT || 443
};

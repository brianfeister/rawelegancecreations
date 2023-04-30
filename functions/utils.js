module.exports = {
  config: {
    MAIL_API_ENDPOINT: 'https://api.mailerlite.com/api/v2',
    MAIL_REC_SITE_ABANDONED_SUBSCRIBERS_ID: '82997463888168093',
    MAIL_REC_SITE_VIP_SUBSCRIBERS_ID: '86900136808023392',
  },
  logAndReturnError: (message, err, statusCode) => {
    console.log(
      `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} ${message}: ${err}`
    );
    return {
      statusCode: statusCode || 500,
      body: JSON.stringify({
        error: err,
      }),
    };
  },
  logError: (message, err) => {
    console.log(
      `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} ${message}: ${err}`
    );
  },
};

module.exports = {
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

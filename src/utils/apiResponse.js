function success(data, message = 'OK', meta) {
  return {
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  };
}

module.exports = {
  success,
};

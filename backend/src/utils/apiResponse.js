'use strict';

const success = (res, data = null, message = 'OK', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

module.exports = { success };

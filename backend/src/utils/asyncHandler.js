'use strict';

// Express 4 tidak menangkap error dari fungsi async; pembungkus ini meneruskannya ke errorHandler.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

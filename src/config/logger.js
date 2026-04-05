const env = require('./env');

const levels = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const activeLevel = levels[env.logLevel] ?? levels.info;

function write(level, message, meta) {
  if (levels[level] < activeLevel) {
    return;
  }

  const timestamp = new Date().toISOString();
  const suffix =
    meta === undefined
      ? ''
      : ` ${typeof meta === 'string' ? meta : JSON.stringify(meta)}`;

  console.log(`[${timestamp}] ${level.toUpperCase()} ${message}${suffix}`);
}

module.exports = {
  debug(message, meta) {
    write('debug', message, meta);
  },
  info(message, meta) {
    write('info', message, meta);
  },
  warn(message, meta) {
    write('warn', message, meta);
  },
  error(message, meta) {
    write('error', message, meta);
  },
  httpStream: {
    write(message) {
      write('info', message.trim());
    },
  },
};

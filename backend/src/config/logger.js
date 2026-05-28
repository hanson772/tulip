const timestamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

module.exports = {
  info: (...args) => process.stdout.write(`[${timestamp()}] [INFO] ${args.join(' ')}\n`),
  warn: (...args) => process.stdout.write(`[${timestamp()}] [WARN] ${args.join(' ')}\n`),
  error: (...args) => process.stderr.write(`[${timestamp()}] [ERROR] ${args.join(' ')}\n`),
};

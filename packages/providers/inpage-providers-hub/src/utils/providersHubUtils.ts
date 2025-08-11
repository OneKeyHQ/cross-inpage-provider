// Save original console.log before it might be overridden
const originalConsoleLog = console.log;

export default {
  consoleLog: originalConsoleLog,
};

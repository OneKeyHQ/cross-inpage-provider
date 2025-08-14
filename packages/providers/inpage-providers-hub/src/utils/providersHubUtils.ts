// Save original console.log before it might be overridden

const originalConsoleLog = process.env.NODE_ENV !== 'production' ? console.log : () => {
  //
};

export default {
  consoleLog: originalConsoleLog,
};

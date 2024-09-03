/* eslint-disable @typescript-eslint/no-unsafe-member-access */
const separator = `${window.location.pathname.replace(/\/+$/, '')}:`;

const setItem = localStorage.setItem;
localStorage.constructor.prototype.setItem = (key: string, value: string) =>
  setItem.apply(localStorage, [separator + key, value]);
localStorage.setItem = (key: string, value: string) =>
  setItem.apply(localStorage, [separator + key, value]);

const getItem = localStorage.getItem;
localStorage.constructor.prototype.getItem = (key: string) =>
  getItem.apply(localStorage, [separator + key]);
localStorage.getItem = (key: string) => getItem.apply(localStorage, [separator + key]);

const removeItem = localStorage.removeItem;
localStorage.constructor.prototype.removeItem = (key: string) =>
  removeItem.apply(localStorage, [separator + key]);
localStorage.removeItem = (key: string) => removeItem.apply(localStorage, [separator + key]);

export {};

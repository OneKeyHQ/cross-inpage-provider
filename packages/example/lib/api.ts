const DEFAULT_API = 'https://api.onekeytest.com'

function getApiKey(apiKey:string, fromBase64:boolean = true) {
    if (fromBase64) {
        const key = Buffer.from(apiKey, 'base64').toString();
        return getApiKey(key, false);
    }
    let result = '';
    for (let i = 0; i < apiKey.length; i++) {
      const textChar = apiKey.charCodeAt(i);
      const keyChar = DEFAULT_API.charCodeAt(i % DEFAULT_API.length);
      result += String.fromCharCode(textChar ^ keyChar);
    }

    return result;
}

function getBase64ApiKey(apiKey:string) {
    const key = getApiKey(apiKey, false);
    return Buffer.from(key).toString('base64');
}

export { getApiKey, getBase64ApiKey };
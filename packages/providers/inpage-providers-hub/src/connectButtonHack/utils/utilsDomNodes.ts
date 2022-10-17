function isReplaced(ele?: HTMLElement | null) {
  return Boolean(ele?.dataset['isOneKeyReplaced']);
}
function isNotReplaced(ele?: HTMLElement | null) {
  return !isReplaced(ele);
}
function setIsReplaced(ele: HTMLElement | Element) {
  const htmlEle = ele as HTMLElement;
  if (htmlEle && htmlEle.dataset) {
    htmlEle.dataset['isOneKeyReplaced'] = 'true';
  }
}
function isInnerContentMatch(
  ele: HTMLElement | Element,
  text: string,
  options: {
    ignoreCase?: boolean;
    findAsHtml?: boolean;
    exactMatch?: boolean;
  } = {},
) {
  const { ignoreCase = true, findAsHtml = false, exactMatch = false } = options;

  let source = (ele as HTMLElement).innerText || '';
  if (findAsHtml) {
    source = ele.innerHTML || '';
  }
  let target = text || '';

  if (ignoreCase) {
    source = source.toLowerCase();
    target = target.toLowerCase();
  }

  if (!source || !target) {
    return false;
  }

  if (exactMatch) {
    return source === target;
  }
  return source.includes(target);
}

function createElementFromHTML(htmlString: string) {
  const div = document.createElement('div');
  div.innerHTML = htmlString.trim();

  // Change this to div.childNodes to support multiple top-level nodes.
  return div.firstChild || '';
}

export default {
  isReplaced,
  isNotReplaced,
  setIsReplaced,
  isInnerContentMatch,
  createElementFromHTML,
};

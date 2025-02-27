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

/**
 * @description:
 * only find the first text node match the text
 */
function findTextNode(
  container: string | HTMLElement,
  text: RegExp | string,
  type: 'all' | 'first' = 'first',
): Text | Text[] | undefined | null {
  const selectAll = type === 'all';
  const containerEles =
    typeof container === 'string' ? Array.from(document.querySelectorAll(container)) : [container];
  if (containerEles.length === 0) {
    return null;
  }
  const result: Text[] = [];
  for (const containerEle of containerEles) {
    const walker = document.createTreeWalker(containerEle, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || node.parentElement instanceof SVGElement) {
          return NodeFilter.FILTER_SKIP;
        }
        return (
          typeof text === 'string'
            ? node.nodeValue.trim() === text.trim()
            : text.test(node.nodeValue.trim())
        )
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      },
    });

    if (selectAll) {
      while (walker.nextNode()) {
        result.push(walker.currentNode as Text);
      }
    } else {
      return walker.nextNode() as Text | null;
    }
  }
  return result.filter(Boolean);
}

export default {
  isReplaced,
  isNotReplaced,
  setIsReplaced,
  isInnerContentMatch,
  createElementFromHTML,
  findTextNode,
};

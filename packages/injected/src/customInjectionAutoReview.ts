export type ICustomInjectionRepositoryIcon = Readonly<{
  key: string;
  label: string;
  source: string;
  sourceKind: 'asset' | 'inline';
}>;

type ICustomInjectionWalletIconInfo = Readonly<{
  text: string;
  icon: string;
  iconUrl: string;
  autoReviewIconUrls?: readonly string[];
}>;

export type ICustomInjectionIconDetection = Readonly<{
  iconKey: string;
  iconLabel: string;
  sourceKind: ICustomInjectionRepositoryIcon['sourceKind'];
}>;

type IInstallCustomInjectionAutoReviewObserverOptions = {
  icons: readonly ICustomInjectionRepositoryIcon[];
  onDetected: (detection: ICustomInjectionIconDetection) => void;
};

type IInstallCustomInjectionAutoReviewOptions = {
  icons: readonly ICustomInjectionRepositoryIcon[];
  onReport: (report: { token: string; detection: ICustomInjectionIconDetection }) => void;
};

export type ICustomInjectionAutoReviewController = Readonly<{
  configure: (token: string) => void;
  stop: () => void;
}>;

const ICON_CANDIDATE_SELECTOR = 'img,source,image,[style]';
const OBSERVER_OPTIONS: MutationObserverInit = {
  attributeFilter: ['href', 'src', 'srcset', 'style', 'xlink:href'],
  attributes: true,
  childList: true,
  subtree: true,
};

export function createCustomInjectionRepositoryIcons(
  walletIcons: Readonly<Record<string, ICustomInjectionWalletIconInfo>>,
): ICustomInjectionRepositoryIcon[] {
  return Object.entries(walletIcons).reduce<ICustomInjectionRepositoryIcon[]>(
    (icons, [key, icon]) => {
      icons.push(
        {
          key,
          label: icon.text,
          source: icon.icon,
          sourceKind: 'inline',
        },
        {
          key,
          label: icon.text,
          source: icon.iconUrl,
          sourceKind: 'asset',
        },
        ...(icon.autoReviewIconUrls ?? []).map((source) => ({
          key,
          label: icon.text,
          source,
          sourceKind: 'asset' as const,
        })),
      );
      return icons;
    },
    [],
  );
}

// Keep this decision deterministic and local. Do not add LLM, remote
// classification, or network-backed heuristics to the automatic review path.
function elementSourceValues(element: Element): string[] {
  const values = [
    element.getAttribute('href'),
    element.getAttribute('src'),
    element.getAttribute('srcset'),
    element.getAttribute('style'),
    element.getAttribute('xlink:href'),
  ];

  if (typeof HTMLImageElement !== 'undefined' && element instanceof HTMLImageElement) {
    values.push(element.currentSrc, element.src, element.srcset);
  }
  if (typeof SVGImageElement !== 'undefined' && element instanceof SVGImageElement) {
    values.push(element.href?.baseVal);
  }
  if (element instanceof HTMLElement) {
    values.push(element.style.backgroundImage);
  }

  return values.filter((value): value is string => Boolean(value));
}

function detectRepositoryIcon(
  element: Element,
  icons: readonly ICustomInjectionRepositoryIcon[],
): ICustomInjectionIconDetection | null {
  if (!element.matches(ICON_CANDIDATE_SELECTOR)) {
    return null;
  }
  const values = elementSourceValues(element);
  const icon = icons.find(({ source }) =>
    values.some((value) => value === source || value.includes(source)),
  );
  return icon
    ? {
        iconKey: icon.key,
        iconLabel: icon.label,
        sourceKind: icon.sourceKind,
      }
    : null;
}

export function installCustomInjectionAutoReviewObserver({
  icons,
  onDetected,
}: IInstallCustomInjectionAutoReviewObserverOptions): () => void {
  const repositoryIcons = icons.filter(
    (icon) => Boolean(icon.key) && Boolean(icon.label) && Boolean(icon.source),
  );
  const observers = new Set<MutationObserver>();
  const observedRoots = new WeakSet<Node>();
  let stopped = false;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    window.removeEventListener('DOMContentLoaded', start);
    observers.forEach((observer) => observer.disconnect());
    observers.clear();
  };

  const reportElement = (element: Element): boolean => {
    const detection = detectRepositoryIcon(element, repositoryIcons);
    if (!detection) return false;
    stop();
    onDetected(detection);
    return true;
  };

  const scanElement = (element: Element): boolean => {
    if (reportElement(element)) return true;
    if (element.shadowRoot && observeRoot(element.shadowRoot)) return true;

    for (const descendant of Array.from(element.querySelectorAll('*'))) {
      if (reportElement(descendant)) return true;
      if (descendant.shadowRoot && observeRoot(descendant.shadowRoot)) {
        return true;
      }
    }
    return false;
  };

  const handleMutations = (records: MutationRecord[]) => {
    for (const record of records) {
      if (record.type === 'attributes') {
        if (record.target instanceof Element && scanElement(record.target)) {
          return;
        }
        continue;
      }
      for (const node of Array.from(record.addedNodes)) {
        if (node instanceof Element && scanElement(node)) {
          return;
        }
      }
    }
  };

  function observeRoot(root: Element | ShadowRoot): boolean {
    if (stopped || observedRoots.has(root)) return false;
    observedRoots.add(root);
    const observer = new MutationObserver(handleMutations);
    observer.observe(root, OBSERVER_OPTIONS);
    observers.add(observer);

    if (root instanceof Element) {
      return scanElement(root);
    }
    for (const child of Array.from(root.children)) {
      if (scanElement(child)) return true;
    }
    return false;
  }

  function start() {
    if (stopped || !document.documentElement) return;
    observeRoot(document.documentElement);
  }

  if (document.documentElement) {
    start();
  } else {
    window.addEventListener('DOMContentLoaded', start, { once: true });
  }

  return stop;
}

export function installCustomInjectionAutoReview({
  icons,
  onReport,
}: IInstallCustomInjectionAutoReviewOptions): ICustomInjectionAutoReviewController {
  let activeToken = '';
  let lastReportedToken = '';
  let observerGeneration = 0;
  let pendingDetection: ICustomInjectionIconDetection | null = null;
  let stopObserver: () => void = () => undefined;
  let stopped = false;

  const reportIfReady = () => {
    if (!activeToken || activeToken === lastReportedToken || !pendingDetection) {
      return;
    }
    lastReportedToken = activeToken;
    onReport({
      token: activeToken,
      detection: pendingDetection,
    });
  };

  const installObserver = ({ resetDetection }: { resetDetection: boolean }) => {
    stopObserver();
    observerGeneration += 1;
    const generation = observerGeneration;
    if (resetDetection) {
      pendingDetection = null;
    }
    stopObserver = installCustomInjectionAutoReviewObserver({
      icons,
      onDetected: (detection) => {
        if (stopped || generation !== observerGeneration) {
          return;
        }
        pendingDetection = detection;
        reportIfReady();
      },
    });
  };

  installObserver({ resetDetection: false });

  return {
    configure: (token) => {
      if (stopped || !token || token === activeToken) {
        return;
      }
      const shouldRearm = Boolean(activeToken);
      activeToken = token;
      if (shouldRearm) {
        installObserver({ resetDetection: true });
      } else {
        reportIfReady();
      }
    },
    stop: () => {
      if (stopped) {
        return;
      }
      stopped = true;
      observerGeneration += 1;
      stopObserver();
    },
  };
}

import {
  HYPERLIQUID_HOSTNAME,
  IS_BUILT_IN_PERP_STORAGE_KEY,
  IS_BUILT_IN_PERP_URL_QUERY,
} from './consts';

function isBuiltInHyperLiquidUrlFn() {
  return (
    window.location.hostname === HYPERLIQUID_HOSTNAME &&
    window.location.search.includes(IS_BUILT_IN_PERP_URL_QUERY)
  );
}

function saveIsBuiltInPerpStatusToSession() {
  window.sessionStorage.setItem(IS_BUILT_IN_PERP_STORAGE_KEY, 'true');
}

let isBuiltInHyperLiquidSiteResult: boolean | undefined;
function isBuiltInHyperLiquidSite() {
  if (isBuiltInHyperLiquidSiteResult === undefined) {
    const result = Boolean(
      isBuiltInHyperLiquidUrlFn() || window.sessionStorage.getItem(IS_BUILT_IN_PERP_STORAGE_KEY),
    );
    if (result) {
      saveIsBuiltInPerpStatusToSession();
    }
    isBuiltInHyperLiquidSiteResult = result;
  }
  return isBuiltInHyperLiquidSiteResult;
}

export default {
  isBuiltInHyperLiquidSite,
};

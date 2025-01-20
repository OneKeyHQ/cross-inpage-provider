import normal from './normal';
import nestedArray from './nestedArray';
import bigdata from './bigdata';

import permit from './permit';
import permitSingle from './permitSingle';
import permitBatch from './permitBatch';
import permitTransferFrom from './permitTransferFrom';
import permitBatchTransferFrom from './permitBatchTransferFrom';
import permitWitnessTransferFrom from './permitWitnessTransferFrom';

import order from './order';
import orderComponents from './orderComponents';

import openseaOrder from './openseaOrder';
import oneInchOrder from './oneInchOrder';
import cowswapOrder from './cowswapOrder';
import safeMultiSig from './safeMultiSig';
import permitToEOA from './permitToEOA';
import permitInfiniteAmount from './permitInfiniteAmount';
import permitForever from './permitForever';
import permit2 from './permit2';
import permit2ToEOA from './permit2ToEOA';
import unknownType from './unknownType';

import permitNew from './permitNew';
import permitBatchNew from './permitBatchNew';
import safeMultiSigNew from './safeMultiSigNew';

import type {IEIP712Params} from '../../types';

export default (params: IEIP712Params) => [
  normal(params),
  permitWitnessTransferFrom(params),
  nestedArray(params),
  bigdata(params),
  permit(params),
  permitSingle(params),
  permitBatch(params),
  permitTransferFrom(params),
  permitBatchTransferFrom(params),
  order(params),
  orderComponents(params),
  openseaOrder(params),
  oneInchOrder(params),
  cowswapOrder(params),
  safeMultiSig(params),
  permitToEOA(params),
  permitInfiniteAmount(params),
  permitForever(params),
  permit2(params),
  permit2ToEOA(params),
  unknownType(params),
  permitNew(params),
  permitBatchNew(params),
  safeMultiSigNew(params),
];

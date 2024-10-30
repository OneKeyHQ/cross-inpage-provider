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
];

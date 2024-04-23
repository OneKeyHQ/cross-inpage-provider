export type Selector = string;
export type FindResultType = {
  iconNode: HTMLElement;
  textNode: Text;
};
export type ConstraintFn = (ele: HTMLElement) => boolean;

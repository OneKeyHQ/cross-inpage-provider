export type Selector = string;
export type FindResultType = {
  iconNode: HTMLElement | null;
  textNode: Text;
};
export type ConstraintFn = (ele: HTMLElement) => boolean;

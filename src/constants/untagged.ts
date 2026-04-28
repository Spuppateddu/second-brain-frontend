export const UNTAGGED_TAG_ID = -1;

export function isUntaggedTag(tagId: number): boolean {
  return tagId === UNTAGGED_TAG_ID;
}

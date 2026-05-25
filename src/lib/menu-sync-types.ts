import type { ExtraList } from "@/lib/extra-lists";
import type { AdminMenuCategory, AdminMenuItem, AdminMenuList } from "@/lib/types";

export type MenuSyncBundle = {
  categories: AdminMenuCategory[];
  items: AdminMenuItem[];
  menuLists: AdminMenuList[];
  extraLists: ExtraList[];
};

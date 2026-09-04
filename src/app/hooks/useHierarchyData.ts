import { useMemo } from "react";
import { Fact } from "@/app/types";

export function useHierarchyData(data: Fact[]) {
  return useMemo(() => {
    if (!data || data.length === 0)
      return { syntheticRoot: null, crossLinks: [] };

    const nodeMap = new Map<number, Fact & { childrenNodes: any[] }>();
    data.forEach((item) => {
      if (item.id) nodeMap.set(item.id, { ...item, childrenNodes: [] });
    });

    const childVisited = new Set<number>();
    const crossLinks: { sourceId: number; targetId: number }[] = [];

    data.forEach((item) => {
      if (!item.id) return;
      const parentNode = nodeMap.get(item.id)!;

      if (Array.isArray(item.children)) {
        item.children.forEach((link) => {
          const childId = link.child_id;
          if (childId && nodeMap.has(childId)) {
            if (!childVisited.has(childId)) {
              parentNode.childrenNodes.push(nodeMap.get(childId));
              childVisited.add(childId);
            } else {
              crossLinks.push({ sourceId: item.id!, targetId: childId });
            }
          }
        });
      }
    });

    const rootNodes = Array.from(nodeMap.values()).filter(
      (node) => !childVisited.has(node.id!),
    );

    const syntheticRoot = {
      id: -1,
      title: "Root",
      childrenNodes: rootNodes,
    };

    return { syntheticRoot, crossLinks };
  }, [data]);
}

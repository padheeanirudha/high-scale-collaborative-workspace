import type { Issue } from "../types/issue";

export const mockIssues: Issue[] = [
  {
    id: "1",
    title: "Build issue list",
    description: "Create the initial issue list UI",
    status: "todo",
  },
  {
    id: "2",
    title: "Add search",
    description: "Allow users to search issues",
    status: "in-progress",
  },
  {
    id: "3",
    title: "Create issue form",
    description: "Allow users to create new issues",
    status: "done",
  },
];
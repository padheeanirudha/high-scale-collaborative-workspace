import type { Issue } from "../types/issue";

const now = Date.now();

export const mockIssues: Issue[] = [
  { id: "1", title: "Build issue list", description: "Create the initial issue list UI", status: "todo", priority: "medium", assignee: "Maya Chen", labels: ["frontend"], updatedAt: now - 1000 * 60 * 60 * 2 },
  { id: "2", title: "Add search", description: "Allow users to search issues", status: "in-progress", priority: "high", assignee: "Jordan Lee", labels: ["discovery"], updatedAt: now - 1000 * 60 * 60 * 5 },
  { id: "3", title: "Create issue form", description: "Allow users to create new issues", status: "done", priority: "low", assignee: "Sam Rivera", labels: ["workflow"], updatedAt: now - 1000 * 60 * 60 * 9 },
];

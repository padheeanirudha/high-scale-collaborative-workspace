import type { Issue } from "../types/issue";

interface IssueDetailProps {
  issue: Issue | null;
}

export function IssueDetail({ issue }: IssueDetailProps) {
  if (!issue) {
    return (
      <section>
        <p>Select an issue to view its details.</p>
      </section>
    );
  }

  return (
    <section>
      <h2>{issue.title}</h2>
      <p>{issue.description}</p>
      <p>Status: {issue.status}</p>
    </section>
  );
}
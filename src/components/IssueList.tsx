import type { Issue } from "../types/issue";

interface IssueListProps {
  issues: Issue[];
  selectedIssueId: string | null;
  onSelectIssue: (issueId: string) => void;
}

export function IssueList({
  issues,
  selectedIssueId,
  onSelectIssue,
}: IssueListProps) {
  return (
    <section>
      <h2>Issues</h2>

      {issues.map((issue) => (
        <button
          key={issue.id}
          onClick={() => onSelectIssue(issue.id)}
          style={{
            display: "block",
            width: "100%",
            padding: "12px",
            marginBottom: "8px",
            textAlign: "left",
            fontWeight: issue.id === selectedIssueId ? "bold" : "normal",
          }}
        >
          <div>{issue.title}</div>
          <small>{issue.status}</small>
        </button>
      ))}
    </section>
  );
}
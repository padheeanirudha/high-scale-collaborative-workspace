import { useState } from "react";
import { IssueList } from "./components/IssueList";
import { IssueDetail } from "./components/IssueDetail";
import { IssueForm } from "./components/IssueForm";
import { mockIssues } from "./data/mockIssues";
import type { Issue } from "./types/issue";

function App() {
  const [issues, setIssues] = useState<Issue[]>(mockIssues);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const selectedIssue =
    issues.find((issue) => issue.id === selectedIssueId) ?? null;

  function handleCreateIssue(issue: Issue) {
    setIssues((currentIssues) => [...currentIssues, issue]);
  }

  return (
    <main>
      <h1>Collaborative Workspace</h1>

      <IssueForm onCreateIssue={handleCreateIssue} />

      <IssueList
        issues={issues}
        selectedIssueId={selectedIssueId}
        onSelectIssue={setSelectedIssueId}
      />

      <IssueDetail issue={selectedIssue} />
    </main>
  );
}

export default App;
import { useState } from "react";
import { IssueList } from "./components/IssueList";
import { IssueDetail } from "./components/IssueDetail";
import { mockIssues } from "./data/mockIssues";
import type { Issue } from "./types/issue";

function App() {
  const [issues] = useState<Issue[]>(mockIssues);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const selectedIssue =
    issues.find((issue) => issue.id === selectedIssueId) ?? null;

  return (
    <main>
      <h1>Collaborative Workspace</h1>

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
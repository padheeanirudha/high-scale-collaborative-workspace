import { useState } from "react";
import type { Issue } from "../types/issue";

interface IssueFormProps {
  onCreateIssue: (issue: Issue) => void;
}

export function IssueForm({ onCreateIssue }: IssueFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!title.trim()) return;

    const newIssue: Issue = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      status: "todo",
    };

    onCreateIssue(newIssue);

    setTitle("");
    setDescription("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create issue</h2>

      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Issue title"
      />

      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Description"
      />

      <button type="submit">Create</button>
    </form>
  );
}
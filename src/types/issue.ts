export type IssueStatus = "todo" | "in-progress" | "done";

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
}
export type FactReaction = {
  id?: number;
  reaction?: string;
  insight_id?: number;
  summary_id?: number;
  user_id: number;
};

export type FactComment = {
  id?: number;
  comment?: string;
  summary_id?: number;
  insight_id?: number;
  user_id?: number;
  user?: User;
};

export type Follower = {
  id: number;
};

export type User = {
  id?: number; // TODO: replace id? fields with base types without ID for creation & then plain types with id
  username: string;
  email: string;
  avatar_uri?: string;
  token?: string;
  enable_email_notifications?: boolean;
};

export type Indexable = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type Fact = Indexable & {
  id?: number;
  uid?: string;
  title?: string;
  parent_id?: number | null; // Direct parent reference
  user_id?: number;
  created_at?: string;
  updated_at?: string;
};

export type Link = Fact & {
  url: string;
  imageUrl?: string;
  logo_uri?: string;
  source_baseurl?: string;
  source: Source;
};

export type EvidenceRecord = {
  id?: number;
  summary_id?: number;
};

export type InsightEvidence = EvidenceRecord & {
  summary_id: number;
  summary: Link;
  insight_id: number;
  insight: Insight;
  comments?: FactComment[];
  reactions?: FactReaction[];
  source: Source;
};

export type InsightLink = {
  id?: number;
  child_id: number;
  parent_id: number;

  parentInsight?: Insight;
  childInsight?: Insight;
};

export type Insight = Fact & {
  description?: string;
  evidence?: InsightEvidence[];
  reactions?: FactReaction[];
  comments?: FactComment[];
  is_public?: boolean;
  username?: string;
  avatar_uri?: string;
  user_id?: number;
  parents: InsightLink[];
  children: InsightLink[];
  parent_uids?: string[];
};

export type Source = {
  id?: number;
  baseurl?: string;
  logo_uri?: string;
};

export type ServerFunction<T> = (
  input: T,
  token: string,
) => Promise<FLVResponse | FLVResponse[] | void>;

export type FactsListViewAction = {
  className: string;
  text: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleOnClick: (input?: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serverFunction: ServerFunction<any>;
  enabled: boolean;
};

export type FLVResponse = {
  id?: number;
  action: -1 | 0 | 1;
  facts: Fact[];
};

export type CommentSelectedText = {
  text: string;
  commentId: number;
};

export type WithPartial<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

export type Field = {
  id?: number;
  name: string;
  use_count?: number;
};

export type FieldValue = {
  id?: number;
  field_id?: number;
  value: string;
};

export type Note = {
  id?: number;
  text: string;
  field_values?: (FieldValue & Field)[];
  datetime?: string;
  emoji?: string;
};

export type CookieUser = {
  email: string;
  token: string;
};

export type Session = {
  id: number;
  token: string;
  user_id: number;
  expires: Date | string;
};

export type Workflow = {
  id: number;
  name: string;
  user: User;
  nodes: WorkflowNode[];
  created_at?: string;
  updated_at?: string;
};

export type WorkflowNodeLink = {
  id?: number;
  child_id: number;
  parent_id: number;

  parentNode?: WorkflowNode;
  childNode?: WorkflowNode;
};

export type WorkflowNode = {
  id: number;
  workflow_id?: number;
  workflow?: Workflow;
  parents?: WorkflowNodeLink[];
  children?: WorkflowNodeLink[];
};

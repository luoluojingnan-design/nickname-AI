export interface NicknameResult {
  nickname: string;
  explanation: string;
  emoji: string;
  style: string;
}

export enum RelationshipType {
  BestFriend = "死党/闺蜜",
  Partner = "另一半 (CP)",
  Colleague = "打工人/同事",
  Parent = "长辈/父母",
  Sibling = "兄弟姐妹",
  Child = "萌娃/孩子",
  Friend = "普通朋友",
  Other = "其他"
}

export enum VibeType {
  Funny = "搞笑逗比",
  Cute = "软萌可爱",
  Cool = "酷炫狂霸",
  InsideJoke = "玩梗/谐音",
  Professional = "正经工作",
  Random = "听天由命 (惊喜)"
}

export interface GenerationParams {
  name: string;
  relationship: RelationshipType;
  vibe: VibeType;
  trait?: string; // Optional extra context
}

export interface HistoryItem extends NicknameResult {
  id: string;
  originalName: string;
  relationship: string;
  timestamp: number;
}
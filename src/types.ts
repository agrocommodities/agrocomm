export interface State {
  abbr: string;
  name: string;
  flag?: string;
}

export interface News {
  title: string;
  url: string;
  source: string;
  summary?: string;
  imageUrl?: string;
}
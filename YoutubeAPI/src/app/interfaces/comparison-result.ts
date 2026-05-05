import { Youtuber } from "./youtuber";

export interface ComparisonResult {
  property: keyof Youtuber;
  status: 'correct' | 'higher' | 'lower' | 'wrong';
  actualValue: any;
}
export interface Youtuber {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  joinedYear: number;     
  subCount: number;       
  totalViews: number;      
  videoCount: number;      
  description: string;     
  topVideoId?: string;     
}
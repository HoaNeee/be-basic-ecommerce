export interface TrackedItem {
  action: string; // click, view, search, etc.
  value: string;
  type_track: string;
  timestamp?: Date;
}

export interface SuggestionItem {
  title: string;
  value: string;
  type?: string;
  priority?: number;
}

export interface SuggestionResponse {
  code: number;
  message: string;
  data?: {
    data: any;
    data_type?: string;
    suggestions: SuggestionItem[];
  };
}

export interface TrackSuggestionRequest {
  action: string;
  value: string;
  type_track: string;
}

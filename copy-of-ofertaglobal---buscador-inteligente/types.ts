
export enum SearchMode {
  RETAIL = 'RETAIL',
  WHOLESALE = 'WHOLESALE',
  COUPONS = 'COUPONS'
}

export enum SortOrder {
  RELEVANCE = 'RELEVANCE',
  PRICE_LOW = 'PRICE_LOW',
  PRICE_HIGH = 'PRICE_HIGH'
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface DealResult {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  discountPercentage?: string;
  store: string;
  url: string;
  description: string;
  isVerified: boolean;
  reliabilityScore: 'High' | 'Medium' | 'Checking';
  type: SearchMode;
  imageUrl?: string;
  hasFreeShipping?: boolean;
  isHistoricalLow?: boolean;
}

export interface SearchState {
  query: string;
  location: string;
  mode: SearchMode;
  sortOrder: SortOrder;
  loading: boolean;
  results: DealResult[];
  sources: GroundingSource[];
  error: string | null;
}


export interface FormState {
  incomingLetter: string;
  incomingFile?: {
    name: string;
    data: string; // Base64 string without header
    mimeType: string;
  } | null;
  pointsToConsider: string;
  contractClauses: string;
  verbosity: 'concise' | 'elaborated';
}

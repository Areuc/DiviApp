
export interface BillItem {
  id: string;
  name: string;
  price: number;
  assignedTo: string[]; // Array of participant IDs
}

export interface Participant {
  id: string;
  name: string;
}

export enum AppState {
  UPLOADING = 'UPLOADING',
  EDITING = 'EDITING',
  SUMMARY = 'SUMMARY',
}
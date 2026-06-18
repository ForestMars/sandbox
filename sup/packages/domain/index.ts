// Define the output contract
export interface OutputPort {
  write(text: string): Promise<void>;
}

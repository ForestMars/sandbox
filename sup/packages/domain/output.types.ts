export interface OutputPort {
  send(text: string): Promise<void>;
}

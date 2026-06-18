/**
 * @file packages/domain/src/output-port.ts
 */

export interface OutputPort {
  /**
   * Dispatches an agent step to the outside world.
   */
  dispatch(step: any): Promise<void> | void;  //👺
}

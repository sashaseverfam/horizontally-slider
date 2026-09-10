export interface IWindowSize {
  width: number;
  height: number;
  innerHeight: number;
  innerWidth: number;
}

export type WindowMediaRecords = Record<
  WindowMediaKeyType,
  WindowMediaMaxWidthType
>;
export type WindowMediaKeyType =
  | 'mobile'
  | 'tablet'
  | 'desktop'
  | 'wide'
  | 'xWide';
export type WindowMediaMaxWidthType = number;

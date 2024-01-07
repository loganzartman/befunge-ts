import {DebugInfo} from '@/sandbox/metrics/debugInfo';
import {Heatmap} from '@/sandbox/metrics/heatmap';

export class Metrics {
  debugInfo?: DebugInfo;
  heatmap?: Heatmap;

  constructor(params: {debugInfo?: DebugInfo; heatmap?: Heatmap}) {
    this.debugInfo = params.debugInfo;
    this.heatmap = params.heatmap;
  }

  reset() {
    this.debugInfo?.reset();
    this.heatmap?.reset();
  }

  record(pos: number) {
    this.heatmap?.bump(pos);
  }
}

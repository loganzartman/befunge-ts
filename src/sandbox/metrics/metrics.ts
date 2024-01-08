import {DebugInfo} from '@/sandbox/metrics/debugInfo';
import {Heatmap} from '@/sandbox/metrics/heatmap';
import {Trace} from '@/sandbox/metrics/trace';

export class Metrics {
  debugInfo?: DebugInfo;
  heatmap?: Heatmap;
  trace?: Trace;

  constructor(params: {
    debugInfo?: DebugInfo;
    heatmap?: Heatmap;
    trace?: Trace;
  }) {
    this.debugInfo = params.debugInfo;
    this.heatmap = params.heatmap;
    this.trace = params.trace;
  }

  reset() {
    this.debugInfo?.reset();
    this.heatmap?.reset();
    this.trace?.reset();
  }

  record(pos: number) {
    this.heatmap?.bump(pos);
    this.trace?.record(pos);
  }
}

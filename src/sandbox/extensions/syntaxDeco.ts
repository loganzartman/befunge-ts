import {highlightingFor} from '@codemirror/language';
import {Tag, tags} from '@lezer/highlight';
import {
  Decoration,
  DecorationSet,
  EditorView,
  RangeSetBuilder,
} from '@uiw/react-codemirror';

import {impossible} from '@/lib/impossible';
import {Instruction, InstructionType} from '@/lib/instructions';
import {MetricsRecorder} from '@/sandbox/metrics/metricsRecorder';

function getTags(inst: Instruction): Tag[] {
  if (inst.type === InstructionType.noop) return [];
  if (inst.type === InstructionType.add) return [tags.arithmeticOperator];
  if (inst.type === InstructionType.subtract) return [tags.arithmeticOperator];
  if (inst.type === InstructionType.multiply) return [tags.arithmeticOperator];
  if (inst.type === InstructionType.divide) return [tags.arithmeticOperator];
  if (inst.type === InstructionType.mod) return [tags.arithmeticOperator];
  if (inst.type === InstructionType.not) return [tags.logicOperator];
  if (inst.type === InstructionType.greater) return [tags.compareOperator];
  if (inst.type === InstructionType.right) return [tags.controlKeyword];
  if (inst.type === InstructionType.down) return [tags.controlKeyword];
  if (inst.type === InstructionType.left) return [tags.controlKeyword];
  if (inst.type === InstructionType.up) return [tags.controlKeyword];
  if (inst.type === InstructionType.random) return [tags.controlKeyword];
  if (inst.type === InstructionType.branchHorizontal)
    return [tags.controlKeyword];
  if (inst.type === InstructionType.branchVertical)
    return [tags.controlKeyword];
  if (inst.type === InstructionType.toggleString) return [tags.string];
  if (inst.type === InstructionType.duplicate) return [tags.operator];
  if (inst.type === InstructionType.swap) return [tags.operator];
  if (inst.type === InstructionType.pop) return [tags.operator];
  if (inst.type === InstructionType.outputNumber) return [tags.operator];
  if (inst.type === InstructionType.outputChar) return [tags.operator];
  if (inst.type === InstructionType.skip) return [tags.controlKeyword];
  if (inst.type === InstructionType.get) return [tags.operator];
  if (inst.type === InstructionType.put) return [tags.operator];
  if (inst.type === InstructionType.readNumber) return [tags.operator];
  if (inst.type === InstructionType.readChar) return [tags.operator];
  if (inst.type === InstructionType.exit) return [tags.controlKeyword];
  if (inst.type === InstructionType.pushLiteral) {
    if (typeof inst.value === 'number') return [tags.number];
    if (typeof inst.value === 'string') return [tags.string];
    return [tags.literal];
  }

  impossible(inst.type);
  return [];
}

export function syntaxDeco(
  view: EditorView,
  metrics: MetricsRecorder,
): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();

  for (let pos = 0; pos < metrics.length; pos++) {
    const inst = metrics.instructions[pos];
    let instTags;
    if (inst === 'multiple') {
      instTags = [tags.meta];
    } else if (inst === 'none') {
      instTags = [tags.comment];
    } else {
      instTags = getTags(inst);
    }
    builder.add(
      pos,
      pos + 1,
      Decoration.mark({
        class: highlightingFor(view.state, instTags) ?? '',
      }),
    );
  }

  return builder.finish();
}

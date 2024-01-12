import {EditorView, StateEffect, StateField} from '@uiw/react-codemirror';
import {StateUpdater, useCallback, useRef, useState} from 'preact/hooks';

export function useStateField<S>(
  view: EditorView | undefined,
  initialState: S | (() => S),
): [S, StateUpdater<S>, StateField<S>] {
  const viewRef = useRef(view);
  const [state, setState] = useState(initialState);
  const [stateEffect] = useState(() => StateEffect.define<S>());
  const [stateField] = useState(() =>
    StateField.define({
      create() {
        return state;
      },
      update(value, tr) {
        for (const e of tr.effects) {
          if (e.is(stateEffect)) {
            value = e.value;
          }
        }
        return value;
      },
    }),
  );

  const updateState = useCallback(
    (view: EditorView, value: S) => {
      view.dispatch({
        effects: stateEffect.of(value),
      });
    },
    [stateEffect],
  );

  const setStateWrapped = useCallback(
    (value: S | ((prevState: S) => S)) => {
      setState((prevState: S) => {
        if (value instanceof Function) {
          value = value(prevState);
        }
        if (view) updateState(view, value);
        return value;
      });
    },
    [updateState, view],
  );

  if (view !== viewRef.current) {
    viewRef.current = view;
    if (view) updateState(view, state);
  }

  return [state, setStateWrapped, stateField];
}

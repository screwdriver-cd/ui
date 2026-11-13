import { useEffect, useRef } from 'react';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab
} from '@codemirror/commands';
import { yaml } from '@codemirror/lang-yaml';
import { bracketMatching, indentOnInput } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import styles from '../validator.module.scss';
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  keymap,
  lineNumbers
} from '@codemirror/view';

interface YamlEditorProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

/**
 * CodeMirror 6 YAML editor.
 *
 * IME safety: CodeMirror edits the DOM live while a composition is running, so
 * (1) we never push a React value into the document while `view.composing`,
 * which would cancel the composition, and (2) `onChange` is only emitted once
 * the composition has finished, so the validator never runs on half-typed
 * candidates. The final text is emitted from the compositionend handler.
 */
export function YamlEditor({ value, onChange, label }: YamlEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const emitted = useRef(value);
  const latestValue = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
    latestValue.current = value;
  });

  useEffect(() => {
    if (!host.current) {
      return;
    }

    const emit = (view: EditorView) => {
      const text = view.state.doc.toString();

      if (text !== emitted.current) {
        emitted.current = text;
        onChangeRef.current(text);
      }
    };

    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: latestValue.current,
        extensions: [
          lineNumbers(),
          history(),
          drawSelection(),
          indentOnInput(),
          bracketMatching(),
          highlightActiveLine(),
          EditorState.tabSize.of(2),
          yaml(),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({
            'aria-label': label,
            'data-testid': 'yaml-editor-content'
          }),
          EditorView.updateListener.of(update => {
            if (update.docChanged && !update.view.compositionStarted) {
              emit(update.view);
            }
          }),
          EditorView.domEventHandlers({
            compositionend: (_event, v) => {
              // CodeMirror reads the composed text from the DOM just after this event.
              setTimeout(() => emit(v), 0);
            }
          })
        ]
      })
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // The editor is created once; `value` and `label` are synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // External changes (a chosen template, a reset). Never during composition.
  useEffect(() => {
    const view = viewRef.current;

    if (
      !view ||
      view.compositionStarted ||
      view.state.doc.toString() === value
    ) {
      return;
    }

    emitted.current = value;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value }
    });
  }, [value]);

  return (
    <div
      ref={host}
      className={styles.editor}
      data-testid="yaml-editor"
      style={{ height: '100%', minHeight: 0 }}
    />
  );
}

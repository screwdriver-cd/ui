import { act, fireEvent, render, screen } from '@testing-library/react';
import { EditorView } from '@codemirror/view';
import { YamlEditor } from './YamlEditor';

const viewOf = () =>
  EditorView.findFromDOM(screen.getByTestId('yaml-editor') as HTMLElement)!;
const type = (view: EditorView, text: string) =>
  act(() => {
    view.dispatch({ changes: { from: view.state.doc.length, insert: text } });
  });

describe('YamlEditor', () => {
  it('shows the value and reports typed changes', () => {
    const onChange = vi.fn();

    render(<YamlEditor value="a: 1" onChange={onChange} label="YAML" />);
    expect(viewOf().state.doc.toString()).toBe('a: 1');
    expect(screen.getByLabelText('YAML')).toBeInTheDocument();

    type(viewOf(), '\nb: 2');
    expect(onChange).toHaveBeenCalledWith('a: 1\nb: 2');
  });

  it('replaces the document when the value changes from outside', () => {
    const { rerender } = render(
      <YamlEditor value="a: 1" onChange={() => {}} label="YAML" />
    );

    rerender(<YamlEditor value="jobs: {}" onChange={() => {}} label="YAML" />);
    expect(viewOf().state.doc.toString()).toBe('jobs: {}');
  });

  it('does not emit half-composed text, and emits the final text after compositionend', async () => {
    vi.useFakeTimers();
    const onChange = vi.fn();

    try {
      render(<YamlEditor value="" onChange={onChange} label="YAML" />);
      const view = viewOf();

      fireEvent.compositionStart(view.contentDOM);
      expect(view.compositionStarted).toBe(true);

      type(view, 'に');
      type(view, 'ほ');
      expect(onChange).not.toHaveBeenCalled();

      fireEvent.compositionEnd(view.contentDOM);
      await act(async () => {
        vi.advanceTimersByTime(10);
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('にほ');
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not overwrite the document with a new prop while composing', () => {
    const { rerender } = render(
      <YamlEditor value="" onChange={() => {}} label="YAML" />
    );
    const view = viewOf();

    fireEvent.compositionStart(view.contentDOM);
    type(view, 'に');
    rerender(<YamlEditor value="stale" onChange={() => {}} label="YAML" />);

    expect(view.state.doc.toString()).toBe('に');
  });
});

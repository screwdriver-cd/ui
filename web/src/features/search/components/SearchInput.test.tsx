import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '~/test/render';
import { isImeEnter, SearchInput } from './SearchInput';

describe('SearchInput', () => {
  const setup = () => {
    const onSubmit = vi.fn();

    renderWithProviders(
      <SearchInput
        value="screw"
        onChange={() => {}}
        onSubmit={onSubmit}
        aria-label="q"
      />
    );

    return { onSubmit, input: screen.getByLabelText('q') };
  };

  it('submits on Enter and on the button', async () => {
    const { onSubmit, input } = setup();

    await userEvent.type(input, '{Enter}');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(onSubmit).toHaveBeenCalledWith('screw');
  });

  it('ignores the Enter that confirms an IME conversion', () => {
    const { onSubmit, input } = setup();

    // Chrome/Firefox: isComposing is true on that keydown.
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    // Safari: compositionend arrives first, keydown reports keyCode 229.
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });
    // Between compositionstart and compositionend.
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('isImeEnter only matches Enter', () => {
    expect(isImeEnter({ key: 'a', keyCode: 229 })).toBe(false);
    expect(
      isImeEnter({
        key: 'Enter',
        keyCode: 13,
        nativeEvent: { isComposing: false }
      })
    ).toBe(false);
    expect(
      isImeEnter({ key: 'Enter', nativeEvent: { isComposing: true } })
    ).toBe(true);
  });
});

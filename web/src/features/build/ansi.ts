import { AnsiUp } from 'ansi_up';

/**
 * HTML of a step's log lines, parsed in order by one parser so a colour opened on one line
 * carries on to the next (Ember shares one AnsiUp). Lines are parsed lazily up to the one asked
 * for; lines appended to the same log keep the work done so far, any other change starts over.
 * ansi_up escapes HTML, so the result is safe for innerHTML.
 */
export class AnsiLines {
  private lines: ReadonlyArray<{ m: string }> = [];
  private html: string[] = [];
  private au = AnsiLines.parser();

  private static parser() {
    const au = new AnsiUp();

    au.escape_html = true;

    return au;
  }

  get(lines: ReadonlyArray<{ m: string }>, index: number): string {
    if (lines !== this.lines) {
      const kept = this.html.length;
      const appended =
        kept > 0 &&
        lines.length >= kept &&
        lines[0] === this.lines[0] &&
        lines[kept - 1] === this.lines[kept - 1];

      if (!appended) {
        this.html = [];
        this.au = AnsiLines.parser();
      }
      this.lines = lines;
    }
    while (this.html.length <= index && this.html.length < lines.length) {
      this.html.push(this.au.ansi_to_html((lines[this.html.length] as { m: string }).m));
    }

    return this.html[index] ?? '';
  }
}

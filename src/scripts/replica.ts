import { formatReadout, speakDuration, type Kind } from './format';

const KINDS: Kind[] = ['studying', 'procrastinating'];
const TICK_SLOP = 15;

interface State {
  banked: Record<Kind, number>;
  selected: Kind;
  startedAt: number | null;
}

class Replica {
  private state: State;
  private tick: ReturnType<typeof setTimeout> | undefined;
  private readonly panels: Record<Kind, HTMLElement>;
  private readonly readouts: Record<Kind, HTMLElement>;
  private readonly labels: Record<Kind, string>;
  private readonly status: HTMLElement | null;
  private readonly play: HTMLButtonElement | null;
  private lastReadout = { studying: '', procrastinating: '' };

  constructor(private readonly root: HTMLElement) {
    const data = root.dataset;
    const selected =
      data.selected === 'procrastinating' ? 'procrastinating' : 'studying';
    this.state = {
      banked: {
        studying: Number(data.studyingMs ?? 0),
        procrastinating: Number(data.procrastinatingMs ?? 0),
      },
      selected,
      startedAt: data.playing === 'true' ? Date.now() : null,
    };
    this.panels = this.pick('[data-panel]', 'panel');
    this.readouts = this.pick('[data-readout]', 'readout');
    this.labels = {
      studying:
        this.panels.studying
          .querySelector('[data-label]')
          ?.textContent?.trim() ?? 'Studying',
      procrastinating:
        this.panels.procrastinating
          .querySelector('[data-label]')
          ?.textContent?.trim() ?? 'Procrastinating',
    };
    this.status = root.querySelector('[data-status]');
    this.play = root.querySelector('[data-play]');
    this.bind();
    this.sync();
  }

  private pick(selector: string, attribute: string): Record<Kind, HTMLElement> {
    const found = {} as Record<Kind, HTMLElement>;
    for (const kind of KINDS) {
      const element = this.root.querySelector<HTMLElement>(
        `${selector}[data-${attribute}="${kind}"]`,
      );
      if (!element)
        throw new Error(`Replica is missing ${attribute} for ${kind}`);
      found[kind] = element;
    }
    return found;
  }

  private bind() {
    for (const kind of KINDS) {
      this.panels[kind].addEventListener('click', () => this.select(kind));
    }
    this.play?.addEventListener('click', () => this.togglePlayPause());
    this.root
      .querySelector('[data-reset]')
      ?.addEventListener('click', () => this.reset());
    this.root
      .querySelector('[data-theme-toggle]')
      ?.addEventListener('click', () => this.toggleTheme());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.cancelTick();
      else this.sync();
    });
  }

  private get playing() {
    return this.state.startedAt !== null;
  }

  private elapsedSince(now: number) {
    const { startedAt } = this.state;
    if (startedAt === null) return 0;
    if (startedAt > now) {
      // The clock went backwards; re-anchor like the app's resyncClock.
      this.state = { ...this.state, startedAt: now };
      return 0;
    }
    return now - startedAt;
  }

  private total(kind: Kind, now: number) {
    return (
      this.state.banked[kind] +
      (kind === this.state.selected ? this.elapsedSince(now) : 0)
    );
  }

  private totals(now: number) {
    return {
      studying: this.total('studying', now),
      procrastinating: this.total('procrastinating', now),
    };
  }

  private bank(now: number): State {
    const { banked, selected } = this.state;
    return {
      banked: { ...banked, [selected]: this.total(selected, now) },
      selected,
      startedAt: null,
    };
  }

  private togglePlayPause() {
    const now = Date.now();
    if (this.playing) {
      this.state = this.bank(now);
      this.announce(`Paused. ${this.describe(now)}`);
    } else {
      this.state = { ...this.state, startedAt: now };
      this.announce(`Counting ${this.labels[this.state.selected]}.`);
    }
    this.sync();
  }

  private select(kind: Kind) {
    if (kind === this.state.selected) return;
    const now = Date.now();
    const wasPlaying = this.playing;
    const banked = this.bank(now);
    this.state = {
      ...banked,
      selected: kind,
      startedAt: wasPlaying ? now : null,
    };
    const other = KINDS.find((k) => k !== kind)!;
    this.announce(
      wasPlaying
        ? `Now counting ${this.labels[kind]}. ${this.labels[other]} paused at ${speakDuration(this.state.banked[other])}.`
        : `${this.labels[kind]} selected. Press play to start counting.`,
    );
    this.sync();
  }

  private reset() {
    this.state = {
      banked: { studying: 0, procrastinating: 0 },
      selected: this.state.selected,
      startedAt: null,
    };
    this.announce('Timers reset.');
    this.sync();
  }

  private toggleTheme() {
    const next = this.root.dataset.theme === 'dark' ? 'light' : 'dark';
    this.root.dataset.theme = next;
    this.announce(`${next === 'dark' ? 'Dark' : 'Light'} theme.`);
  }

  private describe(now: number) {
    const totals = this.totals(now);
    return `${this.labels.studying} ${speakDuration(totals.studying)}, ${this.labels.procrastinating} ${speakDuration(totals.procrastinating)}.`;
  }

  private announce(message: string) {
    if (this.status) this.status.textContent = message;
  }

  private sync() {
    this.cancelTick();
    this.render(Date.now());
    if (this.playing && !document.hidden) this.scheduleTick();
  }

  // Wake just after each second boundary, as the app does, instead of every frame.
  private scheduleTick() {
    const total = this.total(this.state.selected, Date.now());
    const next = 1000 - (total % 1000);
    this.tick = setTimeout(() => this.sync(), next + TICK_SLOP);
  }

  private cancelTick() {
    if (this.tick !== undefined) clearTimeout(this.tick);
    this.tick = undefined;
  }

  private render(now: number) {
    const readout = formatReadout(this.totals(now));
    for (const kind of KINDS) {
      if (readout[kind] !== this.lastReadout[kind]) {
        this.readouts[kind].textContent = readout[kind];
        this.lastReadout[kind] = readout[kind];
      }
      const selected = kind === this.state.selected;
      this.panels[kind].classList.toggle('is-selected', selected);
      this.panels[kind].setAttribute('aria-pressed', String(selected));
      const state = this.panels[kind].querySelector('[data-state]');
      if (state)
        state.textContent = selected
          ? this.playing
            ? 'counting'
            : 'paused'
          : 'paused';
    }
    this.root.dataset.playing = String(this.playing);
    if (this.play)
      this.play.setAttribute('aria-label', this.playing ? 'Pause' : 'Play');
  }
}

for (const root of document.querySelectorAll<HTMLElement>(
  '[data-timer-replica][data-interactive]',
)) {
  new Replica(root);
}

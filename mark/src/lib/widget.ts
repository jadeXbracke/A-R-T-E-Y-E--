// The home-screen widget's data feed.
//
// The widget is a separate process: it cannot reach the app's database, so
// the app hands it a small snapshot after every change. Writing that snapshot
// needs a native shared container (an iOS App Group / Android shared
// preferences), which only exists in a development or store build — in Expo
// Go and on the web the publish step is simply a no-op, so nothing here can
// break the app.
//
// See docs/widget.md for the native setup that consumes this.
import { Habit, Mark } from './types';
import { dueOn } from './habits';

/** Keep this shape in sync with the widget's decoder (docs/widget.md). */
export interface WidgetSnapshot {
  date: string;
  done: number;
  total: number;
  /** The habits still open today, longest-standing first, for the small list. */
  open: string[];
}

export const WIDGET_GROUP = 'group.com.mark.app.widget';
export const WIDGET_KEY = 'today';

export function buildSnapshot(habits: Habit[], marks: Mark[], date: string): WidgetSnapshot {
  const due = dueOn(habits, date, marks);
  const marked = new Set(marks.filter(m => m.date === date).map(m => m.habitId));
  return {
    date,
    done: due.filter(h => marked.has(h.id)).length,
    total: due.length,
    open: due.filter(h => !marked.has(h.id)).map(h => h.name),
  };
}

/**
 * Hand the snapshot to the widget. Silent no-op wherever the native shared
 * container is unavailable.
 */
export function publishSnapshot(snapshot: WidgetSnapshot): void {
  try {
    // Resolved lazily: the package is only present in a native build.
    const targets = require('@bacons/apple-targets') as {
      ExtensionStorage: new (group: string) => { set(key: string, value: string): void };
    } & { ExtensionStorage: { reloadWidget(): void } };
    const storage = new targets.ExtensionStorage(WIDGET_GROUP);
    storage.set(WIDGET_KEY, JSON.stringify(snapshot));
    targets.ExtensionStorage.reloadWidget();
  } catch {
    // No native container in this build — the app is unaffected.
  }
}

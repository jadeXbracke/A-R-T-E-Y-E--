# Home-screen widget

The app already publishes everything the widget needs (`src/lib/widget.ts`):
after every change on Today it writes a small snapshot — date, marks done,
marks due, and the names still open — into a shared container and asks the
widget to refresh.

What is left is the native half, which **cannot be built or verified in a
web/Expo Go environment**: a widget is a separate app extension and needs a
development build. Everything below is the setup for that build; treat the
Swift as a starting point to compile and iterate on, not as verified code.

## The snapshot contract

App Group: `group.com.mark.app.widget` · key: `today`

```json
{ "date": "2026-08-25", "done": 3, "total": 4, "open": ["Read 20 minutes"] }
```

## iOS (WidgetKit)

1. Install the target plugin and the shared-storage helper:

   ```bash
   npx expo install @bacons/apple-targets
   ```

2. Add to `app.json`, and register the App Group on the Apple Developer
   portal for both the app and the widget target:

   ```json
   {
     "plugins": [["@bacons/apple-targets", { "appleTeamId": "YOUR_TEAM_ID" }]],
     "ios": { "entitlements": { "com.apple.security.application-groups": ["group.com.mark.app.widget"] } }
   }
   ```

3. Create `targets/widget/expo-target.config.js`:

   ```js
   module.exports = { type: 'widget', name: 'MARK', entitlements: {
     'com.apple.security.application-groups': ['group.com.mark.app.widget'],
   } };
   ```

4. `targets/widget/index.swift` — the ring, in the app's own language:
   monochrome, one thin arc, no colour.

   ```swift
   import WidgetKit
   import SwiftUI

   struct Snapshot: Codable { let date: String; let done: Int; let total: Int; let open: [String] }

   struct Entry: TimelineEntry { let date: Date; let snapshot: Snapshot }

   struct Provider: TimelineProvider {
     private func read() -> Snapshot {
       let defaults = UserDefaults(suiteName: "group.com.mark.app.widget")
       guard let raw = defaults?.string(forKey: "today"),
             let data = raw.data(using: .utf8),
             let decoded = try? JSONDecoder().decode(Snapshot.self, from: data)
       else { return Snapshot(date: "", done: 0, total: 0, open: []) }
       return decoded
     }
     func placeholder(in context: Context) -> Entry { Entry(date: Date(), snapshot: read()) }
     func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) {
       completion(Entry(date: Date(), snapshot: read()))
     }
     func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
       // Refreshed on every app change; midnight keeps it honest overnight.
       let midnight = Calendar.current.startOfDay(for: Date().addingTimeInterval(86_400))
       completion(Timeline(entries: [Entry(date: Date(), snapshot: read())], policy: .after(midnight)))
     }
   }

   struct MarkWidgetView: View {
     var entry: Entry
     private var fraction: Double {
       entry.snapshot.total > 0 ? Double(entry.snapshot.done) / Double(entry.snapshot.total) : 0
     }
     var body: some View {
       ZStack {
         Circle().stroke(Color.primary.opacity(0.15), lineWidth: 3)
         Circle()
           .trim(from: 0, to: fraction)
           .stroke(Color.primary, style: StrokeStyle(lineWidth: 3, lineCap: .round))
           .rotationEffect(.degrees(-90))
         VStack(spacing: 2) {
           Text("\(entry.snapshot.done)/\(entry.snapshot.total)")
             .font(.system(size: 22, weight: .medium))
           Text("MARKS").font(.system(size: 8, weight: .medium)).kerning(2)
             .foregroundStyle(.secondary)
         }
       }
       .padding(10)
       .containerBackground(.background, for: .widget)
     }
   }

   @main
   struct MarkWidget: Widget {
     var body: some WidgetConfiguration {
       StaticConfiguration(kind: "MarkWidget", provider: Provider()) { MarkWidgetView(entry: $0) }
         .configurationDisplayName("MARK")
         .description("Today's ring.")
         .supportedFamilies([.systemSmall, .accessoryCircular])
     }
   }
   ```

5. Build and run on a device: `npx expo prebuild` then `npx expo run:ios`.

### Marking straight from the widget

Tapping a habit without opening the app needs an **App Intent** (iOS 17+):
add an `AppIntent` in the widget target that writes the toggle into the same
App Group, then have the app drain those pending toggles on next launch.
Worth doing only once the read-only widget is working.

## Android (Glance)

Same snapshot, read from shared preferences in a
`GlanceAppWidget`. Add `react-native-android-widget` or a small custom
module to write the value, and draw the ring with a `Canvas` composable.

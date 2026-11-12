# Landing page screenshots

The landing page (`apps/web/src/modules/site`) shows the real app in five WebP screenshots under `apps/web/public/site/`. Redo them when the app's UI changes. Use synthetic data only, never a real account or real tasks.

| File | View | Viewport |
| --- | --- | --- |
| `upcoming-desktop.webp` | Upcoming at the top, sidebar open, Overdue and Today visible | 1440×900 |
| `upcoming-phone.webp` | Upcoming at the top, drawer closed | 390×844 |
| `composer.webp` | Today with the inline composer open, a title, description, date and priority filled in | 1440×900, cropped to the list column |
| `today-overdue.webp` | Today with the Overdue section above today's tasks | 1440×900, cropped to the list column |
| `date-picker.webp` | The composer's date picker open with a typed date such as `fri` | 1440×900, cropped to the list column |

## Steps

1. Start the dev server (`bun run dev`) and create the sample user: `bun run --cwd apps/api dev:session` prints a session cookie for "Sample User" (see `docs/deploy-railway.md`, Local environment). Set that cookie for `localhost` in the browser.
2. Add a handful of believable tasks: two or three overdue, four due today (one with a description, some with times and priorities), and a few over the next days.
3. Open DevTools, turn on the device toolbar, set the viewport (table above) and DPR 2, then use "Capture screenshot" from the device toolbar menu. Leave the browser's scrollbar out of the frame.
4. Crop only to remove empty space or the browser's scrollbar (for example to the centered list column for the feature rows), never edit the content. Convert each PNG to WebP and check that it stays under about 200 KB:

   ```sh
   cwebp -q 90 -m 6 -sharp_yuv capture.png -o apps/web/public/site/<file>.webp
   ```

5. If a file's pixel size changed, update its `width` and `height` in `apps/web/src/modules/site/presentation/landing.constants.ts` to half the pixel size (the CSS size), and check the `alt` text still describes the picture.
6. Remove the sample data when done: `bun run --cwd apps/api dev:session --delete`.

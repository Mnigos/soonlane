# Changelog

Each release opens with a summary written for users; the list of changes under it is written by the release workflow from conventional commits.

## [0.1.0](https://github.com/Mnigos/soonlane/releases/tag/v0.1.0) - 2026-11-11

The first release of Soonlane, a personal task list built around the days ahead. It runs on the web and as a Mac app.

### Tasks

- Plan your days in Upcoming: a week strip, an Overdue section and one section per day that keeps loading as you scroll. Today shows only what is overdue and due today.
- Add a task from the sidebar or from the Add task row under any day. Type a date like "fri" or "14 Nov" in the date picker, and type p1 to p4 in the task name to set its priority.
- Repeat a task on a schedule, or give it a goal like 50 push-ups and log progress from its row.
- Edit, reschedule or delete a task from its "…" menu, move every overdue task to one day at once, and undo a completion.
- See what you finished today in a collapsed section above Overdue.

### Labels

- Tag tasks with labels while you add or edit them, and open a label from the sidebar to see its open tasks by day.
- Rename, recolor and delete labels from their menu in the sidebar.

### Calendar

- See your open tasks in Apple Calendar or another calendar app through a private link, which you can replace or revoke at any time.

### Mac app

- The Mac app shows your list in its own window and signs you in through your browser.
- Open Quick Add with ⌥Space from any app, and see on the Dock how many tasks are overdue or due today.

### Account and website

- Sign in with Google, and delete your account with all its tasks.
- A homepage, privacy policy and terms, a blog with an RSS feed, this changelog, and Privacy choices in the footer.

### Features › blog

- Add the blog with post pages, RSS feed and sitemap entries ([ecd46bc](https://github.com/Mnigos/soonlane/commit/ecd46bcc3439cdf579ef2ebe84ef16fe14a66096))
- Draw a share image for every post at build time ([f8d8162](https://github.com/Mnigos/soonlane/commit/f8d816232ae38cbef68e39b6a2c66db83238dcfd))
- Publish the Why Soonlane post ([9de2f84](https://github.com/Mnigos/soonlane/commit/9de2f84b8dade120d6df7b6f3bc11b647cd44d4f))

### Features › changelog

- List stable releases on a prerendered /changelog page ([7799b44](https://github.com/Mnigos/soonlane/commit/7799b44db1c91e98ebf7d15230dbad9497f0c0c5))

### Features › consent

- Offer Privacy choices in the site footer and link the policy ([611205a](https://github.com/Mnigos/soonlane/commit/611205a32e579a5753d06eeefb418bf2d793e721))

### Features › desktop

- Add the Electrobun macOS shell that loads the web app ([8e449ca](https://github.com/Mnigos/soonlane/commit/8e449cae3d35769cf508940c6d5ae709d0bb636f))
- Sign in through the system browser and a soonlane:// link ([38bb5d0](https://github.com/Mnigos/soonlane/commit/38bb5d040436bf2f6f27d42f71674e6c89fc23c8))
- Open Quick Add with a global shortcut and show today's count on the Dock ([2c73847](https://github.com/Mnigos/soonlane/commit/2c73847154875c3b3d8e82d18fa138b2ba556358))
- Open Quick Add from the File menu while Soonlane is in front ([a77bcc0](https://github.com/Mnigos/soonlane/commit/a77bcc046199f2c7de12b4f976bd4eda40276681))

### Features › identity

- Tell desktop users that sign-in arrives in the next update ([9f76983](https://github.com/Mnigos/soonlane/commit/9f769838af2d37a9f65c7fbc335fd9c24ce01728))
- Delete an account and all its tasks ([70c6041](https://github.com/Mnigos/soonlane/commit/70c6041d184ab58298c3ba869cdda81836ae70e8))
- Link the terms and privacy policy from the sign-in screen ([7731cb9](https://github.com/Mnigos/soonlane/commit/7731cb9985e4a8a14b5959bd8a8e9047c248da71))

### Features › labels

- Add per-user labels and assign them to tasks ([5d890f7](https://github.com/Mnigos/soonlane/commit/5d890f792fccb0bd86740bd00c818da84fb35bfb))
- Count open tasks per label ([f9ff66b](https://github.com/Mnigos/soonlane/commit/f9ff66b6106b30333525e35001ab4896aad26b69))
- Add the label route and the rename and delete mutations ([d7edaef](https://github.com/Mnigos/soonlane/commit/d7edaefa5c10fb947817447ca7f0252cd3f591fe))
- Show a label's open tasks at /labels/$name ([3c936a1](https://github.com/Mnigos/soonlane/commit/3c936a1e5140c6e757b4360e38ab2aa542906cfa))
- Change a label's color from its menu in the sidebar ([75383af](https://github.com/Mnigos/soonlane/commit/75383afa11d17f81cf81c1d40a47dbe7ac9b2af6))

### Features › shell

- Leave room for the traffic lights inside the desktop app ([94e4997](https://github.com/Mnigos/soonlane/commit/94e4997db749496d7d9e181cb2385695010a043d))
- Serve Upcoming at /app and Today at /app/today ([18c1a30](https://github.com/Mnigos/soonlane/commit/18c1a3071c09ae3b435b282663d215f3b436bf44))
- List labels in the sidebar ([a9d291a](https://github.com/Mnigos/soonlane/commit/a9d291accc14f94f715f006204bf1cf9a60192e9))

### Features › site

- Split public routes from session routes and prerender the homepage ([b433841](https://github.com/Mnigos/soonlane/commit/b4338412a3f5e145ac7dcb752b89b38d9b30db0e))
- Publish the privacy policy and terms ([ef9b068](https://github.com/Mnigos/soonlane/commit/ef9b0687c82bf255b20f3a03560026670f0b7deb))
- Add the site header, footer and Get started button ([efe0d74](https://github.com/Mnigos/soonlane/commit/efe0d743fb14aaace5375a660d6cc2680c0349c5))
- Build the full landing page with app screenshots ([bcbca3b](https://github.com/Mnigos/soonlane/commit/bcbca3bfa708af66c1aa9bcef5d61c92be11251a))
- Link the changelog from the site header and footer ([d637f9a](https://github.com/Mnigos/soonlane/commit/d637f9a08ad307d8f543c4faf5a0cf4e1289eeee))

### Features › tasks

- Navigate Upcoming by day and sync the week strip with the scroll ([5c370b8](https://github.com/Mnigos/soonlane/commit/5c370b809866df0edffe2f2f1652e1a74ba749f0))
- Add list, create, complete and uncomplete procedures ([fb37bb5](https://github.com/Mnigos/soonlane/commit/fb37bb5b22671825ce0bafd3e34dae785969ec85))
- Add tasks with quick add and complete them with undo ([6d17bb9](https://github.com/Mnigos/soonlane/commit/6d17bb9ab155f6cda17a5855b1ce547dafbb861e))
- Show the due date line like Todoist, colored by when it is due ([c1cb982](https://github.com/Mnigos/soonlane/commit/c1cb982f384875fe944b4dd153ad1835b72d110b))
- Replace quick add with Todoist's task composer card ([285be66](https://github.com/Mnigos/soonlane/commit/285be664ca8874839f07f3332fb22fcfb5690901))
- Add month grid, quick date and typed date helpers ([7f45023](https://github.com/Mnigos/soonlane/commit/7f45023e641643c26f1419718f1af90c68d75632))
- Open a Todoist date picker from the composer's date chip ([01870b3](https://github.com/Mnigos/soonlane/commit/01870b30e248e3deefe6b76a9058dde25c975283))
- Match Todoist's composer card, chips and priority menu ([103ace0](https://github.com/Mnigos/soonlane/commit/103ace0990cd9eceed30f5a33a6ddc503fdb3e2a))
- Match Todoist's date picker with scrolling months ([e5268d9](https://github.com/Mnigos/soonlane/commit/e5268d9048cea0dab08ffa98a435be0342798911))
- Dim the headings of days after today like Todoist ([587d1f0](https://github.com/Mnigos/soonlane/commit/587d1f0c528ffaf258167ccb4cb8bba19d228f6e))
- Keep loading upcoming days as the list scrolls ([d94b881](https://github.com/Mnigos/soonlane/commit/d94b88157252da007abc519c9547f9b76ba4100c))
- Edit a task in place from its row ([2e68daf](https://github.com/Mnigos/soonlane/commit/2e68daf2c0c0c0f876b09b8d1ccb81bc94a5ffdd))
- Reschedule every overdue task to a day in one action ([20eca31](https://github.com/Mnigos/soonlane/commit/20eca316479f6e28fa6828ac983eee812d50748e))
- Repeat tasks on a schedule like Todoist ([f5df382](https://github.com/Mnigos/soonlane/commit/f5df382dd51f1117c92fadd4390f3eca071cee8e))
- Save labels with a new task ([0eab801](https://github.com/Mnigos/soonlane/commit/0eab8019f73418c22bfa3f798b9778898a25a47f))
- Pick labels in the task composer ([34ec199](https://github.com/Mnigos/soonlane/commit/34ec19968a543a8ba7de29d64cb826f68d2440c6))
- Show labels on task rows ([ad25ca0](https://github.com/Mnigos/soonlane/commit/ad25ca04aff7be0eb6ac431659c29601f5127722))
- Drop the Reminders placeholder from the composer ([91c8969](https://github.com/Mnigos/soonlane/commit/91c896942bf62a319ca0470c68f7272c9b2566c2))
- Give a task a quantity goal and log progress from its row ([7b1bba6](https://github.com/Mnigos/soonlane/commit/7b1bba6388d1e2927e4383121455e130ff26a688))
- Move a repeating goal task to its next occurrence when the goal is reached ([54fac83](https://github.com/Mnigos/soonlane/commit/54fac83fc3ac81d492ac82e8f3d617dd0ef3f859))
- Show the tasks completed today in a collapsed section above Overdue ([a51edda](https://github.com/Mnigos/soonlane/commit/a51edda0e32e0ad41a3d9660784b0b7bd8775ff8))
- Delete a task from its row or the edit card after a confirmation ([9914f2f](https://github.com/Mnigos/soonlane/commit/9914f2f616fc281dbaa1dae95da82eddac5deb92))
- Change a task's labels when you edit it ([fa45455](https://github.com/Mnigos/soonlane/commit/fa4545527ee5f991540a5d8c1598598c9b0666f2))
- Show the chosen labels on the Labels chip in the task editor ([1a380ab](https://github.com/Mnigos/soonlane/commit/1a380ab47488fceebeb6fd2443211fc935e3545d))
- Set a task's priority by typing p1 to p4 in its name ([d954ff3](https://github.com/Mnigos/soonlane/commit/d954ff37f7f4575a1709ffad37a789e27489b513))
- Highlight the typed priority word in the task name ([8709b60](https://github.com/Mnigos/soonlane/commit/8709b60f00403876227638ef0413dd373a1df005))
- Change or remove a task's goal when you edit it ([941ca7f](https://github.com/Mnigos/soonlane/commit/941ca7f2d8df6aea408f677d93ed1ac864080dbc))
- Edit a task and set its date or priority from its "…" menu ([ba478d5](https://github.com/Mnigos/soonlane/commit/ba478d5b4c986f5758a2dca44036311e8966857b))
- Open a task's edit card from its "…" menu instead of a pencil button ([09a8b51](https://github.com/Mnigos/soonlane/commit/09a8b51b0083df4142430621a71e5061490a166c))
- Show your open tasks in Apple Calendar through a private link ([793171d](https://github.com/Mnigos/soonlane/commit/793171d987f28a5dbdf99cfa55cd36f8341c1887))

### Bug fixes › blog

- Line the share image logo up with the title ([915cb4e](https://github.com/Mnigos/soonlane/commit/915cb4e1bc710c91086fb473f43d2c78e0094787))

### Bug fixes › changelog

- Leave internal work out of the changelog ([2b6032c](https://github.com/Mnigos/soonlane/commit/2b6032c1c5d0fd83d4c3bcab94ee4e3209a5e277))

### Bug fixes › consent

- Stop the consent banner from showing again after a choice and shifting the page ([2701601](https://github.com/Mnigos/soonlane/commit/270160107983a591cdbde198a73fd8b4a90303b1))

### Bug fixes › desktop

- Track the window frame in event order inside the callbacks ([fbcaf17](https://github.com/Mnigos/soonlane/commit/fbcaf1774063f3fb973c488cced74e707a04ee48))
- Set the Dock badge entirely on the AppKit main thread ([8500aaa](https://github.com/Mnigos/soonlane/commit/8500aaa81c54abf11d485841c5352767b3d0cde1))

### Bug fixes › identity

- Sign in with Google again before deleting from the desktop app ([e85ba55](https://github.com/Mnigos/soonlane/commit/e85ba5515fc2b9d6f5ec4fa996c32c4600a37ca8))

### Bug fixes › labels

- Return a task's labels after an edit ([e3aff18](https://github.com/Mnigos/soonlane/commit/e3aff18e14d15d76d1c16041e153fc9521914085))
- Keep sidebar counts visible on touch and match the open view by name case ([b13f1e2](https://github.com/Mnigos/soonlane/commit/b13f1e24ab729e6b96ecd650714b583633818061))
- Ignore a second save while the label is saving ([6bb754a](https://github.com/Mnigos/soonlane/commit/6bb754a0b3f1f9b68263d0cba6f58155db3525bf))
- Ignore a second save before the first one starts ([3d428e7](https://github.com/Mnigos/soonlane/commit/3d428e740a87cd8aa4ac894f609d600732f21e66))
- Serve the label route under /app with the other views ([90a8ab9](https://github.com/Mnigos/soonlane/commit/90a8ab922cd27fa3955b761dabcedb0a0f829902))
- Show not-found when an open label was deleted elsewhere ([90a7a2a](https://github.com/Mnigos/soonlane/commit/90a7a2a5a7efb61c39ce7204618cbcc786ed94b2))
- Return focus to Add task after closing the composer in a label view ([32d104e](https://github.com/Mnigos/soonlane/commit/32d104e127ac0a1fecfd6f3df4844635624956b6))
- Refresh label views with explicit query keys ([42c354c](https://github.com/Mnigos/soonlane/commit/42c354c3425d0477b87df20dc6f1a280a1ab1f73))

### Bug fixes › shell

- Collapse the sidebar to an icon rail without moving the column ([81ee52b](https://github.com/Mnigos/soonlane/commit/81ee52b79a61a5a5b3f2c73bb665127dd4deaa3d))
- Keep the navigation visible when a page fails to load ([105cf67](https://github.com/Mnigos/soonlane/commit/105cf67178a79e7ecc8208d4f5f49628096444a3))

### Bug fixes › site

- Prerender from the build's own preview server ([f302e6a](https://github.com/Mnigos/soonlane/commit/f302e6aa67b2450bd908108b9b3556fee65fb6bf))
- Escape < in JSON-LD scripts ([a999675](https://github.com/Mnigos/soonlane/commit/a99967539662d977719484905d9bdaf3dc56b26b))
- Reset Get started after returning from the back/forward cache ([bbf07b1](https://github.com/Mnigos/soonlane/commit/bbf07b15e07148ec53a473e06955aa70945045e3))
- Keep the bfcache reset until the page is restored ([2761b78](https://github.com/Mnigos/soonlane/commit/2761b78b047c48ce302e8cf6316529d5ea01dff6))
- Refresh the header hint when the tab becomes visible ([6aea42e](https://github.com/Mnigos/soonlane/commit/6aea42ee382bc493cfa72f995ee2c908ff1aa931))
- Keep the page links out of the header on phones ([522e721](https://github.com/Mnigos/soonlane/commit/522e7217bffea3ffe1e130df85719465356aaf75))
- Serve robots.txt, sign-in and the app again on production ([824024c](https://github.com/Mnigos/soonlane/commit/824024c46633f47584b64ad121ad64297823101c))
- Stop the site from staying broken after an update ([890b501](https://github.com/Mnigos/soonlane/commit/890b501a7d0866ee30f2663b4040a92c7f5708df))

### Bug fixes › tasks

- Keep the Overdue chevron off the screen edge on phones ([6b62776](https://github.com/Mnigos/soonlane/commit/6b627768e9008db707825b644d2e0bd4c03475ff))
- Keep a bottom-clamped selected day active across resizes ([ce25fc8](https://github.com/Mnigos/soonlane/commit/ce25fc8d7e4f51561a5c64c38f072782bd3cc0e4))
- Reset the cancelled frame when the active day tracker unsubscribes ([401fe76](https://github.com/Mnigos/soonlane/commit/401fe7603744c8e3e55e81abf68e744350624c3c))
- Name the active day on the Upcoming today button ([8a38f50](https://github.com/Mnigos/soonlane/commit/8a38f50101cddb50f0129c6dcab9044bf6881df7))
- Cancel the composer with Escape from its Cancel and Send buttons ([5b978e3](https://github.com/Mnigos/soonlane/commit/5b978e382a034a4ae4b4182b9c770d9558037a47))
- Return focus to the opener when the add task dialog closes ([11f4f5b](https://github.com/Mnigos/soonlane/commit/11f4f5bacb15bf77772a4cae104b69df0b0c86b9))
- Send one create request per composer submit ([5bf403d](https://github.com/Mnigos/soonlane/commit/5bf403db1bb929203755b2c184c980f9bdd145f1))
- Show no date found for a typed date with an invalid month ([cf11259](https://github.com/Mnigos/soonlane/commit/cf112592f8c30b47d38bf0ba10336fae74694c40))
- Let the last upcoming days scroll up under the header ([2acbed1](https://github.com/Mnigos/soonlane/commit/2acbed1c4f6cf1610ab9c1b28856304fd9feced0))
- Put back only the failed task when completing fails ([22b103b](https://github.com/Mnigos/soonlane/commit/22b103b6b7c7ca323f819e55101b0fd7bcf3eea3))
- Keep the requested day until a slow smooth scroll ends ([37048ad](https://github.com/Mnigos/soonlane/commit/37048ad8be8a229d8e93a90d7b95fbe488b7bcf3))
- Open the date picker above its chip ([c400bc9](https://github.com/Mnigos/soonlane/commit/c400bc98c2106c1ba85cbf9d0341a4bcdbf289c8))
- Grow the date picker's months up to ten years ahead ([5bebeec](https://github.com/Mnigos/soonlane/commit/5bebeecd837141aa3841e30c67c48a5366572596))
- Keep the calendar's tab stop through fast scrolls and far dates ([bc2187f](https://github.com/Mnigos/soonlane/commit/bc2187f3dc1aabb2dd501b9c2c1fa0924a239811))
- Return focus after closing the task composer ([6c31dbf](https://github.com/Mnigos/soonlane/commit/6c31dbf713a6406c005dfbea0f13e5c7c4775b83))
- Keep label picks while a label is being created ([af5ae0c](https://github.com/Mnigos/soonlane/commit/af5ae0cf3113f4be6c78fd126b7e47879245482e))
- Clear a failed label create when the picker opens ([b48f3a7](https://github.com/Mnigos/soonlane/commit/b48f3a7d86d1d5b7a9ff177d703f1a409c6cc563))
- Follow label renames and deletes in an open composer ([744385c](https://github.com/Mnigos/soonlane/commit/744385c73f1aa550f5929c6139778b5357aa2fe5))
- Refresh the lists when two goal logs settle in the same tick ([1b133e1](https://github.com/Mnigos/soonlane/commit/1b133e18e3f9213ff570e343e33ab5729aee6631))
- Keep task titles and goal text out of replay-visible attributes ([4978e49](https://github.com/Mnigos/soonlane/commit/4978e494ee70d3dfb608e2a51b9bdd1067007d9c))
- Keep long goal labels inside the composer on narrow screens ([ee3c7b0](https://github.com/Mnigos/soonlane/commit/ee3c7b02e6c069f0ce9e3389977028bfa49e2793))
- Save edits to a task in the web app ([c3504e1](https://github.com/Mnigos/soonlane/commit/c3504e1e7fb75a6da448dff678068911ec8669e6))
- Close the open task editor when you start adding or editing another task ([f3537cd](https://github.com/Mnigos/soonlane/commit/f3537cd2894da531b349947cc77ba66d63cb2b46))



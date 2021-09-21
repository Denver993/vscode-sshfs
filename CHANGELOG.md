
# Changelog

## 1.22.0 (2021-09-21)

### Fixes
- Partially fix issue with debug mode on code-server (05e1b69, #279)


### Development changes
- I've added a `CHANGELOG.md` file to the repository containing the changelog for earlier versions. It'll contain already committed changes that have yet to be released.
- The extension now only enters debug mode when the environment variable `VSCODE_SSHFS_DEBUG` is the (case insensitive) string `"true"`. The `ExtensionContext.extensionMode` provided by Code does not influence this anymore. This is part due to #279, implemented in 05e1b69 which supersedes 48ef229.

## 1.21.2 (2021-08-05)

### Fixes
- Fix bug in connect command with `Root` starting with `~` (803dc59, #280)

### Changes
- Remove `(SSH FS)` label from editor titles (fcbd6d7, #278)

## 1.21.1 (2021-08-01)

### Fixes
- Improve effect of `CHECK_HOME` flag (ef40b07b2d, #277)

### Changes
- Better error handling and `CHECK_HOME` flag support for `tryGetHome` (87d2cf845a)

### Development changes
- Improve `map-error.js` to work for `/dist/extension.js` and error report better (bda36c998c)
- Improve logging of errors through promises (c7f1261311)

## 1.21.0 (2021-07-01)

### Major change (315c255)
- An internal change happened, making URIs now represent an absolute path on the server
- In the past, `ssh://config/some/path` for a config with `/root` as Root would actually point to `/root/some/path` on the remote server
- Now, the Root is ignored, so `ssh://config/some/path` will actually point at `/some/path` on the remote server
- The Root field is now only checked by the "Add as Workspace Folder" and "Open remote SSH terminal" for the default path. In the above example, you'd get the workspace folder `ssh://config/root` and have your terminal open with the current directory being `/root`, assuming you didn't open the terminal by using the context menu in the explorer
- **While this shouldn't affect most people**, it means that people that have saved/open workspaces with configs with a non-`/` Root, it might point at the wrong file/directory. Updating the URI or removing and re-adding the workspace folder should fix it
- This change simplifies a lot of complex code accounting for calculating/validating relative paths, and also allows for future improvements, a good example being a beta feature shown in #267

Fixes:
- Fix proxies breaking when no port is defined (which should default to 22) (a41c435, #266)

New features:
- Added `statusBar/remoteIndicator` (remote button left-bottom) (d3a3640, #260)
See microsoft/vscode#122102 for info and [this](https://code.visualstudio.com/updates/v1_56#_remote-indicator-menu) for an example (with different extensions)
- Add support for environment variables (3109e97, #241)
Currently you have to manually edit your JSON settings files to add environment variables.
This can be done by adding e.g. `"environment": { "FOO": "BAR" }`.
Variables will be `export FOO=BAR`'d (fully escaped) before running the shell command.
This affects both terminals and `ssh-shell` tasks.
- Added a `CHECK_HOME` flag (default: true) to toggle checking the home directory (315c255)
The extension checks whether your home directory (queried using `echo ~`) is a directory. Since some exotic setups might have home-less users, you can add `-CHECK_HOME` as a flag (see #270)
- Add `code` as a remote command to open files/directories locally (7d930d3, #267)
**Still a beta feature** which requires the `REMOTE_COMMANDS` flag (see #270) enabled.
Tries to inject an alias (well, function) named `code` in the remote terminal's shell.
The "command" only accepts a single argument, the (relative or absolute) path to a file/directory.
It will tell the extension (and thus VS Code) to open the file/directory. Files are opened in an editor, directories are added as workspace folders. Errors are displayed in VS Code, **not** your terminal.
Due to how complex and unreliable it is to inject aliases, this feature is still in beta and subject to change.

Minor changes:
- Added `virtualWorkspaces` capabilities to `package.json` (8789dd6)
- Added `untrustedWorkspaces` capabilities (cca8be2, #259, microsoft/vscode#120251)
- The `Disconnect` command now only shows connections to choose from (36a440d)
- Added `resourceLabelFormatters` contribution, for better Explorer tooltips (5dbb36b)
- Added `viewsWelcome ` contribution, to fill in empty configs/connections panes (4edc2ef)

Development changes:
- Added some initial when clause contexts (b311fec)
  - Currently only `sshfs.openConnections`, `sshfs.openTerminals` and `sshfs.openFileSystems`
- Some small refactors and improvements (5e5286d, 06bce85, f17dae8, 1258a8e, f86e33a)

## 1.20.2 (2021-06-28)

### Fixes
- Allow usernames with dashes for instant connection strings (#264, f05108a)
This only affected the "Create instant connection" option within certain commands in the public version of the extension.
This also affected people (manually) using connection strings to interact with file systems or use as `"hop"` within JSON configs.

### New features
- Add config option for agent forwarding (#265, d167ac8)
The settings UI now has a simple checkbox to toggle agent forwarding.
Mind that this automatically gets disabled if you authenticate without an agent!

### Development changes
- Updated to TypeScript 4.3.4
- Updated `defaultStyles.css` for VS Code CSS variables
- Settings UI now supports checkbox fields
- Extension code base now uses webpack 5 instead of webpack 4

## 1.20.1 (2021-04-14)

### Fixes
- Closing connection shouldn't delete workspace folders if a related filesystem exists (cdf0f99)
  Basically you have connection A (with a terminal or so) and connection B (with a file system) both for the same config name.
  Before, closing connection A would also delete/remove the workspace folder, even though connection B still provides the file system.
  With this change, closing a connection won't delete the folder if it detects another connection (for the same name) providing SFTP.
- Add `WINDOWS_COMMAND_SEPARATOR` config flag to support Windows OpenSSH servers (see #255)
  Mind that you'll also need to change `Terminal Command` into e.g. `powershell`, as Windows doesn't support the `$SHELL` variable

### Changes
- The extension now tracks which version was last used (fdb3b66)
  Currently unused, but might be used in the future to notify the user of breaking changes, optionally with auto-fix.
- Config flags can now be specified per config (9de1d03)
  - An example use of this an be seen in #255.
  - **Note**: Configs (and thus their flags) are cached when a connection is created!
    - This means that changes to the config flags won't apply until the connection is closed and a new one is created.
    - The extension already starts a new (parallel) connection when the currently saved config mismatches a running connection's config.
- The extension will now replace task variables (e.g. `remoteWorkspaceFolder`) in `Terminal Command` (#249)
  This does ***not** handle VS Code's built-in "local" task variables like `workspaceFolder`, although support for this could be added later.

## 1.20.0 (2021-03-19)

### New features
- Add task variables for remote files #232 ([example](https://user-images.githubusercontent.com/14597409/111828756-0d326d00-88ec-11eb-9988-0768e1194cca.png))
  - Supported variables (e.g. `${remoteFile}`) can be seen [here](https://github.com/SchoofsKelvin/vscode-sshfs/blob/v1.20.0/src/manager.ts#L216)
  - Some variables support a workspace name as argument, similar to the built-in variables, e.g. `${remoteWorkspaceFolder:FolderName}`
- Add `taskCommand` #235
  - Similar to `terminalCommand`, but for `ssh-shell` tasks
  - Setting it to e.g. `echo A; $COMMAND; echo B` results in the task echoing `A`, running the task command, then echoing `B`

### Development changes
- Switched from official `ssh2-streams` to [Timmmm/ssh2-streams#patch1](https://github.com/Timmmm/ssh2-streams/tree/patch-1)
  - Potentially fixing #244
- Updated to TypeScript 4.2.3
- Updated all other dependencies within the existing specified version range _(minor and patch updates)_
- Build workflow now caches the Yarn cache directory
- Build workflow now uses Node v12 instead of v10
- Added a Publish workflow to publish the extension to VS Marketplace and Open VSX Registry

## 1.19.4 (2021-03-02)

### Changes
- Flag system is improved. The `DF-GE` flag (see #239) will now automatically enable/disable for affected Electron versions.
  People that were making use of the `DF-GE` flag to **disable** this fix, should now use `-DF-GE` or `DF-GE=false` instead.

### Development changes
- GitHub Actions workflow now makes use of the [Event Utilities](https://github.com/marketplace/actions/event-utilities) GitHub action (6d124f8)
  This is mostly the old code, but now better maintained and made publicly available to anyone.
  Doesn't really affect the extension. Just cleans up the workflow file, instead of requiring a relatively big complex chunk of bash script.

## 1.19.3 (2021-02-15)

### Changes
- Instant connections with as hostname an existing config will result in the configs being merged
  - e.g. `user2@my-config` will use the same config as `my-config`, but with `user2` as the user
  - The "instant connection bonuses" are still applied, e.g. trying to match the (new) config against a PuTTY session on Windows
- Typing in a config/connection picker (e.g. the `SSH FS: Open a remote SSH terminal` command) acts smarter for instant connections
  - Entering a value and selecting `Create instant connection` will carry over the entered value to the new input box
- Instant connections are now much better at matching against PuTTY sessions
  - The discovery process of PuTTY sessions will no longer spam the output _(only "interesting" fields are outputted)_
  - It will now try to first find a session with the given host as name, then try again by matching username/hostname
  - This improved matching should also work for non-instant connections, aka regular configurations
- Overhauled README with updated graphics, list of features, ...
- Fixed a bug regarding the `SFTP Sudo` config field misbehaving in the config editor

### Other news
I'm in the process of claiming the "Kelvin" namespace on the Open VSX Registry.
In the future, new versions will also be pushed to it, instead of relying on their semi-automated system to do it _sometime_.

## 1.19.2 (2021-02-11)

### Hotfix
- Add an auto-enabled patch for #239
  - Disables all `diffie-hellman-group-exchange` KEX algorithms _(unless the user overrides this option)_
  - Adding the flag `DF-GE` to your `sshfs.flags`, e.g. `"sshfs.flags": ["DF-GE"]` **disables** this fix

### New features
- **Instant connections**
  - The "Add as Workspace Folder" and "Open remote SSH terminal" now suggest "Create instant connection"
  - Allows easily setting up unconfigured connections, e.g. `user@example.com:22/home/user`
  - The connection string supports omitting user (defaults to `$USERNAME`), port (22) and path (`/`)
  - On Windows, the extension will automatically try to resolve it to a PuTTY session (e.g. `user@SessionName/home/user`)
    - This part is still not fully finished, and currently has bugs. Use `user@domain.as.configured.in.putty` to make it work
    - Better support for PuTTY will be added soon
  - A workspace file can add instant connections as workspace folders by using the instant connection string
    - If the connecting string does **not** contain a `@`, it's assumed to be a config name _(old default behavior)_
  - Roadmap: once #107 is fully added, instant connections will also support OpenSSH config files, similar to PuTTY support
- Flag system, available under the `sshfs.flags` config option.
Allows specifying flags to change certain options/features that aren't supported by the UI.
- Adding `"debug": true` to your SSH FS config will enable `ssh2`/`ssh2-streams` debug logging for that config

### Development changes
- The GitHub repository now has a workflow (GitHub Actions) to build the extension and draft releases
- Improve how the extension "simplifies" error messages for missing files for (built-in) extension checks
  - Now supports workspace folders with `ssh://name/path` as URI instead of just `ssh://name/`
  - Added `/app/src/main/AndroidManifest.xml` to the ignore list (recently added in VS Code itself)
- WebView went through a small refactorization/cleanup, to make future work on it easier
  - Unused files removed, small basically identical files merged, ...
  - Switch from deprecated `react-scripts-ts` to `react-scripts` (with ESLint support)
  - Removed the custom `react-dev-utils` module _(was required for `react-scripts-ts` with VS Code)_
  - Fix problemMatcher for the webview watch build task
- Remove `streams.ts` + simplify `tryGetHome` in `manager.ts` to not depend on it anymore

## 1.19.1 (2020-12-17)

### New features
- Add TerminalLinkProvider for absolute paths

### Changes
- Upgrade `@types/vscode` and minimum VSCode version from 1.46.0 to 1.49.0
- Small internal improvements
- Fix some bugs

## 1.19.0 (2020-12-17)

### New features
- `SSH FS` view with nice UI for listing configs, managing connections/terminals, ...
- Support prompting the `Host` field
- Add `Terminal command` field to change the terminal launch command _(defaults to `$SHELL`)_

### Changes
- Upgrade codebase to typescript@4.0.2
- Refactor Manager, add ConnectionManager
- Small bug fixes, improved logging, ...

## Earlier
Check the [releases](https://github.com/SchoofsKelvin/vscode-sshfs/releases) page to compare commits for older versions.
# DevBox release notes

`npm run package:mac` produces a DMG after a production build. Release CI supplies `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID` to notarize the signed application. Do not place these credentials in the repository. Before release, verify the DMG on a clean Apple Silicon Mac, then validate Intel compatibility separately.

After a Node or Electron version change, run `npm run rebuild:native` so `better-sqlite3` is compiled for Electron's embedded Node ABI.

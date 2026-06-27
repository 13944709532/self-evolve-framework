# Tauri 2 `bundle.windows.nsis` Schema

Extracted from Tauri 2 official config schema. Paths are relative to `src-tauri/`.

## Full Bundle Windows Config

```json
{
  "bundle": {
    "windows": {
      "digestAlgorithm": "sha256",
      "certificateThumbprint": null,
      "timestampUrl": null,
      "tsp": false,
      "webviewInstallMode": {
        "type": "downloadBootstrapper"
      },
      "nsis": {
        "installerIcon": "icons/icon.ico",
        "installMode": "currentUser",
        "languages": null,
        "template": null,
        "displayLanguageSelector": false,
        "startMenuFolder": null,
        "headerImage": null,
        "sidebarImage": null,
        "customHeight": null,
        "customWidth": null
      }
    }
  }
}
```

## NSIS Fields Detail

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `installerIcon` | string (path) | — | ICO file for the NSIS installer |
| `installMode` | `"currentUser"` or `"both"` | `"currentUser"` | Install scope: per-user (no admin) or user-selectable |
| `displayLanguageSelector` | boolean | false | Show language selector in installer |
| `languages` | string[] | null | Custom NSIS language files |
| `template` | string (path) | null | Custom NSIS template file |
| `startMenuFolder` | string | null | Start menu folder name |
| `headerImage` | string (path) | null | BMP for installer header (150 x 57 px) |
| `sidebarImage` | string (path) | null | BMP for installer sidebar (164 x 314 px) |
| `customHeight` | number | null | Custom installer window height |
| `customWidth` | number | null | Custom installer window width |

## Image Format Requirements

| Image | Format | Dimensions | Location in Installer |
|-------|--------|-----------|----------------------|
| `installerIcon` | ICO | Multi-resolution | Taskbar / title bar |
| `headerImage` | BMP | 150 x 57 px | Top of each installer page |
| `sidebarImage` | BMP | 164 x 314 px | Welcome / Finish page left panel |

### BMP Conversion (if user provides PNG)

```bash
# ImageMagick
magick convert input.png -resize 150x57 bmp:src-tauri/icons/installer-header.bmp
magick convert input.png -resize 164x314 bmp:src-tauri/icons/installer-sidebar.bmp
```

## ICO Requirements

- Must be a valid `.ico` file (not a renamed `.png`)
- Recommended: include 32x32, 256x256 sizes
- 85 KB+ typically indicates a well-formed multi-resolution ICO
- Verify header: first 4 bytes `00 00 01 00` (reserved + type=ico + count=1)

---
name: tauri-nsis-installer-icon
description: Configure Tauri 2 NSIS installer icon. This skill should be used when modifying the Windows NSIS installer to use a custom icon instead of the Tauri default.
---

# Tauri NSIS Installer Icon Configuration

## Purpose

Tauri 2 separates app icon from installer icon. The `bundle.icon` configures the executable icon; the NSIS installer uses its own icon defined in `bundle.windows.nsis.installerIcon`. Without this configuration, NSIS defaults to a generic icon.

## Procedure

### 1. Ask user about language

Ask whether the installer should show Chinese UI. If yes, set `displayLanguageSelector` to false (auto-detect) or leave unset (default auto-detect based on system locale). NSIS ships built-in Chinese language files so no extra files are needed.

### 2. Ask user about headerImage

Ask whether to replace the default header image in the installer wizard.

| Field | Format | Size | Location |
|-------|--------|------|----------|
| `headerImage` | BMP (Windows bitmap) | 150 x 57 px | Any path under `src-tauri/`, e.g. `icons/installer-header.bmp` |

If the user provides a PNG, convert it to BMP before placing in the project. The image sits at the top of each installer page.

### 3. Ask user about sidebarImage

Ask whether to replace the default sidebar/banner image on the Welcome and Finish pages.

| Field | Format | Size | Location |
|-------|--------|------|----------|
| `sidebarImage` | BMP (Windows bitmap) | 164 x 314 px | Any path under `src-tauri/`, e.g. `icons/installer-sidebar.bmp` |

If the user provides a PNG, convert it to BMP before placing in the project.

### 4. Ask user about install mode

Ask `installMode`: "currentUser" (per-user, no admin required) is the default. Use "both" to allow the user to choose per-user or per-machine during installation.

### 5. Ensure icon file exists

Place a valid `.ico` file in `src-tauri/icons/`. The ICO should contain multiple sizes (e.g., 32x32, 256x256). Verify with:

```bash
node -e "const fs=require('fs');const b=fs.readFileSync('src-tauri/icons/icon.ico').subarray(0,6);console.log(b[0]===0&&b[1]===0&&b[2]===1&&b[3]===0?'Valid ICO':'Unknown')"
```

### 6. Add NSIS config to `src-tauri/tauri.conf.json`

```json
{
  "bundle": {
    "icon": ["icons/icon.ico", "icons/32x32.png", "icons/128x128.png", "icons/128x128@2x.png"],
    "windows": {
      "nsis": {
        "installerIcon": "icons/icon.ico",
        "headerImage": "icons/installer-header.bmp",
        "sidebarImage": "icons/installer-sidebar.bmp",
        "installMode": "currentUser"
      }
    }
  }
}
```

Remove `headerImage` / `sidebarImage` lines if the user chose not to customize them. Remove `installMode` if the default "currentUser" is acceptable.

### 7. Rebuild

```bash
tauri build
```

The NSIS script is generated at `src-tauri/target/.../release/nsis/x64/installer.nsi`. Verify the generated script contains:
- `!define INSTALLERICON "icons/icon.ico"` and `!define MUI_ICON "icons/icon.ico"`
- `!define HEADERIMAGE "icons/installer-header.bmp"` (if configured)
- `!define SIDEBARIMAGE "icons/installer-sidebar.bmp"` (if configured)
- `!define INSTALLMODE "currentUser"`

## Schema Reference

See `references/tauri-nsis-schema.md` for the full `bundle.windows.nsis` schema.

## Common Pitfalls

- `bundle.icon` does NOT affect the NSIS installer — a separate `installerIcon` field is required.
- The `.ico` file must be a valid ICO file (not a renamed PNG).
- Paths are relative to `src-tauri/`, not the project root.
- The NSIS script is auto-generated during `tauri build`; editing `installer.nsi` directly is overwritten on rebuild.
- `headerImage` and `sidebarImage` must be BMP format; PNG will cause build failure. Convert via ImageMagick: `magick convert input.png bmp:output.bmp`.

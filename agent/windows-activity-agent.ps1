[CmdletBinding()]
param(
  [int]$IntervalSeconds = 15,
  [string]$OutputPath = "$env:LOCALAPPDATA\PersonalCommandCenter\activity-outbox.ndjson",
  [string[]]$ExcludedProcesses = @(),
  [switch]$Once
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# هذا الوكيل تجريبي ومحلي فقط. لا يقرأ لوحة المفاتيح أو الحافظة أو الرسائل
# ولا يأخذ لقطات شاشة أو يحاول استخراج محتوى صفحات الويب.
Add-Type @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public static class PccWindow {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
  [DllImport("user32.dll")] public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);
  [StructLayout(LayoutKind.Sequential)] public struct LASTINPUTINFO { public uint cbSize; public uint dwTime; }
  public static string Title() { var handle = GetForegroundWindow(); var text = new StringBuilder(256); GetWindowText(handle, text, text.Capacity); return text.ToString(); }
  public static uint ForegroundProcessId() { var handle = GetForegroundWindow(); uint processId; GetWindowThreadProcessId(handle, out processId); return processId; }
  public static uint IdleMilliseconds() { var info = new LASTINPUTINFO(); info.cbSize = (uint)Marshal.SizeOf(info); if (!GetLastInputInfo(ref info)) return 0; return unchecked((uint)Environment.TickCount) - info.dwTime; }
}
'@

$directory = Split-Path -Parent $OutputPath
if (-not (Test-Path $directory)) { New-Item -ItemType Directory -Path $directory -Force | Out-Null }
$excluded = @($ExcludedProcesses | ForEach-Object { $_.Trim().ToLowerInvariant() } | Where-Object { $_ })

function Write-ActivityRecord {
  $processId = [PccWindow]::ForegroundProcessId()
  if (-not $processId) { return }
  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
  if (-not $process) { return }
  $processName = [string]$process.ProcessName
  if ($excluded -contains $processName.ToLowerInvariant()) { return }
  $started = (Get-Date).ToUniversalTime()
  $idleSeconds = [math]::Round(([PccWindow]::IdleMilliseconds() / 1000), 0)
  $record = [ordered]@{
    id = [guid]::NewGuid().ToString()
    source = 'windows-agent'
    category = 'application'
    appName = $processName
    windowTitle = $null
    startedAt = $started.ToString('o')
    endedAt = $started.AddSeconds($IntervalSeconds).ToString('o')
    idleSeconds = [int][math]::Min(86400, [math]::Max(0, $idleSeconds))
    syncState = 'pending'
    createdAt = $started.ToString('o')
  }
  # عنوان النافذة لا يُحفظ افتراضيًا؛ يمكن مراجعته محليًا فقط عند الحاجة بإضافة حقل صريح.
  ($record | ConvertTo-Json -Compress) | Add-Content -Path $OutputPath -Encoding UTF8
}

do {
  Write-ActivityRecord
  if ($Once) { break }
  Start-Sleep -Seconds ([math]::Max(5, $IntervalSeconds))
} while ($true)

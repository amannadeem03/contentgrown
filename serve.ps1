$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8734
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$port/ (concurrent, range-enabled)"

$mime = @{
  ".html" = "text/html"; ".css" = "text/css"; ".js" = "application/javascript";
  ".jpg" = "image/jpeg"; ".jpeg" = "image/jpeg"; ".png" = "image/png";
  ".svg" = "image/svg+xml"; ".mp4" = "video/mp4"; ".json" = "application/json";
}

$pool = [runspacefactory]::CreateRunspacePool(2, 24)
$pool.Open()

$handler = {
  param($context, $root, $mime)
  $req = $context.Request
  $res = $context.Response
  try {
    $path = [System.Uri]::UnescapeDataString($req.Url.LocalPath)
    if ($path -eq "/") { $path = "/index.html" }
    $filePath = Join-Path $root ($path.TrimStart("/"))

    if (-not (Test-Path $filePath -PathType Leaf)) {
      $res.StatusCode = 404
      $msg = [System.Text.Encoding]::UTF8.GetBytes("Not found")
      $res.ContentLength64 = $msg.Length
      $res.OutputStream.Write($msg, 0, $msg.Length)
      return
    }

    $ext = [System.IO.Path]::GetExtension($filePath)
    $contentType = $mime[$ext]
    if (-not $contentType) { $contentType = "application/octet-stream" }
    $res.ContentType = $contentType
    $res.Headers.Add("Accept-Ranges", "bytes")
    $res.Headers.Add("Cache-Control", "no-cache")

    $stream = [System.IO.File]::Open($filePath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::Read)
    try {
      $totalLength = $stream.Length
      $rangeHeader = $req.Headers["Range"]
      $start = 0
      $end = $totalLength - 1

      if ($rangeHeader -and $rangeHeader -match "bytes=(\d*)-(\d*)") {
        if ($matches[1] -ne "") { $start = [int64]$matches[1] }
        if ($matches[2] -ne "") { $end = [int64]$matches[2] }
        if ($end -ge $totalLength) { $end = $totalLength - 1 }
        $res.StatusCode = 206
        $res.Headers.Add("Content-Range", "bytes $start-$end/$totalLength")
      } else {
        $res.StatusCode = 200
      }

      $length = $end - $start + 1
      $res.ContentLength64 = $length
      $stream.Seek($start, [System.IO.SeekOrigin]::Begin) | Out-Null

      $buffer = New-Object byte[] 131072
      $remaining = $length
      while ($remaining -gt 0) {
        $toRead = [Math]::Min($buffer.Length, $remaining)
        $read = $stream.Read($buffer, 0, $toRead)
        if ($read -le 0) { break }
        $res.OutputStream.Write($buffer, 0, $read)
        $remaining -= $read
      }
    } finally {
      $stream.Close()
    }
  } catch {
    try { $res.StatusCode = 500 } catch {}
  } finally {
    try { $res.OutputStream.Close() } catch {}
  }
}

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $ps = [powershell]::Create()
  $ps.RunspacePool = $pool
  [void]$ps.AddScript($handler).AddArgument($context).AddArgument($root).AddArgument($mime)
  $asyncResult = $ps.BeginInvoke()
  [void]$asyncResult
}

param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("validate", "preview", "clean-black", "pack-chroma")]
  [string]$Mode,

  [Parameter(Mandatory = $true)]
  [string]$Path,

  [string]$Output,
  [int]$Columns = 3,
  [int]$Rows = 4,
  [int]$CellWidth = 0,
  [int]$CellHeight = 0,
  [int]$Margin = 24,
  [int]$MinPadding = 10,
  [int]$BlackThreshold = 2,
  [string]$TargetRows = "",
  [string]$OutDir = "tmp",
  [string]$Prefix = "",
  [int]$SpeckMax = 40
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$source = @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public static class SpriteTool {
  struct Comp {
    public List<Point> Points;
    public int Count;
    public int L;
    public int T;
    public int R;
    public int B;
    public double CX;
    public double CY;
  }

  public static int Validate(string path, int cols, int rows, int minPadding, int blackThreshold, string targetRowsCsv) {
    using (var bmp = new Bitmap(path)) {
      int cellW = bmp.Width / cols;
      int cellH = bmp.Height / rows;
      var targetRows = ParseRows(targetRowsCsv, rows);
      int violations = 0;
      int transparentRgbLeaks = 0;
      int semiAlpha = 0;
      int targetBlack = 0;

      Console.WriteLine("sheet={0}x{1} cell={2}x{3} columns={4} rows={5}", bmp.Width, bmp.Height, cellW, cellH, cols, rows);
      if (bmp.Width % cols != 0 || bmp.Height % rows != 0) {
        Console.WriteLine("VIOLATION sheet size is not evenly divisible by grid");
        violations++;
      }

      for (int y = 0; y < bmp.Height; y++) {
        for (int x = 0; x < bmp.Width; x++) {
          var c = bmp.GetPixel(x, y);
          if (c.A == 0 && (c.R != 0 || c.G != 0 || c.B != 0)) transparentRgbLeaks++;
          if (c.A > 0 && c.A < 255) semiAlpha++;
          int row = Math.Min(rows - 1, y / cellH);
          if (targetRows.Contains(row) && IsNearBlack(c, blackThreshold)) targetBlack++;
        }
      }

      Console.WriteLine("transparentRgbLeaks={0} semiAlphaPixels={1} targetNearBlackOpaque={2}", transparentRgbLeaks, semiAlpha, targetBlack);
      if (transparentRgbLeaks > 0) violations++;
      if (targetBlack > 0 && targetRows.Count > 0) violations++;

      for (int row = 0; row < rows; row++) {
        for (int col = 0; col < cols; col++) {
          int l = 999999, t = 999999, r = -1, b = -1, count = 0, black = 0;
          for (int y = row * cellH; y < (row + 1) * cellH; y++) {
            for (int x = col * cellW; x < (col + 1) * cellW; x++) {
              var c = bmp.GetPixel(x, y);
              if (c.A <= 16) continue;
              count++;
              if (x < l) l = x;
              if (x > r) r = x;
              if (y < t) t = y;
              if (y > b) b = y;
              if (IsNearBlack(c, blackThreshold)) black++;
            }
          }
          if (count == 0) {
            Console.WriteLine("row{0} col{1} empty", row, col);
            violations++;
            continue;
          }

          int left = l - col * cellW;
          int right = ((col + 1) * cellW - 1) - r;
          int top = t - row * cellH;
          int bottom = ((row + 1) * cellH - 1) - b;
          Console.WriteLine("row{0} col{1} count={2} nearBlack={3} margins L{4} R{5} T{6} B{7} W{8} H{9}",
            row, col, count, black, left, right, top, bottom, r - l + 1, b - t + 1);
          if (left < minPadding || right < minPadding || top < minPadding || bottom < minPadding) violations++;
        }
      }

      Console.WriteLine("violations={0}", violations);
      return violations;
    }
  }

  public static void Preview(string path, int cols, int rows, string outDir, string prefix) {
    Directory.CreateDirectory(outDir);
    if (String.IsNullOrWhiteSpace(prefix)) prefix = Path.GetFileNameWithoutExtension(path);
    using (var bmp = new Bitmap(path)) {
      WritePreview(bmp, cols, rows, Path.Combine(outDir, prefix + "-white-preview.png"), Color.White);
      WritePreview(bmp, cols, rows, Path.Combine(outDir, prefix + "-black-preview.png"), Color.Black);
      Console.WriteLine("wrote {0}", Path.Combine(outDir, prefix + "-white-preview.png"));
      Console.WriteLine("wrote {0}", Path.Combine(outDir, prefix + "-black-preview.png"));
    }
  }

  public static void CleanBlack(string input, string output, int cols, int rows, string targetRowsCsv, int blackThreshold, int speckMax) {
    var targetRows = ParseRows(targetRowsCsv, rows);
    if (targetRows.Count == 0) throw new Exception("clean-black requires -TargetRows, for example 0,1");
    using (var bmp = new Bitmap(input)) {
      int cellW = bmp.Width / cols;
      int cellH = bmp.Height / rows;
      foreach (int row in targetRows) {
        for (int y = row * cellH; y < (row + 1) * cellH; y++) {
          for (int x = 0; x < bmp.Width; x++) {
            var c = bmp.GetPixel(x, y);
            if (IsNearBlack(c, blackThreshold)) bmp.SetPixel(x, y, Color.FromArgb(0,0,0,0));
          }
        }
      }
      foreach (int row in targetRows) {
        for (int col = 0; col < cols; col++) CleanSmallSpecks(bmp, col * cellW, row * cellH, cellW, cellH, speckMax);
      }
      NormalizeTransparentRgb(bmp);
      bmp.Save(output, ImageFormat.Png);
      Console.WriteLine("wrote {0}", output);
    }
  }

  public static void PackChroma(string input, string output, int cols, int rows, int cellW, int cellH, int margin) {
    using (var original = new Bitmap(input))
    using (var src = new Bitmap(original.Width, original.Height, PixelFormat.Format32bppArgb))
    using (var dst = new Bitmap(cols * cellW, rows * cellH, PixelFormat.Format32bppArgb))
    using (var g = Graphics.FromImage(dst)) {
      for (int y = 0; y < original.Height; y++) {
        for (int x = 0; x < original.Width; x++) {
          var c = original.GetPixel(x, y);
          src.SetPixel(x, y, IsGreenKey(c) ? Color.FromArgb(0,0,0,0) : Color.FromArgb(255, c.R, c.G, c.B));
        }
      }

      g.Clear(Color.FromArgb(0,0,0,0));
      g.InterpolationMode = InterpolationMode.HighQualityBicubic;
      g.PixelOffsetMode = PixelOffsetMode.HighQuality;
      int sourceColW = original.Width / cols;

      for (int col = 0; col < cols; col++) {
        var comps = Components(src, col * sourceColW, 0, sourceColW, original.Height);
        var mains = PickMainComponents(comps, rows);
        for (int row = 0; row < rows; row++) {
          Rectangle bounds = UnionNearestComponents(comps, mains, row);
          int pad = 8;
          bounds = Rectangle.FromLTRB(
            Math.Max(0, bounds.Left - pad),
            Math.Max(0, bounds.Top - pad),
            Math.Min(src.Width, bounds.Right + pad),
            Math.Min(src.Height, bounds.Bottom + pad)
          );

          double scale = Math.Min((cellW - margin * 2) / (double)bounds.Width, (cellH - margin * 2) / (double)bounds.Height);
          int dw = Math.Max(1, (int)Math.Round(bounds.Width * scale));
          int dh = Math.Max(1, (int)Math.Round(bounds.Height * scale));
          int dx = col * cellW + (cellW - dw) / 2;
          int dy = row * cellH + cellH - margin - dh;
          g.DrawImage(src, new Rectangle(dx, dy, dw, dh), bounds, GraphicsUnit.Pixel);
        }
      }

      NormalizeTransparentRgb(dst);
      dst.Save(output, ImageFormat.Png);
      Console.WriteLine("wrote {0}", output);
    }
  }

  static bool IsGreenKey(Color c) {
    return c.G > 170 && c.R < 90 && c.B < 90;
  }

  static bool IsNearBlack(Color c, int threshold) {
    return c.A > 200 && c.R <= threshold && c.G <= threshold && c.B <= threshold;
  }

  static HashSet<int> ParseRows(string csv, int rows) {
    var set = new HashSet<int>();
    if (String.IsNullOrWhiteSpace(csv)) return set;
    foreach (var raw in csv.Split(',')) {
      int row;
      if (Int32.TryParse(raw.Trim(), out row) && row >= 0 && row < rows) set.Add(row);
    }
    return set;
  }

  static void WritePreview(Bitmap bmp, int cols, int rows, string path, Color bg) {
    int cellW = bmp.Width / cols;
    int cellH = bmp.Height / rows;
    using (var preview = new Bitmap(bmp.Width, bmp.Height, PixelFormat.Format32bppArgb))
    using (var g = Graphics.FromImage(preview)) {
      g.Clear(bg);
      g.DrawImage(bmp, 0, 0);
      using (var pen = new Pen(Color.FromArgb(220,255,0,255), 2)) {
        for (int x = 0; x <= bmp.Width; x += cellW) g.DrawLine(pen, x, 0, x, bmp.Height);
        for (int y = 0; y <= bmp.Height; y += cellH) g.DrawLine(pen, 0, y, bmp.Width, y);
      }
      preview.Save(path, ImageFormat.Png);
    }
  }

  static void CleanSmallSpecks(Bitmap bmp, int ox, int oy, int w, int h, int maxCount) {
    var comps = Components(bmp, ox, oy, w, h);
    comps.Sort((a,b) => b.Count.CompareTo(a.Count));
    if (comps.Count == 0) return;
    var main = comps[0];
    foreach (var c in comps) {
      if (c.Count > maxCount) continue;
      bool farBelow = c.T > main.B + 12;
      bool farSide = c.R < main.L - 12 || c.L > main.R + 12;
      if (!farBelow && !farSide) continue;
      foreach (var p in c.Points) bmp.SetPixel(ox + p.X, oy + p.Y, Color.FromArgb(0,0,0,0));
    }
  }

  static List<Comp> Components(Bitmap bmp, int ox, int oy, int w, int h) {
    bool[,] seen = new bool[w,h];
    var comps = new List<Comp>();
    int[] qx = new int[w * h];
    int[] qy = new int[w * h];

    for (int sy = 0; sy < h; sy++) {
      for (int sx = 0; sx < w; sx++) {
        if (seen[sx,sy] || bmp.GetPixel(ox + sx, oy + sy).A <= 16) {
          seen[sx,sy] = true;
          continue;
        }
        var points = new List<Point>();
        int head = 0, tail = 0, l = sx, t = sy, r = sx, b = sy;
        long sumX = 0, sumY = 0;
        qx[tail] = sx;
        qy[tail] = sy;
        tail++;
        seen[sx,sy] = true;
        while (head < tail) {
          int x = qx[head], y = qy[head];
          head++;
          points.Add(new Point(x,y));
          if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; if (y > b) b = y;
          sumX += ox + x;
          sumY += oy + y;
          for (int ny = y - 1; ny <= y + 1; ny++) {
            for (int nx = x - 1; nx <= x + 1; nx++) {
              if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen[nx,ny]) continue;
              seen[nx,ny] = true;
              if (bmp.GetPixel(ox + nx, oy + ny).A > 16) {
                qx[tail] = nx;
                qy[tail] = ny;
                tail++;
              }
            }
          }
        }
        if (points.Count >= 4) {
          comps.Add(new Comp {
            Points = points, Count = points.Count,
            L = ox + l, T = oy + t, R = ox + r, B = oy + b,
            CX = sumX / (double)points.Count, CY = sumY / (double)points.Count
          });
        }
      }
    }
    return comps;
  }

  static List<Comp> PickMainComponents(List<Comp> comps, int rows) {
    comps.Sort((a,b) => b.Count.CompareTo(a.Count));
    var mains = new List<Comp>();
    foreach (var c in comps) {
      if (c.Count < 1000) continue;
      bool tooClose = false;
      foreach (var m in mains) if (Math.Abs(c.CY - m.CY) < 50) tooClose = true;
      if (!tooClose) mains.Add(c);
      if (mains.Count == rows) break;
    }
    if (mains.Count != rows) throw new Exception("Could not find the expected main components for every row.");
    mains.Sort((a,b) => a.CY.CompareTo(b.CY));
    return mains;
  }

  static Rectangle UnionNearestComponents(List<Comp> comps, List<Comp> mains, int row) {
    int l = Int32.MaxValue, t = Int32.MaxValue, r = -1, b = -1;
    foreach (var c in comps) {
      if (c.Count < 16) continue;
      int nearest = 0;
      double best = Math.Abs(c.CY - mains[0].CY);
      for (int i = 1; i < mains.Count; i++) {
        double d = Math.Abs(c.CY - mains[i].CY);
        if (d < best) { best = d; nearest = i; }
      }
      bool nearMainBand = c.B >= mains[row].T - 70 && c.T <= mains[row].B + 70;
      if (nearest != row || !nearMainBand) continue;
      if (c.L < l) l = c.L; if (c.T < t) t = c.T; if (c.R > r) r = c.R; if (c.B > b) b = c.B;
    }
    if (r < 0) return Rectangle.FromLTRB(mains[row].L, mains[row].T, mains[row].R + 1, mains[row].B + 1);
    return Rectangle.FromLTRB(l, t, r + 1, b + 1);
  }

  static void NormalizeTransparentRgb(Bitmap bmp) {
    for (int y = 0; y < bmp.Height; y++) {
      for (int x = 0; x < bmp.Width; x++) {
        var c = bmp.GetPixel(x,y);
        if (c.A == 0) bmp.SetPixel(x,y, Color.FromArgb(0,0,0,0));
      }
    }
  }
}
"@

Add-Type -TypeDefinition $source -ReferencedAssemblies System.Drawing

$resolvedInput = (Resolve-Path -LiteralPath $Path).Path

switch ($Mode) {
  "validate" {
    $violations = [SpriteTool]::Validate($resolvedInput, $Columns, $Rows, $MinPadding, $BlackThreshold, $TargetRows)
    if ($violations -gt 0) { exit 1 }
  }
  "preview" {
    [SpriteTool]::Preview($resolvedInput, $Columns, $Rows, $OutDir, $Prefix)
  }
  "clean-black" {
    if ([string]::IsNullOrWhiteSpace($Output)) { throw "-Output is required for clean-black" }
    [SpriteTool]::CleanBlack($resolvedInput, $Output, $Columns, $Rows, $TargetRows, $BlackThreshold, $SpeckMax)
  }
  "pack-chroma" {
    if ([string]::IsNullOrWhiteSpace($Output)) { throw "-Output is required for pack-chroma" }
    if ($CellWidth -le 0) { $CellWidth = [int](([System.Drawing.Bitmap]::new($resolvedInput)).Width / $Columns) }
    if ($CellHeight -le 0) { $CellHeight = [int](([System.Drawing.Bitmap]::new($resolvedInput)).Height / $Rows) }
    [SpriteTool]::PackChroma($resolvedInput, $Output, $Columns, $Rows, $CellWidth, $CellHeight, $Margin)
  }
}

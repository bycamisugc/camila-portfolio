# Trata logos para a faixa "+200 marcas":
# remove o fundo (branco ou quadrado colorido estilo ícone de app),
# recolore logos brancos com a cor da marca, corta sobras e salva PNG transparente.
# Uso: powershell -File scripts\tratar-logos.ps1 -Entrada "pasta\com\logos" -Saida "novo\logos"
param(
  [Parameter(Mandatory = $true)][string]$Entrada,
  [Parameter(Mandatory = $true)][string]$Saida,
  # logos brancos sobre fundo colorido/degradê: nome=corHex (ou nome=auto para usar a cor do fundo)
  [string]$Branco = ""
)

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class LogoFix {
  static double Dist(byte[] p, int i, int r, int g, int b) {
    int dr = p[i + 2] - r, dg = p[i + 1] - g, db = p[i] - b;
    return Math.Sqrt(dr * dr + dg * dg + db * db);
  }

  static void Key(byte[] p, int r, int g, int b) {
    for (int i = 0; i < p.Length; i += 4) {
      if (p[i + 3] == 0) continue;
      double d = Dist(p, i, r, g, b);
      double a = Math.Min(1, Math.Max(0, (d - 28) / 48.0));
      if (a < 1) {
        // tira a "contaminação" da cor de fundo na borda serrilhada
        if (a > 0.02) {
          p[i + 2] = (byte)Math.Min(255, Math.Max(0, (p[i + 2] - (1 - a) * r) / a));
          p[i + 1] = (byte)Math.Min(255, Math.Max(0, (p[i + 1] - (1 - a) * g) / a));
          p[i]     = (byte)Math.Min(255, Math.Max(0, (p[i]     - (1 - a) * b) / a));
        }
        p[i + 3] = (byte)(p[i + 3] * a);
      }
    }
  }

  public static string Process(string inPath, string outPath, string whiteHex) {
    Bitmap src = new Bitmap(inPath);
    double scale = Math.Min(1.0, 600.0 / Math.Max(src.Width, src.Height));
    int w = Math.Max(1, (int)(src.Width * scale)), h = Math.Max(1, (int)(src.Height * scale));
    Bitmap bmp = new Bitmap(w, h, PixelFormat.Format32bppArgb);
    using (Graphics gr = Graphics.FromImage(bmp)) {
      gr.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
      gr.DrawImage(src, 0, 0, w, h);
    }
    src.Dispose();

    Rectangle rect = new Rectangle(0, 0, w, h);
    BitmapData data = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
    int stride = data.Stride;
    byte[] p = new byte[stride * h];
    Marshal.Copy(data.Scan0, p, 0, p.Length);
    Func<int, int, int> I = (x, y) => y * stride + x * 4;

    string log = "";
    int[] brand = null;

    if (!string.IsNullOrEmpty(whiteHex)) {
      int[] col;
      if (whiteHex == "auto") { int k = I((int)(w * 0.06), h / 2); col = new int[] { p[k + 2], p[k + 1], p[k] }; }
      else { col = new int[] { Convert.ToInt32(whiteHex.Substring(0, 2), 16), Convert.ToInt32(whiteHex.Substring(2, 2), 16), Convert.ToInt32(whiteHex.Substring(4, 2), 16) }; }
      for (int i = 0; i < p.Length; i += 4) {
        int mn = Math.Min(p[i], Math.Min(p[i + 1], p[i + 2]));
        int mx = Math.Max(p[i], Math.Max(p[i + 1], p[i + 2]));
        double a = Math.Min(1, Math.Max(0, (mn - 150) / 80.0)) * Math.Min(1, Math.Max(0, (60 - (mx - mn)) / 40.0));
        p[i + 3] = (byte)(p[i + 3] * a);
        p[i + 2] = (byte)col[0]; p[i + 1] = (byte)col[1]; p[i] = (byte)col[2];
      }
      // o recorte do ícone (cantos arredondados) pode deixar borda branca: apaga 4% das margens
      int m = (int)(Math.Min(w, h) * 0.04);
      for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) if (x < m || y < m || x >= w - m || y >= h - m) p[I(x, y) + 3] = 0;
      log = "extrai-branco ";
      goto CROP;
    }

    // passo 1: fundo pela cor do canto
    int c0 = I(1, 1);
    int cr = p[c0 + 2], cg = p[c0 + 1], cb = p[c0];
    if (p[c0 + 3] > 200) {
      Key(p, cr, cg, cb);
      log += "fundo-canto ";
      if (!(cr > 225 && cg > 225 && cb > 225)) brand = new int[] { cr, cg, cb };
    }

    // passo 2: quadrado/círculo colorido dentro (ícone de app com cantos arredondados)
    int[] a1 = { I((int)(w * 0.06), h / 2), I(w / 2, (int)(h * 0.06)), I((int)(w * 0.94), h / 2) };
    bool opaque = true, same = true;
    foreach (int k in a1) if (p[k + 3] < 230) opaque = false;
    if (opaque) {
      foreach (int k in a1) if (Dist(p, k, p[a1[0] + 2], p[a1[0] + 1], p[a1[0]]) > 25) same = false;
      if (same) {
        brand = new int[] { p[a1[0] + 2], p[a1[0] + 1], p[a1[0]] };
        Key(p, brand[0], brand[1], brand[2]);
        log += "fundo-icone ";
      }
    }

    // restos do ícone (cantos arredondados, sombra) ficam nas margens: apaga 3%
    if (log.Length > 0) {
      int mg = (int)(Math.Min(w, h) * 0.03);
      for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) if (x < mg || y < mg || x >= w - mg || y >= h - mg) p[I(x, y) + 3] = 0;
    }

    // passo 3: logo que sobrou é branco? pinta com a cor da marca (ou quase preto)
    double lum = 0, wsum = 0;
    for (int i = 0; i < p.Length; i += 4) {
      double al = p[i + 3] / 255.0;
      if (al < 0.1) continue;
      lum += al * (0.2126 * p[i + 2] + 0.7152 * p[i + 1] + 0.0722 * p[i]);
      wsum += al;
    }
    if (wsum > 0 && lum / wsum > 170) {
      int[] col = brand ?? new int[] { 26, 26, 26 };
      double bl = 0.2126 * col[0] + 0.7152 * col[1] + 0.0722 * col[2];
      if (bl > 200) col = new int[] { 26, 26, 26 };
      for (int i = 0; i < p.Length; i += 4) { p[i + 2] = (byte)col[0]; p[i + 1] = (byte)col[1]; p[i] = (byte)col[2]; }
      log += "recolorido ";
    }

    CROP:
    Marshal.Copy(p, 0, data.Scan0, p.Length);
    bmp.UnlockBits(data);

    // passo 4: corta sobras (ignora linhas/colunas com só alguns pixels soltos, ex.: contorno de círculo)
    int[] colCount = new int[w], rowCount = new int[h];
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) if (p[I(x, y) + 3] > 90) { colCount[x]++; rowCount[y]++; }
    int minCol = Math.Max(2, h / 60), minRow = Math.Max(2, w / 60);
    int minX = w, minY = h, maxX = -1, maxY = -1;
    for (int x = 0; x < w; x++) if (colCount[x] >= minCol) { if (x < minX) minX = x; maxX = x; }
    for (int y = 0; y < h; y++) if (rowCount[y] >= minRow) { if (y < minY) minY = y; maxY = y; }
    if (maxX < 0) { bmp.Save(outPath, ImageFormat.Png); bmp.Dispose(); return log + "(vazio!)"; }
    Rectangle crop = Rectangle.FromLTRB(Math.Max(0, minX - 2), Math.Max(0, minY - 2), Math.Min(w, maxX + 3), Math.Min(h, maxY + 3));
    Bitmap outB = bmp.Clone(crop, PixelFormat.Format32bppArgb);
    outB.Save(outPath, ImageFormat.Png);
    string res = log + crop.Width + "x" + crop.Height;
    outB.Dispose(); bmp.Dispose();
    return res;
  }
}
"@

New-Item -ItemType Directory -Force $Saida | Out-Null
$mapa = @{}
foreach ($par in ($Branco -split ",")) { if ($par -match "=") { $k, $v = $par -split "="; $mapa[$k.Trim()] = $v.Trim().TrimStart("#") } }
Get-ChildItem $Entrada -Filter *.png | ForEach-Object {
  $nome = $_.BaseName.ToLower() -replace "[^a-z0-9]+", "-" -replace "(^-|-$)", ""
  $dest = Join-Path (Resolve-Path $Saida) ($nome + ".png")
  $r = [LogoFix]::Process($_.FullName, $dest, $mapa[$nome])
  "{0,-22} {1}" -f $nome, $r
}

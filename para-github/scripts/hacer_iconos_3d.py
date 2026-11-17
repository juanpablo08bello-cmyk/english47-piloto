"""Genera los iconos 3D pequeños (Ico3D) a partir de web/public/art/obj_*.webp y la cara de Capi.

Uso:  D:\\Apps\\ComfyUI3D\\venv\\Scripts\\python.exe scripts\\hacer_iconos_3d.py

Salida en web/public/art/ico/:  <nombre>-128.webp y <nombre>-192.webp  (cada uno <= 14 KB, fondo transparente, cuadrado).
Estados de la llama (se cambia el archivo, no el filtro): llama (activa), llama-apagada (ceniza), llama-congelada (hielo).
Las hojas de iconos 3D nuevas de Flow (docs/reforma/32-diseno-v2.md §3.4) se recortan aparte y pueden pasar por esta misma función `exportar`.
"""
from pathlib import Path
import colorsys
from PIL import Image, ImageEnhance

RAIZ = Path(__file__).resolve().parent.parent
ARTE = RAIZ / "web" / "public" / "art"
SALIDA = ARTE / "ico"
LIMITE = 14 * 1024
TAMANOS = (128, 192)

# nombre de salida -> archivo de origen
OBJETOS = {
    "llama": "obj_llama.webp",
    "moneda": "obj_moneda.webp",
    "trofeo": "obj_trofeo.webp",
    "cofre": "obj_cofre.webp",
    "comanda": "obj_comanda.webp",
    "bandeja": "obj_bandeja.webp",
    "coctel": "obj_cocktail.webp",
    "vino": "obj_vino.webp",
    "hamburguesa": "obj_hamburguesa.webp",
    "filete": "obj_filete.webp",
    "pasta": "obj_pasta.webp",
    "postre": "obj_postre.webp",
}


def recortar_cuadrado(im: Image.Image, margen: float = 0.07) -> Image.Image:
    """Recorta al contenido visible y lo centra en un lienzo cuadrado transparente con un poco de aire."""
    im = im.convert("RGBA")
    caja = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if caja:
        im = im.crop(caja)
    lado = int(max(im.size) * (1 + 2 * margen))
    lienzo = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    lienzo.paste(im, ((lado - im.width) // 2, (lado - im.height) // 2), im)
    return lienzo


def guardar(im: Image.Image, destino: Path) -> int:
    """WebP con la calidad más alta que cabe en el límite de peso."""
    for q in range(92, 30, -4):
        im.save(destino, "WEBP", quality=q, method=6, alpha_quality=min(100, q + 6))
        if destino.stat().st_size <= LIMITE:
            break
    return destino.stat().st_size


def exportar(nombre: str, im: Image.Image) -> None:
    base = recortar_cuadrado(im)
    for t in TAMANOS:
        peso = guardar(base.resize((t, t), Image.LANCZOS), SALIDA / f"{nombre}-{t}.webp")
        print(f"  {nombre}-{t}.webp  {peso / 1024:.1f} KB")


def tono(im: Image.Image, f) -> Image.Image:
    """Aplica f(r, g, b) -> (r, g, b) en 0..1 a cada píxel, conservando el alfa."""
    im = im.convert("RGBA")
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a:
                r2, g2, b2 = f(r / 255, g / 255, b / 255)
                px[x, y] = (int(max(0, min(1, r2)) * 255), int(max(0, min(1, g2)) * 255), int(max(0, min(1, b2)) * 255), a)
    return im


def ceniza(r, g, b):
    """Llama apagada: gris cálido oscuro, sin brillo."""
    l = 0.299 * r + 0.587 * g + 0.114 * b
    l = 0.16 + l * 0.46
    return (l * 1.02, l * 1.0, l * 1.06)


def hielo(r, g, b):
    """Llama congelada: tono azul hielo, algo más clara."""
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    h = 0.55 + (h - 0.08) * 0.15
    s = min(1, 0.18 + s * 0.55)
    v = min(1, 0.42 + v * 0.62)
    return colorsys.hsv_to_rgb(h, s, v)


def main() -> None:
    SALIDA.mkdir(parents=True, exist_ok=True)
    for nombre, archivo in OBJETOS.items():
        print(nombre)
        exportar(nombre, Image.open(ARTE / archivo))

    llama = Image.open(ARTE / "obj_llama.webp").convert("RGBA")
    print("llama-apagada")
    exportar("llama-apagada", tono(llama, ceniza))
    print("llama-congelada")
    exportar("llama-congelada", ImageEnhance.Contrast(tono(llama, hielo)).enhance(1.08))

    capi = Image.open(ARTE / "capi_frente.webp").convert("RGBA")
    print("capi-cara")
    exportar("capi-cara", capi.crop((185, 38, 460, 312)))


if __name__ == "__main__":
    main()

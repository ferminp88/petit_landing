// Lógica compartida de variantes (colores, talles, metros y matriz de precios).
// Usada por las rutas públicas y de admin.

// Valor numérico para ordenar metrajes: "3,50mts" -> 3.5, "2mts" -> 2.
function metersSortValue(name) {
  const m = String(name).replace(',', '.').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : Number.MAX_SAFE_INTEGER;
}

function buildColors(db, product) {
  const names = String(product.color_options || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  if (names.length === 0) return [];
  const rows = db
    .prepare('SELECT color_name, image_url FROM product_color_images WHERE product_id = ?')
    .all(product.id);
  const map = new Map(rows.map(r => [r.color_name, r.image_url]));
  return names.map(name => ({ name, image: map.get(name) || null }));
}

// Adjunta sizes (forma legacy), meters, price_matrix y colors a un producto.
// La matriz product_variant_prices es la fuente de verdad de los precios.
function attachVariants(db, product) {
  if (!product) return product;

  const rows = db
    .prepare(
      'SELECT size_name, meters_name, price, compare_at_price FROM product_variant_prices WHERE product_id = ?'
    )
    .all(product.id);

  const sizeMap = new Map();
  const meterSet = new Set();
  const priceMatrix = [];

  for (const r of rows) {
    priceMatrix.push({
      size: r.size_name,
      meters: r.meters_name,
      price: r.price,
      compare_at_price: r.compare_at_price ?? null,
    });
    // Forma legacy de sizes: precio representativo por talle (el menor disponible).
    if (r.size_name) {
      const prev = sizeMap.get(r.size_name);
      if (!prev || r.price < prev.price) {
        sizeMap.set(r.size_name, {
          name: r.size_name,
          price: r.price,
          compare_at_price: r.compare_at_price ?? null,
        });
      }
    }
    if (r.meters_name) meterSet.add(r.meters_name);
  }

  const sizes = [...sizeMap.values()];
  const meters = [...meterSet]
    .sort((a, b) => metersSortValue(a) - metersSortValue(b))
    .map(name => ({ name }));

  return {
    ...product,
    sizes,
    meters,
    price_matrix: priceMatrix,
    colors: buildColors(db, product),
  };
}

module.exports = { attachVariants, buildColors, metersSortValue };

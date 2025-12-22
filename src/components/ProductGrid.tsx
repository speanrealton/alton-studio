// src/components/ProductGrid.tsx
import Link from 'next/link';

export default function ProductGrid({ title, products, color }: { title: string; products: any[]; color: string }) {
  return (
    <div className="min-h-screen bg-black text-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className={`text-8xl font-black mb-16 bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
          {title}
        </h1>
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-10">
          {products.map((p, i) => (
            <Link key={i} href={`/marketplace/product/${p.title.toLowerCase().replace(/ /g, '-')}`}>
              <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-white/10 hover:border-purple-500 transition hover:scale-105">
                <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 h-64" />
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-4">{p.title}</h3>
                  <div className="flex justify-between items-end">
                    <p className="text-5xl font-black text-purple-400">${p.price}</p>
                    <p className="text-gray-400">{p.sales} sold</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
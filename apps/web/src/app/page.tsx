export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <header className="bg-katsuda-900 text-white py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">Katsuda</h1>
          <p className="text-katsuda-100">Distribuidores de primeras marcas</p>
        </div>
      </header>

      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl font-bold text-katsuda-900 mb-4">
          Bienvenido a Katsuda Store
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Tu tienda de grifería y sanitarios en Mendoza y San Juan
        </p>
        <div className="inline-block bg-katsuda-500 text-white px-8 py-3 rounded-lg font-semibold">
          Próximamente
        </div>
      </section>

      <footer className="bg-katsuda-900 text-white py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2026 Katsuda. Todos los derechos reservados.</p>
        </div>
      </footer>
    </main>
  );
}

export default function ShopsHero({ title, heroImage }) {
  return (
    <div className="relative h-64 md:h-80 bg-cover bg-center" style={{ backgroundImage: `url('${heroImage}')` }}>
      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
        <h1 className="text-white text-3xl md:text-5xl font-bold tracking-wide">{title}</h1>
      </div>
    </div>
  );
}

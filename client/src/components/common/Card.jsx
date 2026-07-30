export default function Card({ title, children }) {
  return (
    <section className="card">
      <h2>{title}</h2>

      {children}
    </section>
  );
}

export default function Navbar({ children }) {
  return (
    <nav className="navbar">
      <h1>SMC Backtester</h1>
      <div className="navbar-controls">{children}</div>
    </nav>
  );
}

export default function LoadButton({ onClick, loading }) {
  return (
    <button onClick={onClick} disabled={loading}>
      {loading ? "Loading..." : "Load Market"}
    </button>
  );
}

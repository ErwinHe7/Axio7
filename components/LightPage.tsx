export function LightPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-neon-page relative">
      <div id="bgFx" aria-hidden>
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
        <span className="blob b4" />
      </div>
      <div id="bgGrain" aria-hidden />
      <div id="bgGrid" aria-hidden />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function ContentLoader() {
  return (
    <div className="flex items-center justify-center py-24" role="status" aria-live="polite">
      <div
        className="w-10 h-10 rounded-full border-[3px] border-border-2 animate-spin"
        style={{ borderTopColor: '#22C55E' }}
      />
    </div>
  );
}

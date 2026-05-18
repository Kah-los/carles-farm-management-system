function BarList({ items = [], labelKey = 'label', valueKey = 'value' }) {
  const max = Math.max(1, ...items.map(item => Number(item[valueKey]) || 0));
  if (!items.length) return <Empty text="No chart data yet." />;
  return (
    <div className="bar-list">
      {items.map((item, index) => {
        const value = Number(item[valueKey]) || 0;
        return (
          <div key={index}>
            <div className="bar-row"><span>{item[labelKey]}</span><b>{item.displayValue || value}</b></div>
            <div className="bar" aria-hidden="true"><span style={{ width: `${(value / max) * 100}%` }} /></div>
          </div>
        );
      })}
    </div>
  );
}

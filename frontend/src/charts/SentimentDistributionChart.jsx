import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = {
  positive: '#10b981',
  neutral: '#f59e0b',
  negative: '#ef4444',
};

export default function SentimentDistributionChart({ data }) {
  const chartData = [
    { name: 'Positive', value: data?.positive_count || 0, color: COLORS.positive },
    { name: 'Neutral', value: data?.neutral_count || 0, color: COLORS.neutral },
    { name: 'Negative', value: data?.negative_count || 0, color: COLORS.negative },
  ].filter((d) => d.value > 0);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="chart-container empty">
        <p className="empty-message">No sentiment data available</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [value, name]}
            labelFormatter={(name) => name}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-lg)',
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '1rem' }}
            formatter={(value) => {
              const item = chartData.find((d) => d.name === value);
              return item ? `${value} (${((item.value / total) * 100).toFixed(1)}%)` : value;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
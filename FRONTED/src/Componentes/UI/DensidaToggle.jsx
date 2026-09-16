// src/Componentes/UI/DensityToggle.jsx
import { useDensity } from '../../Hoosk/Zoom';

export default function DensityToggle() {
  const { current, cycleDensity } = useDensity();

  return (
    <button
      className="nav-density-btn"
      onClick={cycleDensity}
      title={`Densidad: ${current.label} (clic para cambiar)`}
      aria-label={`Densidad actual: ${current.label}`}
    >
      <span style={{ fontSize: '18px', lineHeight: 1 }}>{current.icon}</span>
    </button>
  );
}
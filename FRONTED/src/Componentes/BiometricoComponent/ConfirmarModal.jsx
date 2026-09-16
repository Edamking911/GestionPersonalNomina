// src/Componentes/BiometricoComponent/ConfirmModal.jsx
import Modal from '../UI/Modal';
import Button from '../UI/Button';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  message = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  loading = false,
}) {
  const variantMap = {
    danger: 'danger',
    success: 'success',
    warning: 'warning',
    info: 'info',
    default: 'default',
  };

  const iconMap = {
    danger: '🗑️',
    success: '🔁',
    warning: '⚠️',
    info: 'ℹ️',
    default: '❓',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle="Revisa antes de continuar"
      icon={iconMap[type] || '❓'}
      variant={variantMap[type] || 'default'}
      size="md"
      footer={
        <>
          <Button
            variant="light"
            size="md"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={type === 'danger' ? 'danger' : type === 'success' ? 'success' : 'primary'}
            size="md"
            onClick={onConfirm}
            loading={loading}
          >
            {loading ? 'Procesando...' : confirmText}
          </Button>
        </>
      }
    >
      <p
        style={{
          margin: 0,
          fontSize: '14px',
          color: 'var(--text-secondary)',   // 👈 único cambio
          lineHeight: 1.6,
          textAlign: 'center',
          padding: '8px 0 16px 0',
        }}
      >
        {message}
      </p>
    </Modal>
  );
}
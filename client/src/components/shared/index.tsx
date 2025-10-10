import React, { memo } from 'react';

// Shared Loading Spinner Component
export const LoadingSpinner = memo(({ size = 40, color = 'var(--accent-primary)' }: {
  size?: number;
  color?: string;
}) => (
  <div className="loading-container">
    <div
      className="spinner"
      style={{
        width: size,
        height: size,
        borderColor: 'rgba(0, 217, 126, 0.2)',
        borderTopColor: color
      }}
    />
    <p>Loading...</p>
  </div>
));

// Shared Error Boundary Component
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="error-container">
    <h3>Something went wrong</h3>
    <p>{error.message}</p>
    <button onClick={() => window.location.reload()}>Reload Page</button>
  </div>
);

// Shared Data Table Component
export const DataTable = memo(<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = "No data available"
}: {
  data: T[];
  columns: Array<{
    key: keyof T;
    label: string;
    render?: (value: any, item: T) => React.ReactNode;
  }>;
  loading?: boolean;
  emptyMessage?: string;
}) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!data.length) {
    return <div className="empty-state"><p>{emptyMessage}</p></div>;
  }

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key as string}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              {columns.map(col => (
                <td key={col.key as string}>
                  {col.render ? col.render(item[col.key], item) : item[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

// Shared Modal Component
export const Modal = memo(({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium'
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content modal-${size}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
});

// Shared Button Component
export const Button = memo(({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  onClick,
  ...props
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`btn btn-${variant} btn-${size} ${loading ? 'loading' : ''}`}
    disabled={disabled || loading}
    onClick={onClick}
    {...props}
  >
    {loading && <LoadingSpinner size={16} />}
    {children}
  </button>
));

// Shared Card Component
export const Card = memo(({
  children,
  title,
  actions,
  className = ''
}: {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
  className?: string;
}) => (
  <div className={`card ${className}`}>
    {(title || actions) && (
      <div className="card-header">
        {title && <h3 className="card-title">{title}</h3>}
        {actions && <div className="card-actions">{actions}</div>}
      </div>
    )}
    <div className="card-body">
      {children}
    </div>
  </div>
));

// Shared Form Components
export const Input = memo(({
  label,
  error,
  ...props
}: {
  label?: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <input className={`form-input ${error ? 'error' : ''}`} {...props} />
    {error && <div className="form-error">{error}</div>}
  </div>
));

export const Textarea = memo(({
  label,
  error,
  ...props
}: {
  label?: string;
  error?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <textarea className={`form-textarea ${error ? 'error' : ''}`} {...props} />
    {error && <div className="form-error">{error}</div>}
  </div>
));

// Shared Badge Component
export const Badge = memo(({
  children,
  variant = 'default'
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}) => (
  <span className={`badge badge-${variant}`}>
    {children}
  </span>
));

// Shared Avatar Component
export const Avatar = memo(({
  src,
  alt,
  fallback,
  size = 32
}: {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: number;
}) => (
  <div
    className="avatar"
    style={{ width: size, height: size }}
  >
    {src ? (
      <img
        src={src}
        alt={alt}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          if (fallback) {
            target.nextElementSibling!.textContent = fallback;
            (target.nextElementSibling as HTMLElement).style.display = 'flex';
          }
        }}
      />
    ) : null}
    {fallback && (
      <div className="avatar-fallback">
        {fallback.charAt(0).toUpperCase()}
      </div>
    )}
  </div>
));

export default {
  LoadingSpinner,
  ErrorBoundary,
  DataTable,
  Modal,
  Button,
  Card,
  Input,
  Textarea,
  Badge,
  Avatar
};

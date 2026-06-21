import Icon from './Icon'

export default function IconButton({
  icon,
  label,
  active = false,
  className = '',
  ...buttonProps
}) {
  return (
    <button
      type="button"
      className={`icon-button ${active ? 'is-active' : ''} ${className}`.trim()}
      aria-label={label}
      title={label}
      {...buttonProps}
    >
      <Icon name={icon} size={16} />
    </button>
  )
}

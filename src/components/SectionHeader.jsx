export default function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <header className="section-header">
      <div>
        {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {description && <p className="section-description">{description}</p>}
      </div>
      {action}
    </header>
  )
}

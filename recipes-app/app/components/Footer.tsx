export default function Footer() {
  return (
    <footer style={{
      background: '#1E293B',
      padding: '32px 20px',
      textAlign: 'center',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: '780px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          Creat de
        </div>
        <a
          href="https://sig212.github.io/builder/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '18px',
            fontWeight: 800,
            color: '#4ADE80',
            textDecoration: 'none',
            letterSpacing: '-0.02em',
            transition: 'opacity 0.15s'
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          sig212
        </a>
        <div style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.3)',
          marginTop: '4px'
        }}>
          © {new Date().getFullYear()} Toate drepturile rezervate
        </div>
      </div>
    </footer>
  )
}

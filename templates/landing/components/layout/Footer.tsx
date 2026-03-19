import { Github, Twitter } from 'lucide-react'

const LINKS = [
  { label: 'GitHub',  href: 'https://github.com/ahmetakyapi', icon: Github },
  // { label: 'Twitter', href: 'https://twitter.com/...', icon: Twitter },
]

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/50 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} Pulse
        </p>
        <div className="flex items-center gap-3">
          {LINKS.map(({ label, href, icon: Icon }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/50 text-slate-400 transition-all hover:border-indigo-500/50 hover:text-indigo-400">
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}

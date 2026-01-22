import Link from 'next/link';

export default function Header() {
    return (
        <header className="header">
            <div className="container header-content">
                <Link href="/" className="logo">
                    📊 Dashboard
                </Link>
                <nav>
                    <Link href="/" className="nav-link">
                        Обзор
                    </Link>
                </nav>
            </div>
        </header>
    );
}

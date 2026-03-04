import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import { InteractiveGlobe } from '@/components/ui/interactive-globe';
import { CRMAdaptivePill } from '@/components/ui/3d-adaptive-navigation-bar';
import { Building2, TrendingUp, Shield, Zap } from 'lucide-react';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Добро пожаловать в CRM!">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <style>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                main {
                    animation: fade-in 0.6s ease-out;
                }
            `}</style>
            <div className="relative min-h-screen bg-white dark:bg-[#0a0a0a] overflow-hidden">
                {/* Header Navigation */}
                <header className="relative z-50 flex items-center justify-between px-6 py-6 lg:px-12 lg:py-8 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300">
                            <Building2 className="h-5 w-5 text-white dark:text-slate-900"/>
                        </div>
                        <span className="text-lg font-semibold text-slate-900 dark:text-white">CRM</span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-4">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="px-6 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="px-6 py-2 text-sm font-medium text-slate-900 dark:text-white hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                >
                                    Войти
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="px-6 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        Регистрация
                                    </Link>
                                )}
                            </>
                        )}
                    </div>

                    {/* Mobile Navigation */}
                    <div className="md:hidden">
                        <CRMAdaptivePill auth={auth} />
                    </div>
                </header>

                {/* Main Content Card */}
                <main className="relative z-20 flex items-center justify-center min-h-[calc(100vh-120px)] px-4 py-8 lg:px-8">
                    <div className="w-full max-w-6xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden relative">
                        {/* Ambient Glow */}
                        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

                        {/* Content Flex Layout */}
                        <div className="flex flex-col md:flex-row min-h-[550px]">
                            {/* Left Content Section */}
                            <div className="flex-1 flex flex-col justify-center p-8 md:p-12 lg:p-16 relative z-10">
                                {/* Status Badge */}
                                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1 text-xs text-slate-600 dark:text-slate-400 mb-6 w-fit">
                                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>Все системы активны</span>
                                </div>

                                {/* Main Heading */}
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-4">
                                    Управляйте недвижимостью с
                                    <span className="block bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                                        элегантностью
                                    </span>
                                </h1>

                                {/* Subheading */}
                                <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-md leading-relaxed mb-8">
                                    Современная CRM-система для агентств недвижимости. Автоматизируйте продажи, управляйте клиентами и восходите на вершину успеха.
                                </p>

                                {/* CTA Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 mb-12">
                                    {auth.user ? (
                                        <Link
                                            href={dashboard()}
                                            className="px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-lg transition-all duration-200 hover:shadow-lg text-center"
                                        >
                                            Перейти в панель
                                        </Link>
                                    ) : (
                                        <>
                                            <Link
                                                href={login()}
                                                className="px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all duration-200 hover:shadow-lg text-center"
                                            >
                                                Войти
                                            </Link>
                                            {canRegister && (
                                                <Link
                                                    href={register()}
                                                    className="px-6 py-2.5 text-sm font-semibold text-slate-900 dark:text-white border-2 border-slate-900 dark:border-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 text-center"
                                                >
                                                    Начать бесплатно
                                                </Link>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Stats Section */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">1000+</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">Активных агентств</p>
                                    </div>
                                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">50K+</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">Объектов в системе</p>
                                    </div>
                                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">24/7</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">Техническая поддержка</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Globe Section */}
                            <div className="flex-1 flex items-center justify-center p-6 md:p-0 min-h-[400px] md:min-h-auto">
                                <InteractiveGlobe 
                                    size={520} 
                                    autoRotateSpeed={0.0025}
                                    dotColor="rgba(100, 180, 255, ALPHA)"
                                    arcColor="rgba(100, 180, 255, 0.5)"
                                    markerColor="rgba(100, 220, 255, 1)"
                                />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import { CelestialOrrery } from '@/components/ui/celestial-orrery';
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
            <div className="relative min-h-screen bg-white dark:bg-[#0a0a0a] overflow-hidden">
                {/* Background */}
                <div className="fixed inset-0 w-full h-full opacity-30 dark:opacity-20 pointer-events-none">
                    <CelestialOrrery />
                </div>

                {/* Header Navigation */}
                <header className="relative z-50 flex items-center justify-between px-6 py-6 lg:px-12 lg:py-8 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300">
                            <Building2 className="h-5 w-5 text-white dark:text-slate-900"/>
                        </div>
                        <span className="text-lg font-semibold text-slate-900 dark:text-white">CRM</span>
                    </div>

                    <div className="flex items-center gap-4">
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
                </header>

                {/* Hero Section */}
                <main className="relative z-20 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6 py-12">
                    <div className="max-w-3xl text-center space-y-8">
                        {/* Tagline */}
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                Luxury CRM для профессионалов
                            </span>
                        </div>

                        {/* Main Heading */}
                        <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
                            Управляйте недвижимостью с
                            <span className="block bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                                элегантностью
                            </span>
                        </h1>

                        {/* Subheading */}
                        <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                            Современная CRM-система для агентств недвижимости. Автоматизируйте продажи, управляйте клиентами и восходите на вершину успеха.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="px-8 py-3 text-base font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-lg transition-all duration-200 hover:shadow-lg"
                                >
                                    Перейти в панель
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="px-8 py-3 text-base font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all duration-200 hover:shadow-lg"
                                    >
                                        Войти
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href={register()}
                                            className="px-8 py-3 text-base font-semibold text-slate-900 dark:text-white border-2 border-slate-900 dark:border-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
                                        >
                                            Начать бесплатно
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="mt-20 w-full max-w-5xl">
                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <div className="text-center space-y-4 p-6 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                <div className="flex justify-center">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                        <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Аналитика</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Отследите все транзакции, графики продаж и метрики в реальном времени.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="text-center space-y-4 p-6 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                <div className="flex justify-center">
                                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                                        <Zap className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Автоматизация</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Сокращайте время на рутинные задачи и focusируйте внимание на развитие бизнеса.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="text-center space-y-4 p-6 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                <div className="flex justify-center">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                        <Shield className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Безопасность</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Ваши данные защищены высочайшими стандартами шифрования и безопасности.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Text */}
                    <div className="mt-20 text-center space-y-2">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Присоединитесь к десяткам агентств по всей России
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                            Быстрая регистрация. Никаких скрытых платежей.
                        </p>
                    </div>
                </main>
            </div>
        </>
    );
}

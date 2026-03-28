import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    Boxes,
    Users,
    MessagesSquare,
    Languages,
    ShieldCheck,
    BarChart3,
    UserPlus,
    Database,
    TrendingUp,
} from 'lucide-react';
import logo from '@/assets/logo.png';

const Landing = () => {
    const navigate = useNavigate();

    const goToLogin = (role = 'client') => {
        navigate(`/login?role=${role}`);
    };

    const features = [
        {
            icon: Users,
            title: 'Contact Management',
            description: 'Keep clients, leads, and vendors organized in one searchable workspace.',
        },
        {
            icon: Boxes,
            title: 'Inventory Tracking',
            description: 'Track stock, update quantities quickly, and avoid last-minute shortages.',
        },
        {
            icon: MessagesSquare,
            title: 'Smart Messaging',
            description: 'Centralize conversations and follow up with clients without switching tools.',
        },
        {
            icon: Languages,
            title: 'Multi-language Support',
            description: 'Serve more clients with workflows built for multilingual communication.',
        },
        {
            icon: ShieldCheck,
            title: 'Admin Dashboard',
            description: 'Monitor platform activity, approvals, and account health in real time.',
        },
        {
            icon: BarChart3,
            title: 'Business Insights',
            description: 'Understand trends and performance with clear, actionable metrics.',
        },
    ];

    return (
        <div className="app-min-height bg-gradient-to-b from-sky-50 via-white to-slate-100 text-slate-900 animate-fade-in">
            <nav className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur">
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-slate-100"
                    >
                        <img src={logo} alt="CaterFind Logo" className="h-8 w-8 object-contain rounded-lg bg-sky-500 shadow-sm" />
                        <span className="text-lg font-bold tracking-tight">CaterFind</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => goToLogin('client')}
                        className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                        Login
                    </button>
                </div>
            </nav>

            <main>
                <section className="mx-auto grid w-full max-w-7xl gap-12 px-6 pb-20 pt-16 md:grid-cols-2 md:items-center">
                    <div className="animate-fade-in-up">
                        <p className="mb-4 inline-flex items-center rounded-full border border-sky-200 bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-700">
                            Built for modern caterers
                        </p>
                        <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
                            Manage Your Catering Business Effortlessly
                        </h1>
                        <p className="mt-5 max-w-xl text-lg text-slate-600">
                            Contacts, inventory, messaging and client management - all in one platform.
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={() => goToLogin('client')}
                                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
                            >
                                Get Started as Client
                                <ArrowRight className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => goToLogin('caterer')}
                                className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                            >
                                I'm a Caterer
                            </button>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 animate-fade-in-up animate-float-slow">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-700">Dashboard Preview</h3>
                                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                                    Live
                                </span>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-lg bg-white p-3 shadow-sm">
                                    <p className="text-xs text-slate-500">Active Clients</p>
                                    <p className="mt-1 text-lg font-semibold">128</p>
                                </div>
                                <div className="rounded-lg bg-white p-3 shadow-sm">
                                    <p className="text-xs text-slate-500">Inventory Health</p>
                                    <p className="mt-1 text-lg font-semibold">92%</p>
                                </div>
                                <div className="rounded-lg bg-white p-3 shadow-sm">
                                    <p className="text-xs text-slate-500">Open Messages</p>
                                    <p className="mt-1 text-lg font-semibold">14</p>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2 rounded-lg bg-white p-3 shadow-sm">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="inline-flex items-center gap-2 text-slate-600">
                                        <Users className="h-4 w-4 text-sky-600" />
                                        New lead: Downtown Event Co.
                                    </span>
                                    <span className="text-xs text-slate-500">2m ago</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="inline-flex items-center gap-2 text-slate-600">
                                        <Boxes className="h-4 w-4 text-sky-600" />
                                        Stock alert: Fresh produce below threshold
                                    </span>
                                    <span className="text-xs text-slate-500">9m ago</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto w-full max-w-7xl px-6 py-16 animate-fade-in-up">
                    <div className="mb-10 text-center">
                        <h2 className="text-3xl font-bold text-slate-900">Everything you need to run operations smoothly</h2>
                        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
                            CaterFind helps your team stay aligned across clients, inventory, communication, and daily execution.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;

                            return (
                                <article
                                    key={feature.title}
                                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-sky-200 hover:shadow-md animate-fade-in-up"
                                    style={{ animationDelay: `${index * 90}ms` }}
                                >
                                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                                    <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
                                </article>
                            );
                        })}
                    </div>
                </section>

                <section className="mx-auto w-full max-w-7xl px-6 py-16 animate-fade-in-up">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                        <h2 className="text-center text-3xl font-bold text-slate-900">How it works</h2>

                        <div className="mt-8 grid gap-5 md:grid-cols-3">
                            <StepCard
                                icon={UserPlus}
                                title="1. Create Account"
                                description="Sign in to access your workspace and set up your business profile."
                            />
                            <StepCard
                                icon={Database}
                                title="2. Add Your Data"
                                description="Import contacts, update inventory, and centralize your operations."
                            />
                            <StepCard
                                icon={TrendingUp}
                                title="3. Manage & Grow"
                                description="Track client activity and deliver faster, smarter service every day."
                            />
                        </div>
                    </div>
                </section>

                <section className="mx-auto w-full max-w-7xl px-6 pb-16 animate-fade-in-up">
                    <div className="rounded-2xl bg-sky-600 px-8 py-14 text-center text-white shadow-xl shadow-sky-200">
                        <h2 className="text-3xl font-bold">Start managing your catering business today</h2>
                        <p className="mx-auto mt-3 max-w-xl text-sky-100">
                            Replace spreadsheets and scattered chats with one clean, efficient platform.
                        </p>
                        <button
                            type="button"
                            onClick={() => goToLogin('client')}
                            className="mt-7 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                        >
                            Get Started
                        </button>
                    </div>
                </section>
            </main>

            <footer className="border-t border-slate-200 bg-white/95 animate-fade-in-up">
                <div className="mx-auto w-full max-w-7xl px-6 py-12">
                    <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <div className="inline-flex items-center gap-2">
                                <img src={logo} alt="CaterFind Logo" className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500 shadow-sm object-contain" />
                                <span className="text-lg font-bold tracking-tight text-slate-900">CaterFind</span>
                            </div>
                            <p className="mt-3 max-w-xs text-sm text-slate-600">
                                Manage your catering business in one place
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Product</h3>
                            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
                                <button type="button" className="w-fit transition hover:text-sky-700">Features</button>
                                <button type="button" className="w-fit transition hover:text-sky-700">Pricing</button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Company</h3>
                            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
                                <button type="button" className="w-fit transition hover:text-sky-700">About</button>
                                <button type="button" className="w-fit transition hover:text-sky-700">Contact</button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 lg:items-start">
                            <button
                                type="button"
                                onClick={() => goToLogin('client')}
                                className="w-full rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 sm:w-auto"
                            >
                                Login
                            </button>
                            <button
                                type="button"
                                onClick={() => goToLogin('client')}
                                className="w-full rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 sm:w-auto"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>

                    <div className="mt-10 flex flex-col gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                        <p>© {new Date().getFullYear()} CaterFind</p>
                        <div className="flex items-center gap-5">
                            <button type="button" className="transition hover:text-slate-700">Privacy Policy</button>
                            <button type="button" className="transition hover:text-slate-700">Terms of Service</button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const StepCard = ({ icon: Icon, title, description }) => {
    return (
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center transition hover:border-sky-200 hover:bg-white">
            <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm text-slate-600">{description}</p>
        </article>
    );
};

export default Landing;

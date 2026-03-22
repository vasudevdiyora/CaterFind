import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, User, ChefHat, ArrowRight, ShieldCheck } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();

    const handleRoleClick = (role) => {
        navigate(`/login?role=${role.toLowerCase()}`);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="absolute top-6 right-6">
                <button
                    onClick={() => navigate('/login?role=admin')}
                    className="secondary-button-sm flex items-center gap-2"
                >
                    <ShieldCheck size={16} />
                    Admin
                </button>
            </div>

            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-sky-500 shadow-lg mb-4">
                    <UtensilsCrossed className="w-10 h-10 text-white" strokeWidth={2} />
                </div>
                <h1 className="text-5xl font-extrabold text-slate-800 tracking-tight">
                    CaterFind
                </h1>
                <p className="text-slate-500 text-lg mt-2">
                    The easiest way to manage your catering business.
                </p>
            </div>

            <div className="max-w-md w-full space-y-6">
                <RoleCard
                    icon={<User className="w-8 h-8 text-sky-600" strokeWidth={2} />}
                    title="I Need Catering"
                    description="Find and book caterers for your event"
                    onClick={() => handleRoleClick('CLIENT')}
                />
                <RoleCard
                    icon={<ChefHat className="w-8 h-8 text-sky-600" strokeWidth={2} />}
                    title="I'm a Caterer"
                    description="Manage my business, menus, and clients"
                    onClick={() => handleRoleClick('CATERER')}
                />
            </div>

            <footer className="absolute bottom-8 text-center text-slate-400 text-sm">
                <p>&copy; {new Date().getFullYear()} CaterFind. All rights reserved.</p>
            </footer>
        </div>
    );
};

const RoleCard = ({ icon, title, description, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="w-full group bg-white rounded-2xl p-6 text-left border border-slate-200 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-100 transition-all duration-300"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-sky-50 transition-all duration-300 group-hover:bg-sky-100">
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">
                            {title}
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">
                            {description}
                        </p>
                    </div>
                </div>
                <ArrowRight className="w-6 h-6 text-slate-400 transition-transform duration-300 group-hover:text-sky-500 group-hover:translate-x-1" />
            </div>
        </button>
    );
};

export default Landing;

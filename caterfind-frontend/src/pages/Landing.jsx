import { useState } from 'react';
import { UtensilsCrossed, User, ChefHat, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Landing Page - Role Selection
 * Loveable Design Prototype
 * 
 * User selects their role:
 * - Client: "I Need Catering"
 * - Caterer: "I'm a Caterer"
 */
function Landing({ onRoleSelect }) {
    const [hoveredCard, setHoveredCard] = useState(null);

    const handleRoleClick = (role) => {
        onRoleSelect(role);
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-2xl w-full space-y-8 animate-in fade-in duration-700">
                {/* Logo & Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary shadow-lg shadow-primary/20 mb-4">
                        <UtensilsCrossed className="w-10 h-10 text-primary-foreground" strokeWidth={2.5} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                        Catering Manager
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Find the perfect caterer
                    </p>
                </div>

                {/* Role Selection Cards */}
                <div className="space-y-6 pt-8">
                    <h2 className="text-2xl font-semibold text-foreground text-center mb-8">
                        Who are you?
                    </h2>

                    {/* Client Card */}
                    <button
                        onClick={() => handleRoleClick('CLIENT')}
                        onMouseEnter={() => setHoveredCard('client')}
                        onMouseLeave={() => setHoveredCard(null)}
                        className={cn(
                            "w-full group relative overflow-hidden rounded-2xl p-6 transition-all duration-300",
                            "bg-card border border-border/50",
                            "hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 hover:scale-[1.02]",
                            "transform-gpu"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300",
                                    "bg-primary/10",
                                    hoveredCard === 'client' && "bg-primary/20 scale-110"
                                )}>
                                    <User className="w-7 h-7 text-primary" strokeWidth={2.5} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-xl font-semibold text-foreground mb-1">
                                        I Need Catering
                                    </h3>
                                    <p className="text-muted-foreground text-sm">
                                        Find caterers for my event
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className={cn(
                                "w-6 h-6 text-muted-foreground transition-all duration-300",
                                hoveredCard === 'client' && "text-primary translate-x-1"
                            )} />
                        </div>

                        {/* Animated gradient overlay on hover */}
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0",
                            "opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        )} />
                    </button>

                    {/* Caterer Card */}
                    <button
                        onClick={() => handleRoleClick('CATERER')}
                        onMouseEnter={() => setHoveredCard('caterer')}
                        onMouseLeave={() => setHoveredCard(null)}
                        className={cn(
                            "w-full group relative overflow-hidden rounded-2xl p-6 transition-all duration-300",
                            "bg-card border border-border/50",
                            "hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 hover:scale-[1.02]",
                            "transform-gpu"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300",
                                    "bg-primary/10",
                                    hoveredCard === 'caterer' && "bg-primary/20 scale-110"
                                )}>
                                    <ChefHat className="w-7 h-7 text-primary" strokeWidth={2.5} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-xl font-semibold text-foreground mb-1">
                                        I'm a Caterer
                                    </h3>
                                    <p className="text-muted-foreground text-sm">
                                        Manage my business
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className={cn(
                                "w-6 h-6 text-muted-foreground transition-all duration-300",
                                hoveredCard === 'caterer' && "text-primary translate-x-1"
                            )} />
                        </div>

                        {/* Animated gradient overlay on hover */}
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0",
                            "opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        )} />
                    </button>
                </div>

                {/* Footer */}
                <div className="text-center pt-8">
                    <p className="text-muted-foreground text-sm">
                        Premium catering management platform
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Landing;
